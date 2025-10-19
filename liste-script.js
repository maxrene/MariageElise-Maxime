document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // <--- PASTE YOUR CSV LINK HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbxpYkmQpRry9oXlBoX03eV9EIOGIi3Pj41ZLbmxdjuHY0fXJYi0ra8y5XlhdGKOeHm4bA/exec'; // <-- AJOUTEZ CETTE LIGNE (URL à venir)

 // --- DOM ELEMENTS ---
    const giftListContainer = document.getElementById('gift-list-container');
    const cagnotteButton = document.querySelector('.cagnotte-section .revolut-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const giftModal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = giftModal.querySelector('.modal-close-button');

    let allGifts = [];
    let currentGiftId = null;

    // --- FUNCTIONS ---

    async function fetchGifts() {
        console.log("Attempting to fetch gifts from:", sheetUrl);
        giftListContainer.innerHTML = '<p class="loading-message">Chargement de la liste de cadeaux...</p>';
        try {
            const response = await fetch(sheetUrl);
             console.log("Fetch response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();
            console.log("CSV Text received (first 300 chars):", csvText.substring(0, 300));

             const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
             if (rows.length < 2) {
                 throw new Error("CSV data seems empty or invalid (less than 2 rows).");
             }

            function parseCsvRow(rowString) {
                const values = [];
                let currentVal = '';
                let inQuotes = false;
                for (let i = 0; i < rowString.length; i++) {
                    const char = rowString[i];
                    if (char === '"') {
                        if (inQuotes && rowString[i+1] === '"') {
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

            const headers = parseCsvRow(rows[0]);
            console.log("Parsed headers:", headers);

            if (headers.length === 0 || !headers.includes("ID") || !headers.includes("Nom")) {
                 throw new Error("CSV Headers are missing or invalid. Check publication settings.");
            }

            allGifts = rows.slice(1).map((row, rowIndex) => {
                 const values = parseCsvRow(row);
                 if (values.length !== headers.length) {
                     console.warn(`Skipping row ${rowIndex + 2}: Incorrect number of columns after parsing. Expected ${headers.length}, got ${values.length}. Row content: ${row}`);
                     return null;
                 }
                  const gift = {};
                  headers.forEach((header, index) => {
                      gift[header.trim()] = values[index] ? values[index] : '';
                  });

                 if (!gift.ID || !gift.Nom) {
                    console.warn(`Skipping row ${rowIndex + 2}: Missing ID or Nom. Row content: ${row}`);
                    return null;
                 }

                 gift.Prix = parseFloat(gift.Prix) || 0;
                 return gift;
             }).filter(gift => gift !== null);


            console.log("Gifts parsed successfully:", allGifts);
            if (allGifts.length === 0 && rows.length > 1) {
                 console.warn("Parsing resulted in zero valid gifts, although rows were present. Check row content and column matching.");
                 throw new Error("Aucun cadeau valide n'a pu être lu. Vérifiez le format des lignes dans le Google Sheet.");
            }
            displayAllGiftsByCategory();
        } catch (error) {
            console.error("❌ Error fetching or parsing gifts:", error);
            giftListContainer.innerHTML = `<p class="error-message">Impossible de charger la liste. Erreur: ${error.message}. Vérifiez l'URL, la publication et le format du Google Sheet.</p>`;
        }
    }

    /**
     * Generates HTML for a single gift card, reflecting initial offered status (Comments Removed).
     */
    function createGiftCardHTML(gift) {
        const isOffered = gift.Offert_par && gift.Offert_par.trim() !== ''; // Ensure correct property name from sheet
        const formattedPrice = gift.Prix > 0 ? `${gift.Prix}€` : '';

        // Comments removed from inside the string
        return `
            <div class="gift-card ${isOffered ? 'offered' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper" style="background-image: url('${gift.ImageURL || 'https://via.placeholder.com/300'}')">
                    ${!isOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : ''}
                </div>
                <div class="gift-info">
                    <p class="gift-title-price">${gift.Nom || 'Cadeau'}</p>
                    ${gift.Brand ? `<p class="brand">${gift.Brand}</p>` : ''}
                    <p class="description">${gift.Description || ''}</p>
                </div>
                <button class="button ${isOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${isOffered ? 'disabled' : ''}>
                    ${isOffered ? 'Offert' : '<i class="fab fa-rev"></i> Offrir via Revolut'}
                </button>
            </div>
        `;
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
             const button = event.target.closest('.revolut-button[data-type="gift"]:not(.offered)');
             if (button) {
                 console.log("Offer button clicked");
                 currentGiftId = button.closest('.gift-card').dataset.id;
                 const gift = allGifts.find(g => g.ID === currentGiftId);
                 if (gift) {
                     openModal(gift);
                 } else {
                     console.error("Could not find gift data for ID:", currentGiftId);
                 }
             }
         });
         giftListContainer.dataset.listenerAttached = 'true';
         console.log("Offer button listeners attached via delegation.");
    }

    // --- Fonctions openModal, closeModal, handleConfirmOffer, displayModalMessage ---
     function openModal(gift = null) {
        let contentHTML = '';
        if (gift) { // Offering a specific gift
            const revolutAmountLink = gift.Prix > 0 ? `${revolutLinkBase}${gift.Prix}` : revolutLinkBase;
            contentHTML = `
                <h3>${gift.Nom}</h3>
                <p>${gift.Description || 'Pas de description.'}</p>
                <a href="${revolutAmountLink}" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
                   <i class="fas fa-external-link-alt"></i> Contribuer ${gift.Prix > 0 ? `de ${gift.Prix}€ ` : ''}via Revolut
                </a>
                <div class="confirmation-section">
                    <p>Après avoir contribué, merci d'entrer votre nom pour marquer ce cadeau comme offert :</p>
                    <label for="offeredByName">Votre nom ou initiales :</label>
                    <input type="text" id="offeredByName" placeholder="Ex: Jean D." required>
                    <div class="modal-buttons">
                        <button class="button secondary" id="cancelOfferButton">Annuler</button>
                        <button class="button primary" id="confirmOfferButton">Marquer comme offert</button>
                    </div>
                    <div id="modal-message" style="display: none;"></div>
                </div>
            `;
        } else { // Free contribution (cagnotte)
             contentHTML = `
                <h3>Contribution Libre</h3>
                <p>Participez librement à notre cagnotte !</p>
                 <a href="${revolutLinkBase}" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
                   <i class="fas fa-external-link-alt"></i> Contribuer via Revolut
                </a>
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
             console.log("cancelOfferButton not found in modal");
        }
    }


    function closeModal() {
        modalOverlay.style.display = 'none';
        giftModal.style.display = 'none';
        modalContent.innerHTML = '';
        currentGiftId = null;
    }

    async function handleConfirmOffer() { // Made async
        const nameInput = document.getElementById('offeredByName');
        const modalMessage = document.getElementById('modal-message');
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            // Re-attach listener if validation fails, because {once: true} removed it
            if(confirmButton) confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
            return;
        }

        const offeredByName = nameInput.value.trim();
        const giftIdToUpdate = currentGiftId;

        if (confirmButton) confirmButton.disabled = true;
        if (cancelButton) cancelButton.disabled = true;
        displayModalMessage("Mise à jour en cours...", "info");

        let scriptUpdateError = null;

        try {
            console.log("Sending to Apps Script:", { giftId: giftIdToUpdate, name: offeredByName });

            await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ giftId: giftIdToUpdate, name: offeredByName }),
             });

            console.log("Request potentially sent to Apps Script (no-cors). Assuming success for UI update.");

        } catch (error) {
            scriptUpdateError = error;
            console.error("❌ Error sending update request to Apps Script:", error);
        }

        // --- Update UI (Optimistically unless fetch failed) ---
        if (!scriptUpdateError) {
             const giftIndex = allGifts.findIndex(g => g.ID === giftIdToUpdate);
             if (giftIndex !== -1) {
                 allGifts[giftIndex].Offert_par = offeredByName; // Update local data using correct property name
                 try {
                     displayAllGiftsByCategory();
                     console.log("UI redraw attempted after potential script success.");
                     displayModalMessage("Merci beaucoup pour votre contribution !", "success");
                     if (nameInput) nameInput.disabled = true;
                     if (confirmButton) confirmButton.style.display = 'none';
                     if (cancelButton) {
                         cancelButton.textContent = 'Fermer';
                         cancelButton.disabled = false; // Re-enable close button
                         // Re-attach close listener since it was {once: true}
                         cancelButton.addEventListener('click', closeModal, { once: true });
                     }
                 } catch(redrawError) {
                     console.error("❌ Error during UI redraw:", redrawError);
                     displayModalMessage(`Cadeau marqué, mais erreur d'affichage: ${redrawError.message}. Rafraîchissez la page.`, "warning");
                     if (cancelButton) {
                        cancelButton.disabled = false; // Still allow closing
                        // Re-attach close listener
                         cancelButton.addEventListener('click', closeModal, { once: true });
                     }
                 }
             } else {
                 console.error("Error updating UI: could not find gift with ID", giftIdToUpdate);
                 displayModalMessage("Erreur locale lors de la mise à jour (cadeau non trouvé).", "error");
                 if (confirmButton) {
                     confirmButton.disabled = false;
                     // Re-attach listener
                     confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
                 }
                 if (cancelButton) {
                    cancelButton.disabled = false;
                    // Re-attach listener
                    cancelButton.addEventListener('click', closeModal, { once: true });
                 }
             }
        } else {
             displayModalMessage(`Erreur réseau lors de la mise à jour: ${scriptUpdateError.message}. Veuillez réessayer.`, "error");
             if (confirmButton) {
                confirmButton.disabled = false;
                 // Re-attach listener
                confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
             }
             if (cancelButton) {
                cancelButton.disabled = false;
                 // Re-attach listener
                cancelButton.addEventListener('click', closeModal, { once: true });
             }
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
    fetchGifts(); // Fetch data and display

    if (cagnotteButton) {
        cagnotteButton.addEventListener('click', () => {
            openModal();
        });
    }

    modalOverlay.addEventListener('click', closeModal);
    closeModalButton.addEventListener('click', closeModal);
}); // --- FIN DU DOMCONTENTLOADED ---
