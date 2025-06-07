// Remplacez tout le contenu de script.js par ce qui suit

document.addEventListener('DOMContentLoaded', function() {
  
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  // !!! IMPORTANT !!!
  // 1. COLLEZ L'URL DE VOTRE FEUILLE PUBLIÉE EN CSV
  const sheetURL_Cadeaux_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv'; 
  const sheetURL_Contributions_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv'; 
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycbxWjfEAshO5ytdUrcxNenPiDxJhwIIC_stMMpMid3ae1OUwqABQpAGfEAyB-w8iD3q9yQ/exec';
  const revolutUsername = 'maxbook';
  // =========================================================================


document.addEventListener('DOMContentLoaded', function() {
  
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  const sheetURL_Cadeaux_CSV = 'VOTRE_URL_CSV_POUR_LA_FEUILLE_CADEAUX_ICI'; 
  const sheetURL_Contributions_CSV = 'VOTRE_URL_CSV_POUR_LA_FEUILLE_CONTRIBUTIONS_ICI';
  const webAppURL_API = 'VOTRE_URL_APPS_SCRIPT_POUR_L_ECRITURE_ICI';
  const revolutUsername = 'votre_nom_utilisateur_revolut';
  // =========================================================================

  // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
  const giftListContainer = document.getElementById('gift-list-container');
  const cagnotteContainer = document.getElementById('cagnotte-container');
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalAmountElement = document.getElementById('modal-amount');
  const modalNoteElement = document.getElementById('modal-note');
  const modalRevolutLink = document.getElementById('modal-revolut-link');
  const modalOfferForm = document.getElementById('modal-offer-form');

  const modalGiftAmountInput = document.createElement('input');
  modalGiftAmountInput.type = 'hidden';
  modalGiftAmountInput.name = 'amount';
  if(modalOfferForm) modalOfferForm.appendChild(modalGiftAmountInput);

  // --- FONCTIONS POUR LA MODALE (inchangées) ---
  function openRevolutModal(id, giftNameForDisplay, amountToPay, noteTypeOrBrand, isGenericContribution = false, guestNameFromCard = null) {
      const modalGiftIdInput = document.getElementById('modal-gift-id');
      const modalGuestNameLabel = document.querySelector('label[for="modal-guest-name"]');
      const modalGuestNameInput = document.getElementById('modal-guest-name');
      const modalSubmitButton = modalOfferForm ? modalOfferForm.querySelector('button[type="submit"]') : null;
      const modalFormStatus = document.getElementById('modal-form-status');
      
      modalTitle.textContent = isGenericContribution ? `Confirmer votre contribution à : ${giftNameForDisplay}` : `Offrir : ${giftNameForDisplay}`;
      modalAmountElement.textContent = `${amountToPay}€`;
      modalGiftIdInput.value = id;
      modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
      if(modalOfferForm) modalOfferForm.reset();
      if(modalFormStatus) modalFormStatus.textContent = '';
      if(submitButton) submitButton.disabled = false;

      if (isGenericContribution) {
          modalNoteElement.textContent = `Contribution pour "${giftNameForDisplay}" (De la part de : ${guestNameFromCard})`;
          modalGiftAmountInput.value = amountToPay;
          if(modalGuestNameLabel) modalGuestNameLabel.classList.add('hidden');
          if(modalGuestNameInput) {
              modalGuestNameInput.classList.add('hidden');
              modalGuestNameInput.value = guestNameFromCard; 
              modalGuestNameInput.required = false; 
          }
          if(modalSubmitButton) modalSubmitButton.textContent = 'Confirmer ma participation';
      } else {
          modalNoteElement.textContent = `Cadeau mariage : ${giftNameForDisplay} (${noteTypeOrBrand})`;
          modalGiftAmountInput.value = ''; 
          if(modalGuestNameLabel) modalGuestNameLabel.classList.remove('hidden');
          if(modalGuestNameInput) {
              modalGuestNameInput.classList.remove('hidden');
              modalGuestNameInput.value = '';
              modalGuestNameInput.required = true;
          }
          if(modalSubmitButton) modalSubmitButton.textContent = 'Valider mon offre';
      }
      
      if(modalOverlay) modalOverlay.classList.add('active');
      if(revolutModal) revolutModal.classList.add('active');
  }

  function closeRevolutModal() {
    if(modalOverlay) modalOverlay.classList.remove('active');
    if(revolutModal) revolutModal.classList.remove('active');
  }

  // --- FONCTION PRINCIPALE POUR AFFICHER LA LISTE ---
  async function fetchAndDisplayGifts(categoryToSelect = null) {
    // ... (contenu de fetchAndDisplayGifts reste le même que la version précédente) ...
    try {
        const [cadeauxResponse, contributionsResponse] = await Promise.all([
          fetch(`${sheetURL_Cadeaux_CSV}&t=${Date.now()}`),
          fetch(`${sheetURL_Contributions_CSV}&t=${Date.now()}`)
        ]);
        if (!cadeauxResponse.ok) throw new Error(`Erreur HTTP Cadeaux CSV: ${cadeauxResponse.status}`);
        if (!contributionsResponse.ok) throw new Error(`Erreur HTTP Contributions CSV: ${contributionsResponse.status}`);
        const cadeauxCsvText = await cadeauxResponse.text();
        const contributionsCsvText = await contributionsResponse.text();
        const allItems = parseCSV(cadeauxCsvText);
        const allContributions = parseCSV(contributionsCsvText);
        const contributionsByGiftId = allContributions.reduce((acc, contrib) => {
          const id = contrib.ID_Cadeau;
          const amount = parseFloat(contrib.Montant) || 0;
          acc[id] = (acc[id] || 0) + amount;
          return acc;
        }, {});
        if(giftListContainer) giftListContainer.innerHTML = ''; 
        if(cagnotteContainer) cagnotteContainer.innerHTML = '';
        const cagnotteItemData = allItems.find(item => item.Categorie.toLowerCase().trim() === 'cagnotte');
        const regularGiftsData = allItems.filter(item => item.Categorie.toLowerCase().trim() !== 'cagnotte');
        if (cagnotteItemData && cagnotteContainer) {
          const cagnotteCard = document.createElement('div');
          cagnotteCard.className = 'cagnotte-item';
          cagnotteContainer.appendChild(cagnotteCard);
          const totalCagnotteContributed = contributionsByGiftId[cagnotteItemData.ID] || 0;
          cagnotteCard.innerHTML = `
            <h3>${cagnotteItemData.Nom}</h3>
            <p>${cagnotteItemData.Description || 'Contribuez du montant de votre choix.'}</p>
            ${totalCagnotteContributed > 0 ? `<p><strong>Déjà collecté : ${totalCagnotteContributed.toFixed(2)}€</strong></p>` : ''}
            <form class="cagnotte-form-display">
              <input type="hidden" name="id" value="${cagnotteItemData.ID}">
              <div class="input-group">
                <label for="cagnotte-amount-${cagnotteItemData.ID}">Montant de votre participation (€)</label>
                <input type="number" id="cagnotte-amount-${cagnotteItemData.ID}" name="amount-display" placeholder="Ex: 50" min="1" required>
              </div>
              <div class="input-group">
                <label for="cagnotte-name-${cagnotteItemData.ID}">De la part de :</label>
                <input type="text" id="cagnotte-name-${cagnotteItemData.ID}" name="name-display" placeholder="Ex: Jean Dupont" required>
              </div>
              <button type="submit" class="button primary">Préparer ma contribution</button>
            </form>
            <p class="form-status-message"></p>
          `;
        }
        regularGiftsData.forEach(gift => {
          const giftCard = document.createElement('div');
          giftCard.className = 'gift-item';
          giftCard.dataset.category = gift.Categorie.toLowerCase().trim();
          const isOffered = gift['Offert par'] && gift['Offert par'].trim() !== '';
          const isPartial = gift.Type_Contribution && gift.Type_Contribution.toLowerCase().trim() === 'partiel';
          const totalContributed = contributionsByGiftId[gift.ID] || 0;
          const giftPrice = parseFloat(gift.Prix) || 0;
          const isFullyFunded = isPartial && totalContributed >= giftPrice;
          let cardContent = `
            <div class="gift-details">
              <div class="gift-info">
                <p class="gift-name">${gift.Nom}</p>
                <p class="gift-brand">Brand: ${gift.Brand}</p>
                <p class="gift-description">${gift.Description}</p>
              </div>
              <div class="gift-image" style="background-image: url('${gift.ImageURL}');">
                ${!isOffered && !isFullyFunded && !isPartial ? `<span class="gift-price-badge">${gift.Prix}€</span>` : ''}
                ${isPartial && !isFullyFunded ? `<span class="gift-price-badge">${giftPrice.toFixed(2)}€</span>` : ''}
              </div>
            </div>
          `;
          if (isOffered) {
            cardContent += `<p class="gift-status final">✨ Offert par ${gift['Offert par']} !</p>`;
          } else if (isPartial) {
            giftCard.classList.add('partial-gift-item');
            cardContent += `<div class="contribution-progress">
                              <p>Objectif : ${giftPrice.toFixed(2)}€</p>
                              <p>Collecté : <strong>${totalContributed.toFixed(2)}€</strong></p>
                              ${isFullyFunded ? '<p class="gift-status final">🎉 Objectif atteint ! Merci !</p>' : ''}
                            </div>`;
            if (!isFullyFunded) {
              cardContent += `
                <form class="partial-contribution-form-display">
                  <input type="hidden" name="id" value="${gift.ID}">
                  <input type="hidden" name="giftName" value="${gift.Nom}"> 
                  <div class="input-group">
                    <label for="partial-amount-${gift.ID}">Votre participation (€)</label>
                    <input type="number" id="partial-amount-${gift.ID}" name="amount-partial" placeholder="Ex: 20" min="1" max="${(giftPrice - totalContributed).toFixed(2)}" required>
                  </div>
                  <div class="input-group">
                    <label for="partial-name-${gift.ID}">De la part de :</label>
                    <input type="text" id="partial-name-${gift.ID}" name="name-partial" placeholder="Ex: Jean Dupont" required>
                  </div>
                  <button type="submit" class="button primary">Participer</button>
                </form>
                <p class="form-status-message"></p>
              `;
            }
          } else {
            cardContent += `
              <div class="gift-actions">
                <a href="${gift.ProductLink}" target="_blank" class="button secondary">Voir le produit</a>
                <button class="button primary open-revolut-modal-btn" 
                        data-gift-id="${gift.ID}" data-gift-name="${gift.Nom}" 
                        data-gift-price="${gift.Prix}" data-gift-brand="${gift.Brand}">
                  Offrir via Revolut
                </button>
              </div>
            `;
          }
          giftCard.innerHTML = cardContent;
          giftListContainer.appendChild(giftCard);
        });
        initializeTabs(categoryToSelect);
      } catch (error) {
        console.error('Erreur fetch/display:', error);
        if(giftListContainer) giftListContainer.innerHTML = '<p>Erreur chargement. Vérifiez la console.</p>';
      }
  }

  // Initialise et gère les onglets
  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    function filterTabs(selectedTab) {
        if (!selectedTab) {
            if (tabs.length > 0) selectedTab = tabs[0]; else return;
        }
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
        document.querySelectorAll('.gift-item').forEach(item => {
             if(item.closest('#cagnotte-container')) return;
             item.style.display = item.dataset.category === category ? 'block' : 'none';
        });
    }
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => { e.preventDefault(); filterTabs(e.currentTarget); });
    });
    let tabToActivate = tabs[0];
    if (categoryToSelect) {
        const foundTab = document.querySelector(`.tab-item[data-tab="${categoryToSelect}"]`);
        if (foundTab) tabToActivate = foundTab;
    }
    if (tabs.length > 0) filterTabs(tabToActivate);
  }

  // --- NOUVELLE VERSION DE ATTACHEVENTLISTENERS ---
  // Utilise la délégation d'événements pour une meilleure robustesse
  function attachEventListeners() {
    const mainContent = document.body; // On écoute sur le corps entier de la page

    // --- ÉCOUTEUR POUR LES CLICS ---
    mainContent.addEventListener('click', function(event) {
        const target = event.target;
        
        // Clic sur un bouton "Offrir via Revolut"
        if (target.matches('.open-revolut-modal-btn')) {
            openRevolutModal(target.dataset.giftId, target.dataset.giftName, target.dataset.giftPrice, target.dataset.giftBrand, false, null);
        }

        // Clic sur le bouton pour fermer la modale
        if (target.matches('#modal-close-btn') || target.matches('.modal-overlay')) {
            closeRevolutModal();
        }
    });

    // --- ÉCOUTEUR POUR LES SOUMISSIONS DE FORMULAIRE ---
    mainContent.addEventListener('submit', async function(event) {
        event.preventDefault(); // On empêche le rechargement pour tous les formulaires
        const form = event.target;
        
        // Soumission du formulaire de la MODALE
        if (form.matches('#modal-offer-form')) {
          const submitButton = form.querySelector('button[type="submit"]');
          const modalFormStatus = document.getElementById('modal-form-status');
          modalFormStatus.textContent = 'Envoi en cours...';
          if(submitButton) submitButton.disabled = true;

          const activeTab = document.querySelector('.tab-item.active');
          const activeCategory = activeTab ? activeTab.dataset.tab : null;
          
          try {
            const formData = new FormData(form);
            const response = await fetch(webAppURL_API, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message || 'API Unknown Error');

            modalFormStatus.textContent = 'Merci ! Votre offre/contribution a été enregistrée.';
            modalFormStatus.style.color = 'green';
            setTimeout(() => { 
              closeRevolutModal(); 
              fetchAndDisplayGifts(activeCategory); 
            }, 2000);
          } catch (error) {
            console.error('Erreur soumission modale:', error);
            modalFormStatus.textContent = `Erreur: ${error.message}. Réessayez.`;
            modalFormStatus.style.color = 'red';
            if(submitButton) submitButton.disabled = false;
          }
        }

        // Soumission du formulaire de la CAGNOTTE
        if (form.matches('.cagnotte-form-display')) {
            const giftId = form.querySelector('input[name="id"]').value;
            const amount = form.querySelector('input[name="amount-display"]').value;
            const guestName = form.querySelector('input[name="name-display"]').value;
            const giftDisplayName = form.closest('.cagnotte-item').querySelector('h3').textContent;

            if (!amount || !guestName) {
                form.nextElementSibling.textContent = "Veuillez remplir le montant et votre nom.";
                form.nextElementSibling.style.color = 'red';
                return;
            }
            form.nextElementSibling.textContent = '';
            openRevolutModal(giftId, giftDisplayName, amount, 'Cagnotte', true, guestName);
        }
        
        // Soumission du formulaire de CONTRIBUTION PARTIELLE
        if (form.matches('.partial-contribution-form-display')) {
            const giftId = form.querySelector('input[name="id"]').value;
            const giftName = form.querySelector('input[name="giftName"]').value;
            const amount = form.querySelector('input[name="amount-partial"]').value;
            const guestName = form.querySelector('input[name="name-partial"]').value;

            if (!amount || !guestName) {
                form.nextElementSibling.textContent = "Veuillez remplir le montant et votre nom.";
                form.nextElementSibling.style.color = 'red';
                return;
            }
            openRevolutModal(giftId, giftName, amount, 'Contribution Partielle', true, guestName);
        }
    });
  }
  
  // Parse le CSV de manière robuste
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 1) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (data.length !== headers.length) { 
        console.warn('Ligne CSV malformée ignorée:', line, "Expected", headers.length, "got", data.length);
        return null; 
      }
      return headers.reduce((obj, nextKey, index) => {
        const value = data[index] ? data[index].trim() : "";
        obj[nextKey.trim()] = value.replace(/^"|"$/g, '');
        return obj;
      }, {});
    }).filter(gift => gift && gift.ID && gift.ID.trim() !== '');
  }

  // --- LANCEMENT INITIAL ---
  fetchAndDisplayGifts();
});
