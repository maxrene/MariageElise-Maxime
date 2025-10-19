document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // <--- PASTE YOUR CSV LINK HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username

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
            console.log("CSV Text received (first 200 chars):", csvText.substring(0, 200)); // Debug log

             const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
             if (rows.length < 2) {
                 throw new Error("CSV data seems empty or invalid (less than 2 rows).");
             }

             const headers = rows[0].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(h => h.replace(/^"|"$/g, '').trim());
             console.log("Parsed headers:", headers); // Debug log

             allGifts = rows.slice(1).map((row, rowIndex) => {
                 const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                 if (!values || values.length !== headers.length) {
                     console.warn(`Skipping row ${rowIndex + 2}: Incorrect number of columns. Expected ${headers.length}, got ${values ? values.length : 0}. Row content: ${row}`);
                     return null;
                 }
                  const gift = {};
                  values.map(v => v.replace(/^"|"$/g, '').trim()).forEach((value, index) => {
                      gift[headers[index]] = value;
                  });

                 if (!gift.ID || !gift.Nom) {
                    console.warn(`Skipping row ${rowIndex + 2}: Missing ID or Nom. Row content: ${row}`);
                    return null;
                 }

                 gift.Prix = parseFloat(gift.Prix) || 0;
                 return gift;
             }).filter(gift => gift !== null);

            console.log("Gifts parsed successfully:", allGifts); // Debug log
            displayAllGiftsByCategory();
        } catch (error) {
            console.error("❌ Error fetching or parsing gifts:", error);
            giftListContainer.innerHTML = `<p class="error-message">Impossible de charger la liste. Erreur: ${error.message}. Vérifiez l'URL et la publication du Google Sheet.</p>`;
        }
    }

    /**
     * Generates HTML for a single gift card (White price tag - Comments Removed).
     */
    function createGiftCardHTML(gift) {
        const isOffered = gift.Offert_Par && gift.Offert_Par.trim() !== '';
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
                    ${isOffered ? `Offert par ${gift.Offert_Par}` : '<i class="fab fa-rev"></i> Offrir via Revolut'}
                </button>
            </div>
        `;
    }

    /**
     * Displays all gifts grouped by category sequentially. (Listener call moved)
     */
    function displayAllGiftsByCategory() {
        giftListContainer.innerHTML = ''; // Clear loading message

        if (allGifts.length === 0) {
            if (!giftListContainer.querySelector('.error-message')) {
               giftListContainer.innerHTML = '<p class="loading-message">La liste est vide ou n\'a pas pu être chargée correctement.</p>';
            }
            return;
        }

        const giftsByCategory = allGifts.reduce((acc, gift) => {
            const category = gift.Categorie || 'Autres';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(gift);
            return acc;
        }, {});

        const categoryOrder = Object.keys(giftsByCategory);

        if (categoryOrder.length === 0) {
             giftListContainer.innerHTML = '<p class="loading-message">Aucune catégorie trouvée dans la liste.</p>';
            return;
        }

        // Use a document fragment for potentially better performance
        const fragment = document.createDocumentFragment();

        categoryOrder.forEach(category => {
            console.log("Displaying category:", category); // Debug log
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            fragment.appendChild(categoryTitle); // Add title to fragment

            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'gift-grid-wrapper';
            giftsByCategory[category].forEach(gift => {
                gridWrapper.innerHTML += createGiftCardHTML(gift); // Add gifts to grid
            });
            fragment.appendChild(gridWrapper); // Add grid to fragment
        });

        giftListContainer.appendChild(fragment); // Append everything at once
        console.log("Finished appending categories and gifts."); // Debug log

        // Add event listeners AFTER all HTML is added to the page
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
            console.error("Error in handleConfirmOffer: could not find gift with ID", currentGiftId);
            displayModalMessage("Erreur lors de la mise à jour (cadeau non trouvé).", "error");
        }
    }

    function displayModalMessage(message, type = 'success') {
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            modalMessage.className = type; // 'success' or 'error' applied directly
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
