document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // URL for the main gift list
    const contributionsSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=123456789&single=true&output=csv'; // <-- PASTE THE URL OF YOUR "Contributions" SHEET HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username
    const appsScriptUrl = 'https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec'; // <-- PASTE YOUR GOOGLE APPS SCRIPT URL HERE
    const IBAN_NUMBER = 'FR76 XXXX XXXX XXXX XXXX XXXX XXX'; // <-- VRAI IBAN ICI
    
 // --- DOM ELEMENTS ---
   const giftListContainer = document.getElementById('gift-list-container');
    const cagnotteButton = document.querySelector('.cagnotte-section .revolut-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const giftModal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = giftModal.querySelector('.modal-close-button');

    let allGifts = [];
    let allContributions = []; // New array to store contributions
    let currentGiftId = null;

    // --- UTILITY FUNCTIONS ---
    function parseCsvRow(rowString) {
        const values = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < rowString.length; i++) {
            const char = rowString[i];
            if (char === '"') {
                if (inQuotes && rowString[i + 1] === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim());
        return values;
    }

    // --- DATA FETCHING AND PROCESSING ---
    async function fetchData(url, expectedHeaders) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 1) return []; // Can be empty, that's okay

        const headers = parseCsvRow(rows[0]);
        if (expectedHeaders.some(h => !headers.includes(h))) {
            throw new Error(`CSV from ${url} is missing one of the required headers: ${expectedHeaders.join(', ')}`);
        }

        return rows.slice(1).map(row => {
            const values = parseCsvRow(row);
            const item = {};
            headers.forEach((header, index) => {
                item[header.trim()] = values[index] ? values[index] : '';
            });
            return item;
        });
    }

    async function fetchAndProcessData() {
        giftListContainer.innerHTML = '<p class="loading-message">Chargement de la liste de cadeaux...</p>';
        try {
            // Fetch both sets of data in parallel
            const [giftsData, contributionsData] = await Promise.all([
                fetchData(sheetUrl, ["ID", "Nom"]),
                fetchData(contributionsSheetUrl, ["ID_Cadeau", "Montant"])
            ]);

            allContributions = contributionsData.map(c => ({
                giftId: c.ID_Cadeau,
                contributor: c.Nom_Contributeur || 'Anonyme',
                amount: parseFloat(c.Montant) || 0
            }));

            // Map contributions to gifts
            allGifts = giftsData.map(gift => {
                const isPartial = gift.Type_Contribution?.toLowerCase().trim() === 'partiel';
                let totalContributed = 0;

                if (isPartial) {
                    totalContributed = allContributions
                        .filter(c => c.giftId === gift.ID)
                        .reduce((sum, current) => sum + current.amount, 0);
                }

                return {
                    ...gift,
                    Prix: parseFloat(gift.Prix) || 0,
                    totalContributed: totalContributed,
                    isPartial: isPartial
                };
            }).filter(gift => gift.ID && gift.Nom);

            console.log("Gifts and contributions processed successfully:", allGifts);
            displayAllGiftsByCategory();

        } catch (error) {
            console.error("❌ Error fetching or processing data:", error);
            giftListContainer.innerHTML = `<p class="error-message">Impossible de charger la liste. Erreur: ${error.message}.</p>`;
        }
    }

    /**
     * Generates HTML for a single gift card.
     */
    function createGiftCardHTML(gift) {
        // Data is now pre-processed, so we just use the properties from the gift object
        const { isPartial, totalContributed, Prix } = gift;
        const isFullyFunded = isPartial && Prix > 0 && totalContributed >= Prix;
        const isOffered = !isPartial && gift.Offert_par && gift.Offert_par.trim() !== '';
        const finalIsOffered = isOffered || isFullyFunded;

        const formattedPrice = Prix > 0 ? `${Prix}€` : '';

        let productLinkButtonHTML = '';
        const productURL = gift.ProductLink;
        if (productURL && productURL.trim() !== '' && !finalIsOffered) {
            productLinkButtonHTML = `
                <a href="${productURL}" target="_blank" rel="noopener noreferrer" class="button product-link">
                    <i class="fas fa-store"></i> Voir le produit
                </a>`;
        }

        let progressBarHTML = '';
        if (isPartial && Prix > 0) {
            const percentage = Math.min((totalContributed / Prix) * 100, 100);
            progressBarHTML = `
                <div class="progress-info">
                    <span>${totalContributed.toFixed(0)}€ / ${Prix.toFixed(0)}€</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                </div>`;
        }

        const offerButtonText = isPartial ? '<i class="fas fa-coins"></i> Contribuer' : '<i class="fab fa-rev"></i> Offrir via Revolut';
        const offeredButtonText = isPartial ? '100% financé !' : 'Offert';

        const offerButtonHTML = `
            <button class="button ${finalIsOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${finalIsOffered ? 'disabled' : ''}>
                ${finalIsOffered ? offeredButtonText : offerButtonText}
            </button>`;

        return `
            <div class="gift-card ${finalIsOffered ? 'offered' : ''} ${isPartial ? 'is-partial' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper" style="background-image: url('${gift.ImageURL || 'https://via.placeholder.com/300'}')">
                    ${!finalIsOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : ''}
                </div>
                <div class="gift-info">
                    <p class="gift-title-price">${gift.Nom || 'Cadeau'}</p>
                    ${gift.Brand ? `<p class="brand">${gift.Brand}</p>` : ''}
                    <p class="description">${gift.Description || ''}</p>
                </div>
                ${progressBarHTML}
                <div class="gift-buttons">
                    ${offerButtonHTML}
                    ${productLinkButtonHTML}
                </div>
            </div>`;
    }


    /**
     * Displays all gifts grouped by category sequentially. (Improved Logging & Structure)
     */
    function displayAllGiftsByCategory() {
        console.log("Running displayAllGiftsByCategory..."); // Log start
        giftListContainer.innerHTML = ''; // Clear loading message or previous content

        if (!allGifts || allGifts.length === 0) {
            console.log("No gifts found in allGifts array."); // Log empty data
            if (!giftListContainer.querySelector('.error-message')) {
               giftListContainer.innerHTML = '<p class="loading-message">La liste est vide ou n\'a pas pu être chargée correctement.</p>';
            }
            return;
        }

        // 1. Grouper les cadeaux par catégorie
        console.log("Grouping gifts by category..."); // Log grouping step
        const giftsByCategory = allGifts.reduce((acc, gift) => {
             if (gift && typeof gift === 'object') {
                const category = gift.Categorie ? gift.Categorie.trim() : 'Autres';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(gift);
             } else {
                console.warn("Skipping invalid gift object during grouping:", gift);
             }
            return acc;
        }, {});
        console.log("Gifts grouped:", giftsByCategory); // Log the result of grouping

        // 2. Déterminer l'ordre des catégories
        const categoryOrder = Object.keys(giftsByCategory);
        console.log("Category order:", categoryOrder); // Log the category order

        if (categoryOrder.length === 0) {
             console.log("No categories found after grouping."); // Log no categories
             giftListContainer.innerHTML = '<p class="loading-message">Aucune catégorie trouvée dans la liste.</p>';
            return;
        }

        // 3. Afficher chaque catégorie et ses cadeaux using a fragment
        const fragment = document.createDocumentFragment();
        let giftCount = 0; // Counter for gifts actually added

        categoryOrder.forEach(category => {
            console.log("Processing category:", category); // Log each category
            const gifts = giftsByCategory[category];
            if (gifts && gifts.length > 0) {
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                fragment.appendChild(categoryTitle);

                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'gift-grid-wrapper';
                let categoryGiftHTML = '';
                gifts.forEach(gift => {
                    if (gift && gift.ID) {
                        categoryGiftHTML += createGiftCardHTML(gift);
                        giftCount++;
                    } else {
                        console.warn("Skipping invalid gift object during HTML generation:", gift);
                    }
                });
                gridWrapper.innerHTML = categoryGiftHTML;
                fragment.appendChild(gridWrapper);
            } else {
                console.log(`Skipping category "${category}" because it has no valid gifts.`);
            }
        });

        giftListContainer.appendChild(fragment);
        console.log(`Finished displaying gifts. Total gifts added: ${giftCount}`);

        addOfferButtonListeners();
    }


    /**
     * Adds event listeners ONCE using delegation to all "Offrir" buttons present in the container.
     */
     function addOfferButtonListeners() {
         if (giftListContainer.dataset.listenerAttached === 'true') {
            console.log("Delegated listener already attached.");
            return;
         }

         giftListContainer.addEventListener('click', function(event) {
             // Clic sur le bouton "Offrir"
             const button = event.target.closest('.revolut-button[data-type="gift"]:not(.offered)');
             if (button) {
                 event.preventDefault(); // Empêche toute action par défaut (au cas où)
                 console.log("Offer button clicked");
                 currentGiftId = button.closest('.gift-card').dataset.id;
                 const gift = allGifts.find(g => g.ID === currentGiftId);
                 if (gift) {
                     openModal(gift);
                 } else {
                     console.error("Could not find gift data for ID:", currentGiftId);
                 }
             }
             
             // Clic sur le bouton "Voir le produit" (ne fait rien, laisse le lien <a> agir)
             const productLink = event.target.closest('.product-link');
             if (productLink) {
                 console.log("Product link clicked, allowing default browser action.");
                 // On ne fait rien ici, on laisse le 'target="_blank"' du <a> faire son travail
             }
         });
         giftListContainer.dataset.listenerAttached = 'true';
         console.log("Offer button listeners attached via delegation.");
    }

    // --- Fonctions openModal, closeModal, handleConfirmOffer, displayModalMessage ---
     function openModal(gift = null) {
        let contentHTML = '';
        const ibanBlockHTML = `
            <div class="discreet-iban-container">
                <p class="modal-or-separator">ou par virement</p>
                <p class="iban-info">
                    IBAN: ${IBAN_NUMBER} 
                    <i class="fas fa-copy icon-copy-iban" id="copyIbanIcon" title="Copier l'IBAN"></i>
                </p>
                <span id="copy-confirm-text" class="copy-confirm-text"></span>
            </div>
        `;

        if (gift) {
            const { isPartial, totalContributed, Prix } = gift;
            const revolutAmountLink = Prix > 0 && !isPartial ? `${revolutLinkBase}${Prix}` : revolutLinkBase;

            let amountInputHTML = '';
            if (isPartial) {
                const remainingAmount = Math.max(0, Prix - totalContributed);
                amountInputHTML = `
                <div class="partial-contribution-section">
                    <p>Ce cadeau est participatif ! Il reste <strong>${remainingAmount.toFixed(0)}€</strong> à financer.</p>
                    <label for="contributionAmount">Montant de votre contribution (€) :</label>
                    <input type="number" id="contributionAmount" placeholder="Ex: 50" min="1" max="${remainingAmount.toFixed(0)}" required>
                </div>`;
            }

            const contributionButtonText = isPartial ? `Contribuer via Revolut` : `Contribuer ${Prix > 0 ? `de ${Prix}€ ` : ''}via Revolut`;

            contentHTML = `
                <h3>${gift.Nom}</h3>
                <p>${gift.Description || 'Pas de description.'}</p>
                <a href="${revolutAmountLink}" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
                   <i class="fas fa-external-link-alt"></i> ${contributionButtonText}
                </a>
                
                ${ibanBlockHTML}

                <div class="confirmation-section">
                    <p>Après votre contribution, merci de confirmer votre participation :</p>
                    ${amountInputHTML}
                    <label for="offeredByName">Votre nom ou initiales :</label>
                    <input type="text" id="offeredByName" placeholder="Ex: Jean D." required>
                    <div class="modal-buttons">
                        <button class="button secondary" id="cancelOfferButton">Annuler</button>
                        <button class="button primary" id="confirmOfferButton">Confirmer ma participation</button>
                    </div>
                    <div id="modal-message" style="display: none;"></div>
                </div>
            `;
        } else {
             contentHTML = `
                <h3>Contribution Libre</h3>
                <p>Participez librement à notre cagnotte !</p>
                 <a href="${revolutLinkBase}" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
                   <i class="fas fa-external-link-alt"></i> Contribuer via Revolut
                </a>

                ${ibanBlockHTML}

                <div class="confirmation-section">
                    <p>Vous pouvez fermer cette fenêtre après avoir effectué votre virement.</p>
                     <div class="modal-buttons">
                         <button class="button secondary" id="cancelOfferButton">Fermer</button>
                    </div>
                </div>
            `;
        }

        // 1. Set the HTML content FIRST
        modalContent.innerHTML = contentHTML;

        // 2. Display the modal
        modalOverlay.style.display = 'block';
        giftModal.style.display = 'block';

        // 3. Find buttons AFTER they are in the DOM
        const confirmButton = modalContent.querySelector('#confirmOfferButton');
        const cancelButton = modalContent.querySelector('#cancelOfferButton');
        const copyIcon = modalContent.querySelector('#copyIbanIcon'); // <-- MODIFIÉ
        const confirmText = modalContent.querySelector('#copy-confirm-text'); // <-- AJOUT

        // --- AJOUT : Logique de copie ---
        if (copyIcon && confirmText) {
            copyIcon.addEventListener('click', () => {
                const textToCopy = IBAN_NUMBER; // MODIFIÉ : Copie l'IBAN uniquement
                try {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        confirmText.textContent = 'IBAN Copié !'; // MODIFIÉ : Met à jour le span
                        confirmText.style.opacity = '1';
                        setTimeout(() => {
                            confirmText.style.opacity = '0';
                        }, 2000);
                    }, (err) => {
                         console.error('Erreur de copie (async): ', err);
                         confirmText.textContent = 'Erreur';
                         confirmText.style.opacity = '1';
                    });
                } catch (err) {
                    console.error('Erreur de copie (sync): ', err);
                    confirmText.textContent = 'Erreur';
                    confirmText.style.opacity = '1';
                }
            });
        }
        // --- FIN AJOUT ---

        // 4. Add listeners directly using { once: true }
        if (confirmButton) {
            confirmButton.disabled = false; // Ensure not disabled initially
            confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
             console.log("Attached listener to confirmOfferButton");
        } else {
             console.log("confirmOfferButton not found in modal");
        }

        if (cancelButton) {
            cancelButton.disabled = false; // Ensure not disabled initially
            cancelButton.addEventListener('click', closeModal, { once: true });
            console.log("Attached listener to cancelOfferButton");
        } else {
             console.log("cancelButton not found in modal");
        }
    }


    function closeModal() {
        modalOverlay.style.display = 'none';
        giftModal.style.display = 'none';
        modalContent.innerHTML = '';
        currentGiftId = null;
    }

    async function handleConfirmOffer() {
        const nameInput = document.getElementById('offeredByName');
        const amountInput = document.getElementById('contributionAmount');
        const modalMessage = document.getElementById('modal-message');
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');
        const giftToUpdate = allGifts.find(g => g.ID === currentGiftId);

        const reattachListeners = () => {
            if (confirmButton) confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
            if (cancelButton) cancelButton.addEventListener('click', closeModal, { once: true });
        };

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            reattachListeners();
            return;
        }

        const isPartial = giftToUpdate && giftToUpdate.Type_Contribution?.toLowerCase().trim() === 'partiel';
        let contributionAmount = 0;

        if (isPartial) {
            if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
                displayModalMessage("Veuillez entrer un montant de contribution valide.", "error");
                reattachListeners();
                return;
            }
            contributionAmount = parseFloat(amountInput.value);
        }

        const offeredByName = nameInput.value.trim();
        const giftIdToUpdate = currentGiftId;

        const dataForScript = {
            giftId: giftIdToUpdate,
            name: offeredByName,
            amount: isPartial ? contributionAmount : undefined
        };

        if (confirmButton) confirmButton.disabled = true;
        if (cancelButton) cancelButton.disabled = true;
        displayModalMessage("Mise à jour en cours...", "info");

        let scriptUpdateError = null;

        try {
            console.log("Sending to Apps Script:", dataForScript);
            await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataForScript),
            });
            console.log("Request potentially sent to Apps Script (no-cors).");

        } catch (error) {
            scriptUpdateError = error;
            console.error("❌ Error sending update request to Apps Script:", error);
        }

        if (!scriptUpdateError) {
            const giftIndex = allGifts.findIndex(g => g.ID === giftIdToUpdate);
            if (giftIndex !== -1) {
                // Optimistic UI Update
                if (isPartial) {
                    // Add to local contributions array
                    allContributions.push({
                        giftId: giftIdToUpdate,
                        contributor: offeredByName,
                        amount: contributionAmount
                    });
                    // Recalculate total for the specific gift
                    allGifts[giftIndex].totalContributed += contributionAmount;
                } else {
                    allGifts[giftIndex].Offert_par = offeredByName;
                }

                try {
                    displayAllGiftsByCategory();
                    displayModalMessage("Merci beaucoup pour votre contribution !", "success");
                    if (nameInput) nameInput.disabled = true;
                    if (amountInput) amountInput.disabled = true;
                    if (confirmButton) confirmButton.style.display = 'none';
                    if (cancelButton) {
                        cancelButton.textContent = 'Fermer';
                        cancelButton.disabled = false;
                        cancelButton.addEventListener('click', closeModal, { once: true });
                    }
                } catch (redrawError) {
                    console.error("❌ Error during UI redraw:", redrawError);
                    displayModalMessage(`Cadeau marqué, mais erreur d'affichage: ${redrawError.message}. Rafraîchissez la page.`, "warning");
                    if (cancelButton) {
                        cancelButton.disabled = false;
                        cancelButton.addEventListener('click', closeModal, { once: true });
                    }
                }
            } else {
                displayModalMessage("Erreur locale: cadeau non trouvé.", "error");
                if (confirmButton) confirmButton.disabled = false;
                if (cancelButton) cancelButton.disabled = false;
                reattachListeners();
            }
        } else {
            displayModalMessage(`Erreur réseau: ${scriptUpdateError.message}. Veuillez réessayer.`, "error");
            if (confirmButton) confirmButton.disabled = false;
            if (cancelButton) cancelButton.disabled = false;
            reattachListeners();
        }
    }

    function displayModalMessage(message, type = 'success') { // success, error, info
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            modalMessage.className = `modal-message-${type}`;
            modalMessage.style.display = 'block';
        }
    }


    // --- INITIALIZATION ---
    fetchAndProcessData(); // Fetch and process gifts and contributions

    if (cagnotteButton) {
        cagnotteButton.addEventListener('click', () => {
            openModal();
        });
    }

    modalOverlay.addEventListener('click', closeModal);
    closeModalButton.addEventListener('click', closeModal);
}); // --- FIN DU DOMCONTENTLOADED ---
