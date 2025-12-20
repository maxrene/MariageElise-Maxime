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

  // --- FONCTIONS DE TRANSITION ET SCROLL ---

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
    if (!notreHistoireSection || !timelineLine || !timelineLineProgress) return;
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
    timelineLineProgress.style.height = (percent * lineHeight) + 'px';
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

  const timelineObserver = new IntersectionObserver(observerCallback, { rootMargin: '-30% 0px -30% 0px', threshold: 0.01 });
  if (timelineItems) { timelineItems.forEach(item => timelineObserver.observe(item)); }

  function handleHamburgerIconColor() {
    if (mobileNavToggle && mainNav) {
      const isFixed = mainNav.classList.contains('fixed-nav');
      const isOpen = mobileNavToggle.classList.contains('is-open');
      mobileNavToggle.style.color = (isFixed || isOpen) ? 'var(--text-color-headings)' : 'var(--text-color-light)';
    }
  }

  function onScrollOrResize() {
    handleHeroTransition();
    updateActiveNavLink();
    handleTimelineScrollAnimations();
    handleHamburgerIconColor();
  }

  window.addEventListener('scroll', onScrollOrResize);
  window.addEventListener('resize', onScrollOrResize);

  // --- COMPTE À REBOURS ---
  function startCountdown(targetDateString) {
    const d = document.getElementById('days'), h = document.getElementById('hours'), m = document.getElementById('minutes');
    const target = new Date(targetDateString).getTime();
    if (!d) return;
    const interval = setInterval(() => {
      const dist = target - Date.now();
      if (dist < 0) { clearInterval(interval); return; }
      d.textContent = String(Math.floor(dist / 86400000)).padStart(2, '0');
      h.textContent = String(Math.floor((dist % 86400000) / 3600000)).padStart(2, '0');
      m.textContent = String(Math.floor((dist % 3600000) / 60000)).padStart(2, '0');
    }, 1000);
  }
  startCountdown("2026-06-20T15:00:00");

  // --- LOGIQUE RSVP ---
  const rsvpForm = document.getElementById('rsvpForm');
  const guestCountSelect = document.getElementById('guestCount');
  const additionalGuestsSection = document.getElementById('additionalGuestsSection');
  const submitRsvpButton = document.getElementById('submitRsvpButton');
  const rsvpMessage = document.getElementById('rsvpMessage');
  const presenceRadios = document.querySelectorAll('input[name="Presence"]');
  const detailsContainer = document.getElementById('rsvp-details-container');
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTA9h3QEZYCQgvbTR_Qe2y6yaJVIHgdw0RlbGfP7BNNImdWKN6G3hRq4uPUXxES8Xg/exec';

  function showDetailsSection(show) {
    if (!detailsContainer) return;
    detailsContainer.style.display = show ? 'block' : 'none';
  }

  presenceRadios.forEach(radio => {
    radio.addEventListener('change', () => showDetailsSection(radio.value === 'Oui'));
  });

  if (guestCountSelect) {
    guestCountSelect.addEventListener('change', () => {
      const count = parseInt(guestCountSelect.value) || 1;
      let fieldsHTML = '';
      for (let i = 2; i <= count; i++) {
        fieldsHTML += `
        <div class="guest-block">
          <p class="guest-block-title">Invité ${i}</p>
          <div class="form-row">
            <div class="form-group half-width"><label>Prénom</label><input type="text" name="PrenomInvite${i}" required></div>
            <div class="form-group half-width"><label>Nom</label><input type="text" name="NomInvite${i}" required></div>
          </div>
          <div class="form-group">
            <label>Allergies</label>
            <select name="AllergiesInvite${i}" class="rsvp-select" required onchange="toggleCustomAllergy(${i})">
              <option value="Aucune">Aucune</option><option value="Vegetarien">Végétarien</option><option value="Sans gluten">Sans gluten</option><option value="Arachides">Arachides</option><option value="Autre">Autre</option>
            </select>
          </div>
          <div class="form-group" id="allergiesGuest${i}AutreContainer" style="display: none;"><input type="text" name="AllergiesInvite${i}Autre" placeholder="Précisez"></div>
        </div>`;
      }
      additionalGuestsSection.innerHTML = fieldsHTML;
      additionalGuestsSection.style.display = count > 1 ? 'block' : 'none';
    });
  }

  window.toggleCustomAllergy = function(i) {
    const select = document.querySelector(`[name='AllergiesInvite${i}']`);
    const container = document.getElementById(`allergiesGuest${i}AutreContainer`);
    if (select && container) container.style.display = select.value === 'Autre' ? 'block' : 'none';
  };

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(rsvpForm);
      const guestCount = parseInt(formData.get('NombredePersonnes')) || 1;

      // Nettoyage Allergies
      if (formData.get('Allergies') === 'Autre') formData.set('Allergies', formData.get('AllergiesAutre') || 'Autre');
      for (let i = 2; i <= guestCount; i++) {
        if (formData.get(`AllergiesInvite${i}`) === 'Autre') {
          formData.set(`AllergiesInvite${i}`, formData.get(`AllergiesInvite${i}Autre`) || 'Autre');
        }
      }

      submitRsvpButton.disabled = true;
      submitRsvpButton.querySelector('.button-text').style.display = 'none';
      submitRsvpButton.querySelector('.button-loader').style.display = 'inline';

      fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          rsvpMessage.textContent = data.message;
          rsvpMessage.className = 'rsvp-form-message ' + (data.result === 'success' ? 'success' : 'error');
          rsvpMessage.style.display = 'block';
          if (data.result === 'success') {
            rsvpForm.reset();
            showDetailsSection(false);
            additionalGuestsSection.innerHTML = '';
          }
          rsvpMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .finally(() => {
          submitRsvpButton.disabled = false;
          submitRsvpButton.querySelector('.button-text').style.display = 'inline';
          submitRsvpButton.querySelector('.button-loader').style.display = 'none';
        });
    });
  }

  // --- FAQ ---
  const faqNavLinks = document.querySelectorAll('.faq-nav-link');
  const faqCategoryContents = document.querySelectorAll('.faq-category-content');
  function showFaqCategory(targetId) {
    faqCategoryContents.forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    faqNavLinks.forEach(l => l.classList.remove('active'));
    const target = document.getElementById(targetId.substring(1));
    if (target) { target.style.display = 'block'; target.classList.add('active'); }
    document.querySelector(`.faq-nav-link[href="${targetId}"]`)?.classList.add('active');
  }
  faqNavLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showFaqCategory(link.getAttribute('href')); }));

  // --- VIGNETTES ---
  const vignetteContainer = document.getElementById('image-cursor-container');
  if (heroSection && vignetteContainer) {
    const imageData = Array.from({length: 50}, (_, i) => ({ src: `images/cards/card${i}.jpg`, year: i < 3 ? '2017' : '2018-2025' }));
    let lastX = 0, lastY = 0, accDist = 0, isFirst = true;
    
    function dropVignette(x, y) {
      const wrapper = document.createElement('div');
      wrapper.className = 'vignette-wrapper';
      wrapper.style.left = `${x + 300}px`; wrapper.style.top = `${y - 30}px`;
      const img = document.createElement('img'); img.src = imageData[Math.floor(Math.random()*imageData.length)].src;
      wrapper.appendChild(img); vignetteContainer.appendChild(wrapper);
      setTimeout(() => { wrapper.style.opacity = '0'; setTimeout(() => wrapper.remove(), 500); }, 2000);
    }

    function handleMove(e) {
      if (isFirst) { lastX = e.clientX; lastY = e.clientY; isFirst = false; return; }
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      accDist += dist;
      if (accDist > 120) { dropVignette(e.clientX, e.clientY); accDist = 0; }
      lastX = e.clientX; lastY = e.clientY;
    }

    const heroObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) document.addEventListener('mousemove', handleMove);
      else document.removeEventListener('mousemove', handleMove);
    }, { threshold: 0.1 });
    heroObserver.observe(heroSection);
  }

  // --- HAMBURGER ---
  if (mobileNavToggle && mainNavForMobile) {
    mobileNavToggle.addEventListener('click', () => {
      mainNavForMobile.classList.toggle('is-open');
      mobileNavToggle.classList.toggle('is-open');
      const icon = mobileNavToggle.querySelector('i');
      icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times');
      handleHamburgerIconColor();
    });
    navLinks.forEach(l => l.addEventListener('click', () => {
        mainNavForMobile.classList.remove('is-open');
        mobileNavToggle.classList.remove('is-open');
        const icon = mobileNavToggle.querySelector('i');
        icon.classList.add('fa-bars'); icon.classList.remove('fa-times');
    }));
  }

  // --- PASSWORD ---
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('password-input');
  const passwordSubmit = document.getElementById('password-submit');
  const mainContent = document.getElementById('main-content');

  function checkPassword() {
    if (passwordInput.value === 'Dublin') {
      sessionStorage.setItem('isVerified', 'true');
      passwordModal.style.display = 'none'; mainContent.style.display = 'block';
    } else {
      document.getElementById('password-error').style.display = 'block';
    }
  }
  if (sessionStorage.getItem('isVerified') === 'true') {
    passwordModal.style.display = 'none'; mainContent.style.display = 'block';
  }
  passwordSubmit?.addEventListener('click', checkPassword);

  // --- QUIZ ---
  const QUIZ_SCRIPT_URL = SCRIPT_URL;
  const quizQuestions = [
    { question: "En quelle année se sont-ils rencontrés ?", options: ["2016", "2017", "2018", "2019"], answer: 1 },
    { question: "Où a eu lieu la demande en mariage ?", options: ["Plage", "Montagne", "Désert", "Sous l'eau"], answer: 2 },
    { question: "Dans quelle ville se sont-ils rencontrés ?", options: ["Paris", "Reims", "Rouen", "Bordeaux"], answer: 1 },
    { question: "Quelle est la date exacte du mariage ?", options: ["10 Mai 2026", "20 Juin 2026", "15 Juillet 2026", "20 Juin 2025"], answer: 1 }
  ];

  let currentQ = 0, quizScore = 0, playerName = "";
  const startBtn = document.getElementById('start-quiz-btn');

  function loadQuestion() {
    const q = quizQuestions[currentQ];
    document.getElementById('quiz-question-text').textContent = q.question;
    const grid = document.getElementById('quiz-options-grid');
    grid.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button'); btn.className = 'quiz-option-btn'; btn.textContent = opt;
      btn.onclick = () => { if(i === q.answer) quizScore++; if(++currentQ < quizQuestions.length) loadQuestion(); else finishQuiz(); };
      grid.appendChild(btn);
    });
  }

  function finishQuiz() {
    document.getElementById('quiz-question-screen').style.display = 'none';
    document.getElementById('quiz-result-screen').style.display = 'block';
    document.getElementById('quiz-final-score').textContent = quizScore;
    fetch(QUIZ_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: 'quiz_result', name: playerName, score: quizScore }) });
  }

  startBtn?.addEventListener('click', () => {
    playerName = document.getElementById('quiz-player-name').value;
    if (playerName) { document.getElementById('quiz-start-screen').style.display = 'none'; document.getElementById('quiz-question-screen').style.display = 'block'; loadQuestion(); }
  });

});
