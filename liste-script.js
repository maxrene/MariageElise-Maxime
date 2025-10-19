document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // <--- PASTE YOUR CSV LINK HERE
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
            // Simple CSV parsing (assumes no commas within fields & handles potential quotes)
             const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
             // Robust header parsing (handles potential quotes)
             const headers = rows[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(h => h.replace(/^"|"$/g, '').trim());
             allGifts = rows.slice(1).map(row => {
                 // Robust value parsing (handles potential quotes and commas within quotes)
                 const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').trim());
                 const gift = {};
                 headers.forEach((header, index) => {
                     gift[header] = values[index] ? values[index] : ''; // Keep empty strings if needed
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
        const categories = ['all', ...new Set(allGifts.map(gift => gift.Categorie).filter(cat => cat))]; // Filter out empty categories
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
     * Displays gifts based on the selected category AND adds a title.
     */
    function displayGifts(category) {
        giftListContainer.innerHTML = ''; // Clear previous content (title + gifts)

        const filteredGifts = category === 'all'
            ? allGifts
            : allGifts.filter(gift => gift.Categorie === category);

        // --- AJOUT : Créer et insérer le titre de la catégorie ---
        if (category !== 'all' && filteredGifts.length > 0) {
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'category-title'; // Classe pour le style CSS
            categoryTitle.textContent = category;
            giftListContainer.appendChild(categoryTitle); // Ajoute le titre AVANT la grille
        } else if (category === 'all' && allGifts.length > 0) { // Only show 'All' title if there are gifts
             const allTitle = document.createElement('h3');
             allTitle.className = 'category-title';
             allTitle.textContent = 'Tous nos coups de cœur'; // Ou simplement "Tous les cadeaux"
             giftListContainer.appendChild(allTitle);
        }
        // --- FIN AJOUT ---

        // Créer un conteneur pour la grille des cadeaux (pour que le titre soit séparé)
        const gridWrapper = document.createElement('div');
        // Appliquer les classes de grille ici (CSS custom)
        gridWrapper.className = 'gift-grid-wrapper'; // Classe pour le style CSS de la grille

        if (filteredGifts.length === 0 && category !== 'all') {
             gridWrapper.innerHTML = '<p class="loading-message">Aucun cadeau dans cette catégorie pour le moment.</p>';
        } else if (allGifts.length === 0) { // Check if allGifts itself is empty
             // This case might be handled by fetch error, but added for robustness
             gridWrapper.innerHTML = '<p class="loading-message">La liste est vide pour le moment.</p>';
        } else if (filteredGifts.length === 0 && category === 'all') {
             gridWrapper.innerHTML = '<p class="loading-message">La liste est vide pour le moment.</p>';
        } else {
             filteredGifts.forEach(gift => {
                gridWrapper.innerHTML += createGiftCardHTML(gift);
            });
        }

        giftListContainer.appendChild(gridWrapper); // Ajoute la grille APRES le titre

        // Add event listeners to the new buttons
        addOfferButtonListeners();
    }


    /**
     * Generates HTML for a single gift card (Simple/Premium design).
     */
    function createGiftCardHTML(gift) {
        const isOffered = gift.Offert_Par && gift.Offert_Par.trim() !== '';
        // Prépare la partie prix à inclure dans le titre, ou une chaîne vide si 0 ou offert
        const priceString = (!isOffered && gift.Prix > 0) ? ` - ${gift.Prix}€` : '';

        return `
            <div class="gift-card ${isOffered ? 'offered' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper" style="background-image: url('${gift.ImageURL || 'https://via.placeholder.com/300'}')">
                    </div>
                <div class="gift-info">
                    <p class="gift-title-price">${gift.Nom || 'Cadeau'}<span class="gift-price-value">${priceString}</span></p>
                    ${gift.Brand ? `<p class="brand">${gift.Brand}</p>` : ''}
                    <p class="description">${gift.Description || ''}</p>
                </div>
                <button class="button ${isOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${isOffered ? 'disabled' : ''}>
                    ${isOffered ? `Offert par ${gift.Offert_Par}` : '<i class="fab fa-rev"></i> Offrir via Revolut'}
                </button>
            </div>
        `;
    }


    /**
     * Adds event listeners to all "Offrir" buttons.
     */
    function addOfferButtonListeners() {
        giftListContainer.querySelectorAll('.revolut-button[data-type="gift"]').forEach(button => {
            // Remove existing listener to prevent duplicates if function is called multiple times
            button.replaceWith(button.cloneNode(true));
        });
         // Add new listeners
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

        // Add listeners for modal buttons
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (confirmButton) {
            confirmButton.addEventListener('click', handleConfirmOffer);
        }
        if (cancelButton) {
             // Ensure only one listener is attached
             cancelButton.replaceWith(cancelButton.cloneNode(true));
             document.getElementById('cancelOfferButton').addEventListener('click', closeModal);
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
             const confirmBtn = document.getElementById('confirmOfferButton');
             if (confirmBtn) confirmBtn.style.display = 'none';
             const cancelButton = document.getElementById('cancelOfferButton');
             if (cancelButton) cancelButton.textContent = 'Fermer'; // Change cancel to close
            // Optional: Close modal automatically after a delay
            // setTimeout(closeModal, 2500);
        } else {
            displayModalMessage("Erreur lors de la mise à jour.", "error");
        }
        // --- End Simulation ---

        /*
        // --- REAL IMPLEMENTATION (Requires backend/Apps Script) ---
        // see previous explanation on how this would work
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

}); // --- FIN DU DOMCONTENTLOADED ---
