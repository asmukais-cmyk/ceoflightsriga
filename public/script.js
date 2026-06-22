/* CEOFLIGHTS Riga — Premium Landing Page Interactions */

// Nav scroll effect
const nav = document.getElementById('nav');
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

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

document.querySelectorAll('.benefits-text, .team-text').forEach(el => {
  el.classList.add('reveal-left');
  leftRevealObs.observe(el);
});
document.querySelectorAll('.benefits-image, .team-image').forEach(el => {
  el.classList.add('reveal-right');
  leftRevealObs.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      const navH = nav.offsetHeight || 70;
      const y = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: y, behavior: 'smooth' });
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
  
  // Create indicator dots dynamically
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `slider-dot${idx === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoPlay();
    });
    dotsContainer.appendChild(dot);
  });
  
  const dots = Array.from(dotsContainer.querySelectorAll('.slider-dot'));
  
  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
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
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  }
  
  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }
  
  // Keyboard arrow controls
  window.addEventListener('keydown', (e) => {
    // Only intercept if the user's cursor isn't in an input field
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    
    // Check if slider is visible in viewport
    const rect = slider.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisible) return;
    
    if (e.key === 'ArrowLeft') {
      prevSlide();
      resetAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      resetAutoPlay();
    }
  });
  
  // Hover/touch interaction pauses autoplay
  slider.addEventListener('mouseenter', stopAutoPlay);
  slider.addEventListener('mouseleave', startAutoPlay);
  slider.addEventListener('touchstart', stopAutoPlay, { passive: true });
  slider.addEventListener('touchend', startAutoPlay, { passive: true });
  
  // Swipe / Drag support for mobile
  let startX = 0;
  let isDragging = false;
  
  slider.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });
  
  slider.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Threshold of 60px for swipe gesture
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      isDragging = false; // Prevent multiple triggers in one gesture
      resetAutoPlay();
    }
  }, { passive: true });
  
  slider.addEventListener('touchend', () => {
    isDragging = false;
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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(emailInput, 'Please enter a valid email'); valid = false; }

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

  // Success state with countdown + copy link
  function showSuccessState(url) {
    const successEl = document.getElementById('apply-success');
    const linkUrlEl = document.getElementById('apply-link-url');
    const countdownEl = document.getElementById('redirect-countdown');
    const copyBtn = document.getElementById('apply-copy-btn');
    const goNowBtn = document.getElementById('apply-go-now');

    // Hide form, show success
    applyForm.hidden = true;
    successEl.hidden = false;

    // Set link
    linkUrlEl.textContent = url;
    goNowBtn.href = url;

    // Copy button
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        const copyIcon = copyBtn.querySelector('.copy-icon');
        const checkIcon = copyBtn.querySelector('.check-icon');
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
        setTimeout(() => {
          copyIcon.style.display = 'block';
          checkIcon.style.display = 'none';
        }, 2000);
      });
    });

    // Countdown + redirect
    let seconds = 5;
    const countdownInterval = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        window.location.href = url;
      }
    }, 1000);
  }
}
