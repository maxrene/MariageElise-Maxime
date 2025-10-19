document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // <--- PASTE YOUR CSV LINK HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzu5ctOjbt_2EqNl7Z2JMM8aJGgirNVoWIhD3P72qn4Dwp4EFQJ4FQOdfwJFMEr_kUBpg/exec'; // <-- AJOUTEZ CETTE LIGNE (URL à venir)

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
        console.log("Attempting to fetch gifts from:", sheetUrl); // Debug log
        giftListContainer.innerHTML = '<p class="loading-message">Chargement de la liste de cadeaux...</p>';
        try {
            const response = await fetch(sheetUrl);
             console.log("Fetch response status:", response.status); // Debug log
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();
            console.log("CSV Text received (first 300 chars):", csvText.substring(0, 300)); // Debug log - Show more data

             const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
             if (rows.length < 2) {
                 throw new Error("CSV data seems empty or invalid (less than 2 rows).");
             }

            // --- Nouvelle Logique de Parsing ---
            function parseCsvRow(rowString) {
                const values = [];
                let currentVal = '';
                let inQuotes = false;
                for (let i = 0; i < rowString.length; i++) {
                    const char = rowString[i];
                    if (char === '"') {
                        // Handle escaped quotes ("") inside quoted field
                        if (inQuotes && rowString[i+1] === '"') {
                            currentVal += '"';
                            i++; // Skip next quote
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
                values.push(currentVal.trim()); // Add the last value
                return values;
            }

            const headers = parseCsvRow(rows[0]);
            console.log("Parsed headers:", headers); // Debug log

            if (headers.length === 0 || !headers.includes("ID") || !headers.includes("Nom")) {
                 throw new Error("CSV Headers are missing or invalid. Check publication settings.");
            }

            allGifts = rows.slice(1).map((row, rowIndex) => {
                 const values = parseCsvRow(row);
                 // Check if the number of values matches the number of headers AFTER parsing
                 if (values.length !== headers.length) {
                     console.warn(`Skipping row ${rowIndex + 2}: Incorrect number of columns after parsing. Expected ${headers.length}, got ${values.length}. Row content: ${row}`);
                     return null; // Skip this invalid row
                 }
                  const gift = {};
                  headers.forEach((header, index) => {
                      // Use header name (trimmed just in case) for assignment
                      gift[header.trim()] = values[index] ? values[index] : '';
                  });


                 // Check for essential fields (optional, but good practice)
                 if (!gift.ID || !gift.Nom) {
                    console.warn(`Skipping row ${rowIndex + 2}: Missing ID or Nom. Row content: ${row}`);
                    return null; // Skip row if essential data is missing
                 }

                 gift.Prix = parseFloat(gift.Prix) || 0;
                 return gift;
             }).filter(gift => gift !== null); // Remove skipped rows
             // --- Fin Nouvelle Logique de Parsing ---


            console.log("Gifts parsed successfully:", allGifts); // Debug log
            if (allGifts.length === 0 && rows.length > 1) {
                 console.warn("Parsing resulted in zero valid gifts, although rows were present. Check row content and column matching.");
                 throw new Error("Aucun cadeau valide n'a pu être lu. Vérifiez le format des lignes dans le Google Sheet."); // Inform user
            }
            displayAllGiftsByCategory();
        } catch (error) {
            console.error("❌ Error fetching or parsing gifts:", error); // Make error more visible
            giftListContainer.innerHTML = `<p class="error-message">Impossible de charger la liste. Erreur: ${error.message}. Vérifiez l'URL, la publication et le format du Google Sheet.</p>`; // More detailed error
        }
    }

    /**
     * Generates HTML for a single gift card (White price tag - Comments Removed).
     */
function createGiftCardHTML(gift) {
        // Check if the 'Offert_par' field has content (is not empty/null/undefined)
        const isOffered = gift.Offert_par && gift.Offert_par.trim() !== ''; // Use the exact header name 'Offert_par'
        const formattedPrice = gift.Prix > 0 ? `${gift.Prix}€` : '';

        // Add 'offered' class to the main div if isOffered is true
        return `
            <div class="gift-card ${isOffered ? 'offered' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper" style="background-image: url('${gift.ImageURL || 'https://via.placeholder.com/300'}')">
                    {/* Display price tag only if NOT offered AND price exists */}
                    ${!isOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : ''}
                </div>
                <div class="gift-info">
                    <p class="gift-title-price">${gift.Nom || 'Cadeau'}</p>
                    ${gift.Brand ? `<p class="brand">${gift.Brand}</p>` : ''}
                    <p class="description">${gift.Description || ''}</p>
                </div>
                {/* Set button class, text, and disabled state based on isOffered */}
                <button class="button ${isOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${isOffered ? 'disabled' : ''}>
                    ${isOffered ? 'Offert' : '<i class="fab fa-rev"></i> Offrir via Revolut'}
                </button>
            </div>
        `;
    }

    /**
     * Displays all gifts grouped by category sequentially. (Listener call moved)
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
             // Ensure gift and gift.Categorie exist before trying to access
             if (gift && typeof gift === 'object') {
                const category = gift.Categorie ? gift.Categorie.trim() : 'Autres'; // Use 'Autres' if category is missing or empty
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
                // Ajoute le titre de la catégorie
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                fragment.appendChild(categoryTitle);

                // Ajoute la grille pour les cadeaux de cette catégorie
                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'gift-grid-wrapper';
                let categoryGiftHTML = ''; // Build HTML string for efficiency
                gifts.forEach(gift => {
                    // Ensure gift object is valid before creating HTML
                    if (gift && gift.ID) {
                        categoryGiftHTML += createGiftCardHTML(gift);
                        giftCount++; // Increment counter
                    } else {
                        console.warn("Skipping invalid gift object during HTML generation:", gift);
                    }
                });
                gridWrapper.innerHTML = categoryGiftHTML; // Set HTML once per category
                fragment.appendChild(gridWrapper);
            } else {
                console.log(`Skipping category "${category}" because it has no valid gifts.`); // Log skipped category
            }
        });

        // Append the fragment to the DOM
        giftListContainer.appendChild(fragment);
        console.log(`Finished displaying gifts. Total gifts added: ${giftCount}`); // Log completion and count

        // Add event listeners AFTER all HTML is added
        addOfferButtonListeners();
    }


    /**
     * Adds event listeners ONCE using delegation to all "Offrir" buttons present in the container.
     */
     function addOfferButtonListeners() {
         // Check if listener already exists to avoid duplicates (optional safety)
         if (giftListContainer.dataset.listenerAttached === 'true') {
            console.log("Delegated listener already attached."); // Debug log
            return;
         }

         giftListContainer.addEventListener('click', function(event) {
             const button = event.target.closest('.revolut-button[data-type="gift"]:not(.offered)');
             if (button) {
                 console.log("Offer button clicked"); // Debug log
                 currentGiftId = button.closest('.gift-card').dataset.id;
                 const gift = allGifts.find(g => g.ID === currentGiftId);
                 if (gift) {
                     openModal(gift);
                 } else {
                     console.error("Could not find gift data for ID:", currentGiftId);
                 }
             }
         });
         giftListContainer.dataset.listenerAttached = 'true'; // Mark container
         console.log("Offer button listeners attached via delegation."); // Debug log
    }

    // --- Fonctions openModal, closeModal, handleConfirmOffer, displayModalMessage (INCHANGÉES) ---
     function openModal(gift = null) {
        let contentHTML = '';
        if (gift) { // Offering a specific gift
            const revolutAmountLink = gift.Prix > 0 ? `${revolutLinkBase}${gift.Prix}` : revolutLinkBase;
            contentHTML = `
                <h3>${gift.Nom}</h3>
                <p>${gift.Description || 'Pas de description.'}</p> {/* Added fallback */}
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

        modalContent.innerHTML = contentHTML;
        modalOverlay.style.display = 'block';
        giftModal.style.display = 'block';

        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (confirmButton) {
            confirmButton.replaceWith(confirmButton.cloneNode(true));
            document.getElementById('confirmOfferButton').addEventListener('click', handleConfirmOffer);
        }
        if (cancelButton) {
             cancelButton.replaceWith(cancelButton.cloneNode(true));
             document.getElementById('cancelOfferButton').addEventListener('click', closeModal);
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
        const modalMessage = document.getElementById('modal-message');
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            return;
        }

        const offeredByName = nameInput.value.trim();
        const giftIdToUpdate = currentGiftId; // Store ID before potential modal closure

        // Disable buttons during processing
        if (confirmButton) confirmButton.disabled = true;
        if (cancelButton) cancelButton.disabled = true;
        displayModalMessage("Mise à jour en cours...", "info"); // Show processing message

        try {
            console.log("Sending to Apps Script:", { giftId: giftIdToUpdate, name: offeredByName }); // Debug log
            
            // --- Appel à Google Apps Script ---
            const response = await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Important for simple Apps Script POST
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                 // Send data as a JSON string in the request body
                 // Apps Script will parse this using JSON.parse(e.postData.contents)
                body: JSON.stringify({ giftId: giftIdToUpdate, name: offeredByName }),
             });
             
            // Note: With 'no-cors', we cannot directly read the response status or body here.
            // We assume success if the request itself didn't throw an error.
            // Apps Script needs to handle errors internally if possible.
            console.log("Request sent to Apps Script (no-cors). Assuming success if no error thrown."); // Debug log

            // --- Update UI Optimistically ---
            const giftIndex = allGifts.findIndex(g => g.ID === giftIdToUpdate);
            if (giftIndex !== -1) {
                allGifts[giftIndex].Offert_Par = offeredByName; // Update local data
                displayAllGiftsByCategory(); // Re-render the list
                displayModalMessage("Merci beaucoup pour votre contribution !", "success");
                nameInput.disabled = true;
                if (confirmButton) confirmButton.style.display = 'none';
                if (cancelButton) {
                    cancelButton.textContent = 'Fermer';
                    cancelButton.disabled = false; // Re-enable close button
                }
                 // Optional: Close modal automatically after a delay
                // setTimeout(closeModal, 2500);
            } else {
                 // This case should ideally not happen if currentGiftId was valid
                console.error("Error updating UI: could not find gift with ID", giftIdToUpdate);
                throw new Error("Erreur locale lors de la mise à jour (cadeau non trouvé).");
            }

        } catch (error) {
            console.error("❌ Error sending update to Apps Script or updating UI:", error);
            displayModalMessage(`Erreur lors de la mise à jour: ${error.message}. Veuillez réessayer ou nous contacter.`, "error");
            // Re-enable buttons on error
            if (confirmButton) confirmButton.disabled = false;
            if (cancelButton) cancelButton.disabled = false;
        }
    }

    // --- Add a new CSS class for the info message ---
    function displayModalMessage(message, type = 'success') { // success, error, info
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            // Use specific classes for styling
            modalMessage.className = `modal-message-${type}`; // e.g., modal-message-success
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
