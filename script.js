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
  // NOUVEAU : On sélectionne les éléments de la modale
  const modalOverlay = document.getElementById('modal-overlay');
  const revolutModal = document.getElementById('revolut-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalAmount = document.getElementById('modal-amount');
  const modalNote = document.getElementById('modal-note');
  const modalRevolutLink = document.getElementById('modal-revolut-link');

  // --- Fonctions pour la modale ---
  function openRevolutModal(name, price, brand) {
    modalTitle.textContent = `Offrir : ${name}`;
    modalAmount.textContent = `${price}€`;
    modalNote.textContent = `Cadeau mariage : ${name} (${brand})`;
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    
    modalOverlay.classList.add('active');
    revolutModal.classList.add('active');
  }

  function closeRevolutModal() {
    modalOverlay.classList.remove('active');
    revolutModal.classList.remove('active');
  }

  // --- Logique principale ---
  async function fetchAndDisplayGifts() {
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
          // MODIFIÉ : On remplace l'ancien formulaire par le nouveau bouton
          cardContent += `
            <div class="gift-actions">
              <a href="${gift.ProductLink}" target="_blank" class="button secondary">Voir le produit</a>
              <button class="button primary open-revolut-modal-btn" 
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
      initializeTabs();
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
    // MODIFIÉ : On écoute les clics sur les nouveaux boutons
    document.querySelectorAll('.open-revolut-modal-btn').forEach(button => {
      button.addEventListener('click', function() {
        const name = this.dataset.giftName;
        const price = this.dataset.giftPrice;
        const brand = this.dataset.giftBrand;
        openRevolutModal(name, price, brand);
      });
    });

    // On ajoute les écouteurs pour fermer la modale
    modalCloseBtn.addEventListener('click', closeRevolutModal);
    modalOverlay.addEventListener('click', closeRevolutModal);
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

  fetchAndDisplayGifts()
