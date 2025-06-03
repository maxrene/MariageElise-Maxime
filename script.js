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
      const response = await fetch(sheetURL_CSV);
      const csvText = await response.text();
      const gifts = parseCSV(csvText);

      giftListContainer.innerHTML = ''; // Vide le conteneur

      gifts.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-item';
        giftCard.dataset.category = gift.Categorie.toLowerCase(); // Pour les onglets
        
        // On vérifie si le cadeau est déjà offert
        if (gift['Offert par'] && gift['Offert par'].trim() !== '') {
          // --- AFFICHE L'ÉTAT "OFFERT" ---
          giftCard.innerHTML = `
            <div class="gift-details">
              <div class="gift-info">
                <p class="gift-name">${gift.Nom}</p>
                <p class="gift-brand">Brand: ${gift.Brand}</p>
              </div>
              <div class="gift-image" style="background-image: url('${gift.ImageURL}');"></div>
            </div>
            <p class="gift-description">${gift.Description}</p>
            <p class="gift-status final">✨ Offert par ${gift['Offert par']} !</p>
          `;
        } else {
          // --- AFFICHE LA CARTE INTERACTIVE ---
          giftCard.innerHTML = `
            <div class="gift-details">
              <div class="gift-info">
                <p class="gift-name">${gift.Nom}</p>
                <p class="gift-brand">Brand: ${gift.Brand} · ${gift.Prix}€</p>
              </div>
              <div class="gift-image" style="background-image: url('${gift.ImageURL}');"></div>
            </div>
            <p class="gift-description">${gift.Description}</p>
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

    } catch (error) {
      console.error('Erreur lors de la récupération des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage.</p>';
    }
  }

  // Fonction pour attacher les écouteurs d'événements aux éléments interactifs
  function attachEventListeners() {
    // Pour les cases à cocher
    document.querySelectorAll('.gift-offer-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const giftItem = this.closest('.gift-item');
        if (this.checked) {
          giftItem.classList.add('is-offering');
        } else {
          giftItem.classList.remove('is-offering');
        }
      });
    });

    // Pour la soumission des formulaires
    document.querySelectorAll('.offer-form form').forEach(form => {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.querySelector('.form-status-message');
        statusMessage.textContent = 'Envoi en cours...';
        
        const formData = new FormData(this);
        
        try {
          const response = await fetch(webAppURL_API, {
            method: 'POST',
            body: formData
          });
          const result = await response.json();

          if (result.status === 'success') {
            statusMessage.textContent = 'Merci ! Votre offre a bien été enregistrée. La liste va se rafraîchir...';
            statusMessage.style.color = 'green';
            // On attend 2 secondes et on rafraîchit la liste pour tout le monde
            setTimeout(fetchAndDisplayGifts, 2000);
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          console.error('Erreur lors de la soumission :', error);
          statusMessage.textContent = 'Erreur lors de l\'envoi. Veuillez réessayer.';
          statusMessage.style.color = 'red';
        }
      });
    });
  }

  // Fonction simple pour parser le CSV
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const data = line.split(',');
      return headers.reduce((obj, nextKey, index) => {
        obj[nextKey.trim()] = data[index] ? data[index].trim() : "";
        return obj;
      }, {});
    }).filter(gift => gift.ID); // Filtre les lignes vides
  }

  // Lancement initial
  fetchAndDisplayGifts();
});
