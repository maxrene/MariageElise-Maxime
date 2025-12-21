document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv'; // URL for the main gift list
    const contributionsSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=88609421&single=true&output=csv'; // <-- PASTE THE URL OF YOUR "Contributions" SHEET HERE
    const revolutLinkBase = 'https://revolut.me/maxbook/'; // Optional: Replace with your Revolut username
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyZQX2yR4FONbibYjZlYNUxSDciU1S03aGdRWPvMu43TbZjDuOcgToqanXf2cl7Z5_k/exec'; // <-- PASTE YOUR GOOGLE APPS SCRIPT URL HERE
    const IBAN_NUMBER = 'FR41 3000 2033 3400 0002 0836 W50'; // <-- VRAI IBAN ICI
    
 // --- DOM ELEMENTS ---
    const giftListContainer = document.getElementById('gift-list-container');
    const cagnotteButton = document.querySelector('.cagnotte-section .revolut-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const giftModal = document.getElementById('gift-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = giftModal.querySelector('.modal-close-button');

    let allGifts = [];
    let allContributions = [];
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
    async function fetchData(url) {
        // AJOUT CRUCIAL : cacheBuster pour forcer Google à donner la version à jour
        const cacheBuster = `&t=${new Date().getTime()}`; 
        const response = await fetch(url + cacheBuster);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 1) return []; 

        const headers = parseCsvRow(rows[0]);
        
        return rows.slice(1).map(row => {
            const values = parseCsvRow(row);
            const item = {};
            headers.forEach((header, index) => {
                // Nettoyage des noms de colonnes pour éviter les erreurs d'espaces
                const cleanHeader = header.trim();
                item[cleanHeader] = values[index] ? values[index] : '';
            });
            return item;
        });
    }

    // --- SKELETON LOADING ---
    function renderSkeletons() {
        const skeletonCount = 8;
        let html = '<div class="skeleton-wrapper">';
        for (let i = 0; i < skeletonCount; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton-bg skeleton-image"></div>
                    <div class="skeleton-bg skeleton-title"></div>
                    <div class="skeleton-bg skeleton-text"></div>
                    <div class="skeleton-bg skeleton-text"></div>
                    <div class="skeleton-bg skeleton-button"></div>
                </div>`;
        }
        html += '</div>';
        giftListContainer.innerHTML = html;
    }

    async function fetchAndProcessData() {
        renderSkeletons(); // Show skeletons immediately
        try {
            // On récupère les deux fichiers
            const [giftsData, contributionsData] = await Promise.all([
                fetchData(sheetUrl),
                fetchData(contributionsSheetUrl)
            ]);

            console.log("Données brutes Cadeaux:", giftsData);
            console.log("Données brutes Contributions:", contributionsData);

            // Préparation des contributions (Nettoyage des ID pour qu'ils soient des Textes)
            allContributions = contributionsData.map(c => ({
                giftId: String(c.ID_Cadeau || '').trim(), // Force string
                contributor: c.Nom_Contributeur || 'Anonyme',
                amount: parseFloat(c.Montant) || 0
            }));

            // Mapping des cadeaux
            allGifts = giftsData.map(gift => {
                const giftID = String(gift.ID || '').trim(); // Force string

                // --- MODIFICATION 1: Détection des prix "Libre" ---
                // Si le prix est "libre" (insensible à la casse) ou vide, on le considère comme infini
                const rawPrice = gift.Prix ? gift.Prix.toString().toLowerCase().trim() : '';
                const isInfinite = rawPrice === 'libre';
                const price = isInfinite ? 0 : (parseFloat(gift.Prix) || 0);

                const isPartial = gift.Type_Contribution?.toLowerCase().trim() === 'partiel';
                
                // 1. Calculer la somme des contributions (CORRECTION DU BUG 0€)
                let totalContributed = 0;
                if (isPartial) {
                    totalContributed = allContributions
                        .filter(c => c.giftId === giftID) // Comparaison String vs String
                        .reduce((sum, current) => sum + current.amount, 0);
                }

                // 2. Vérifier si le cadeau est offert (CORRECTION DU BUG DISPO APRES REFRESH)
                // On vérifie si la colonne "Offert_par" contient quelque chose
                const offerByName = gift.Offert_par || gift["Offert par"] || ''; 
                const isOfferedInSheet = offerByName.trim() !== '';

                return {
                    ...gift,
                    ID: giftID,
                    Prix: price,
                    isInfinite: isInfinite, // Nouveau flag
                    totalContributed: totalContributed,
                    isPartial: isPartial,
                    // Un cadeau est offert si : marqué dans le sheet OU totalement financé via partiel
                    // Si c'est infini (libre), ce n'est jamais "offert" (toujours ouvert)
                    isGlobalOffered: !isInfinite && (isOfferedInSheet || (isPartial && price > 0 && totalContributed >= price))
                };
            }).filter(gift => gift.ID && gift.Nom);

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
        const { isPartial, totalContributed, Prix, isGlobalOffered, isInfinite } = gift;
        
        let formattedPrice = '';
        if (isInfinite) {
            formattedPrice = 'Libre';
        } else if (Prix > 0) {
            formattedPrice = `${Prix}€`;
        }

        // --- GESTION DU LIEN PRODUIT ---
        const productURL = gift.ProductLink || gift.ProductUrl || ''; // Vérifiez aussi cette colonne
        let productLinkButtonHTML = '';
        
        if (productURL && productURL.trim() !== '' && !isGlobalOffered) {
            productLinkButtonHTML = `
                <a href="${productURL}" target="_blank" rel="noopener noreferrer" class="button product-link">
                    <i class="fas fa-store"></i> Voir le produit
                </a>`;
        }

        // --- GESTION DE LA BARRE DE PROGRESSION ---
        let progressBarHTML = '';
        if (isPartial) {
            if (isInfinite) {
                // Barre spéciale pour "Participation Libre" (Pas de max)
                 progressBarHTML = `
                <div class="progress-info">
                    <span>Montant récolté : ${totalContributed.toFixed(0)}€</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar infinite-bar" style="width: 100%;"></div>
                </div>`;
            } else if (Prix > 0) {
                const percentage = Math.min((totalContributed / Prix) * 100, 100);
                progressBarHTML = `
                    <div class="progress-info">
                        <span>${totalContributed.toFixed(0)}€ / ${Prix.toFixed(0)}€</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%;"></div>
                    </div>`;
            }
        }

        // --- BOUTONS ---
        const offerButtonText = isPartial ? '<i class="fas fa-coins"></i> Contribuer' : '<i class="fab fa-rev"></i> Offrir via Revolut';
        const offeredButtonText = isPartial ? '100% financé !' : 'Déjà offert';

        const offerButtonHTML = `
            <button class="button ${isGlobalOffered ? 'offered' : 'primary revolut-button'}" data-type="gift" ${isGlobalOffered ? 'disabled' : ''}>
                ${isGlobalOffered ? offeredButtonText : offerButtonText}
            </button>`;


        // --- CORRECTION CRITIQUE DES IMAGES ---
        // 1. Récupération brute
        let rawImage = gift.ImageURL; 
        
        let finalImageUrl = 'https://via.placeholder.com/300?text=Image'; // Image par défaut si vide

        if (rawImage && rawImage.trim() !== '') {
            // 2. Si c'est un lien Google Drive, on le convertit
            if (rawImage.includes('drive.google.com')) {
                const idMatch = rawImage.match(/\/d\/(.*?)\//);
                if (idMatch && idMatch[1]) {
                    finalImageUrl = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                } else {
                    finalImageUrl = rawImage; // Échec conversion, on tente l'original
                }
            } else {
                // 3. Lien normal (Amazon, hébergement web...)
                finalImageUrl = rawImage;
            }
        }

        return `
            <div class="gift-card ${isGlobalOffered ? 'offered' : ''} ${isPartial ? 'is-partial' : ''}" data-id="${gift.ID}">
                <div class="gift-image-wrapper">
                    <img src="${finalImageUrl}" 
                         alt="${gift.Nom || 'Cadeau'}" 
                         class="gift-image" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300?text=Lien+Casse'; console.error('Erreur chargement image pour:', '${gift.Nom}')">
                    ${!isGlobalOffered && formattedPrice ? `<span class="price-tag">${formattedPrice}</span>` : ''}
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

    function updateCategoryNav(categories) {
        const navContainer = document.getElementById('category-nav');
        if (!navContainer) return;

        if (!categories || categories.length === 0) {
            navContainer.style.display = 'none';
            return;
        }
        navContainer.style.display = 'flex';

        let navHTML = '<ul>';
        categories.forEach(cat => {
            const linkId = 'cat-' + cat.replace(/\s+/g, '-').toLowerCase();
            navHTML += `<li><a href="#${linkId}" class="nav-link">${cat}</a></li>`;
        });
        navHTML += '</ul>';
        navContainer.innerHTML = navHTML;

        // Optional: Add active state on scroll could go here
    }

    function displayAllGiftsByCategory() {
        giftListContainer.innerHTML = ''; 

        if (!allGifts || allGifts.length === 0) {
            giftListContainer.innerHTML = '<p class="loading-message">La liste est vide ou n\'a pas pu être chargée correctement.</p>';
            return;
        }

        // Grouper les cadeaux par catégorie
        const giftsByCategory = allGifts.reduce((acc, gift) => {
             const category = gift.Categorie ? gift.Categorie.trim() : 'Autres';
             if (!acc[category]) acc[category] = [];
             acc[category].push(gift);
             return acc;
        }, {});

        const categoryOrder = Object.keys(giftsByCategory);

        // --- UPDATE NAV ---
        updateCategoryNav(categoryOrder);

        const fragment = document.createDocumentFragment();

        categoryOrder.forEach(category => {
            const gifts = giftsByCategory[category];
            if (gifts && gifts.length > 0) {
                // --- MODIFICATION 2: Category Header & Progress Bar ---
                const categoryHeaderWrapper = document.createElement('div');
                categoryHeaderWrapper.className = 'category-header-wrapper';

                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                // Add ID for navigation
                categoryTitle.id = 'cat-' + category.replace(/\s+/g, '-').toLowerCase();

                categoryHeaderWrapper.appendChild(categoryTitle);

                // Si c'est "Voyage de Noce", on ajoute la barre de progression globale
                if (category === 'Voyage de Noce') {
                    // Calcul des totaux pour cette catégorie
                    const categoryTotalGoal = gifts.reduce((sum, g) => sum + (g.isInfinite ? 0 : g.Prix), 0);

                    // CORRECTION: On compte les partiels (déjà fait via totalContributed)
                    // ET les cadeaux "uniques" s'ils sont offerts (ce qui manquait)
                    const categoryTotalRaised = gifts.reduce((sum, g) => {
                         let contribution = 0;
                         if (g.isPartial) {
                             contribution = g.totalContributed;
                         } else if (g.isGlobalOffered) {
                             contribution = g.Prix;
                         }
                         return sum + contribution;
                    }, 0);

                    if (categoryTotalGoal > 0) {
                         const percentage = Math.min((categoryTotalRaised / categoryTotalGoal) * 100, 100);

                         // Logic for specific message and icon
                         let infoText = `${categoryTotalRaised.toFixed(0)}€ / ${categoryTotalGoal.toFixed(0)}€`;
                         if (percentage >= 100) {
                             infoText += ' - Merci à tous !';
                         }

                         const progressContainer = document.createElement('div');
                         progressContainer.className = 'category-progress-container honeymoon-container';
                         progressContainer.innerHTML = `
                            <div class="category-progress-info">
                                <span>${infoText}</span>
                            </div>
                            <div class="category-progress-bar-bg">
                                <div class="category-progress-bar-fill" style="width: ${percentage}%;"></div>
                            </div>
                         `;
                         categoryHeaderWrapper.appendChild(progressContainer);
                    }
                }

                fragment.appendChild(categoryHeaderWrapper);

                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'gift-grid-wrapper';
                let categoryGiftHTML = '';
                gifts.forEach(gift => {
                    categoryGiftHTML += createGiftCardHTML(gift);
                });
                gridWrapper.innerHTML = categoryGiftHTML;
                fragment.appendChild(gridWrapper);
            }
        });

        giftListContainer.appendChild(fragment);

        // Trigger scroll animations
        observeScrollAnimations();

        addOfferButtonListeners();
    }

    function observeScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        const cards = document.querySelectorAll('.gift-card');
        cards.forEach((card, index) => {
            card.classList.add('animate-on-scroll');
            // Add staggering delay
            card.style.animationDelay = `${index % 4 * 0.1}s`;
            observer.observe(card);
        });
    }


     function addOfferButtonListeners() {
         if (giftListContainer.dataset.listenerAttached === 'true') return;

         giftListContainer.addEventListener('click', function(event) {
             const button = event.target.closest('.revolut-button[data-type="gift"]:not(.offered)');
             if (button) {
                 event.preventDefault();
                 currentGiftId = button.closest('.gift-card').dataset.id;
                 // Utilisation de String() pour être sûr de trouver l'ID
                 const gift = allGifts.find(g => String(g.ID) === String(currentGiftId));
                 if (gift) {
                     openModal(gift);
                 }
             }
         });
         giftListContainer.dataset.listenerAttached = 'true';
    }
    // --- GESTION MODALE ---
     function openModal(gift = null) {
        let contentHTML = '';
        
        // On s'assure que le lien de base n'a pas de slash à la fin pour éviter les doubles //
        // Ex: https://revolut.me/maxbook
        const cleanBaseUrl = revolutLinkBase.endsWith('/') ? revolutLinkBase.slice(0, -1) : revolutLinkBase;

        const ibanBlockHTML = `
            <div class="discreet-iban-container">
                <p class="modal-or-separator">ou par virement</p>
                <p class="iban-info">
                    IBAN: ${IBAN_NUMBER} 
                    <i class="fas fa-copy icon-copy-iban" id="copyIbanIcon" title="Copier l'IBAN"></i>
                </p>
                <p class="beneficiary-info">Bénéficiaire : Elise SMUTKO ou Maxime RENE</p>
                <span id="copy-confirm-text" class="copy-confirm-text"></span>
            </div>
        `;

        // Helper to create Revolut link
        const createRevolutLink = (amount) => {
             const numAmount = parseFloat(amount);
             if (numAmount && numAmount > 0) {
                 const amountToSend = Math.round(numAmount * 100);
                 return `${cleanBaseUrl}?currency=EUR&amount=${amountToSend}`;
             }
             return cleanBaseUrl;
        };

        if (gift) {
            const { isPartial, totalContributed, Prix, isInfinite } = gift;
            
            let contributionButtonText = '';
            let initialRevolutLink = cleanBaseUrl; // Par défaut juste le profil

            // --- LOGIQUE DES BOUTONS ET LIENS ---
            if (isPartial) {
                 contributionButtonText = 'Contribuer via Revolut';
                 // Pour le partiel, le lien restera "de base" tant qu'on n'a rien tapé
            } else {
                contributionButtonText = `Payer ${Prix}€ sur Revolut`;
                if (Prix > 0) {
                    // Génération AUTO du lien avec montant : ?currency=EUR&amount=50
                    initialRevolutLink = createRevolutLink(Prix);
                }
            }

            let amountInputHTML = '';
            if (isPartial) {
                // --- MODIFICATION 3: Logic modal pour prix infini/libre ---
                let labelText = '';
                let maxAttr = '';
                let placeholderText = 'Ex: 50';

                if (isInfinite) {
                    labelText = `Ce cadeau est en participation libre.`;
                    // Pas de max
                } else {
                    const remainingAmount = Math.max(0, Prix - totalContributed);
                    labelText = `Ce cadeau est participatif ! Il reste <strong>${remainingAmount.toFixed(0)}€</strong> à financer.`;
                    maxAttr = `max="${remainingAmount.toFixed(0)}"`;
                }

                amountInputHTML = `
                <div class="partial-contribution-section">
                    <p>${labelText}</p>
                    <label for="contributionAmount">Montant de votre contribution (€) :</label>
                    <input type="number" id="contributionAmount" placeholder="${placeholderText}" min="1" ${maxAttr} required>
                </div>`;
            }

            contentHTML = `
                <h3>${gift.Nom}</h3>
                <p>${gift.Description || 'Pas de description.'}</p>
                
                <a href="${initialRevolutLink}" id="modalRevolutLink" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
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
             // CAS CAGNOTTE LIBRE (Pas de montant fixe imposé)
             // On ajoute l'input pour définir le montant du lien et la confirmation
             const amountInputHTML = `
                <div class="partial-contribution-section">
                    <p>Ce cadeau est en participation libre.</p>
                    <label for="contributionAmount">Montant de votre contribution (€) :</label>
                    <input type="number" id="contributionAmount" placeholder="Ex: 50" min="1" required>
                </div>`;

             contentHTML = `
                <h3>Contribution libre</h3>
                <p>Participez librement à notre cagnotte !</p>
                 <a href="${cleanBaseUrl}" id="modalRevolutLink" target="_blank" rel="noopener noreferrer" class="button primary modal-revolut-link">
                   <i class="fas fa-external-link-alt"></i> Contribuer via Revolut
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
        }

        modalContent.innerHTML = contentHTML;
        modalOverlay.style.display = 'block';
        giftModal.style.display = 'block';

        // --- RÉCUPÉRATION DES ÉLÉMENTS ---
        const confirmButton = modalContent.querySelector('#confirmOfferButton');
        const cancelButton = modalContent.querySelector('#cancelOfferButton');
        const copyIcon = modalContent.querySelector('#copyIbanIcon'); 
        const confirmText = modalContent.querySelector('#copy-confirm-text');
        
        // Éléments spécifiques pour la mise à jour dynamique
        const amountInput = modalContent.querySelector('#contributionAmount');
        const revolutLinkBtn = modalContent.querySelector('#modalRevolutLink');

        // --- PARTIE MAGIQUE : MISE À JOUR DYNAMIQUE DU LIEN ---
        // Si on est sur un cadeau partiel avec input, on écoute ce que l'utilisateur tape
        if (amountInput && revolutLinkBtn) {
            amountInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (val && val > 0) {
                    // Met à jour le lien : revolut.me/maxbook?currency=EUR&amount=MontantTapé
                    revolutLinkBtn.href = createRevolutLink(val);
                    revolutLinkBtn.innerHTML = `<i class="fas fa-external-link-alt"></i> Payer ${val}€ sur Revolut`;
                } else {
                    // Revient au lien de base si vide
                    revolutLinkBtn.href = cleanBaseUrl;
                    revolutLinkBtn.innerHTML = `<i class="fas fa-external-link-alt"></i> Contribuer via Revolut`;
                }
            });
        }

        // --- LOGIQUE EXISTANTE (Copie IBAN, Fermeture...) ---
        if (copyIcon && confirmText) {
            copyIcon.addEventListener('click', () => {
                navigator.clipboard.writeText(IBAN_NUMBER).then(() => {
                    confirmText.textContent = 'IBAN Copié !';
                    confirmText.style.opacity = '1';
                    setTimeout(() => confirmText.style.opacity = '0', 2000);
                }).catch(err => console.error('Erreur copie:', err));
            });
        }

        if (confirmButton) {
            confirmButton.disabled = false; 
            confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
        }

        if (cancelButton) {
            cancelButton.disabled = false; 
            cancelButton.addEventListener('click', closeModal, { once: true });
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
        const confirmButton = document.getElementById('confirmOfferButton');
        const cancelButton = document.getElementById('cancelOfferButton');

        // Find the gift OR handle the generic cagnotte case
        const giftToUpdate = allGifts.find(g => String(g.ID) === String(currentGiftId));
        const isCagnotte = String(currentGiftId) === 'CAGNOTTE';

        const reattachListeners = () => {
            if (confirmButton) confirmButton.addEventListener('click', handleConfirmOffer, { once: true });
            if (cancelButton) cancelButton.addEventListener('click', closeModal, { once: true });
        };

        if (!nameInput || !nameInput.value.trim()) {
            displayModalMessage("Veuillez entrer votre nom.", "error");
            reattachListeners();
            return;
        }

        // It is partial if it's the cagnotte or a partial gift
        const isPartial = isCagnotte || (giftToUpdate && giftToUpdate.isPartial);
        let contributionAmount = 0;

        if (isPartial) {
            if (!amountInput || !amountInput.value || parseFloat(amountInput.value) <= 0) {
                displayModalMessage("Veuillez entrer un montant valide.", "error");
                reattachListeners();
                return;
            }
            contributionAmount = parseFloat(amountInput.value);
        }

        const offeredByName = nameInput.value.trim();

        const dataForScript = {
            giftId: currentGiftId,
            name: offeredByName,
            amount: isPartial ? contributionAmount : undefined
        };

        if (confirmButton) confirmButton.disabled = true;
        if (cancelButton) cancelButton.disabled = true;
        displayModalMessage("Mise à jour en cours...", "info");

        try {
            await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataForScript),
            });
            
            // UI Optimiste : on met à jour l'affichage sans recharger la page
            if (isPartial) {
                allContributions.push({
                    giftId: String(currentGiftId),
                    contributor: offeredByName,
                    amount: contributionAmount
                });

                if (giftToUpdate) {
                    giftToUpdate.totalContributed += contributionAmount;
                    // Si c'est infini, on ne ferme jamais
                    if (!giftToUpdate.isInfinite && giftToUpdate.totalContributed >= giftToUpdate.Prix) {
                        giftToUpdate.isGlobalOffered = true;
                    }
                }
            } else if (giftToUpdate) {
                giftToUpdate.isGlobalOffered = true;
                giftToUpdate.Offert_par = offeredByName;
            }

            displayAllGiftsByCategory();
            displayModalMessage("Merci pour votre contribution !", "success");
            
            setTimeout(() => {
                closeModal();
            }, 2000);

        } catch (error) {
            console.error("Error sending update:", error);
            displayModalMessage("Erreur lors de l'envoi. Veuillez réessayer.", "error");
            if (confirmButton) confirmButton.disabled = false;
            if (cancelButton) cancelButton.disabled = false;
            reattachListeners();
        }
    }

    function displayModalMessage(message, type = 'success') {
        const modalMessage = document.getElementById('modal-message');
        if (modalMessage) {
            modalMessage.textContent = message;
            modalMessage.className = `modal-message-${type}`;
            modalMessage.style.display = 'block';
        }
    }

    // --- INITIALIZATION ---
    fetchAndProcessData(); 

    if (cagnotteButton) {
        cagnotteButton.addEventListener('click', () => {
            currentGiftId = 'CAGNOTTE';
            openModal();
        });
    }

    modalOverlay.addEventListener('click', closeModal);
    closeModalButton.addEventListener('click', closeModal);
});
