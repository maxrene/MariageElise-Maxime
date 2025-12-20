document.addEventListener('DOMContentLoaded', function() {
  // --- 1. VARIABLES GLOBALES ---
  const heroSection = document.getElementById('hero-section');
  const heroBackground = heroSection ? heroSection.querySelector('.hero-background') : null;
  const heroContent = heroSection ? heroSection.querySelector('.hero-content') : null;
  const mainNav = document.querySelector('.main-nav');
  const scrollDownIndicator = heroSection ? heroSection.querySelector('.scroll-down-indicator') : null;
  const notreHistoireSection = document.getElementById('notre-histoire-section');
  const timelineLine = document.querySelector('.timeline-line');
  const timelineLineProgress = document.querySelector('.timeline-line-progress');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const contentSectionsToAnimate = document.querySelectorAll('.content-section');
  const mainNavLinks = document.querySelectorAll(".main-nav a");
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mainNavForMobile = document.querySelector('.main-nav');
  const navLinks = document.querySelectorAll('.main-nav ul li a');

  let pageSections = [];
  if (mainNavLinks) {
    mainNavLinks.forEach(link => {
      const sectionId = link.getAttribute("href");
      if (sectionId && sectionId.startsWith('#')) {
        const sectionElement = document.querySelector(sectionId);
        if (sectionElement) pageSections.push(sectionElement);
      }
    });
  }

  let heroHeight = heroSection ? heroSection.offsetHeight : 0;
  let initialNavTop = mainNav ? mainNav.offsetTop : 0;

  // --- 2. LOGIQUE DU MOT DE PASSE ---
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('password-input');
  const passwordSubmit = document.getElementById('password-submit');
  const mainContent = document.getElementById('main-content');
  const passwordError = document.getElementById('password-error');
  const togglePassword = document.getElementById('toggle-password');

  function showSiteContent() {
    if (passwordModal) passwordModal.style.display = 'none';
    if (mainContent) { mainContent.style.display = 'block'; mainContent.style.opacity = '1'; }
    initialNavTop = mainNav ? mainNav.offsetTop : 0;
  }

  function checkPassword() {
    if (passwordInput && passwordInput.value === 'Dublin') {
      sessionStorage.setItem('isVerified', 'true');
      showSiteContent();
    } else {
      if (passwordError) passwordError.style.display = 'block';
      if (passwordInput) passwordInput.classList.add('error');
    }
  }

  if (sessionStorage.getItem('isVerified') === 'true') {
    showSiteContent();
  } else if (passwordModal) {
    passwordModal.style.display = 'flex';
  }

  passwordSubmit?.addEventListener('click', checkPassword);
  passwordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPassword(); });
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye'); this.classList.toggle('fa-eye-slash');
    });
  }

  // --- 3. ANIMATIONS HERO & NAV ---
  function handleHeroTransition() {
    if (!heroSection) return;
    const scrollY = window.pageYOffset;
    const transitionZone = heroHeight * 0.7;
    let progress = transitionZone > 0 ? Math.min(scrollY / transitionZone, 1) : (scrollY > 0 ? 1 : 0);
    if (heroContent) {
      heroContent.style.opacity = Math.max(0, 1 - progress * 1.5).toFixed(2);
      heroContent.style.transform = `translateY(${-progress * 100}px)`;
    }
    if (heroBackground) {
      heroBackground.style.transform = `scale(${1 + progress * 0.1})`;
      heroBackground.style.opacity = Math.max(0.3, 1 - progress * 0.7).toFixed(2);
    }
    if (mainNav) mainNav.classList.toggle('fixed-nav', scrollY > (initialNavTop - 15));
  }

  function handleTimelineScrollAnimations() {
    if (!notreHistoireSection || !timelineLineProgress) return;
    const scrollY = window.pageYOffset;
    const sectionTop = notreHistoireSection.offsetTop;
    const sectionHeight = notreHistoireSection.offsetHeight;
    const lineHeight = timelineLine.offsetHeight;
    let start = sectionTop - window.innerHeight * 0.25;
    let end = sectionTop + sectionHeight - window.innerHeight * 0.5;
    let percent = Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
    timelineLineProgress.style.height = (percent * lineHeight) + 'px';
  }

  function handleHamburgerIconColor() {
    if (!mobileNavToggle || !mainNav) return;
    const isFixed = mainNav.classList.contains('fixed-nav');
    const isOpen = mobileNavToggle.classList.contains('is-open');
    mobileNavToggle.style.color = (isFixed || isOpen) ? 'var(--text-color-headings)' : 'var(--text-color-light)';
  }

  window.addEventListener('scroll', () => {
    handleHeroTransition();
    handleTimelineScrollAnimations();
    handleHamburgerIconColor();
    // Update active link
    let current = "";
    pageSections.forEach(s => { if (window.pageYOffset >= s.offsetTop - window.innerHeight * 0.4) current = "#" + s.id; });
    mainNavLinks.forEach(l => l.classList.toggle("active-nav-link", l.getAttribute("href") === current));
  });

  // --- 4. LOGIQUE DES VIGNETTES (CARTES QUI FLOTTENT) ---
  const vignetteContainer = document.getElementById('image-cursor-container');
  if (heroSection && vignetteContainer) {
    const imageData = [
      { src: 'images/cards/card0.jpg', year: '2017' }, { src: 'images/cards/card1.jpg', year: '2017' },
      { src: 'images/cards/card2.jpg', year: '2017' }, { src: 'images/cards/card3.jpg', year: '2018' },
      { src: 'images/cards/card4.jpg', year: '2018' }, { src: 'images/cards/card5.jpg', year: '2018' },
      { src: 'images/cards/card6.jpg', year: '2018' }, { src: 'images/cards/card7.jpg', year: '2019' },
      { src: 'images/cards/card8.jpg', year: '2020' }, { src: 'images/cards/card9.jpg', year: '2021' },
      { src: 'images/cards/card10.jpg', year: '2021' }, { src: 'images/cards/card11.jpg', year: '2021' },
      { src: 'images/cards/card12.jpg', year: '2021' }, { src: 'images/cards/card13.jpg', year: '2021' },
      { src: 'images/cards/card14.jpg', year: '2021' }, { src: 'images/cards/card15.jpg', year: '2022' },
      { src: 'images/cards/card16.jpg', year: '2022' }, { src: 'images/cards/card17.jpg', year: '2022' },
      { src: 'images/cards/card18.jpg', year: '2022' }, { src: 'images/cards/card19.jpg', year: '2022' },
      { src: 'images/cards/card20.jpg', year: '2022' }, { src: 'images/cards/card21.jpg', year: '2022' },
      { src: 'images/cards/card22.jpg', year: '2022' }, { src: 'images/cards/card23.jpg', year: '2022' },
      { src: 'images/cards/card24.jpg', year: '2023' }, { src: 'images/cards/card25.jpg', year: '2023' },
      { src: 'images/cards/card26.jpg', year: '2023' }, { src: 'images/cards/card27.jpg', year: '2023' },
      { src: 'images/cards/card28.jpg', year: '2023' }, { src: 'images/cards/card29.jpg', year: '2023' },
      { src: 'images/cards/card30.jpg', year: '2023' }, { src: 'images/cards/card31.jpg', year: '2023' },
      { src: 'images/cards/card32.jpg', year: '2023' }, { src: 'images/cards/card33.jpg', year: '2023' },
      { src: 'images/cards/card34.jpg', year: '2023' }, { src: 'images/cards/card35.jpg', year: '2023' },
      { src: 'images/cards/card36.jpg', year: '2023' }, { src: 'images/cards/card37.jpg', year: '2024' },
      { src: 'images/cards/card38.jpg', year: '2024' }, { src: 'images/cards/card39.jpg', year: '2024' },
      { src: 'images/cards/card40.jpg', year: '2024' }, { src: 'images/cards/card41.jpg', year: '2024' },
      { src: 'images/cards/card42.jpg', year: '2024' }, { src: 'images/cards/card43.jpg', year: '2024' },
      { src: 'images/cards/card44.jpg', year: '2024' }, { src: 'images/cards/card45.jpg', year: '2024' },
      { src: 'images/cards/card46.jpg', year: '2025' }, { src: 'images/cards/card47.jpg', year: '2025' },
      { src: 'images/cards/card48.jpg', year: '2025' }, { src: 'images/cards/card49.jpg', year: '2025' }
    ];

    imageData.forEach(d => { const img = new Image(); img.src = d.src; });

    let lastX = 0, lastY = 0, lastTime = performance.now(), accDist = 0, isFirst = true, gVX = 0, gVY = 0, currentIndex = 0;

    function animateVignette(wrapper, vx, vy) {
      let cx = 0, cy = 0;
      function drift() {
        cx += vx; cy += vy;
        wrapper.style.transform = `translate(${cx}px, ${cy}px)`;
        vx *= 0.9; vy *= 0.9;
        if (Math.hypot(vx, vy) > 0.7) requestAnimationFrame(drift);
        else {
          setTimeout(() => {
            wrapper.style.transition = `opacity 500ms ease, transform 500ms ease`;
            wrapper.style.transform = `translate(${cx}px, ${cy + 200}px)`;
            wrapper.style.opacity = '0';
            setTimeout(() => wrapper.remove(), 500);
          }, 2000);
        }
      }
      requestAnimationFrame(drift);
    }

    function dropVignetteAt(x, y) {
      const existing = vignetteContainer.querySelectorAll('.vignette-wrapper');
      if (existing.length >= 4) existing[0].remove();
      const data = imageData[currentIndex];
      currentIndex = (currentIndex + 1) % imageData.length;
      const w = document.createElement('div'); w.className = 'vignette-wrapper';
      w.style.left = `${x + 300}px`; w.style.top = `${y - 30}px`;
      w.innerHTML = `<img src="${data.src}" class="vignette-img"><span class="vignette-year">${data.year}</span>`;
      vignetteContainer.appendChild(w);
      const norm = Math.hypot(gVX, gVY);
      const capped = Math.min(norm, 14);
      animateVignette(w, (gVX/(norm||1))*capped*0.7, (gVY/(norm||1))*capped);
    }

    function handleMove(e) {
      const now = performance.now();
      if (isFirst) { lastX = e.clientX; lastY = e.clientY; lastTime = now; isFirst = false; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY, dist = Math.hypot(dx, dy), dt = now - lastTime;
      gVX = gVX * 0.85 + (dx / (dt || 1)) * 16.6 * 0.15;
      gVY = gVY * 0.85 + (dy / (dt || 1)) * 16.6 * 0.15;
      accDist += dist;
      if (accDist >= 120) { dropVignetteAt(e.clientX, e.clientY); accDist = 0; }
      lastX = e.clientX; lastY = e.clientY; lastTime = now;
    }

    const hObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) document.addEventListener('mousemove', handleMove);
      else document.removeEventListener('mousemove', handleMove);
    }, { threshold: 0.01 });
    hObs.observe(heroSection);
  }

  // --- 5. LOGIQUE RSVP (10 COLONNES) ---
  const rsvpForm = document.getElementById('rsvpForm');
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTA9h3QEZYCQgvbTR_Qe2y6yaJVIHgdw0RlbGfP7BNNImdWKN6G3hRq4uPUXxES8Xg/exec';

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const submitBtn = document.getElementById('submitRsvpButton');
      const formData = new FormData(rsvpForm);
      const msg = document.getElementById('rsvpMessage');

      submitBtn.disabled = true;
      submitBtn.querySelector('.button-text').style.display = 'none';
      submitBtn.querySelector('.button-loader').style.display = 'inline';

      fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          msg.textContent = data.message;
          msg.className = 'rsvp-form-message ' + (data.result === 'success' ? 'success' : 'error');
          msg.style.display = 'block';
          if (data.result === 'success') {
            rsvpForm.reset();
            document.getElementById('rsvp-details-container').style.display = 'none';
            document.getElementById('additionalGuestsSection').innerHTML = '';
          }
          msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.querySelector('.button-text').style.display = 'inline';
          submitBtn.querySelector('.button-loader').style.display = 'none';
        });
    });
  }

  // --- 6. QUIZ & COUNTDOWN ---
  const QUIZ_SCRIPT_URL = SCRIPT_URL;
  const quizQuestions = [
    { question: "En quelle année se sont-ils rencontrés ?", options: ["2016", "2017", "2018", "2019"], answer: 1 },
    { question: "Où a eu lieu la demande en mariage ?", options: ["Plage", "Montagne", "Désert", "Sous l'eau"], answer: 2 },
    { question: "Dans quelle ville se sont-ils rencontrés ?", options: ["Paris", "Reims", "Rouen", "Bordeaux"], answer: 1 },
    { question: "Quel pays ont-ils visité le plus de fois ?", options: ["USA", "Italie", "Espagne", "UK"], answer: 1 },
    { question: "Quelle est la date exacte du mariage ?", options: ["10 Mai 2026", "20 Juin 2026", "15 Juil 2026", "20 Juin 2025"], answer: 1 }
  ];

  let currentQ = 0, quizScore = 0, pName = "";
  const startBtn = document.getElementById('start-quiz-btn');

  function loadQ() {
    const q = quizQuestions[currentQ];
    document.getElementById('quiz-question-text').textContent = q.question;
    const grid = document.getElementById('quiz-options-grid');
    grid.innerHTML = '';
    q.options.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'quiz-option-btn'; b.textContent = o;
      b.onclick = () => {
        if (i === q.answer) quizScore++;
        if (++currentQ < quizQuestions.length) loadQ();
        else {
          document.getElementById('quiz-question-screen').style.display = 'none';
          document.getElementById('quiz-result-screen').style.display = 'block';
          document.getElementById('quiz-final-score').textContent = quizScore;
          fetch(QUIZ_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: 'quiz_result', name: pName, score: quizScore }) });
        }
      };
      grid.appendChild(b);
    });
  }

  startBtn?.addEventListener('click', () => {
    pName = document.getElementById('quiz-player-name').value;
    if (pName) { document.getElementById('quiz-start-screen').style.display = 'none'; document.getElementById('quiz-question-screen').style.display = 'block'; loadQ(); }
  });

  const d = document.getElementById('days'), h = document.getElementById('hours'), m = document.getElementById('minutes');
  const target = new Date("2026-06-20T15:00:00").getTime();
  setInterval(() => {
    const dist = target - Date.now();
    if (dist > 0 && d) {
      d.textContent = String(Math.floor(dist / 86400000)).padStart(2, '0');
      h.textContent = String(Math.floor((dist % 86400000) / 3600000)).padStart(2, '0');
      m.textContent = String(Math.floor((dist % 3600000) / 60000)).padStart(2, '0');
    }
  }, 1000);

  // FAQ
  document.querySelectorAll('.faq-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.faq-category-content').forEach(c => c.style.display = 'none');
      document.querySelectorAll('.faq-nav-link').forEach(l => l.classList.remove('active'));
      const target = document.getElementById(link.getAttribute('href').substring(1));
      if (target) target.style.display = 'block';
      link.classList.add('active');
    });
  });
});
