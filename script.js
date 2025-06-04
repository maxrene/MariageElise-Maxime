// Remplacez tout le contenu de script.js par ce qui suit

document.addEventListener('DOMContentLoaded', function() {
  
  // =========================================================================
  //                            CONFIGURATION
  // =========================================================================
  // !!! IMPORTANT !!!
  // 1. COLLEZ L'URL DE VOTRE FEUILLE PUBLIÉE EN CSV
  const sheetURL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP1Yxt6ZVzvn-OpDJUvKgia2zj8xc7iI-9bUsGydW8ZS-d86GbXLgET10xwy1KLB4CvMQlfLCJw3xL/pub?output=csv'; 

  // 2. COLLEZ L'URL DE VOTRE APPLICATION WEB (APPS SCRIPT)
  const webAppURL_API = 'https://script.google.com/macros/s/AKfycby0dsby-8ZYDogigfdlEqAl7XAFHdYq9L0IspMlxn5DZe0ZqUeED4RKb91zff06sSEPRQ/exec';

  const revolutUsername = 'maxbook';
  // =========================================================================


 const giftListContainer = document.getElementById('gift-list-container');
  // On sélectionne les éléments de la modale et du formulaire
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

  // --- Fonctions pour la modale ---
  function openRevolutModal(id, name, price, brand) {
    modalTitle.textContent = `Offrir : ${name}`;
    modalAmount.textContent = `${price}€`;
    modalNote.textContent = `Cadeau mariage : ${name} (${brand})`;
    modalGiftIdInput.value = id; // On met l'ID du cadeau dans le champ caché du formulaire
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    modalFormStatus.textContent = ''; // On vide les anciens messages de statut
    
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
      const csvText = await response.text();
      const gifts = parseCSV(csvText);

      giftListContainer.innerHTML = ''; 

      gifts.forEach(gift => {
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
                      data-gift-id="${gift.ID}"
                      data-gift-name="${gift.Nom}" 
                      data-gift-price="${gift.Prix}" 
                      data-gift-brand="${gift.Brand}">
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
      console.error('Erreur lors de la récupération des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage.</p>';
    }
  }

  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
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
        const id = this.dataset.giftId;
        const name = this.dataset.giftName;
        const price = this.dataset.giftPrice;
        const brand = this.dataset.giftBrand;
        openRevolutModal(id, name, price, brand);
      });
    });

    modalCloseBtn.addEventListener('click', closeRevolutModal);
    modalOverlay.addEventListener('click', closeRevolutModal);

    // On reconnecte la logique de soumission du formulaire
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
          // On attend 2 secondes, on ferme la modale, et on rafraîchit la liste
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
  }
  
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

  fetchAndDisplayGifts();
});
