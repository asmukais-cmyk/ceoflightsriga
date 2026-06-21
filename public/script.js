/* CEOFLIGHTS Riga — Landing Page Interactivity */

// Nav scroll effect
const nav = document.getElementById('nav');
let lastY = 0;

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 60);
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Scroll-reveal observer
const reveals = document.querySelectorAll('.role-card, .benefit-item, .req-item, .gallery-item, .cta-card, .teach-banner');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children by index
      const siblings = Array.from(entry.target.parentElement.children).filter(el =>
        el.classList.contains('role-card') ||
        el.classList.contains('benefit-item') ||
        el.classList.contains('req-item') ||
        el.classList.contains('gallery-item')
      );
      const idx = siblings.indexOf(entry.target);
      const delay = Math.max(0, idx) * 80;

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => {
  el.classList.add('reveal');
  revealObs.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
