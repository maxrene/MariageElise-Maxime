// Remplacez tout le contenu de script.js par ce qui suit

document.addEventListener('DOMContentLoaded', function() {
  
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  // !!! IMPORTANT !!!
  // 1. COLLEZ L'URL DE VOTRE FEUILLE PUBLIÉE EN CSV
  const sheetURL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv'; 

  // 2. COLLEZ L'URL DE VOTRE APPLICATION WEB (APPS SCRIPT)
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycbxWjfEAshO5ytdUrcxNenPiDxJhwIIC_stMMpMid3ae1OUwqABQpAGfEAyB-w8iD3q9yQ/exec';

  const revolutUsername = 'maxbook';
  // =========================================================================


 const giftListContainer = document.getElementById('gift-list-container');
  const cagnotteContainer = document.getElementById('cagnotte-container');
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalAmountElement = document.getElementById('modal-amount'); // Renommé pour clarté
  const modalNoteElement = document.getElementById('modal-note');     // Renommé pour clarté
  const modalRevolutLink = document.getElementById('modal-revolut-link');
  const modalOfferForm = document.getElementById('modal-offer-form');
  const modalGiftIdInput = document.getElementById('modal-gift-id');
  const modalFormStatus = document.getElementById('modal-form-status');
  // NOUVEAU: Champ caché pour le montant dans la modale (pour la cagnotte)
  const modalGiftAmountInput = document.createElement('input');
  modalGiftAmountInput.type = 'hidden';
  modalGiftAmountInput.name = 'amount';
  if(modalOfferForm) modalOfferForm.appendChild(modalGiftAmountInput);


  // --- Fonctions pour la modale Revolut ---
  // MODIFIÉ: La fonction accepte un paramètre optionnel 'amountForCagnotte'
  function openRevolutModal(id, name, priceOrAmount, brandOrType, isCagnotte = false) {
    modalTitle.textContent = isCagnotte ? `Contribuer à : ${name}` : `Offrir : ${name}`;
    modalAmountElement.textContent = `${priceOrAmount}€`;
    
    if (isCagnotte) {
      modalNoteElement.textContent = `Participation libre : ${name} (De la part de : ...)`; // Le nom sera rempli par l'invité
      modalGiftAmountInput.value = priceOrAmount; // On stocke le montant pour la soumission
    } else {
      modalNoteElement.textContent = `Cadeau mariage : ${name} (${brandOrType})`;
      modalGiftAmountInput.value = ''; // Pas de montant spécifique pour les cadeaux normaux ici
    }
    
    modalGiftIdInput.value = id;
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    modalOfferForm.reset(); // Réinitialise le champ "De la part de"
    modalFormStatus.textContent = '';
    
    modalOverlay.classList.add('active');
    revolutModal.classList.add('active');
  }

  function closeRevolutModal() {
    modalOverlay.classList.remove('active');
    revolutModal.classList.remove('active');
  }

  // --- Logique principale ---
  async function fetchAndDisplayGifts(categoryToSelect = null) {
    try {
      const urlWithCacheBuster = `${sheetURL_CSV}&t=${Date.now()}`;
      const response = await fetch(urlWithCacheBuster);
      if (!response.ok) throw new Error(`Erreur HTTP CSV: ${response.status}`);
      const csvText = await response.text();
      const allItems = parseCSV(csvText);

      giftListContainer.innerHTML = ''; 
      cagnotteContainer.innerHTML = '';

      const cagnotteItem = allItems.find(item => item.Categorie.toLowerCase().trim() === 'cagnotte');
      const regularGifts = allItems.filter(item => item.Categorie.toLowerCase().trim() !== 'cagnotte');

      if (cagnotteItem) {
        const cagnotteCard = document.createElement('div');
        cagnotteCard.className = 'cagnotte-item';
        cagnotteContainer.appendChild(cagnotteCard);
        
        cagnotteCard.innerHTML = `
          <h3>${cagnotteItem.Nom}</h3>
          <p>${cagnotteItem.Description || 'Contribuez du montant de votre choix.'}</p>
          <form class="cagnotte-form-display"> <input type="hidden" name="id" value="${cagnotteItem.ID}">
            <div class="input-group">
              <label for="cagnotte-amount-${cagnotteItem.ID}">Montant de votre participation (€)</label>
              <input type="number" id="cagnotte-amount-${cagnotteItem.ID}" name="amount-display" placeholder="Ex: 50" min="1" required>
            </div>
            <div class="input-group">
              <label for="cagnotte-name-${cagnotteItem.ID}">De la part de :</label>
              <input type="text" id="cagnotte-name-${cagnotteItem.ID}" name="name-display" placeholder="Ex: Jean Dupont" required>
            </div>
            <button type="submit" class="button primary">Préparer ma contribution</button>
          </form>
          <p class="form-status-message"></p> 
        `;
      }

      regularGifts.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-item';
        giftCard.dataset.category = gift.Categorie.toLowerCase().trim();
        const isOffered = gift['Offert par'] && gift['Offert par'].trim() !== '';

        let cardContent = `
          <div class="gift-details">
            <div class="gift-info">
              <p class="gift-name">${gift.Nom}</p>
              <p class="gift-brand">Brand: ${gift.Brand}</p>
              <p class="gift-description">${gift.Description}</p>
            </div>
            <div class="gift-image" style="background-image: url('${gift.ImageURL}');">
              ${!isOffered ? `<span class="gift-price-badge">${gift.Prix}€</span>` : ''}
            </div>
          </div>
        `;
        if (isOffered) {
          cardContent += `<p class="gift-status final">✨ Offert par ${gift['Offert par']} !</p>`;
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
        if (!selectedTab) {
            if (tabs.length > 0) selectedTab = tabs[0]; else return;
        }
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
    filterTabs(tabToActivate);
  }

  function attachEventListeners() {
    document.querySelectorAll('.open-revolut-modal-btn').forEach(button => {
      button.addEventListener('click', function() {
        openRevolutModal(this.dataset.giftId, this.dataset.giftName, this.dataset.giftPrice, this.dataset.giftBrand, false);
      });
    });

    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeRevolutModal);
    if(modalOverlay) modalOverlay.addEventListener('click', closeRevolutModal);

    if(modalOfferForm) {
      modalOfferForm.addEventListener('submit', async function(event) {
          event.preventDefault();
          const submitButton = this.querySelector('button[type="submit"]');
          modalFormStatus.textContent = 'Envoi en cours...';
          if(submitButton) submitButton.disabled = true;

          const activeTab = document.querySelector('.tab-item.active');
          const activeCategory = activeTab ? activeTab.dataset.tab : null;
          
          try {
            // On s'assure que FormData inclut bien l'ID et le nom du champ de la modale, et le montant caché
            const formData = new FormData(this);
            formData.set('id', modalGiftIdInput.value); // Assure que l'ID est celui du cadeau / de la cagnotte
            // Le champ 'name' est déjà dans le formulaire de la modale : modal-guest-name
            // Le champ 'amount' (pour la cagnotte) est dans modalGiftAmountInput, qui est ajouté au form.

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
            if(submitButton) submitButton.disabled = false;
          }
      });
    }
      
    // MODIFIÉ : Logique pour le formulaire de la cagnotte sur la carte
    const cagnotteDisplayForm = document.querySelector('.cagnotte-form-display');
    if (cagnotteDisplayForm) {
      cagnotteDisplayForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.nextElementSibling; // Le <p class="form-status-message">
        const submitButton = this.querySelector('button[type="submit"]');
        
        const giftId = this.querySelector('input[name="id"]').value;
        const amount = this.querySelector('input[name="amount-display"]').value;
        const name = this.querySelector('input[name="name-display"]').value;

        if (!amount || !name) {
            statusMessage.textContent = "Veuillez remplir le montant et votre nom.";
            statusMessage.style.color = 'red';
            return;
        }
        
        // Ouvre la modale avec les infos de la cagnotte et le montant saisi
        openRevolutModal(giftId, 'Participation libre', amount, 'Cagnotte', true);
        
        // Le formulaire de la modale (`modalOfferForm`) prendra le relais pour la soumission à l'API
        // On peut pré-remplir le nom dans la modale si on veut
        const modalGuestNameInput = document.getElementById('modal-guest-name');
        if(modalGuestNameInput) modalGuestNameInput.value = name;

        // On ne soumet plus rien directement à l'API depuis CE formulaire.
        // On réinitialise le bouton pour une future interaction si la modale est fermée sans soumettre.
        if(submitButton) submitButton.disabled = false; 
        statusMessage.textContent = ''; // Efface le message "Envoi en cours..."
      });
    }
  }
  
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 1) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (data.length !== headers.length) { 
        console.warn('Ligne CSV malformée ignorée:', line);
        return null; 
      }
      return headers.reduce((obj, nextKey, index) => {
        const value = data[index] ? data[index].trim() : "";
        obj[nextKey.trim()] = value.replace(/^"|"$/g, '');
        return obj;
      }, {});
    }).filter(gift => gift && gift.ID && gift.ID.trim() !== '');
  }

  fetchAndDisplayGifts();
});
