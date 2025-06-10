document.addEventListener('DOMContentLoaded', function() {

  console.log("SCRIPT START: Le document est prêt.");
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  const sheetURL_Cadeaux_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv';
  const sheetURL_Contributions_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=88609421&single=true&output=csv';
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycbznjTvevA4lDxSfVKxz9lpZBhg3grsB116q0eCE3BZNFxhFIybQB0s91Vh94uDpedrk8Q/exec';
  const revolutUsername = 'maxbook';
  // =========================================================================

 const giftListContainer = document.getElementById('gift-list-container');
  const cagnotteContainer = document.getElementById('cagnotte-container');
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalOfferForm = document.getElementById('modal-offer-form');

  if(modalOfferForm){
    const modalGiftAmountInput = document.createElement('input');
    modalGiftAmountInput.type = 'hidden';
    modalGiftAmountInput.name = 'amount';
    modalOfferForm.appendChild(modalGiftAmountInput);
  }

  function openRevolutModal(id, giftNameForDisplay, amountToPay, noteTypeOrBrand, isGenericContribution = false, guestNameFromCard = null) {
      const modalTitle = document.getElementById('modal-title');
      const modalAmountElement = document.getElementById('modal-amount');
      const modalNoteElement = document.getElementById('modal-note');
      const modalRevolutLink = document.getElementById('modal-revolut-link');
      const modalGiftIdInput = document.getElementById('modal-gift-id');
      const modalGuestNameLabel = document.querySelector('label[for="modal-guest-name"]');
      const modalGuestNameInput = document.getElementById('modal-guest-name');
      const modalSubmitButton = modalOfferForm ? modalOfferForm.querySelector('button[type="submit"]') : null;
      const modalFormStatus = document.getElementById('modal-form-status');
      
      modalTitle.textContent = isGenericContribution ? `Confirmer votre contribution à : ${giftNameForDisplay}` : `Offrir : ${giftNameForDisplay}`;
      modalAmountElement.textContent = `${amountToPay}€`;
      modalGiftIdInput.value = id;
      modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
      modalOfferForm.reset();
      modalFormStatus.textContent = '';
      if(modalSubmitButton) modalSubmitButton.disabled = false;

      if (isGenericContribution) {
          modalNoteElement.textContent = `Contribution pour "${giftNameForDisplay}" (De la part de : ${guestNameFromCard})`;
          const modalGiftAmountInput = modalOfferForm.querySelector('input[name="amount"]');
          if(modalGiftAmountInput) modalGiftAmountInput.value = amountToPay;
          if(modalGuestNameLabel) modalGuestNameLabel.classList.add('hidden');
          if(modalGuestNameInput) {
              modalGuestNameInput.classList.add('hidden');
              modalGuestNameInput.value = guestNameFromCard; 
              modalGuestNameInput.required = false; 
          }
          if(modalSubmitButton) modalSubmitButton.textContent = 'Confirmer ma participation';
      } else {
          modalNoteElement.textContent = `Cadeau mariage : ${giftNameForDisplay} (${noteTypeOrBrand})`;
          const modalGiftAmountInput = modalOfferForm.querySelector('input[name="amount"]');
          if(modalGiftAmountInput) modalGiftAmountInput.value = ''; 
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

  async function fetchAndDisplayGifts(categoryToSelect = null) {
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
        const id = getNormalizedValue(contrib, 'id_cadeau');
        const amount = parseFloat(getNormalizedValue(contrib, 'montant')) || 0;
        if (id) {
            acc[id] = (acc[id] || 0) + amount;
        }
        return acc;
      }, {});

      if(giftListContainer) giftListContainer.innerHTML = ''; 
      if(cagnotteContainer) cagnotteContainer.innerHTML = '';
      const cagnotteItemData = allItems.find(item => getNormalizedValue(item, 'categorie') === 'cagnotte');
      const regularGiftsData = allItems.filter(item => getNormalizedValue(item, 'categorie') !== 'cagnotte');
      
      if (cagnotteItemData && cagnotteContainer) {
        const cagnotteId = getNormalizedValue(cagnotteItemData, 'id');
        const totalCagnotteContributed = contributionsByGiftId[cagnotteId] || 0;
        cagnotteContainer.innerHTML = `
          <div class="cagnotte-item">
            <h3>${getNormalizedValue(cagnotteItemData, 'nom')}</h3>
            <p>${getNormalizedValue(cagnotteItemData, 'description') || 'Contribuez du montant de votre choix.'}</p>
            ${totalCagnotteContributed > 0 ? `<p><strong>Déjà collecté : ${totalCagnotteContributed.toFixed(2)}€</strong></p>` : ''}
            <form class="cagnotte-form-display">
              <input type="hidden" name="id" value="${cagnotteId}">
              <div class="input-group"><label for="cagnotte-amount">Montant de votre participation (€)</label><input type="number" id="cagnotte-amount" name="amount-display" placeholder="Ex: 50" min="1" required></div>
              <div class="input-group"><label for="cagnotte-name">De la part de :</label><input type="text" id="cagnotte-name" name="name-display" placeholder="Ex: Jean Dupont" required></div>
              <button type="submit" class="button primary">Préparer ma contribution</button>
            </form>
            <p class="form-status-message"></p>
          </div>
        `;
      }
      
      regularGiftsData.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-item';
        giftCard.dataset.category = getNormalizedValue(gift, 'categorie');
        
        const offeredByValue = getNormalizedValue(gift, 'offert par');
        const isOffered = offeredByValue && offeredByValue.trim() !== '';
        
        const isPartial = getNormalizedValue(gift, 'type_contribution') === 'partiel';
        const giftId = getNormalizedValue(gift, 'id');
        const totalContributed = contributionsByGiftId[giftId] || 0;
        const giftPrice = parseFloat(getNormalizedValue(gift, 'prix')) || 0;
        const isFullyFunded = isPartial && totalContributed >= giftPrice;
        const progressPercentage = giftPrice > 0 ? (totalContributed / giftPrice) * 100 : 0;

        let cardContent = `
          <div class="gift-details">
            <div class="gift-info"><p class="gift-name">${getNormalizedValue(gift, 'nom')}</p><p class="gift-brand">Brand: ${getNormalizedValue(gift, 'brand')}</p><p class="gift-description">${getNormalizedValue(gift, 'description')}</p></div>
            <div class="gift-image" style="background-image: url('${getNormalizedValue(gift, 'imageurl')}');">
              ${!isOffered && !isFullyFunded && !isPartial ? `<span class="gift-price-badge">${getNormalizedValue(gift, 'prix')}€</span>` : ''}
              ${isPartial && !isFullyFunded ? `<span class="gift-price-badge">${giftPrice.toFixed(2)}€</span>` : ''}
            </div>
          </div>
        `;
        if (isOffered) {
          cardContent += `<p class="gift-status final">✨ Offert par ${offeredByValue} !</p>`;
        } else if (isPartial) {
          giftCard.classList.add('partial-gift-item');
          if (isFullyFunded) {
            cardContent += '<p class="gift-status final">🎉 Objectif atteint ! Merci à tous les contributeurs !</p>';
          } else {
            cardContent += `
              <div class="contribution-progress">
                <p class="progress-text">Collecté : <strong>${totalContributed.toFixed(2)}€</strong> sur ${giftPrice.toFixed(2)}€</p>
                <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progressPercentage}%;"></div></div>
              </div>
              <form class="partial-contribution-form-display"><input type="hidden" name="id" value="${giftId}"><input type="hidden" name="giftName" value="${getNormalizedValue(gift, 'nom')}"><div class="input-group"><label for="partial-amount-${giftId}">Votre participation (€)</label><input type="number" id="partial-amount-${giftId}" name="amount-partial" placeholder="Ex: 20" min="1" max="${(giftPrice - totalContributed).toFixed(2)}" required></div><div class="input-group"><label for="partial-name-${giftId}">De la part de :</label><input type="text" id="partial-name-${giftId}" name="name-partial" placeholder="Ex: Jean Dupont" required></div><button type="submit" class="button primary">Participer</button></form><p class="form-status-message"></p>
            `;
          }
        } else {
          cardContent += `
            <div class="gift-actions"><a href="${getNormalizedValue(gift, 'productlink')}" target="_blank" class="button secondary">Voir le produit</a><button class="button primary open-revolut-modal-btn" data-gift-id="${giftId}" data-gift-name="${getNormalizedValue(gift, 'nom')}" data-gift-price="${getNormalizedValue(gift, 'prix')}" data-gift-brand="${getNormalizedValue(gift, 'brand')}">Offrir via Revolut</button></div>
          `;
        }
        giftCard.innerHTML = cardContent;
        giftListContainer.appendChild(giftCard);
      });
      
      initializeTabs(categoryToSelect);
    } catch (error) {
      console.error('Erreur lors du chargement ou de l\'affichage:', error);
      if(giftListContainer) giftListContainer.innerHTML = '<p>Erreur chargement. Vérifiez la console pour plus de détails.</p>';
    }
  }

  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    function filterTabs(selectedTab) {
        if (!selectedTab) { if (tabs.length > 0) selectedTab = tabs[0]; else return; }
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
        document.querySelectorAll('.gift-item').forEach(item => {
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

  function attachEventListeners() {
    document.body.addEventListener('click', function(event) {
        const target = event.target;
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (target.matches('.open-revolut-modal-btn')) {
            openRevolutModal(target.dataset.giftId, target.dataset.giftName, target.dataset.giftPrice, target.dataset.giftBrand, false, null);
        } else if (target === modalCloseBtn || target.matches('.modal-overlay')) {
            closeRevolutModal();
        }
    });

    document.body.addEventListener('submit', async function(event) {
        const form = event.target;
        if (form.matches('#modal-offer-form')) {
            event.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            const modalFormStatus = document.getElementById('modal-form-status');
            modalFormStatus.textContent = 'Envoi en cours...';
            if(submitButton) submitButton.disabled = true;
            const activeTab = document.querySelector('.tab-item.active');
            const activeCategory = activeTab ? activeTab.dataset.tab : null;
            try {
                const formData = new FormData(form);
                if (form.dataset.contributionAmount) {
                    formData.set('amount', form.dataset.contributionAmount);
                }
                const response = await fetch(webAppURL_API, { method: 'POST', body: formData });
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message || 'API Unknown Error');
                modalFormStatus.textContent = 'Merci ! Votre offre/contribution a été enregistrée.';
                modalFormStatus.style.color = 'green';
                setTimeout(() => { closeRevolutModal(); fetchAndDisplayGifts(activeCategory); }, 2000);
            } catch (error) {
                console.error('Erreur soumission modale:', error);
                modalFormStatus.textContent = `Erreur: ${error.message}. Réessayez.`;
                modalFormStatus.style.color = 'red';
                if(submitButton) submitButton.disabled = false;
            }
        } else if (form.matches('.cagnotte-form-display') || form.matches('.partial-contribution-form-display')) {
            event.preventDefault();
            const giftId = form.querySelector('input[name="id"]').value;
            const guestName = form.querySelector('input[name*="name-"]').value;
            const amount = form.querySelector('input[name*="amount-"]').value;
            const giftName = form.matches('.cagnotte-form-display')
                ? form.closest('.cagnotte-item').querySelector('h3').textContent
                : form.querySelector('input[name="giftName"]').value;
            const type = form.matches('.cagnotte-form-display') ? 'Cagnotte' : 'Contribution Partielle';
            if (!amount || !guestName) {
                form.nextElementSibling.textContent = "Veuillez remplir le montant et votre nom.";
                form.nextElementSibling.style.color = 'red';
                return;
            }
            form.nextElementSibling.textContent = '';
            openRevolutModal(giftId, giftName, amount, type, true, guestName);
        }
    });
  }
  
  // Fonction utilitaire pour trouver une valeur dans un objet sans se soucier de la casse/espaces/underscores de la clé
  function getNormalizedValue(obj, keyName) {
      if (!obj) return '';
      const normalizedKeyName = keyName.toLowerCase().replace(/[\s_]/g, '');
      const foundKey = Object.keys(obj).find(k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedKeyName);
      return foundKey ? obj[foundKey] : '';
  }

  // CORRIGÉ : La fonction parseCSV la plus robuste et simple
  function parseCSV(text) {
    let cleanText = text.trim();
    if (cleanText.charCodeAt(0) === 0xFEFF) { // Enlève le caractère invisible BOM
        cleanText = cleanText.substring(1);
    }
    const lines = cleanText.split(/\r?\n/);
    if (lines.length < 2 || !lines[0].trim()) {
        return []; // Retourne un tableau vide si pas de données ou pas d'en-tête
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (data.length !== headers.length) { 
        return null; 
      }
      return headers.reduce((obj, header, index) => {
        const value = data[index] ? data[index].trim() : "";
        obj[header] = value.replace(/^"|"$/g, '');
        return obj;
      }, {});
    }).filter(item => item !== null); // Filtre uniquement les lignes vides ou malformées
  }

  attachEventListeners();
  fetchAndDisplayGifts();
});
