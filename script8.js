document.addEventListener('DOMContentLoaded', function() {
  // --- DÉBUT DU CODE D’ANCIENNE PAGE (Hero Transition, Timeline, Countdown, FAQ, RSVP, etc.) ---

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
    let start = sectionTop - viewportHeight * 0.75;
    let end = sectionTop + sectionHeight - viewportHeight * 0.25;
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

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
      else if (!entry.target.matches('#hero-section')) entry.target.classList.remove('is-visible');
    });
  };
  const genericObserver = new IntersectionObserver(observerCallback, { threshold: 0.15 });
  if (contentSectionsToAnimate) {
    contentSectionsToAnimate.forEach(sec => {
      if (!sec.matches('#hero-section')) genericObserver.observe(sec);
    });
  }
  const timelineObserver = new IntersectionObserver(observerCallback, { rootMargin: '-30% 0px -30% 0px', threshold: 0.01 });
  if (timelineItems) {
    timelineItems.forEach(item => timelineObserver.observe(item));
  }

  function onScrollOrResize() {
    handleHeroTransition();
    updateActiveNavLink();
    handleTimelineScrollAnimations();
  }

  window.addEventListener('scroll', onScrollOrResize);
  window.addEventListener('resize', () => {
    if (heroSection) heroHeight = heroSection.offsetHeight;
    if (mainNav) {
      mainNav.classList.remove('fixed-nav');
      initialNavTop = mainNav.offsetTop;
    }
    onScrollOrResize();
  });

  heroHeight = heroSection?.offsetHeight || 0;
  initialNavTop = mainNav?.offsetTop || 0;
  handleHeroTransition();
  updateActiveNavLink();
  handleTimelineScrollAnimations();
  startCountdown("2026-06-20T15:00:00");

  const rsvpForm = document.getElementById('rsvpForm');
  const guestCountSelect = document.getElementById('guestCount');
  const additionalGuestsSection = document.getElementById('additionalGuestsSection');
  const submitRsvpButton = document.getElementById('submitRsvpButton');
  const rsvpMessage = document.getElementById('rsvpMessage');
  const presenceRadios = document.querySelectorAll('input[name="Presence"]');
  const detailsContainer = document.getElementById('rsvp-details-container');
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6oT1lBUfcjtKmSCYYAwAmvvVPfLYeC0ayP52gQUU1bukbgj4CnvuV39p0-ce49wsS/exec';

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
      if (count > 1) {
        fieldsHTML += '<p class="form-label">Noms et prénoms des personnes supplémentaires :</p>';
      }
      for (let i = 2; i <= count; i++) {
        fieldsHTML += `
        <div class="form-row guest-block">
          <div class="form-group third-width">
            <label for="PrenomInvite${i}">Prénom invité ${i}</label>
            <input type="text" id="PrenomInvite${i}" name="PrenomInvite${i}" placeholder="Prénom" required>
          </div>
          <div class="form-group third-width">
            <label for="NomInvite${i}">Nom invité ${i}</label>
            <input type="text" id="NomInvite${i}" name="NomInvite${i}" placeholder="Nom" required>
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
        </div>`;
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

  const styleElement = document.createElement('style');
  if (styleElement) {
    styleElement.textContent = `
      /* Votre ancien code d’injection de styles dynamiques, s’il y en avait… */
    `;
    document.head.appendChild(styleElement);
  }
  // --- FIN DU CODE D’ANCIENNE PAGE ---

  // ─── 2) CODE “V3 – VIGNETTES SURFANTES” (Inertie de groupe + texte année) ───

  // 2.0) Sélecteur du menu, pour savoir si la souris est dessus
  const mainNavElement = document.querySelector('.main-nav');

  // Sélecteurs pour la V3
  const container = document.getElementById('image-cursor-container');

  if (!heroSection || !container) {
    console.error("❌ #hero-section ou #image-cursor-container introuvable");
    return;
  }

  // 2.1) Liste des images + année associée (à adapter à vos fichiers)
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
  const totalImages = imageData.length;
  let currentIndex = 0;

  // 2.2) Constantes V3 (inertie de groupe + espacement régulier)
  const OFFSET_X           = 300;     // px : décalage horizontal pour que la vignette n’apparaisse pas sous la souris
  const OFFSET_Y           = -30;    // px : décalage vertical (au-dessus de la souris)
  const SPATIAL_INTERVAL   = 120;    // px : distance le long du chemin entre deux vignettes
  const FRICTION_GLOBAL    = 0.85;   // friction pour le lissage de la vitesse “groupe”
  const FRICTION_DRIFT     = 0.90;   // friction du drift pour chaque vignette
  const MIN_SPEED_GLOBAL   = 0.2;    // si vitesse globale < 0.2 px/frame, on considère qu’elle est nulle
  const MIN_SPEED_DRIFT    = 0.7;    // si vitesse du drift (vignette) < 0.7 px/frame, on arrête le drift
  const MAX_INITIAL_SPEED  = 14;     // px/frame max pour la vitesse initiale de chaque vignette
  const HORIZ_DAMPEN       = 0.7;    // pour atténuer la composante X du drift
  const DISPLAY_TIME       = 500;    // ms que la vignette reste immobile avant fade-out
  const FADE_DURATION      = 500;    // ms pour le fade-out + chute verticale
  const FALL_DISTANCE      = 200;    // px que la vignette descend au moment du fade-out
  const MAX_ONSCREEN       = 6;      // nombre max de vignettes affichées en même temps

  // 2.3) Variables de suivi
  let lastMouseX           = 0;
  let lastMouseY           = 0;
  let lastTime             = performance.now();
  let accumulatedDistance  = 0;      // distance restante à parcourir avant de créer une nouvelle vignette
  let isFirstMove          = true;   // pour initialiser lastMouseX et lastMouseY
  let isHeroVisible        = false;  // pour savoir si on est dans la zone du hero

  // Vitesse globale lissée
  let globalVX = 0;
  let globalVY = 0;

  // 2.4) IntersectionObserver pour activer/désactiver les vignettes selon qu’on soit dans #hero-section
  const heroObserver = new IntersectionObserver(entries => {
    const e = entries[0];
    if (e.isIntersecting) {
      isHeroVisible = true;
    } else {
      isHeroVisible = false;
      container.style.display = 'none';
      // Supprime toutes les vignettes restantes
      container.querySelectorAll('.vignette-wrapper').forEach(el => el.remove());
    }
  }, {
    threshold: 0.01,
    rootMargin: "-150px 0px 0px 0px"
  });
  heroObserver.observe(heroSection);

  // 2.5) Fonction d’animation du drift + fade-out vertical pour chaque wrapper
  function animateVignette(wrapper, initVX, initVY) {
    let currX = 0;
    let currY = 0;
    let vx = initVX;
    let vy = initVY;

    function drift() {
      currX += vx;
      currY += vy;
      wrapper.style.transform = `translate(${currX}px, ${currY}px)`;

      vx *= FRICTION_DRIFT;
      vy *= FRICTION_DRIFT;

      if (Math.hypot(vx, vy) > MIN_SPEED_DRIFT) {
        requestAnimationFrame(drift);
      } else {
        // Quand le drift est trop lent → après DISPLAY_TIME, fade-out vertical
        setTimeout(() => {
          wrapper.style.transition = `
            opacity ${FADE_DURATION}ms ease,
            transform ${FADE_DURATION}ms ease
          `;
          // Fade-out uniquement vertical, on garde X fixe
          wrapper.style.transform = `translate(${currX}px, ${currY + FALL_DISTANCE}px)`;
          wrapper.style.opacity   = '0';
          setTimeout(() => {
            wrapper.remove();
          }, FADE_DURATION);
        }, DISPLAY_TIME);
      }
    }
    requestAnimationFrame(drift);
  }

  // 2.6) Créer une vignette à un point (x, y), incluant le texte de l’année
  function dropVignetteAt(x, y) {
    // 2.6.a) Si déjà trop de vignettes à l’écran, on supprime la plus ancienne
    const existing = container.querySelectorAll('.vignette-wrapper');
    if (existing.length >= MAX_ONSCREEN) {
      existing[0].remove();
    }

    // 2.6.b) Choix cyclique de l’image + année
    currentIndex = (currentIndex + 1) % totalImages;
    const { src, year } = imageData[currentIndex];

    // 2.6.c) Créer un wrapper (div) qui contiendra l’image et le label
    const wrapper = document.createElement('div');
    wrapper.className = 'vignette-wrapper';
    // Position initiale : on place le coin supérieur gauche ici
    wrapper.style.left = `${x + OFFSET_X}px`;
    wrapper.style.top  = `${y + OFFSET_Y}px`;
    // On place en opacité 1 pour apparaître tout de suite
    wrapper.style.opacity = '1';
    // Pas de transition sur wrapper pour le moment
    wrapper.style.transition = '';

    // 2.6.d) Créer l’élément <img>
    const img = document.createElement('img');
    img.src = src;
    img.className = 'vignette-img';
    // dimensions fixées en CSS : 120×180, border-radius, etc.
    // On positionne l’image au sein du wrapper (wrapper en position:absolute)
    wrapper.appendChild(img);

    // 2.6.e) Créer un label pour l’année
    const label = document.createElement('span');
    label.className = 'vignette-year';
    label.textContent = year;
    wrapper.appendChild(label);

    // 2.6.f) Afficher le container s’il est caché
    if (container.style.display !== 'block') {
      container.style.display = 'block';
    }

    // 2.6.g) Insérer immédiatement le wrapper dans le DOM
    container.appendChild(wrapper);

    // 2.6.h) Calculer la vitesse initiale du drift d’après globalVX/globalVY
    const norm = Math.hypot(globalVX, globalVY);
    const capped = Math.min(norm, MAX_INITIAL_SPEED);
    let dirX = 0, dirY = 0;
    if (norm > 0) {
      dirX = globalVX / norm;
      dirY = globalVY / norm;
    }
    const vx = dirX * capped * HORIZ_DAMPEN;
    const vy = dirY * capped;

    // 2.6.i) Lancer l’animation du drift + fade-out vertical sur le wrapper
    animateVignette(wrapper, vx, vy);
  }

  // 2.7) Gestion du mousemove : on calcule la vitesse globale lissée + on place les vignettes à SPATIAL_INTERVAL
  document.addEventListener('mousemove', e => {
    if (!isHeroVisible) return;

    // 2.7.0) Si le curseur est au-dessus du menu, on ne crée pas de vignettes
    if (mainNavElement) {
      const rect = mainNavElement.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        return;
      }
    }

    const now    = performance.now();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // 2.7.a) Au premier mouvement, on initialise lastMouseX/lastMouseY
    if (isFirstMove) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      lastTime   = now;
      isFirstMove = false;
      return;
    }

    // 2.7.b) Calcul du vecteur entre l’ancienne position et la nouvelle
    const dx   = mouseX - lastMouseX;
    const dy   = mouseY - lastMouseY;
    const dist = Math.hypot(dx, dy);

    // 2.7.c) Calcul de la vitesse instantanée (~ px/frame)
    const dtMs            = now - lastTime;
    const speedPxPerMs    = dtMs > 0 ? dist / dtMs : 0;
    const speedPxPerFrame = speedPxPerMs * (1000 / 60);

    // 2.7.d) Mise à jour de la vitesse globale (lissée)
    const newGlobalVX = (dx / (dtMs || 1)) * (1000 / 60);
    const newGlobalVY = (dy / (dtMs || 1)) * (1000 / 60);

    globalVX = globalVX * FRICTION_GLOBAL + newGlobalVX * (1 - FRICTION_GLOBAL);
    globalVY = globalVY * FRICTION_GLOBAL + newGlobalVY * (1 - FRICTION_GLOBAL);

    if (Math.hypot(globalVX, globalVY) < MIN_SPEED_GLOBAL) {
      globalVX = 0;
      globalVY = 0;
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;
    lastTime   = now;

    // 2.7.e) Si le container était caché, on l’affiche dès le premier mouvement dans le hero
    if (container.style.display !== 'block') {
      container.style.display = 'block';
    }

    // 2.7.f) On découpe la distance parcourue en segments de SPATIAL_INTERVAL pour déposer les vignettes
    let remaining = dist;
    let startX = mouseX - dx;
    let startY = mouseY - dy;

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
  });
});
