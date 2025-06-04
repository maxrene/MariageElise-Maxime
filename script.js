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
  // =========================================================================


  const giftListContainer = document.getElementById('gift-list-container');
  
  // MODIFICATION : La fonction accepte maintenant un paramètre pour savoir quel onglet activer
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

        if (isOffered) {
          giftCard.innerHTML = `
            <div class="gift-details">
              <div class="gift-info">
                <p class="gift-name">${gift.Nom}</p>
                <p class="gift-brand">Brand: ${gift.Brand}</p>
                <p class="gift-description">${gift.Description}</p>
              </div>
              <div class="gift-image" style="background-image: url('${gift.ImageURL}');"></div>
            </div>
            <p class="gift-status final">✨ Offert par ${gift['Offert par']} !</p>
          `;
        } else {
          giftCard.innerHTML = `
            <div class="gift-details">
              <div class="gift-info">
                <p class="gift-name">${gift.Nom}</p>
                <p class="gift-brand">Brand: ${gift.Brand}</p>
                <p class="gift-description">${gift.Description}</p>
              </div>
              <div class="gift-image" style="background-image: url('${gift.ImageURL}');">
                <span class="gift-price-badge">${gift.Prix}€</span>
              </div>
            </div>
            <div class="gift-actions">
                <a href="${gift.ProductLink}" target="_blank" class="button secondary">Voir le produit</a>
            </div>
            <div class="gift-offer">
              <label class="offer-checkbox-label">
                <input type="checkbox" class="gift-offer-checkbox">
                J'offre ce cadeau
              </label>
              <div class="offer-form">
                <form>
                  <input type="hidden" name="id" value="${gift.ID}">
                  <label for="name-${gift.ID}">Votre nom/prénom :</label>
                  <input type="text" id="name-${gift.ID}" name="name" placeholder="Ex: Jean Dupont" required>
                  <button type="submit" class="button primary">Valider mon offre</button>
                  <p class="form-status-message"></p>
                </form>
              </div>
            </div>
          `;
        }
        giftListContainer.appendChild(giftCard);
      });
      
      attachEventListeners();
      // MODIFICATION : On passe la catégorie à réactiver à la fonction d'initialisation des onglets
      initializeTabs(categoryToSelect);

    } catch (error) {
      console.error('Erreur lors de la récupération des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage.</p>';
    }
  }

  // MODIFICATION : La fonction reçoit la catégorie à activer
  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    
    function filterTabs(selectedTab) {
        if (!selectedTab) return;
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab === selectedTab);
        });
        document.querySelectorAll('.gift-item').forEach(item => {
            item.style.display = item.dataset.category === category ? 'block' : 'none';
        });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', function(event) {
        event.preventDefault(); 
        filterTabs(this); 
      });
    });
    
    // MODIFICATION : Logique pour activer le bon onglet
    let tabToActivate = tabs[0]; // Par défaut, le premier
    if (categoryToSelect) {
        const foundTab = document.querySelector(`.tab-item[data-tab="${categoryToSelect}"]`);
        if (foundTab) {
            tabToActivate = foundTab;
        }
    }
    filterTabs(tabToActivate);
  }

  function attachEventListeners() {
    document.querySelectorAll('.gift-offer-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        this.closest('.gift-item').classList.toggle('is-offering', this.checked);
      });
    });

    document.querySelectorAll('.offer-form form').forEach(form => {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.querySelector('.form-status-message');
        const submitButton = this.querySelector('button[type="submit"]');
        statusMessage.textContent = 'Envoi en cours...';
        submitButton.disabled = true;

        // MODIFICATION : On mémorise l'onglet actif AVANT de soumettre
        const activeTab = document.querySelector('.tab-item.active');
        const activeCategory = activeTab ? activeTab.dataset.tab : null;
        
        try {
          await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
          statusMessage.textContent = 'Merci ! Votre offre a été enregistrée. La liste va se rafraîchir...';
          statusMessage.style.color = 'green';
          
          // MODIFICATION : On passe la catégorie mémorisée à la fonction de rafraîchissement
          setTimeout(() => fetchAndDisplayGifts(activeCategory), 2000);

        } catch (error) {
          console.error('Erreur lors de la soumission :', error);
          statusMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
          statusMessage.style.color = 'red';
          submitButton.disabled = false;
        }
      });
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

  // Lancement initial
  fetchAndDisplayGifts();
});
