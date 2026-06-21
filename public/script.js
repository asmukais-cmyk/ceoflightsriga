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
  '.photo-gallery-item', '.cta-card', '.teach-banner',
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
      c.classList.contains('quality-item') ||
      c.classList.contains('photo-gallery-item')
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

// Parallax on photo gallery items (subtle)
const galleryItems = document.querySelectorAll('.photo-gallery-item img');
if (galleryItems.length && window.matchMedia('(min-width: 768px)').matches) {
  const parallaxObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.dataset.parallax = 'true';
      } else {
        e.target.dataset.parallax = 'false';
      }
    });
  }, { threshold: 0 });

  galleryItems.forEach(img => parallaxObs.observe(img));

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        galleryItems.forEach(img => {
          if (img.dataset.parallax !== 'true') return;
          const rect = img.parentElement.getBoundingClientRect();
          const pct = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
          img.style.transform = `scale(1.06) translateY(${pct * -18}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
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
        showMessage('Success! Redirecting you to the assessment…', 'success');
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1200);
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
}
