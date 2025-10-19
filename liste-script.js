document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'YOUR_PUBLISHED_GOOGLE_SHEET_CSV_URL'; // <--- PASTE YOUR CSV LINK HERE
    const revolutLinkBase = 'https://revolut.me/YOUR_REVOLUT_USERNAME/'; // Optional: Replace with your Revolut username

    // --- DOM ELEMENTS ---
    const giftListContainer = document.getElementById('gift-list-container');
    // const tabsContainer = document.getElementById('tabs-container'); // <-- Supprimé
    const cagnotteButton = document.querySelector('.cagnotte-section .revolut-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const giftModal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = giftModal.querySelector('.modal-close-button');

    let allGifts = []; // To store all gifts fetched from the sheet
    let currentGiftId = null; // To track which gift is being offered in the modal

    // --- FUNCTIONS ---

    async function fetchGifts() {
        try {
            const response = await fetch(sheetUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
             const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
             const headers = rows[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(h => h.replace(/^"|"$/g, '').trim());
             allGifts = rows.slice(1).map(row => {
                 const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').trim());
                 const gift = {};
                 headers.forEach((header, index) => {
                     gift[header] = values[index] ? values[index] : '';
                 });
                 gift.Prix = parseFloat(gift.Prix) || 0;
                 return gift;
             });
            console.log("Gifts loaded:", allGifts);
            // displayCategories(); // <-- Appel supprimé
            displayAllGiftsByCategory(); // <-- Nouvelle fonction appelée
        } catch (error) {
            console.error("Error fetching or parsing gifts:", error);
            giftListContainer.innerHTML = '<p class="error-message">Impossible de charger la liste. Veuillez réessayer plus tard.</p>';
        }
    }

    // --- FONCTION displayCategories() SUPPRIMÉE ---

    /**
     * Generates HTML for a single gift card (Simple/Premium design).
     * (Fonction inchangée)
     */
    function createGiftCardHTML(gift) {
        const isOffered = gift.Offert_Par && gift.Offert_Par.trim() !== '';
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
     * NOUVELLE FONCTION: Displays all gifts grouped by category sequentially.
     */
    function displayAllGiftsByCategory() {
        giftListContainer.innerHTML = ''; // Clear loading message

        if (allGifts.length === 0) {
            giftListContainer.innerHTML = '<p class="loading-message">La liste est vide pour le moment.</p>';
            return;
        }

        // 1. Grouper les cadeaux par catégorie
        const giftsByCategory = allGifts.reduce((acc, gift) => {
            const category = gift.Categorie || 'Autres'; // Default category if empty
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(gift);
            return acc;
        }, {});

        // 2. Déterminer l'ordre des catégories (peut être défini manuellement si besoin)
        const categoryOrder = Object.keys(giftsByCategory); // Ordre par défaut (alphabétique ou ordre d'apparition)
        // Si vous voulez un ordre spécifique : const categoryOrder = ['Cuisine', 'Maison', 'Expériences', 'Autres'];

        // 3. Afficher chaque catégorie et ses cadeaux
        categoryOrder.forEach(category => {
            // Ajoute le titre de la catégorie
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            giftListContainer.appendChild(categoryTitle);

            // Ajoute la grille pour les cadeaux de cette catégorie
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'gift-grid-wrapper';
            giftsByCategory[category].forEach(gift => {
                gridWrapper.innerHTML += createGiftCardHTML(gift);
            });
            giftListContainer.appendChild(gridWrapper);
        });

        // Add event listeners to all buttons once everything is displayed
        addOfferButtonListeners();
    }


    /**
     * Adds event listeners to all "Offrir" buttons.
     * (Fonction inchangée, mais importante)
     */
     function addOfferButtonListeners() {
        // Technique pour éviter les listeners dupliqués
        const buttons = giftListContainer.querySelectorAll('.revolut-button[data-type="gift"]:not(.listener-added)');
        buttons.forEach(button => {
            button.classList.add('listener-added'); // Marque le bouton
            button.addEventListener('click', () => {
                currentGiftId = button.closest('.gift-card').dataset.id;
                const gift = allGifts.find(g => g.ID === currentGiftId);
                openModal(gift);
            });
        });
    }

    // --- Fonctions openModal, closeModal, handleConfirmOffer, displayModalMessage (INCHANGÉES) ---
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

        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        if (confirmButton) {
            confirmButton.addEventListener('click', handleConfirmOffer);
        }
        if (cancelButton) {
             cancelButton.replaceWith(cancelButton.cloneNode(true)); // Avoid duplicate listeners
             document.getElementById('cancelOfferButton').addEventListener('click', closeModal);
        }
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        giftModal.style.display = 'none';
        modalContent.innerHTML = '';
        currentGiftId = null;
    }

    function handleConfirmOffer() {
        const nameInput = document.getElementById('offeredByName');
        const modalMessage = document.getElementById('modal-message');

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            return;
        }

        const offeredByName = nameInput.value.trim();
        const giftIndex = allGifts.findIndex(g => g.ID === currentGiftId);

        if (giftIndex !== -1) {
            allGifts[giftIndex].Offert_Par = offeredByName;
            displayAllGiftsByCategory(); // Re-display everything
            displayModalMessage("Merci beaucoup pour votre contribution !", "success");
            nameInput.disabled = true;
            const confirmBtn = document.getElementById('confirmOfferButton');
            if (confirmBtn) confirmBtn.style.display = 'none';
            const cancelButton = document.getElementById('cancelOfferButton');
            if (cancelButton) cancelButton.textContent = 'Fermer';
        } else {
            displayModalMessage("Erreur lors de la mise à jour.", "error");
        }
    }

    function displayModalMessage(message, type = 'success') {
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            modalMessage.className = type;
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
