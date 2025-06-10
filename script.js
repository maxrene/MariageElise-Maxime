document.addEventListener('DOMContentLoaded', function() {

  console.log("SCRIPT START: Le document est prêt.");
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  const sheetURL_Cadeaux_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=0&single=true&output=csv';
  const sheetURL_Contributions_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?gid=88609421&single=true&output=csv';
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycbwjO3gsIKNgruc86ufR1KpDiEJ4PMX2PqBBtvLxsrPk1mOnGsf6kjvbDWRp788KKocENQ/exec';
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
      console.log(`FONCTION openRevolutModal: Ouverture pour le cadeau "${giftNameForDisplay}".`);
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
    console.log("FONCTION closeRevolutModal: Fermeture de la modale.");
    if(modalOverlay) modalOverlay.classList.remove('active');
    if(revolutModal) revolutModal.classList.remove('active');
  }

  async function fetchAndDisplayGifts(categoryToSelect = null) {
    console.log(`--- DÉBUT DU CHARGEMENT --- Rafraîchissement demandé pour l'onglet : ${categoryToSelect || 'défaut (premier)'}`);
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

      console.log("--- DONNÉES BRUTES ---");
      console.log("Cadeaux parsés:", allItems);
      console.log("Contributions parsées:", allContributions);
      
      const contributionsByGiftId = allContributions.reduce((acc, contrib) => {
        const id = getNormalizedValue(contrib, 'id_cadeau');
        const amount = parseFloat(getNormalizedValue(contrib, 'montant')) || 0;
        if (id) {
            acc[id] = (acc[id] || 0) + amount;
        }
        return acc;
      }, {});

      console.log("--- CALCUL DES SOMMES ---");
      console.log("Objet des contributions calculées par ID:", contributionsByGiftId);

      if(giftListContainer) giftListContainer.innerHTML = ''; 
      if(cagnotteContainer) cagnotteContainer.innerHTML = '';
      const cagnotteItemData = allItems.find(item => getNormalizedValue(item, 'categorie') === 'cagnotte');
      const regularGiftsData = allItems.filter(item => getNormalizedValue(item, 'categorie') !== 'cagnotte');
      
      if (cagnotteItemData && cagnotteContainer) { /* ... affichage cagnotte, inchangé ... */ }
      
      regularGiftsData.forEach(gift => {
        const giftId = getNormalizedValue(gift, 'id');
        const totalContributed = contributionsByGiftId[giftId] || 0;
        const isPartial = getNormalizedValue(gift, 'type_contribution') === 'partiel';
        
        if (isPartial) {
            console.log(`==> Calcul pour cadeau partiel (ID: '${giftId}') | Total trouvé: ${totalContributed}€`);
        }
        // ... le reste de l'affichage des cartes ...
      });
      
      initializeTabs(categoryToSelect);
    } catch (error) {
      console.error('Erreur fetch/display:', error);
      if(giftListContainer) giftListContainer.innerHTML = '<p>Erreur chargement. Vérifiez la console.</p>';
    }
  }

  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    let tabToActivate = tabs[0];
    if (categoryToSelect) {
        const foundTab = document.querySelector(`.tab-item[data-tab="${categoryToSelect}"]`);
        if (foundTab) tabToActivate = foundTab;
    }
    console.log(`INITIALIZE TABS: Tentative d'activation de l'onglet :`, tabToActivate ? tabToActivate.dataset.tab : "aucun");

    function filterTabs(selectedTab) {
        if (!selectedTab) return;
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
        document.querySelectorAll('.gift-item').forEach(item => {
             item.style.display = item.dataset.category === category ? 'block' : 'none';
        });
    }
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => { e.preventDefault(); filterTabs(e.currentTarget); });
    });
    if (tabs.length > 0) filterTabs(tabToActivate);
  }

  function attachEventListeners() {
    document.body.addEventListener('click', function(event) { /* ... */ });
    document.body.addEventListener('submit', async function(event) {
        const form = event.target;
        if (form.matches('#modal-offer-form')) {
            event.preventDefault();
            const activeTab = document.querySelector('.tab-item.active');
            const activeCategory = activeTab ? activeTab.dataset.tab : null;
            console.log(`SUBMIT MODAL: Onglet actif mémorisé : ${activeCategory}`);
            // ... le reste de la logique de soumission ...
        } // ... autres else if ...
    });
  }
  
  function getNormalizedValue(obj, keyName) { /* ... */ }
  function parseCSV(text) { /* ... */ }

  attachEventListeners();
  fetchAndDisplayGifts();
});
