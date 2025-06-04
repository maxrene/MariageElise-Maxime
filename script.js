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
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalAmount = document.getElementById('modal-amount');
  const modalNote = document.getElementById('modal-note');
  const modalRevolutLink = document.getElementById('modal-revolut-link');
  const modalOfferForm = document.getElementById('modal-offer-form');
  const modalGiftIdInput = document.getElementById('modal-gift-id');
  const modalFormStatus = document.getElementById('modal-form-status');

  // --- FONCTIONS POUR LA MODALE REVOLUT ---
  function openRevolutModal(id, name, price, brand) {
    modalTitle.textContent = `Offrir : ${name}`;
    modalAmount.textContent = `${price}€`;
    modalNote.textContent = `Cadeau mariage : ${name} (${brand})`;
    modalGiftIdInput.value = id;
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    modalOfferForm.reset();
    modalFormStatus.textContent = '';
    
    modalOverlay.classList.add('active');
    revolutModal.classList.add('active');
  }

  function closeRevolutModal() {
    modalOverlay.classList.remove('active');
    revolutModal.classList.remove('active');
  }

  // --- FONCTION PRINCIPALE POUR AFFICHER LA LISTE ---
  async function fetchAndDisplayGifts(categoryToSelect = null) {
    try {
      const urlWithCacheBuster = `${sheetURL_CSV}&t=${Date.now()}`;
      const response = await fetch(urlWithCacheBuster);
      const csvText = await response.text();
      const gifts = parseCSV(csvText);

      giftListContainer.innerHTML = ''; 

      gifts.forEach(gift => {
        // LOGIQUE SPÉCIALE POUR LA CAGNOTTE
        if (gift.Categorie.toLowerCase().trim() === 'cagnotte') {
          const cagnotteCard = document.createElement('div');
          cagnotteCard.className = 'cagnotte-item';
          cagnotteCard.dataset.category = 'cagnotte';

          cagnotteCard.innerHTML = `
            <h3>${gift.Nom}</h3>
            <p>${gift.Description}</p>
            <form class="cagnotte-form">
              <input type="hidden" name="id" value="${gift.ID}">
              <div class="input-group">
                <label for="cagnotte-amount">Montant de votre participation (€)</label>
                <input type="number" id="cagnotte-amount" name="amount" placeholder="Ex: 50" min="1" required>
              </div>
              <div class="input-group">
                <label for="cagnotte-name">De la part de :</label>
                <input type="text" id="cagnotte-name" name="name" placeholder="Ex: Jean Dupont" required>
              </div>
              <button type="submit" class="button primary">Contribuer</button>
            </form>
            <p class="form-status-message"></p>
          `;
          giftListContainer.appendChild(cagnotteCard);
        } else {
          // LOGIQUE POUR LES CADEAUX NORMAUX
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
        }
      });
      
      attachEventListeners();
      initializeTabs(categoryToSelect);
    } catch (error) {
      console.error('Erreur lors de la récupération des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage.</p>';
    }
  }

  // --- FONCTIONS UTILITAIRES ---

  // Initialise et gère les onglets
  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    function filterTabs(selectedTab) {
        if (!selectedTab) return;
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
        document.querySelectorAll('.gift-item, .cagnotte-item').forEach(item => {
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

  // Attache tous les écouteurs d'événements
  function attachEventListeners() {
    // Pour les boutons qui ouvrent la modale
    document.querySelectorAll('.open-revolut-modal-btn').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.dataset.giftId;
        const name = this.dataset.giftName;
        const price = this.dataset.giftPrice;
        const brand = this.dataset.giftBrand;
        openRevolutModal(id, name, price, brand);
      });
    });

    // Pour fermer la modale
    modalCloseBtn.addEventListener('click', closeRevolutModal);
    modalOverlay.addEventListener('click', closeRevolutModal);

    // Pour la soumission du formulaire DANS la modale (cadeaux normaux)
    modalOfferForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        modalFormStatus.textContent = 'Envoi en cours...';
        submitButton.disabled = true;

        const activeTab = document.querySelector('.tab-item.active');
        const activeCategory = activeTab ? activeTab.dataset.tab : null;
        
        try {
          await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
          modalFormStatus.textContent = 'Merci ! Votre offre a été enregistrée.';
          modalFormStatus.style.color = 'green';
          setTimeout(() => {
            closeRevolutModal();
            fetchAndDisplayGifts(activeCategory);
          }, 2000);
        } catch (error) {
          console.error('Erreur lors de la soumission :', error);
          modalFormStatus.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
          modalFormStatus.style.color = 'red';
          submitButton.disabled = false;
        }
    });
      
    // Pour la soumission du formulaire de la CAGNOTTE
    const cagnotteForm = document.querySelector('.cagnotte-form');
    if (cagnotteForm) {
      cagnotteForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.nextElementSibling;
        const submitButton = this.querySelector('button[type="submit"]');
        statusMessage.textContent = 'Envoi en cours...';
        submitButton.disabled = true;

        try {
          await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
          statusMessage.textContent = 'Merci pour votre généreuse contribution !';
          statusMessage.style.color = 'green';
          this.reset();
        } catch (error) {
          console.error('Erreur lors de la soumission de la contribution :', error);
          statusMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
          statusMessage.style.color = 'red';
        } finally {
            submitButton.disabled = false;
        }
      });
    }
  }
  
  // Analyse le CSV de manière robuste
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (data.length !== headers.length) { return null; }
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
