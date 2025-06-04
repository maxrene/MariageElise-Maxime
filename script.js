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


 // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
  const giftListContainer = document.getElementById('gift-list-container');
  const cagnotteContainer = document.getElementById('cagnotte-container'); // Conteneur pour la carte "cagnotte"

  // Éléments de la modale
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
    modalGiftIdInput.value = id; // ID du cadeau pour le formulaire de la modale
    modalRevolutLink.href = `https://revolut.me/${revolutUsername}`;
    modalOfferForm.reset(); // Vide le formulaire de la modale
    modalFormStatus.textContent = ''; // Efface les anciens messages de statut
    
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
      // Astuce anti-cache pour toujours avoir les données fraîches
      const urlWithCacheBuster = `${sheetURL_CSV}&t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBuster);
      if (!response.ok) {
        throw new Error(`Erreur HTTP pour le CSV : ${response.status}`);
      }
      const csvText = await response.text();
      const allItems = parseCSV(csvText);

      // On vide les conteneurs avant de les remplir
      giftListContainer.innerHTML = ''; 
      cagnotteContainer.innerHTML = '';

      // On sépare la cagnotte des autres cadeaux
      const cagnotteItem = allItems.find(item => item.Categorie.toLowerCase().trim() === 'cagnotte');
      const regularGifts = allItems.filter(item => item.Categorie.toLowerCase().trim() !== 'cagnotte');

      // --- 1. AFFICHER LA CAGNOTTE (si elle existe) ---
      if (cagnotteItem) {
        const cagnotteCard = document.createElement('div');
        cagnotteCard.className = 'cagnotte-item'; // Pour le style CSS
        cagnotteContainer.appendChild(cagnotteCard); // Ajout au DOM avant innerHTML pour que le form soit trouvable par querySelector
        
        cagnotteCard.innerHTML = `
          <h3>${cagnotteItem.Nom}</h3>
          <p>${cagnotteItem.Description || 'Contribuez du montant de votre choix pour nous aider dans nos projets.'}</p>
          <form class="cagnotte-form">
            <input type="hidden" name="id" value="${cagnotteItem.ID}">
            <div class="input-group">
              <label for="cagnotte-amount-${cagnotteItem.ID}">Montant de votre participation (€)</label>
              <input type="number" id="cagnotte-amount-${cagnotteItem.ID}" name="amount" placeholder="Ex: 50" min="1" required>
            </div>
            <div class="input-group">
              <label for="cagnotte-name-${cagnotteItem.ID}">De la part de :</label>
              <input type="text" id="cagnotte-name-${cagnotteItem.ID}" name="name" placeholder="Ex: Jean Dupont" required>
            </div>
            <button type="submit" class="button primary">Contribuer</button>
          </form>
          <p class="form-status-message"></p>
        `;
      }
      
      // --- 2. AFFICHER LES CADEAUX NORMAUX ---
      regularGifts.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-item';
        giftCard.dataset.category = gift.Categorie.toLowerCase().trim(); // Pour le filtrage par onglets
        
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
      
      attachEventListeners(); // Attache tous les écouteurs d'événements nécessaires
      initializeTabs(categoryToSelect); // Initialise les onglets et active le bon

    } catch (error) {
      console.error('Erreur lors de la récupération ou de l\'affichage des cadeaux:', error);
      giftListContainer.innerHTML = '<p>Erreur: Impossible de charger la liste de mariage. Vérifiez la console pour plus de détails.</p>';
    }
  }

  // --- FONCTIONS UTILITAIRES ---

  // Initialise et gère les onglets
  function initializeTabs(categoryToSelect) {
    const tabs = document.querySelectorAll('.tab-item');
    
    function filterTabs(selectedTab) {
        if (!selectedTab) { // Si aucun onglet n'est sélectionné (ex: au premier chargement avec catégorie inconnue)
            if (tabs.length > 0) selectedTab = tabs[0]; // On prend le premier par défaut
            else return; // Pas d'onglets, rien à faire
        }
        const category = selectedTab.dataset.tab;
        tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
        // On ne filtre que les .gift-item, la cagnotte reste toujours visible
        document.querySelectorAll('.gift-item').forEach(item => {
            item.style.display = item.dataset.category === category ? 'block' : 'none';
        });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => { 
        e.preventDefault(); 
        filterTabs(e.currentTarget); 
      });
    });
    
    let tabToActivate = tabs[0]; // Le premier onglet par défaut
    if (categoryToSelect) {
        const foundTab = document.querySelector(`.tab-item[data-tab="${categoryToSelect}"]`);
        if (foundTab) tabToActivate = foundTab;
    }
    filterTabs(tabToActivate); // Filtre initial ou basé sur categoryToSelect
  }

  // Attache tous les écouteurs d'événements après la création des éléments
  function attachEventListeners() {
    // Pour les boutons qui ouvrent la modale Revolut
    document.querySelectorAll('.open-revolut-modal-btn').forEach(button => {
      button.addEventListener('click', function() {
        openRevolutModal(this.dataset.giftId, this.dataset.giftName, this.dataset.giftPrice, this.dataset.giftBrand);
      });
    });

    // Pour fermer la modale
    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeRevolutModal);
    if(modalOverlay) modalOverlay.addEventListener('click', closeRevolutModal);

    // Pour la soumission du formulaire DANS la modale (cadeaux normaux)
    if(modalOfferForm) {
      modalOfferForm.addEventListener('submit', async function(event) {
          event.preventDefault();
          const submitButton = this.querySelector('button[type="submit"]');
          modalFormStatus.textContent = 'Envoi en cours...';
          if(submitButton) submitButton.disabled = true;

          const activeTab = document.querySelector('.tab-item.active');
          const activeCategory = activeTab ? activeTab.dataset.tab : null;
          
          try {
            const response = await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
            if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message || 'Erreur inconnue de l\'API');

            modalFormStatus.textContent = 'Merci ! Votre offre a été enregistrée.';
            modalFormStatus.style.color = 'green';
            setTimeout(() => { 
              closeRevolutModal(); 
              fetchAndDisplayGifts(activeCategory); 
            }, 2000);
          } catch (error) {
            console.error('Erreur lors de la soumission du formulaire modal :', error);
            modalFormStatus.textContent = `Erreur: ${error.message}. Veuillez réessayer.`;
            modalFormStatus.style.color = 'red';
            if(submitButton) submitButton.disabled = false;
          }
      });
    }
      
    // Pour la soumission du formulaire de la CAGNOTTE
    const cagnotteForm = document.querySelector('.cagnotte-form');
    if (cagnotteForm) {
      cagnotteForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const statusMessage = this.nextElementSibling; // Le <p class="form-status-message">
        const submitButton = this.querySelector('button[type="submit"]');
        statusMessage.textContent = 'Envoi en cours...';
        if(submitButton) submitButton.disabled = true;

        try {
          const response = await fetch(webAppURL_API, { method: 'POST', body: new FormData(this) });
          if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
          const result = await response.json();
          if (result.status !== 'success') throw new Error(result.message || 'Erreur inconnue de l\'API');
            
          statusMessage.textContent = 'Merci pour votre généreuse contribution !';
          statusMessage.style.color = 'green';
          this.reset(); // Vide le formulaire de la cagnotte
        } catch (error) {
          console.error('Erreur lors de la soumission de la contribution :', error);
          statusMessage.textContent = `Erreur: ${error.message}. Veuillez réessayer.`;
          statusMessage.style.color = 'red';
        } finally {
          if(submitButton) submitButton.disabled = false;
        }
      });
    }
  }
  
  // Analyse le CSV de manière robuste
  function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 1) return []; // Gère le cas où le CSV est vide
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      if (!line.trim()) return null; // Gère les lignes vides à la fin
      const data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (data.length !== headers.length) { 
        console.warn('Ligne CSV malformée ignorée:', line);
        return null; 
      }
      return headers.reduce((obj, nextKey, index) => {
        const value = data[index] ? data[index].trim() : "";
        obj[nextKey.trim()] = value.replace(/^"|"$/g, ''); // Enlève les guillemets si présents
        return obj;
      }, {});
    }).filter(gift => gift && gift.ID && gift.ID.trim() !== ''); // Filtre les lignes nulles ou sans ID
  }

  // --- LANCEMENT INITIAL ---
  fetchAndDisplayGifts();
});
