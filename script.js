document.addEventListener('DOMContentLoaded', function() {
  // --- VARIABLES GLOBALES (Hero, Nav, Histoire) ---
  const heroSection = document.getElementById('hero-section');
  const heroBackground = heroSection ? heroSection.querySelector('.hero-background') : null;
  const heroContent = heroSection ? heroSection.querySelector('.hero-content') : null;
  const mainNav = document.querySelector('.main-nav');
  const scrollDownIndicator = heroSection ? heroSection.querySelector('.scroll-down-indicator') : null;
  const notreHistoireSection = document.getElementById('notre-histoire-section');
  const timelineContainer = document.querySelector('.timeline-container');
  const timelineLine = document.querySelector('.timeline-line');
  const timelineLineProgress = document.querySelector('.timeline-line-progress');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const contentSectionsToAnimate = document.querySelectorAll('.content-section');
  const mainNavLinks = document.querySelectorAll(".main-nav a");
  let pageSections = [];
  
  if (mainNavLinks) {
    mainNavLinks.forEach(link => {
      const sectionId = link.getAttribute("href");
      if (sectionId && sectionId.startsWith('#')) {
        const sectionElement = document.querySelector(sectionId);
        if (sectionElement) { pageSections.push(sectionElement); }
      }
    });
  }

  let heroHeight = heroSection ? heroSection.offsetHeight : 0;
  let initialNavTop = mainNav ? mainNav.offsetTop : 0;
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mainNavForMobile = document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.main-nav ul li a');

  // --- FONCTIONS D'ANIMATION ET UI ---
  function handleHeroTransition() {
    if (!heroSection) return;
    heroHeight = heroSection.offsetHeight;
    const scrollY = window.pageYOffset;
    const transitionZone = heroHeight * 0.7;
    let progress = transitionZone > 0 ? Math.min(scrollY / transitionZone, 1) : (scrollY > 0 ? 1 : 0);

    if (heroContent) {
      heroContent.style.opacity = Math.max(0, 1 - progress * 1.5).toFixed(2);
      heroContent.style.transform = `translateY(${-progress * 100}px)`;
    }
    if (scrollDownIndicator) {
      scrollDownIndicator.style.opacity = Math.max(0, 1 - progress * 3).toFixed(2);
    }
    if (heroBackground) {
      heroBackground.style.transform = `scale(${1 + progress * 0.1})`;
      heroBackground.style.opacity = Math.max(0.3, 1 - progress * 0.7).toFixed(2);
    }
    if (mainNav) {
      const navStickThreshold = initialNavTop > 15 ? initialNavTop - 15 : 10;
      mainNav.classList.toggle('fixed-nav', scrollY > navStickThreshold);
    }
  }

  function handleTimelineScrollAnimations() {
    if (!notreHistoireSection || !timelineLineProgress) return;
    const scrollY = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const sectionTop = notreHistoireSection.offsetTop;
    const sectionHeight = notreHistoireSection.offsetHeight;
    const lineHeight = timelineLine.offsetHeight;
    let start = sectionTop - viewportHeight * 0.25;
    let end = sectionTop + sectionHeight - viewportHeight * 0.5;
    let percent = Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
    timelineLineProgress.style.height = (percent * lineHeight) + 'px';
  }

  function updateActiveNavLink() {
    let current = "";
    const offset = window.innerHeight * 0.4;
    pageSections.forEach(section => {
      if (window.pageYOffset >= section.offsetTop - offset) {
        current = "#" + section.getAttribute("id");
      }
    });
    mainNavLinks.forEach(link => {
      link.classList.toggle("active-nav-link", link.getAttribute("href") === current);
    });
  }

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  };

  const genericObserver = new IntersectionObserver(observerCallback, { threshold: 0.05 });
  contentSectionsToAnimate.forEach(sec => {
    if (sec.id !== 'hero-section') genericObserver.observe(sec);
  });

  function onScrollOrResize() {
    handleHeroTransition();
    updateActiveNavLink();
    handleTimelineScrollAnimations();
    handleHamburgerIconColor();
  }

  window.addEventListener('scroll', onScrollOrResize);
  window.addEventListener('resize', onScrollOrResize);

  // --- LOGIQUE DU FORMULAIRE RSVP (AMÉLIORÉE) ---
  const rsvpForm = document.getElementById('rsvpForm');
  const guestCountSelect = document.getElementById('guestCount');
  const additionalGuestsSection = document.getElementById('additionalGuestsSection');
  const submitRsvpButton = document.getElementById('submitRsvpButton');
  const rsvpMessage = document.getElementById('rsvpMessage');
  const presenceRadios = document.querySelectorAll('input[name="Presence"]');
  const detailsContainer = document.getElementById('rsvp-details-container');
  // URL de votre AppScript mise à jour
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTA9h3QEZYCQgvbTR_Qe2y6yaJVIHgdw0RlbGfP7BNNImdWKN6G3hRq4uPUXxES8Xg/exec';

  function showDetailsSection(show) {
    if (!detailsContainer) return;
    detailsContainer.style.display = show ? 'block' : 'none';
  }

  // Toggle affichage détails selon présence Samedi
  presenceRadios.forEach(radio => {
    radio.addEventListener('change', () => showDetailsSection(radio.value === 'Oui'));
  });

  // Gestion dynamique des invités supplémentaires
  if (guestCountSelect) {
    guestCountSelect.addEventListener('change', () => {
      const count = parseInt(guestCountSelect.value) || 1;
      let fieldsHTML = '';
      for (let i = 2; i <= count; i++) {
        fieldsHTML += `
          <div class="guest-block">
            <p class="guest-block-title">Invité ${i}</p>
            <div class="form-row">
              <div class="form-group half-width">
                <label for="PrenomInvite${i}">Prénom</label>
                <input type="text" id="PrenomInvite${i}" name="PrenomInvite${i}" required>
              </div>
              <div class="form-group half-width">
                <label for="NomInvite${i}">Nom</label>
                <input type="text" id="NomInvite${i}" name="NomInvite${i}" required>
              </div>
            </div>
            <div class="form-group">
              <label for="AllergiesInvite${i}">Allergies invité ${i}</label>
              <select id="AllergiesInvite${i}" name="AllergiesInvite${i}" required onchange="toggleCustomAllergy(${i})">
                <option value="Aucune">Aucune</option>
                <option value="Vegetarien">Végétarien</option>
                <option value="Sans gluten">Sans gluten</option>
                <option value="Arachides">Arachides</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div class="form-group" id="allergiesGuest${i}AutreContainer" style="display: none;">
              <input type="text" name="AllergiesInvite${i}Autre" placeholder="Précisez l'allergie">
            </div>
          </div>`;
      }
      additionalGuestsSection.innerHTML = fieldsHTML;
      additionalGuestsSection.style.display = count > 1 ? 'block' : 'none';
    });
  }

  // Soumission du formulaire
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(rsvpForm);
      const guestCount = parseInt(formData.get('NombredePersonnes')) || 1;

      // Traitement des allergies "Autre" avant envoi
      if (formData.get('Allergies') === 'Autre') {
        formData.set('Allergies', formData.get('AllergiesAutre') || 'Autre');
      }
      for (let i = 2; i <= guestCount; i++) {
        if (formData.get(`AllergiesInvite${i}`) === 'Autre') {
          formData.set(`AllergiesInvite${i}`, formData.get(`AllergiesInvite${i}Autre`) || 'Autre');
        }
      }

      // UI Loading
      const btnText = submitRsvpButton.querySelector('.button-text');
      const btnLoader = submitRsvpButton.querySelector('.button-loader');
      if (btnText) btnText.style.display = 'none';
      if (btnLoader) btnLoader.style.display = 'inline';
      submitRsvpButton.disabled = true;

      fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (rsvpMessage) {
            rsvpMessage.textContent = data.message;
            rsvpMessage.className = 'rsvp-form-message ' + (data.result === "success" ? "success" : "error");
            rsvpMessage.style.display = 'block';
            rsvpMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (data.result === 'success') {
            rsvpForm.reset();
            showDetailsSection(false);
            if (additionalGuestsSection) additionalGuestsSection.innerHTML = '';
          }
        })
        .catch(err => {
          rsvpMessage.textContent = "Erreur de connexion. Veuillez réessayer.";
          rsvpMessage.style.display = 'block';
        })
        .finally(() => {
          if (btnText) btnText.style.display = 'inline';
          if (btnLoader) btnLoader.style.display = 'none';
          submitRsvpButton.disabled = false;
        });
    });
  }

  // --- RESTE DU SCRIPT (Vignettes, Password, Quiz, Countdown) ---
  // [Garder votre code pour startCountdown, handleHamburgerIconColor, vignettes, quiz, etc.]
  startCountdown("2026-06-20T15:00:00");
});
