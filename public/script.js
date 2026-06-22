/* CEOFLIGHTS Riga — Premium Landing Page Interactions */

// Nav scroll effect
const nav = document.getElementById('nav');
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Hide nav on mobile when CTA form is in view
const ctaSection = document.getElementById('apply');
if (ctaSection) {
  const navHideObs = new IntersectionObserver((entries) => {
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    entries.forEach(e => {
      if (isMobile) {
        nav.classList.toggle('nav-hidden', e.isIntersecting);
      }
    });
  }, { threshold: 0.15 });
  navHideObs.observe(ctaSection);
}

// Staggered scroll-reveal observer
const revealSelectors = [
  '.role-card', '.benefit-item', '.quality-item',
  '.cta-card', '.teach-banner',
  '.team-layout', '.benefits-layout'
];

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const el = entry.target;
    // Calculate stagger index among siblings of same type
    const parentChildren = Array.from(el.parentElement.children);
    const sameType = parentChildren.filter(c =>
      c.classList.contains('role-card') ||
      c.classList.contains('benefit-item') ||
      c.classList.contains('quality-item')
    );
    const idx = sameType.indexOf(el);
    const delay = idx >= 0 ? idx * 90 : 0;

    setTimeout(() => el.classList.add('visible'), delay);
    revealObs.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll(revealSelectors.join(',')).forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});

// Directional reveals for split layouts
const leftRevealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      leftRevealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

// FIX #8: Corrected selectors — old code targeted .benefits-image / .team-image which don't exist
document.querySelectorAll('.benefits-text, .team-text').forEach(el => {
  el.classList.add('reveal-left');
  leftRevealObs.observe(el);
});
document.querySelectorAll('.benefits-images-collage, .photo-slider').forEach(el => {
  el.classList.add('reveal-right');
  leftRevealObs.observe(el);
});

// FIX #4: Smooth scroll for anchor links — skip non-fragment hrefs and bare "#"
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    // Skip bare "#" (used as placeholder) and any href that's been dynamically changed to a full URL
    if (!href || href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const navH = nav.offsetHeight || 70;
      const y = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // If linking to #apply, highlight the CTA card and focus first input
      if (href === '#apply') {
        const ctaCard = target.querySelector('.cta-card');
        const firstInput = target.querySelector('.apply-input');
        if (ctaCard) {
          ctaCard.classList.add('form-highlight');
          setTimeout(() => ctaCard.classList.remove('form-highlight'), 1200);
        }
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 600);
        }
      }
    }
  });
});

// Office Photo Showcase Slider
const slider = document.getElementById('office-slider');
if (slider) {
  const track = slider.querySelector('.photo-slider-track');
  const slides = Array.from(slider.querySelectorAll('.photo-slider-slide'));
  const prevBtn = document.getElementById('slider-prev-btn');
  const nextBtn = document.getElementById('slider-next-btn');
  const dotsContainer = slider.querySelector('.slider-dots');
  
  let currentIndex = 0;
  let autoPlayTimer = null;
  const slideCount = slides.length;
  
  // FIX #7: Create accessible indicator dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `slider-dot${idx === 0 ? ' active' : ''}`;
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoPlay();
    });
    // Keyboard support for dots
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToSlide(idx);
        resetAutoPlay();
      }
    });
    dotsContainer.appendChild(dot);
  });
  
  const dots = Array.from(dotsContainer.querySelectorAll('.slider-dot'));
  
  // Mobile: add numeric counter (hidden on desktop via CSS)
  const counterEl = document.createElement('span');
  counterEl.className = 'slider-counter';
  counterEl.textContent = `1 / ${slideCount}`;
  dotsContainer.appendChild(counterEl);
  
  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    // Update ARIA live region for screen reader announcement
    track.setAttribute('aria-label', `Slide ${currentIndex + 1} of ${slideCount}`);
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
      dot.setAttribute('aria-current', idx === currentIndex ? 'true' : 'false');
    });
    // Update mobile counter
    counterEl.textContent = `${currentIndex + 1} / ${slideCount}`;
  }
  
  function goToSlide(index) {
    currentIndex = (index + slideCount) % slideCount;
    updateSlider();
  }
  
  function nextSlide() {
    goToSlide(currentIndex + 1);
  }
  
  function prevSlide() {
    goToSlide(currentIndex - 1);
  }
  
  // Navigation event listeners
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoPlay();
  });
  
  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoPlay();
  });
  
  // Auto-play control
  function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(nextSlide, 5000);
  }
  
  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }
  
  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }
  
  // FIX #5: Keyboard arrow controls — only when slider or its children have focus,
  // or when no interactive element is focused (body-level)
  window.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const tag = active ? active.tagName : '';
    // Never intercept when user is in an input, textarea, select, or contenteditable
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        (active && active.isContentEditable)) return;
    
    // Only intercept if slider is visible in viewport
    const rect = slider.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;
    
    // Only act if focus is on body/document or within the slider itself
    const focusInSlider = slider.contains(active);
    const focusOnBody = !active || active === document.body || active === document.documentElement;
    if (!focusInSlider && !focusOnBody) return;
    
    if (e.key === 'ArrowLeft') {
      prevSlide();
      resetAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      resetAutoPlay();
    }
  });
  
  // FIX #10: Consolidated touch/hover handlers to prevent autoplay race condition
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;
  let swipeHandled = false;

  slider.addEventListener('mouseenter', stopAutoPlay);
  slider.addEventListener('mouseleave', () => {
    if (!isSwiping) startAutoPlay();
  });

  slider.addEventListener('touchstart', (e) => {
    stopAutoPlay();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
    swipeHandled = false;
  }, { passive: true });
  
  slider.addEventListener('touchmove', (e) => {
    if (!isSwiping || swipeHandled) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX - currentX;
    const diffY = touchStartY - currentY;
    
    // If horizontal movement exceeds vertical, prevent page scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
    }
    
    // Threshold of 50px for swipe gesture
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      swipeHandled = true;
    }
  }, { passive: false });
  
  slider.addEventListener('touchend', () => {
    isSwiping = false;
    swipeHandled = false;
    // Restart autoplay after touch interaction ends
    startAutoPlay();
  }, { passive: true });
  
  // Initialize slider
  startAutoPlay();
}

// ========================================
// Application Form — TestGorilla API Invite
// ========================================
const applyForm = document.getElementById('apply-form');
if (applyForm) {
  const firstNameInput = document.getElementById('apply-first-name');
  const lastNameInput = document.getElementById('apply-last-name');
  const emailInput = document.getElementById('apply-email');
  const submitBtn = document.getElementById('cta-apply-btn');
  const messageEl = document.getElementById('apply-message');
  let isSubmitting = false;

  // Clear field errors on input
  [firstNameInput, lastNameInput, emailInput].forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errorEl = input.parentElement.querySelector('.apply-error');
      if (errorEl) errorEl.textContent = '';
      messageEl.hidden = true;
    });
  });

  function showFieldError(input, msg) {
    input.classList.add('input-error');
    const errorEl = input.parentElement.querySelector('.apply-error');
    if (errorEl) errorEl.textContent = msg;
  }

  function setLoading(on) {
    isSubmitting = on;
    submitBtn.disabled = on;
    if (on) {
      submitBtn.classList.add('is-loading');
    } else {
      submitBtn.classList.remove('is-loading');
    }
  }

  function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.className = 'apply-form-message ' + (type === 'error' ? 'msg-error' : 'msg-success');
    messageEl.hidden = false;
  }

  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent double-submit
    if (isSubmitting) return;

    // Reset
    messageEl.hidden = true;
    [firstNameInput, lastNameInput, emailInput].forEach(i => i.classList.remove('input-error'));

    // Validate
    let valid = true;
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();

    if (!firstName) { showFieldError(firstNameInput, 'First name is required'); valid = false; }
    if (!lastName) { showFieldError(lastNameInput, 'Last name is required'); valid = false; }
    if (!email) { showFieldError(emailInput, 'Email is required'); valid = false; }
    // FIX #18: Tightened email regex — require 2+ char TLD
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) { showFieldError(emailInput, 'Please enter a valid email'); valid = false; }

    if (!valid) {
      const firstErr = applyForm.querySelector('.input-error');
      if (firstErr) firstErr.focus();
      return;
    }

    // Submit with timeout
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.redirectUrl) {
        setLoading(false);
        // Show success state with link + countdown
        showSuccessState(data.redirectUrl);
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err) {
      clearTimeout(timeout);
      setLoading(false);
      if (err.name === 'AbortError') {
        showMessage('Request timed out. Please check your connection and try again.', 'error');
      } else {
        showMessage(err.message || 'Something went wrong. Please try again.', 'error');
      }
    }
  });

  // FIX #1 & #2: Success state — no listener leaks, proper cleanup
  let countdownInterval = null;
  let copyBtnBound = false;

  function showSuccessState(url) {
    const successEl = document.getElementById('apply-success');
    const linkUrlEl = document.getElementById('apply-link-url');
    const countdownEl = document.getElementById('redirect-countdown');
    const copyBtn = document.getElementById('apply-copy-btn');
    const goNowBtn = document.getElementById('apply-go-now');

    // Hide form and CTA heading/desc, show success
    applyForm.hidden = true;
    successEl.hidden = false;
    const ctaHeading = document.getElementById('cta-heading');
    const ctaDesc = document.getElementById('cta-desc');
    if (ctaHeading) ctaHeading.style.display = 'none';
    if (ctaDesc) ctaDesc.style.display = 'none';

    // Set link — update both property AND attribute so it works as a real link
    linkUrlEl.textContent = url;
    goNowBtn.href = url;
    goNowBtn.setAttribute('href', url);

    // FIX #1: Guard against double-binding the copy button listener
    if (!copyBtnBound) {
      copyBtnBound = true;
      copyBtn.addEventListener('click', () => {
        const linkUrl = document.getElementById('apply-link-url').textContent;
        navigator.clipboard.writeText(linkUrl).then(() => {
          const copyIcon = copyBtn.querySelector('.copy-icon');
          const checkIcon = copyBtn.querySelector('.check-icon');
          copyIcon.style.display = 'none';
          checkIcon.style.display = 'block';
          setTimeout(() => {
            copyIcon.style.display = 'block';
            checkIcon.style.display = 'none';
          }, 2000);
        }).catch(() => {
          // Fallback: select the text so user can Ctrl+C
          const range = document.createRange();
          range.selectNodeContents(document.getElementById('apply-link-url'));
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      });
    }

    // FIX #2: Clear any previous countdown before starting a new one
    if (countdownInterval) clearInterval(countdownInterval);

    // FIX #2: Clear countdown when "Start Now" is clicked
    goNowBtn.addEventListener('click', () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }, { once: true });

    // Countdown + redirect
    let seconds = 10;
    countdownEl.textContent = seconds;
    countdownInterval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        window.location.href = url;
      }
    }, 1000);
  }

  // FIX #2: Handle bfcache — clear countdown if user navigates back
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  });
}
