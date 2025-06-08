document.addEventListener('DOMContentLoaded', function() {
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  const sheetURL_Cadeaux_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv';
  const sheetURL_Contributions_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv';
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycbzeUY76LoHLz9iHaH_8b3iyY5RhVM6zg1V0Ot3nK79Yu8quEG0zAHeJ-2uRrMKKUb9Rzw/exec';
  const revolutUsername = 'maxbook';
  // =========================================================================

  const giftListContainer = document.getElementById('gift-list-container');
  const cagnotteContainer = document.getElementById('cagnotte-container');
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalOfferForm = document.getElementById('modal-offer-form');

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
    const modalGiftAmountInput = modalOfferForm.querySelector('input[name="amount"]');

    modalTitle.textContent = isGenericContribution ? `Confirmer votre contribution à : ${giftNameForDisplay}` : `Offrir : ${giftNameForDisplay}`;
    modalAmountElement.textContent = `${amountToPay}€`;
    modalGiftIdInput.value = id;
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    if(modalOfferForm) modalOfferForm.reset();
    if(modalFormStatus) modalFormStatus.textContent = '';
    if(modalSubmitButton) modalSubmitButton.disabled = false;

    if (isGenericContribution) {
      modalNoteElement.textContent = `Contribution pour "${giftNameForDisplay}" (De la part de : ${guestNameFromCard})`;
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
        const id = contrib.ID_Cadeau;
        const amount = parseFloat(contrib.Montant) || 0;
        acc[id] = (acc[id] || 0) + amount;
        return acc;
      }, {});

      giftListContainer.innerHTML = '';
      cagnotteContainer.innerHTML = '';

      const cagnotteItemData = allItems.find(item => item.Categorie.toLowerCase().trim() === 'cagnotte');
      const regularGiftsData = allItems.filter(item => item.Categorie.toLowerCase().trim() !== 'cagnotte');

      if (cagnotteItemData) {
        cagnotteContainer.innerHTML = `
          <div class="cagnotte-item">
            <h3>${cagnotteItemData.Nom}</h3>
            <p>${cagnotteItemData.Description || 'Contribuez du montant de votre choix.'}</p>
            ${contributionsByGiftId[cagnotteItemData.ID] > 0 ? `<p><strong>Déjà collecté : ${contributionsByGiftId[cagnotteItemData.ID].toFixed(2)}€</strong></p>` : ''}
            <form class="cagnotte-form-display">
              <input type="hidden" name="id" value="${cagnotteItemData.ID}">
              <div class="input-group">
                <label for="cagnotte-amount">Montant de votre participation (€)</label>
                <input type="number" id="cagnotte-amount" name="amount-display" placeholder="Ex: 50" min="1" required>
              </div>
              <div class="input-group">
                <label for="cagnotte-name">De la part de :</label>
                <input type="text" id="cagnotte-name" name="name-display" placeholder="Ex: Jean Dupont" required>
              </div>
              <button type="submit" class="button primary">Préparer ma contribution</button>
            </form>
            <p class="form-status-message"></p>
          </div>
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

        giftCard.innerHTML = `
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
          ${isOffered ? `<p class="gift-status final">✨ Offert par ${gift['Offert par']} !</p>`
          : isPartial ? `
            <div class="contribution-progress">
              <p>Objectif : ${giftPrice.toFixed(2)}€</p>
              <p>Collecté : <strong>${totalContributed.toFixed(2)}€</strong></p>
              ${isFullyFunded ? '<p class="gift-status final">🎉 Objectif atteint ! Merci !</p>' : ''}
            </div>
            ${!isFullyFunded ? `
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
            ` : ''}`
          : `
            <div class="gift-actions">
              <a href="${gift.ProductLink}" target="_blank" class="button secondary">Voir le produit</a>
              <button class="button primary open-revolut-modal-btn"
                      data-gift-id="${gift.ID}" data-gift-name="${gift.Nom}"
                      data-gift-price="${gift.Prix}" data-gift-brand="${gift.Brand}">
                Offrir via Revolut
              </button>
            </div>
          `}
        `;
        giftListContainer.appendChild(giftCard);
      });

      attachEventListeners();
      initializeTabs(categoryToSelect);
    } catch (error) {
      console.error('Erreur fetch/display:', error);
      giftListContainer.innerHTML = '<p>Erreur chargement. Vérifiez la console.</p>';
    }
  }

  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    function filterTabs(selectedTab) {
      if (!selectedTab && tabs.length) selectedTab = tabs[0];
      tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
      document.querySelectorAll('.gift-item').forEach(item => {
        item.style.display = item.dataset.category === selectedTab.dataset.tab ? 'block' : 'none';
      });
    }
    tabs.forEach(tab => tab.addEventListener('click', e => { e.preventDefault(); filterTabs(e.currentTarget); }));
    let toActivate = categoryToSelect
      ? document.querySelector(`.tab-item[data-tab="${categoryToSelect}"]`)
      : tabs[0];
    if (toActivate) filterTabs(toActivate);
  }

  function attachEventListeners() {
    document.body.addEventListener('click', function(event) {
      const target = event.target;
      if (target.matches('.open-revolut-modal-btn')) {
        openRevolutModal(target.dataset.giftId, target.dataset.giftName, target.dataset.giftPrice, target.dataset.giftBrand, false, null);
      } else if (target.matches('#modal-close-btn') || target.matches('.modal-overlay')) {
        closeRevolutModal();
      }
    });

    document.body.addEventListener('submit', async function(event) {
      const form = event.target;

      if (form.matches('#modal-offer-form')) {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const statusEl    = document.getElementById('modal-form-status');
        submitButton.disabled = true;
        statusEl.textContent  = 'Envoi en cours…';
        
        const id     = form.querySelector('input[name="id"]').value;
        const name   = form.querySelector('input[name="name"]').value;
        const amount = form.querySelector('input[name="amount"]').value;
        
        const payload = new URLSearchParams();
        payload.append('id',     id);
        payload.append('name',   name);
        payload.append('amount', amount);

        try {
          const res = await fetch(webAppURL_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body:    payload.toString()
          });
          const json = await res.json();
          if (json.status !== 'success') throw new Error(json.message);
          statusEl.textContent = '✔️ Envoyé !';
          setTimeout(() => { closeRevolutModal(); fetchAndDisplayGifts(); }, 1500);
        } catch (err) {
          statusEl.textContent  = `Erreur : ${err.message}`;
          statusEl.style.color  = 'red';
          submitButton.disabled = false;
        }

      } else if (form.matches('.cagnotte-form-display')) {
        event.preventDefault();
        const giftId      = form.querySelector('input[name="id"]').value;
        const amount      = form.querySelector('input[name="amount-display"]').value;
        const guestName   = form.querySelector('input[name="name-display"]').value;
        const giftDisplayName = form.closest('.cagnotte-item').querySelector('h3').textContent;
        if (!amount || !guestName) {
          form.nextElementSibling.textContent = "Veuillez remplir le montant et votre nom.";
          form.nextElementSibling.style.color = 'red';
          return;
        }
        form.nextElementSibling.textContent = '';
        openRevolutModal(giftId, giftDisplayName, amount, 'Cagnotte', true, guestName);

      } else if (form.matches('.partial-contribution-form-display')) {
        event.preventDefault();
        const giftId    = form.querySelector('input[name="id"]').value;
        const giftName  = form.querySelector('input[name="giftName"]').value;
        const amount    = form.querySelector('input[name="amount-partial"]').value;
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

  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
