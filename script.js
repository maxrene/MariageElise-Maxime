document.addEventListener('DOMContentLoaded', function() {
  // --- DÉBUT DES VARIABLES GLOBALES ---

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
      if (sectionId) {
        const sectionElement = document.querySelector(sectionId);
        if (sectionElement) { pageSections.push(sectionElement); }
      }
    });
  }

  let heroHeight = heroSection ? heroSection.offsetHeight : 0;
  let initialNavTop = mainNav ? mainNav.offsetTop : 0;

  // --- Variables pour le menu hamburger ---
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mainNavForMobile = document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.main-nav ul li a');

  // --- FIN DES VARIABLES GLOBALES ---

  // --- DÉBUT DES FONCTIONS PRINCIPALES ---

  function handleHeroTransition() {
    if (!heroSection) return;
    heroHeight = heroSection.offsetHeight;
    const scrollY = window.pageYOffset;
    const transitionZone = heroHeight * 0.7;
    let progress = transitionZone > 0
      ? Math.min(scrollY / transitionZone, 1)
      : (scrollY > 0 && heroHeight === 0 ? 1 : 0);

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
    if (!notreHistoireSection || !timelineContainer || !timelineLine || !timelineLineProgress) return;
    const scrollY = window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const sectionTop = notreHistoireSection.offsetTop;
    const sectionHeight = notreHistoireSection.offsetHeight;
    const lineHeight = timelineLine.offsetHeight;
    if (lineHeight === 0) return;
    let start = sectionTop - viewportHeight * 0.25;
    let end = sectionTop + sectionHeight - viewportHeight * 0.5;
    let progress = Math.max(0, scrollY - start);
    let total = Math.max(1, end - start);
    let percent = Math.min(1, progress / total);
    if (scrollY < start) percent = 0;
    if (scrollY > end && scrollY > sectionTop) percent = 1;
    timelineLineProgress.style.height = (percent * lineHeight) + 'px';
  }

  function startCountdown(targetDateString) {
    const d = document.getElementById('days');
    const h = document.getElementById('hours');
    const m = document.getElementById('minutes');
    const t = document.getElementById('countdown-timer');
    if (!d || !h || !m) {
      if (t) t.innerHTML = "<div class='countdown-finished'>Chargement...</div>";
      return;
    }
    const target = new Date(targetDateString).getTime();
    if (isNaN(target)) {
      if (t) t.innerHTML = "<div class='countdown-finished'>Date invalide.</div>";
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const dist = target - now;
      if (dist < 0) {
        clearInterval(interval);
        if (t) t.innerHTML = "<div class='countdown-finished'>Le grand jour est arrivé !</div>";
        return;
      }
      d.textContent = String(Math.floor(dist / (1000 * 60 * 60 * 24))).padStart(2, '0');
      h.textContent = String(Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
      m.textContent = String(Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    }, 1000);
  }

  function updateActiveNavLink() {
    let current = "";
    const offset = window.innerHeight * 0.4;
    pageSections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (window.pageYOffset >= top - offset && window.pageYOffset < top + height - offset) {
        current = "#" + section.getAttribute("id");
      }
    });
    if (pageSections.length > 0) {
      if (window.pageYOffset < pageSections[0].offsetTop - offset + pageSections[0].offsetHeight * 0.5) {
        current = "#" + pageSections[0].id;
      }
      if (window.pageYOffset + window.innerHeight >= document.body.scrollHeight - 50) {
        current = "#" + pageSections[pageSections.length -1].id;
      }
    }
    if (mainNavLinks) {
      mainNavLinks.forEach(link => {
        link.classList.toggle("active-nav-link", link.getAttribute("href") === current);
      });
    }
  }

  const observerCallback = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      // On dit à l'observateur d'ARRÊTER de surveiller cet élément
      observer.unobserve(entry.target); 
    }
    // On ne remet JAMAIS 'is-visible' à false.
  });
};
  const genericObserver = new IntersectionObserver(observerCallback, { threshold: 0.05 });
  if (contentSectionsToAnimate) {
    contentSectionsToAnimate.forEach(sec => {
      if (!sec.matches('#hero-section')) genericObserver.observe(sec);
    });
  }
  const timelineObserver = new IntersectionObserver(observerCallback, { rootMargin: '-30% 0px -30% 0px', threshold: 0.01 });
  if (timelineItems) {
    timelineItems.forEach(item => timelineObserver.observe(item));
  }

  // Fonction pour gérer la couleur de l'icône du hamburger
  function handleHamburgerIconColor() {
      if (mobileNavToggle && mainNav) {
          const isFixed = mainNav.classList.contains('fixed-nav');
          // Si le menu est ouvert, l'icône est toujours foncée (car sur fond clair)
          if (mobileNavToggle.classList.contains('is-open')) {
                mobileNavToggle.style.color = 'var(--text-color-headings)';
          }
          // Sinon, on adapte sa couleur au scroll (clair sur hero, foncé après)
          else if (isFixed) {
              mobileNavToggle.style.color = 'var(--text-color-headings)';
          } else {
              mobileNavToggle.style.color = 'var(--text-color-light)';
          }
      }
  }

  function onScrollOrResize() {
    handleHeroTransition();
    updateActiveNavLink();
    handleTimelineScrollAnimations();
    handleHamburgerIconColor(); // Ligne ajoutée
  }

  // --- DÉBUT DES ÉCOUTEURS D'ÉVÉNEMENTS INITIAUX ---

  window.addEventListener('scroll', onScrollOrResize);
  window.addEventListener('resize', () => {
    if (heroSection) heroHeight = heroSection.offsetHeight;
    if (mainNav) {
      mainNav.classList.remove('fixed-nav');
      initialNavTop = mainNav.offsetTop;
    }
    onScrollOrResize();
  });

  // --- DÉBUT DES APPELS DE FONCTIONS INITIAUX ---
  
  heroHeight = heroSection?.offsetHeight || 0;
  initialNavTop = mainNav?.offsetTop || 0;
  
  handleHeroTransition();
  updateActiveNavLink();
  handleTimelineScrollAnimations();
  handleHamburgerIconColor();
  startCountdown("2026-06-20T15:00:00");

  // --- LOGIQUE DU FORMULAIRE RSVP ---
  const rsvpForm = document.getElementById('rsvpForm');
  const guestCountSelect = document.getElementById('guestCount');
  const additionalGuestsSection = document.getElementById('additionalGuestsSection');
  const submitRsvpButton = document.getElementById('submitRsvpButton');
  const rsvpMessage = document.getElementById('rsvpMessage');
  const presenceRadios = document.querySelectorAll('input[name="Presence"]');
  const detailsContainer = document.getElementById('rsvp-details-container');
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4CMTsy3OIbsu_zQ6on_yLmqrXWavDggnbWTL6I768pTRoEQVQMlPuyOPaOsdBJW9B/exec';

  function showDetailsSection(show) {
    if (!detailsContainer) return;
    detailsContainer.style.display = show ? 'block' : 'none';
    const inputs = detailsContainer.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
      const originalRequired = el.dataset.originalRequired === 'true';
      if (show && originalRequired) {
        el.setAttribute('required', 'required');
      } else {
        if (el.dataset.originalRequired === undefined || !show) {
          el.dataset.originalRequired = el.hasAttribute('required').toString();
        }
        el.removeAttribute('required');
      }
    });
  }

  if (presenceRadios && presenceRadios.length > 0) {
    const initialPresence = document.querySelector('input[name="Presence"]:checked');
    if (initialPresence) {
      showDetailsSection(initialPresence.value === 'Oui');
    } else {
      showDetailsSection(false);
    }
    presenceRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        showDetailsSection(radio.value === 'Oui');
      });
    });
  }

  if (guestCountSelect) {
    guestCountSelect.addEventListener('change', () => {
      const count = parseInt(guestCountSelect.value) || 1;
      let fieldsHTML = '';
      // MODIFICATION : Le titre est maintenant généré pour chaque invité
      for (let i = 2; i <= count; i++) {
        fieldsHTML += `
        <div class="guest-block">
          <p class="guest-block-title">Invité ${i}</p>
          
          <div class="form-row">
            <div class="form-group half-width">
              <label for="PrenomInvite${i}">Prénom</label>
              <input type="text" id="PrenomInvite${i}" name="PrenomInvite${i}" placeholder="Prénom" required>
            </div>
            <div class="form-group half-width">
              <label for="NomInvite${i}">Nom</label>
              <input type="text" id="NomInvite${i}" name="NomInvite${i}" placeholder="Nom" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="AllergiesInvite${i}">Allergies invité ${i}</label>
            <select id="AllergiesInvite${i}" name="AllergiesInvite${i}" class="rsvp-select" required onchange="toggleCustomAllergy(${i})">
              <option value="Aucune">Aucune</option>
              <option value="Vegetarien">Végétarien</option>
              <option value="Sans gluten">Sans gluten</option>
              <option value="Arachides">Arachides</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div class="form-group" id="allergiesGuest${i}AutreContainer" style="display: none;">
            <label for="AllergiesInvite${i}Autre">Précisez</label>
            <input type="text" id="AllergiesInvite${i}Autre" name="AllergiesInvite${i}Autre" placeholder="Précisez l'allergie">
          </div>
        </div>
        `;
      }
      if (additionalGuestsSection) {
        additionalGuestsSection.innerHTML = fieldsHTML;
        additionalGuestsSection.style.display = count > 1 ? 'block' : 'none';
      }
    });
  }

  window.toggleCustomAllergy = function (i) {
    const select = document.querySelector(`[name='AllergiesInvite${i}']`);
    const container = document.getElementById(`allergiesGuest${i}AutreContainer`);
    const inputAutre = container ? container.querySelector('input') : null;
    if (select && container && inputAutre) {
      const isAutre = select.value === 'Autre';
      container.style.display = isAutre ? 'block' : 'none';
      if (isAutre) inputAutre.setAttribute('required', 'required');
      else { inputAutre.removeAttribute('required'); inputAutre.value = ''; }
    }
  }

  const allergiesSelectPrincipal = document.getElementById('allergiesSelect');
  const allergiesAutreContainerPrincipal = document.getElementById('allergiesAutreContainer');
  if (allergiesSelectPrincipal && allergiesAutreContainerPrincipal) {
    allergiesSelectPrincipal.addEventListener('change', function() {
      const inputAutrePrincipal = allergiesAutreContainerPrincipal.querySelector('input');
      const isAutre = this.value === 'Autre';
      allergiesAutreContainerPrincipal.style.display = isAutre ? 'block' : 'none';
      if (inputAutrePrincipal) {
        if (isAutre) inputAutrePrincipal.setAttribute('required', 'required');
        else { inputAutrePrincipal.removeAttribute('required'); inputAutrePrincipal.value = ''; }
      }
    });
    const inputAutrePrincipalInitial = allergiesAutreContainerPrincipal.querySelector('input');
    if (allergiesSelectPrincipal.value === 'Autre' && inputAutrePrincipalInitial) {
      allergiesAutreContainerPrincipal.style.display = 'block';
      inputAutrePrincipalInitial.setAttribute('required', 'required');
    } else if (inputAutrePrincipalInitial) {
      allergiesAutreContainerPrincipal.style.display = 'none';
      inputAutrePrincipalInitial.removeAttribute('required');
    }
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(rsvpForm);
      const presence = formData.get('Presence');
      const guestCountValue = formData.get('NombredePersonnes');
      const guestCount = guestCountValue ? parseInt(guestCountValue) : 1;

      if (presence === 'Oui') {
        if (formData.get('Allergies') === 'Autre') {
          formData.set('Allergies', formData.get('AllergiesAutre') || 'Autre non précisé');
        }
        formData.delete('AllergiesAutre');
        for (let i = 2; i <= guestCount; i++) {
          if (formData.get(`AllergiesInvite${i}`) === 'Autre') {
            formData.set(`AllergiesInvite${i}`, formData.get(`AllergiesInvite${i}Autre`) || 'Autre non précisé');
          }
          formData.delete(`AllergiesInvite${i}Autre`);
        }
      }
      const buttonText = submitRsvpButton ? submitRsvpButton.querySelector('.button-text') : null;
      const buttonLoader = submitRsvpButton ? submitRsvpButton.querySelector('.button-loader') : null;
      if (buttonText) buttonText.style.display = 'none';
      if (buttonLoader) buttonLoader.style.display = 'inline';
      if (submitRsvpButton) submitRsvpButton.disabled = true;

      fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => { throw new Error(errData.message || `Erreur HTTP ${res.status}`); })
              .catch(() => { throw new Error(`Erreur HTTP ${res.status} (${res.statusText || 'Status Text N/A'})`); });
          }
          return res.json();
        })
        .then(data => {
          if (rsvpMessage) {
            rsvpMessage.textContent = data.message || 'Merci pour votre réponse !';
            rsvpMessage.className = 'rsvp-form-message ' + (data.result === "success" ? "success" : "error");
            rsvpMessage.style.display = 'block';
          }
          if (data.result === 'success') {
            rsvpForm.reset();
            showDetailsSection(false);
            if (guestCountSelect) guestCountSelect.value = "1";
            if (additionalGuestsSection) { additionalGuestsSection.innerHTML = ''; additionalGuestsSection.style.display = 'none'; }
            if (allergiesSelectPrincipal) allergiesSelectPrincipal.value = "Aucune";
            if (allergiesAutreContainerPrincipal) allergiesAutreContainerPrincipal.style.display = 'none';
            if (allergiesAutreContainerPrincipal && allergiesAutreContainerPrincipal.querySelector('input')) {
              allergiesAutreContainerPrincipal.querySelector('input').value = '';
            }
            // --- AJOUT : Scroll vers le message de confirmation ---
            if (rsvpMessage) {
              rsvpMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        })
        .catch(err => {
          if (rsvpMessage) {
            rsvpMessage.textContent = err.message || 'Erreur lors de l’envoi. Veuillez réessayer.';
            rsvpMessage.className = 'rsvp-form-message error';
            rsvpMessage.style.display = 'block';
          }
          console.error("Fetch Error:", err);
        })
        .finally(() => {
          if (buttonText) buttonText.style.display = 'inline';
          if (buttonLoader) buttonLoader.style.display = 'none';
          if (submitRsvpButton) submitRsvpButton.disabled = false;
        });
    });
  }

  // --- LOGIQUE DE LA FAQ ---
  const faqNavLinks = document.querySelectorAll('.faq-nav-link');
  const faqCategoryContents = document.querySelectorAll('.faq-category-content');
  if (faqNavLinks && faqNavLinks.length > 0 && faqCategoryContents && faqCategoryContents.length > 0) {
    function showFaqCategory(targetId) {
      faqCategoryContents.forEach(content => { content.style.display = 'none'; content.classList.remove('active'); });
      faqNavLinks.forEach(navLink => { navLink.classList.remove('active'); });
      const targetContent = document.getElementById(targetId.substring(1));
      const currentNavLink = document.querySelector(`.faq-nav-link[href="${targetId}"]`);
      if (targetContent) { targetContent.style.display = 'block'; targetContent.classList.add('active'); }
      if (currentNavLink) currentNavLink.classList.add('active');
    }
    faqNavLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        const targetCategoryId = this.getAttribute('href');
        showFaqCategory(targetCategoryId);
      });
    });
    let initialCategory = '';
    if (window.location.hash && window.location.hash.startsWith('#faq-cat-')) {
      initialCategory = window.location.hash;
    } else {
      const activeNavLink = document.querySelector('.faq-nav-categories .faq-nav-link.active');
      if (activeNavLink) initialCategory = activeNavLink.getAttribute('href');
    }
    if (initialCategory) showFaqCategory(initialCategory);
    else if (faqNavLinks.length > 0) showFaqCategory(faqNavLinks[0].getAttribute('href'));
  }

  // --- LOGIQUE DES VIGNETTES SURFANTES (Corrigée) ---
  const vignetteContainer = document.getElementById('image-cursor-container');
  const vignetteMainNav = document.querySelector('.main-nav'); // Renommé pour éviter les conflits

  if (heroSection && vignetteContainer) {
    const imageData = [
      { src: 'images/cards/card0.jpg', year: '2017' },
      { src:  'images/cards/card1.jpg', year: '2017' },
      { src:  'images/cards/card2.jpg', year: '2017' },
      { src:  'images/cards/card3.jpg', year: '2018' },
      { src:  'images/cards/card4.jpg', year: '2018' },
      { src:  'images/cards/card5.jpg', year: '2018' },
      { src:  'images/cards/card6.jpg', year: '2018' },
      { src:  'images/cards/card7.jpg', year: '2019' },
      { src:  'images/cards/card8.jpg', year: '2020' },
      { src:  'images/cards/card9.jpg', year: '2021' },
      { src:  'images/cards/card10.jpg', year: '2021' },
      { src:  'images/cards/card11.jpg', year: '2021' },
      { src:  'images/cards/card12.jpg', year: '2021' },
      { src:  'images/cards/card13.jpg', year: '2021' },
      { src:  'images/cards/card14.jpg', year: '2021' },
      { src:  'images/cards/card15.jpg', year: '2022' },
      { src:  'images/cards/card16.jpg', year: '2022' },
      { src:  'images/cards/card17.jpg', year: '2022' },
      { src:  'images/cards/card18.jpg', year: '2022' },
      { src:  'images/cards/card19.jpg', year: '2022' },
      { src:  'images/cards/card20.jpg', year: '2022' },
      { src:  'images/cards/card21.jpg', year: '2022' },
      { src:  'images/cards/card22.jpg', year: '2022' },
      { src:  'images/cards/card23.jpg', year: '2022' },
      { src:  'images/cards/card24.jpg', year: '2023' },
      { src:  'images/cards/card25.jpg', year: '2023' },
      { src:  'images/cards/card26.jpg', year: '2023' },
      { src:  'images/cards/card27.jpg', year: '2023' },
      { src:  'images/cards/card28.jpg', year: '2023' },
      { src:  'images/cards/card29.jpg', year: '2023' },
      { src:  'images/cards/card30.jpg', year: '2023' },
      { src:  'images/cards/card31.jpg', year: '2023' },
      { src:  'images/cards/card32.jpg', year: '2023' },
      { src:  'images/cards/card33.jpg', year: '2023' },
      { src:  'images/cards/card34.jpg', year: '2023' },
      { src:  'images/cards/card35.jpg', year: '2023' },
      { src:  'images/cards/card36.jpg', year: '2023' },
      { src:  'images/cards/card37.jpg', year: '2024' },
      { src:  'images/cards/card38.jpg', year: '2024' },
      { src:  'images/cards/card39.jpg', year: '2024' },
      { src:  'images/cards/card40.jpg', year: '2024' },
      { src:  'images/cards/card41.jpg', year: '2024' },
      { src:  'images/cards/card42.jpg', year: '2024' },
      { src:  'images/cards/card43.jpg', year: '2024' },
      { src:  'images/cards/card44.jpg', year: '2024' },
      { src:  'images/cards/card45.jpg', year: '2024' },
      { src:  'images/cards/card46.jpg', year: '2025' },
      { src:  'images/cards/card47.jpg', year: '2025' },
      { src:  'images/cards/card48.jpg', year: '2025' },
      { src:  'images/cards/card49.jpg', year: '2025' },
    ];

    // --- MODIFICATION 1 : PRÉCHARGEMENT DES IMAGES ---
    // On lance le chargement immédiatement, même si le mot de passe n'est pas encore entré.
    // Le navigateur mettra les images en cache.
    imageData.forEach(data => {
        const imgPreload = new Image();
        imgPreload.src = data.src;
    });

    
    const totalImages = imageData.length;
    let currentIndex = 0;

    const OFFSET_X           = 300;
    const OFFSET_Y           = -30;
    const SPATIAL_INTERVAL   = 120;
    const FRICTION_GLOBAL    = 0.85;
    const FRICTION_DRIFT     = 0.90;
    const MIN_SPEED_GLOBAL   = 0.2;
    const MIN_SPEED_DRIFT    = 0.7;
    const MAX_INITIAL_SPEED  = 14;
    const HORIZ_DAMPEN       = 0.7;
    const DISPLAY_TIME       = 2000;
    const FADE_DURATION      = 500;
    const FALL_DISTANCE      = 200;
    const MAX_ONSCREEN       = 4;

    let lastMouseX = 0, lastMouseY = 0;
    let lastTime = performance.now();
    let accumulatedDistance = 0;
    let isFirstMove = true;
    let globalVX = 0, globalVY = 0;

    function animateVignette(wrapper, initVX, initVY) {
      let currX = 0, currY = 0;
      let vx = initVX, vy = initVY;

      function drift() {
        currX += vx; currY += vy;
        wrapper.style.transform = `translate(${currX}px, ${currY}px)`;
        vx *= FRICTION_DRIFT; vy *= FRICTION_DRIFT;
        if (Math.hypot(vx, vy) > MIN_SPEED_DRIFT) {
          requestAnimationFrame(drift);
        } else {
          setTimeout(() => {
            wrapper.style.transition = `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`;
            wrapper.style.transform = `translate(${currX}px, ${currY + FALL_DISTANCE}px)`;
            wrapper.style.opacity   = '0';
            setTimeout(() => { wrapper.remove(); }, FADE_DURATION);
          }, DISPLAY_TIME);
        }
      }
      requestAnimationFrame(drift);
    }

    function dropVignetteAt(x, y) {
      const existing = vignetteContainer.querySelectorAll('.vignette-wrapper');
      if (existing.length >= MAX_ONSCREEN) {
        existing[0].remove();
      }
      currentIndex = (currentIndex + 1) % totalImages;
      const { src, year } = imageData[currentIndex];
      const wrapper = document.createElement('div');
      wrapper.className = 'vignette-wrapper';
      wrapper.style.left = `${x + OFFSET_X}px`;
      wrapper.style.top  = `${y + OFFSET_Y}px`;
      wrapper.style.opacity = '1';
      wrapper.style.transition = '';
      const img = document.createElement('img');
      img.src = src; img.className = 'vignette-img';
      wrapper.appendChild(img);
      const label = document.createElement('span');
      label.className = 'vignette-year';
      label.textContent = year;
      wrapper.appendChild(label);
      if (vignetteContainer.style.display !== 'block') {
        vignetteContainer.style.display = 'block';
      }
      vignetteContainer.appendChild(wrapper);
      const norm = Math.hypot(globalVX, globalVY);
      const capped = Math.min(norm, MAX_INITIAL_SPEED);
      let dirX = 0, dirY = 0;
      if (norm > 0) { dirX = globalVX / norm; dirY = globalVY / norm; }
      const vx = dirX * capped * HORIZ_DAMPEN;
      const vy = dirY * capped;
      animateVignette(wrapper, vx, vy);
    }

    // --- ICI LA LOGIQUE CORRIGÉE ---
    // 1. Définir la fonction qui gère le mouvement de la souris
    function handleVignetteMouseMove(e) {
      if (vignetteMainNav) {
        const rect = vignetteMainNav.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          return;
        }
      }
      const now = performance.now();
      const mouseX = e.clientX, mouseY = e.clientY;
      if (isFirstMove) {
        lastMouseX = mouseX; lastMouseY = mouseY;
        lastTime = now; isFirstMove = false; return;
      }
      const dx = mouseX - lastMouseX, dy = mouseY - lastMouseY;
      const dist = Math.hypot(dx, dy);
      const dtMs = now - lastTime;
      const newGlobalVX = (dx / (dtMs || 1)) * (1000 / 60);
      const newGlobalVY = (dy / (dtMs || 1)) * (1000 / 60);
      globalVX = globalVX * FRICTION_GLOBAL + newGlobalVX * (1 - FRICTION_GLOBAL);
      globalVY = globalVY * FRICTION_GLOBAL + newGlobalVY * (1 - FRICTION_GLOBAL);
      if (Math.hypot(globalVX, globalVY) < MIN_SPEED_GLOBAL) {
        globalVX = 0; globalVY = 0;
      }
      lastMouseX = mouseX; lastMouseY = mouseY; lastTime = now;
      if (vignetteContainer.style.display !== 'block') {
        vignetteContainer.style.display = 'block';
      }
      let remaining = dist;
      let startX = mouseX - dx, startY = mouseY - dy;
      while (accumulatedDistance + remaining >= SPATIAL_INTERVAL) {
        const needed = SPATIAL_INTERVAL - accumulatedDistance;
        const dropX = startX + (dx / dist) * needed;
        const dropY = startY + (dy / dist) * needed;
        dropVignetteAt(dropX, dropY);
        remaining -= needed;
        accumulatedDistance = 0;
        startX += (dx / dist) * needed;
        startY += (dy / dist) * needed;
      }
      accumulatedDistance += remaining;
    }

    // 2. Créer l'observateur pour le hero
    const heroObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        // Quand le hero est visible, on active l'écouteur
        isFirstMove = true; // Réinitialiser au cas où
        document.addEventListener('mousemove', handleVignetteMouseMove);
      } else {
        // Quand le hero n'est pas visible, on désactive l'écouteur
        document.removeEventListener('mousemove', handleVignetteMouseMove);
        vignetteContainer.style.display = 'none';
        vignetteContainer.querySelectorAll('.vignette-wrapper').forEach(el => el.remove());
      }
    }, {
      threshold: 0.01,
      rootMargin: "-150px 0px 0px 0px"
    });

    // 3. Lancer l'observation
    heroObserver.observe(heroSection);
  }

  // --- LOGIQUE DU MENU HAMBURGER (Placée au bon endroit) ---
  if (mobileNavToggle && mainNavForMobile) {
      
      // 1. Gérer l'ouverture/fermeture au clic sur l'icône
      mobileNavToggle.addEventListener('click', () => {
          mainNavForMobile.classList.toggle('is-open');
          
          // Changer l'icône (bars <-> times)
          const icon = mobileNavToggle.querySelector('i');
          if (mainNavForMobile.classList.contains('is-open')) {
              icon.classList.remove('fa-bars');
              icon.classList.add('fa-times');
              mobileNavToggle.classList.add('is-open');
          } else {
              icon.classList.remove('fa-times');
              icon.classList.add('fa-bars');
              mobileNavToggle.classList.remove('is-open');
          }
          handleHamburgerIconColor(); // Mettre à jour la couleur de l'icône
      });

      // 2. Fermer le menu automatiquement quand on clique sur un lien
      navLinks.forEach(link => {
          link.addEventListener('click', () => {
              if (mainNavForMobile.classList.contains('is-open')) {
                  mainNavForMobile.classList.remove('is-open');
                  const icon = mobileNavToggle.querySelector('i');
                  icon.classList.remove('fa-times');
                  icon.classList.add('fa-bars');
                  mobileNavToggle.classList.remove('is-open');
                  handleHamburgerIconColor(); // Mettre à jour la couleur
              }
          });
      });
  }

  // --- LOGIQUE pour le Popup de Mot de Passe ---
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('password-input');
  const passwordSubmit = document.getElementById('password-submit');
  const mainContent = document.getElementById('main-content');
  const passwordError = document.getElementById('password-error');

  function showSiteContent() {
    if (passwordModal) passwordModal.style.display = 'none';
    if (mainContent) {
      mainContent.style.display = 'block';
      mainContent.style.opacity = '1';
    }
  }

  function showPasswordPopup() {
    if (passwordModal) passwordModal.style.display = 'flex';
     if (mainContent) {
      mainContent.style.display = 'none';
      mainContent.style.opacity = '0';
    }
  }

  function checkPassword() {
    // Le mot de passe est sensible à la casse. "Dublin" est correct.
    if (passwordInput && passwordInput.value === 'Dublin') {
      sessionStorage.setItem('isVerified', 'true');
      showSiteContent();
    } else {
      if (passwordError) {
        passwordError.style.display = 'block';
      }
      if (passwordInput) {
        passwordInput.classList.add('error');
      }
    }
  }

  // Au chargement de la page, on vérifie si l'utilisateur est déjà passé
  if (sessionStorage.getItem('isVerified') === 'true') {
    showSiteContent();
  } else {
    showPasswordPopup();
  }

  // Écouteur pour le clic sur le bouton
  if (passwordSubmit) {
    passwordSubmit.addEventListener('click', checkPassword);
  }

  // Écouteur pour la touche "Entrée" dans le champ
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault(); // Empêche le rechargement/soumission de formulaire
        checkPassword();
      }
    });
    // Cache le message d'erreur dès que l'utilisateur commence à corriger
    passwordInput.addEventListener('input', function() {
        if (passwordError && passwordError.style.display === 'block') {
            passwordError.style.display = 'none';
            passwordInput.classList.remove('error');
        }
    });
  }
// --- MODIFICATION 3 : LOGIQUE TOGGLE PASSWORD ---
  const togglePassword = document.getElementById('toggle-password');
  if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', function () {
          // Basculer le type
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          
          // Basculer l'icône
          this.classList.toggle('fa-eye');
          this.classList.toggle('fa-eye-slash');
      });
    }

  // --- LOGIQUE PHOTO TEAM (X, Y, ZOOM) ---
  function applyTeamPhotoSettings() {
      const images = document.querySelectorAll('.team-member-photo img');
      images.forEach(img => {
          const x = img.getAttribute('data-x') || 50;
          const y = img.getAttribute('data-y') || 50;
          const zoom = img.getAttribute('data-zoom') || 1;

          img.style.objectPosition = `${x}% ${y}%`;
          img.style.transform = `scale(${zoom})`;
      });
  }
  applyTeamPhotoSettings();

}); // --- FIN DU DOMCONTENTLOADED ---

  // --- QUIZ LOGIC ---
  const QUIZ_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4CMTsy3OIbsu_zQ6on_yLmqrXWavDggnbWTL6I768pTRoEQVQMlPuyOPaOsdBJW9B/exec';
  const quizQuestions = [
      {
          question: "Quelle est la destination de leur voyage de noces ?",
          options: ["Japon", "Tanzanie", "Pérou", "Nouvelle-Zélande"],
          answer: 1 // Index of the correct answer (Tanzanie)
      },
      {
          question: "En quelle année se sont-ils rencontrés ?",
          options: ["2016", "2017", "2018", "2019"],
          answer: 1 // 2017
      },
      {
          question: "Où a eu lieu la demande en mariage ?",
          options: ["Sur une plage", "Au sommet d'une montagne", "Dans le désert", "Sous l'eau"],
          answer: 2 // Dans le désert
      },
      {
          question: "Quel est le nom de leur chat (imaginaire ou réel) ?",
          options: ["Guinness", "Cheddar", "Mallow", "Ils n'ont pas de chat"],
          answer: 3 // Ils n'ont pas de chat
      },
      {
          question: "Quelle est leur ville de cœur (après Paris) ?",
          options: ["Londres", "Dublin", "New York", "Bordeaux"],
          answer: 1 // Dublin
      },
      {
          question: "Qui est le meilleur cuisinier ?",
          options: ["Elise", "Maxime", "C'est 50/50", "Uber Eats"],
          answer: 1 // Elise (Assumption!)
      },
      {
          question: "Quel est leur péché mignon commun ?",
          options: ["Le chocolat", "Le fromage", "Les voyages", "Le vin"],
          answer: 2 // Les voyages
      },
      {
          question: "Combien d'années ont-ils vécu à l'étranger ensemble ?",
          options: ["1 an", "2 ans", "3 ans", "4 ans"],
          answer: 1 // 2 ans (Dublin)
      },
      {
          question: "Quel sport Maxime pratique-t-il ?",
          options: ["Tennis", "Football", "Rugby", "Course à pied"],
          answer: 0 // Tennis
      },
      {
          question: "Quelle est la date exacte du mariage ?",
          options: ["10 Mai 2026", "20 Juin 2026", "15 Juillet 2026", "20 Juin 2025"],
          answer: 1 // 20 Juin 2026
      }
  ];

  let currentQuestionIndex = 0;
  let quizScore = 0;
  let quizPlayerName = "";
  let userAnswers = new Array(quizQuestions.length).fill(null);

  const quizContainer = document.getElementById('quiz-container');
  const startScreen = document.getElementById('quiz-start-screen');
  const questionScreen = document.getElementById('quiz-question-screen');
  const resultScreen = document.getElementById('quiz-result-screen');
  const startBtn = document.getElementById('start-quiz-btn');
  const nameInput = document.getElementById('quiz-player-name');
  const questionText = document.getElementById('quiz-question-text');
  const optionsGrid = document.getElementById('quiz-options-grid');
  const progressText = document.getElementById('quiz-progress-text');
  const progressFill = document.getElementById('quiz-progress-fill');
  const prevBtn = document.getElementById('quiz-prev-btn');
  const finalScoreEl = document.getElementById('quiz-final-score');
  const resultMessage = document.getElementById('quiz-result-message');

  if (quizContainer) {
      startBtn.addEventListener('click', startQuiz);
      prevBtn.addEventListener('click', prevQuestion);
  }

  function startQuiz() {
      const name = nameInput.value.trim();
      if (!name) {
          nameInput.style.borderColor = "red";
          return;
      }
      quizPlayerName = name;
      currentQuestionIndex = 0;
      quizScore = 0;
      userAnswers.fill(null);

      startScreen.style.display = 'none';
      questionScreen.style.display = 'block';
      loadQuestion();
  }

  function loadQuestion() {
      const q = quizQuestions[currentQuestionIndex];
      questionText.textContent = q.question;
      progressText.textContent = `Question ${currentQuestionIndex + 1}/${quizQuestions.length}`;
      progressFill.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;

      optionsGrid.innerHTML = '';
      q.options.forEach((opt, index) => {
          const btn = document.createElement('button');
          btn.className = 'quiz-option-btn';
          btn.textContent = opt;
          btn.onclick = () => selectOption(index);
          optionsGrid.appendChild(btn);
      });

      if (currentQuestionIndex === 0) {
          prevBtn.style.visibility = 'hidden';
      } else {
          prevBtn.style.visibility = 'visible';
      }
  }

  function selectOption(selectedIndex) {
      userAnswers[currentQuestionIndex] = selectedIndex;

      if (currentQuestionIndex < quizQuestions.length - 1) {
          currentQuestionIndex++;
          // Petit délai pour l'effet visuel si besoin, ici instantané comme demandé
          loadQuestion();
      } else {
          finishQuiz();
      }
  }

  function prevQuestion() {
      if (currentQuestionIndex > 0) {
          currentQuestionIndex--;
          loadQuestion();
      }
  }

  function finishQuiz() {
      // Calculate Score
      quizScore = 0;
      userAnswers.forEach((ans, idx) => {
          if (ans === quizQuestions[idx].answer) {
              quizScore++;
          }
      });

      questionScreen.style.display = 'none';
      resultScreen.style.display = 'block';

      // Animation du score
      let currentDisplayScore = 0;
      const scoreInterval = setInterval(() => {
          finalScoreEl.textContent = currentDisplayScore;
          if (currentDisplayScore >= quizScore) {
              clearInterval(scoreInterval);
              triggerConfetti();
          } else {
              currentDisplayScore++;
          }
      }, 100);

      // Message personnalisé
      if (quizScore === 10) resultMessage.textContent = "Incroyable ! Vous savez tout !";
      else if (quizScore >= 7) resultMessage.textContent = "Bravo ! Très belle performance !";
      else if (quizScore >= 4) resultMessage.textContent = "Pas mal, mais peut mieux faire !";
      else resultMessage.textContent = "Oups... Il va falloir réviser !";

      sendQuizResult();
  }

  function sendQuizResult() {
    const payload = {
        type: 'quiz_result',
        name: quizPlayerName,
        score: quizScore,
        timestamp: new Date().toISOString()
    };

    // On envoie en 'text/plain' pour contourner les blocages CORS
    fetch(QUIZ_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log("Résultat du quiz envoyé avec succès !");
    })
    .catch(err => {
        console.error("Erreur lors de l'envoi du quiz", err);
    });
}

  // Confetti Effect (Simple Canvas Implementation)
  function triggerConfetti() {
      const canvasContainer = document.getElementById('confetti-canvas-container');
      if (!canvasContainer) return;

      const canvas = document.createElement('canvas');
      canvasContainer.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      canvas.width = canvasContainer.offsetWidth;
      canvas.height = canvasContainer.offsetHeight;

      const particles = [];
      const colors = ['#f2d74e', '#95c3de', '#ff9a9e', '#a18cd1', '#fbc2eb'];

      for (let i = 0; i < 100; i++) {
          particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height - canvas.height,
              r: Math.random() * 6 + 2,
              d: Math.random() * 10 + 10,
              color: colors[Math.floor(Math.random() * colors.length)],
              tilt: Math.floor(Math.random() * 10) - 10,
              tiltAngleIncremental: Math.random() * 0.07 + 0.05,
              tiltAngle: 0
          });
      }

      let animationId;
      function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          let finished = true;

          particles.forEach(p => {
              p.tiltAngle += p.tiltAngleIncremental;
              p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
              p.x += Math.sin(p.d);
              p.tilt = Math.sin(p.tiltAngle) * 15;

              if (p.y < canvas.height) finished = false;

              ctx.beginPath();
              ctx.lineWidth = p.r;
              ctx.strokeStyle = p.color;
              ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
              ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
              ctx.stroke();
          });

          if (!finished) {
              animationId = requestAnimationFrame(draw);
          } else {
             // Cleanup
             canvas.remove();
          }
      }
      draw();
  }
