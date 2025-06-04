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

  // Fonction principale pour récupérer et afficher les cadeaux
  async function fetchAndDisplayGifts() {
    try {
      // Ajout d'un paramètre anti-cache à l'URL pour avoir les données à jour
      const urlWithCacheBuster = `${sheetURL_CSV}&t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBuster);
      const csvText = await response.text();
      const gifts = parseCSV(csvText);

      giftListContainer.innerHTML = ''; // Vide le conteneur avant de le remplir

      gifts.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-item';
        giftCard.dataset.category = gift.Categorie.toLowerCase().trim();
        
        const isOffered = gift['Offert par'] && gift['Offert par'].trim() !== '';

        // On génère le HTML de la carte en fonction de si le cadeau est offert ou non
        if (isOffered) {
          // --- AFFICHE L'ÉTAT "OFFERT" (VERSION SIMPLE) ---
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
          // --- AFFICHE LA CARTE INTERACTIVE (AVEC FORMULAIRE) ---
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
      
      // Une fois les cartes créées, on attache les écouteurs d'événements
      attachEventListeners();
      initializeTabs();

    } catch (error) {
      console.error('Erreur lors de la récupération des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage.</p>';
    }
  }

  // Fonction pour initialiser et gérer les onglets
  function initializeTabs() {
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
    
    // Active le premier onglet par défaut au chargement
    if (tabs.length > 0) {
      filterTabs(tabs[0]);
    }
  }

  // Fonction pour attacher les écouteurs d'événements aux formulaires
  function attachEventListeners() {
    // Pour les cases à cocher qui affichent/cachent le formulaire
    document.querySelectorAll('.gift-offer-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const giftItem = this.closest('.gift-item');
        giftItem.classList.toggle('is-offering', this.checked);
      });
    });

    // Pour la soumission des formulaires d'offre
    document.querySelectorAll('.offer-form form').forEach(form => {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.querySelector('.form-status-message');
        const submitButton = this.querySelector('button[type="submit"]');
        statusMessage.textContent = 'Envoi en cours...';
        submitButton.disabled = true;
        
        try {
          await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
          statusMessage.textContent = 'Merci ! Votre offre a été enregistrée. La liste va se rafraîchir...';
          statusMessage.style.color = 'green';
          // On attend 2 secondes pour que l'utilisateur lise le message, puis on rafraîchit
          setTimeout(fetchAndDisplayGifts, 2000);
        } catch (error) {
          console.error('Erreur lors de la soumission :', error);
          statusMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
          statusMessage.style.color = 'red';
          submitButton.disabled = false;
        }
      });
    });
  }
  
  // Fonction améliorée pour analyser le CSV
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

  // Lancement initial au chargement de la page
  fetchAndDisplayGifts();
});
