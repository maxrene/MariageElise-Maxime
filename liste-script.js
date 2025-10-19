document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQtHWPuy80gjnY-HuAO8K7KMxBQPEE5XEGNzJUZTsiDnE8MOG-3V9DSbp0tJ5jP7bTF1yYplsKx59p1/pub?output=csv'; // <--- PASTE YOUR CSV LINK HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username

    // --- DOM ELEMENTS ---
    const giftListContainer = document.getElementById('gift-list-container');
    const tabsContainer = document.getElementById('tabs-container');
    const cagnotteButton = document.querySelector('.cagnotte-section .revolut-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const giftModal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = giftModal.querySelector('.modal-close-button');

    let allGifts = []; // To store all gifts fetched from the sheet
    let currentGiftId = null; // To track which gift is being offered in the modal

    // --- FUNCTIONS ---

    /**
     * Fetches and parses CSV data from Google Sheets.
     * Skips the header row.
     */
    async function fetchGifts() {
        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            // Simple CSV parsing (assumes no commas within fields)
            const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
            const headers = rows[0].split(',').map(h => h.trim());
            allGifts = rows.slice(1).map(row => {
                const values = row.split(',');
                const gift = {};
                headers.forEach((header, index) => {
                    gift[header] = values[index] ? values[index].trim() : '';
                });
                // Convert price to number, default to 0 if invalid
                gift.Prix = parseFloat(gift.Prix) || 0;
                return gift;
            });
            console.log("Gifts loaded:", allGifts); // For debugging
            displayCategories();
            displayGifts('all'); // Display all gifts initially
        } catch (error) {
            console.error("Error fetching or parsing gifts:", error);
            giftListContainer.innerHTML = '<p class="error-message">Impossible de charger la liste. Veuillez réessayer plus tard.</p>';
        }
    }

    /**
     * Extracts unique categories and creates filter tabs.
     */
    function displayCategories() {
        const categories = ['all', ...new Set(allGifts.map(gift => gift.Categorie))];
        tabsContainer.innerHTML = categories.map(category => `
            <a href="#" class="tab-item ${category === 'all' ? 'active' : ''}" data-category="${category}">
                ${category === 'all' ? 'Tous' : category}
            </a>
        `).join('');

        // Add event listeners to tabs
        tabsContainer.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabsContainer.querySelector('.tab-item.active').classList.remove('active');
                tab.classList.add('active');
                displayGifts(tab.dataset.category);
            });
        });
    }

    /**
     * Generates HTML for a single gift card.
     */
    function createGiftCardHTML(gift) {
        const isOffered = gift.Offert_Par && gift.Offert_Par.trim() !== '';
        const formattedPrice = gift.Prix > 0 ? `${gift.Prix}€` : ''; // Format price

        return `
            <div class="gift-card ${isOffered ? 'offered' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper" style="background-image: url('${gift.ImageURL || 'https://via.placeholder.com/300'}')">
                    ${!isOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : ''}
                </div>
                <div class="gift-info">
                    <h4>${gift.Nom || 'Cadeau'}</h4>
                    ${gift.Brand ? `<p class="brand">${gift.Brand}</p>` : ''}
                    <p class="description">${gift.Description || ''}</p>
                </div>
                <button class="button ${isOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${isOffered ? 'disabled' : ''}>
                    ${isOffered ? `Offert par ${gift.Offert_Par}` : '<i class="fas fa-gift"></i> Offrir'}
                </button>
            </div>
        `;
    }


    /**
     * Displays gifts based on the selected category.
     */
    function displayGifts(category) {
        giftListContainer.innerHTML = ''; // Clear previous gifts
        const filteredGifts = category === 'all'
            ? allGifts
            : allGifts.filter(gift => gift.Categorie === category);

        if (filteredGifts.length === 0 && category !== 'all') {
             giftListContainer.innerHTML = '<p class="loading-message">Aucun cadeau dans cette catégorie pour le moment.</p>';
        } else if (allGifts.length === 0) {
            // This case is handled by the fetch error message or initial loading message
             giftListContainer.innerHTML = '<p class="loading-message">La liste est vide pour le moment.</p>';
        }
        else {
             filteredGifts.forEach(gift => {
                giftListContainer.innerHTML += createGiftCardHTML(gift);
            });
        }


        // Add event listeners to the new buttons
        addOfferButtonListeners();
    }

    /**
     * Adds event listeners to all "Offrir" buttons.
     */
    function addOfferButtonListeners() {
        giftListContainer.querySelectorAll('.revolut-button[data-type="gift"]').forEach(button => {
            button.addEventListener('click', () => {
                currentGiftId = button.closest('.gift-card').dataset.id;
                const gift = allGifts.find(g => g.ID === currentGiftId);
                openModal(gift);
            });
        });
    }

    /**
     * Opens the modal with gift details or for free contribution.
     */
     function openModal(gift = null) {
        let contentHTML = '';
        if (gift) { // Offering a specific gift
            const revolutAmountLink = gift.Prix > 0 ? `${revolutLinkBase}${gift.Prix}` : revolutLinkBase;
            contentHTML = `
                <h3>${gift.Nom}</h3>
                <p>${gift.Description}</p>
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
                    <div id="modal-message" class="success" style="display: none;"></div>
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

        // Add listeners for modal buttons
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (confirmButton) {
            confirmButton.addEventListener('click', handleConfirmOffer);
        }
        if (cancelButton) {
             cancelButton.addEventListener('click', closeModal);
        }
    }

    /**
     * Closes the modal.
     */
    function closeModal() {
        modalOverlay.style.display = 'none';
        giftModal.style.display = 'none';
        modalContent.innerHTML = ''; // Clear content
        currentGiftId = null;
    }

    /**
     * Handles the confirmation of offering a gift.
     * **Note:** This only updates the UI for now. No data is sent back to Google Sheets.
     */
    function handleConfirmOffer() {
        const nameInput = document.getElementById('offeredByName');
        const modalMessage = document.getElementById('modal-message');

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            return;
        }

        const offeredByName = nameInput.value.trim();

        // --- SIMULATION: Update UI ---
        const giftIndex = allGifts.findIndex(g => g.ID === currentGiftId);
        if (giftIndex !== -1) {
            allGifts[giftIndex].Offert_Par = offeredByName; // Update local data
             // Re-display gifts with the current filter to show the change
            const currentCategory = tabsContainer.querySelector('.tab-item.active')?.dataset.category || 'all';
            displayGifts(currentCategory);
             displayModalMessage("Merci beaucoup pour votre contribution !", "success");
             // Disable form and change button after success
             nameInput.disabled = true;
             document.getElementById('confirmOfferButton').style.display = 'none';
             const cancelButton = document.getElementById('cancelOfferButton');
             cancelButton.textContent = 'Fermer'; // Change cancel to close
            // Optional: Close modal automatically after a delay
            // setTimeout(closeModal, 2500);
        } else {
            displayModalMessage("Erreur lors de la mise à jour.", "error");
        }
        // --- End Simulation ---

        /*
        // --- REAL IMPLEMENTATION (Requires backend/Apps Script) ---
        // Here you would typically send the gift ID and offeredByName
        // to a backend service (like a Google Apps Script web app)
        // which would then update the Google Sheet.
        // Example:
        // markGiftAsOfferedOnSheet(currentGiftId, offeredByName)
        //    .then(() => {
        //        // Update UI as in simulation
        //        displayModalMessage("Merci beaucoup !", "success");
        //         setTimeout(closeModal, 2000); // Close after success
        //    })
        //    .catch(error => {
        //        console.error("Error marking gift as offered:", error);
        //        displayModalMessage("Erreur lors de la mise à jour.", "error");
        //    });
        */
    }

     /**
     * Displays a message within the modal.
     */
    function displayModalMessage(message, type = 'success') {
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            modalMessage.className = type; // 'success' or 'error'
            modalMessage.style.display = 'block';
        }
    }


    // --- INITIALIZATION ---
    fetchGifts();

    // Event listener for the free contribution button
    if (cagnotteButton) {
        cagnotteButton.addEventListener('click', () => {
            openModal(); // Open modal without gift details
        });
    }

    // Event listener for closing the modal via overlay or close button
    modalOverlay.addEventListener('click', closeModal);
    closeModalButton.addEventListener('click', closeModal);

});
