/* ========================================
   CodeShelf Homepage — script.js
   Chaos animation, scroll effects, pricing toggle
   ======================================== */

(function () {
  'use strict';

  // --- Current Year ---
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  // --- Mobile Menu ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
    });
  });

  // --- Navbar Scroll ---
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // --- Scroll Fade-In ---
  const fadeElements = document.querySelectorAll('.fade-in');

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  fadeElements.forEach((el) => fadeObserver.observe(el));

  // --- Pricing Toggle ---
  const pricingToggle = document.getElementById('pricingToggle');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const yearlyLabel = document.getElementById('yearlyLabel');
  const proPrice = document.getElementById('proPrice');
  const proPeriod = document.getElementById('proPeriod');
  let isYearly = false;

  monthlyLabel.classList.add('active');

  pricingToggle.addEventListener('click', () => {
    isYearly = !isYearly;
    pricingToggle.classList.toggle('active', isYearly);
    monthlyLabel.classList.toggle('active', !isYearly);
    yearlyLabel.classList.toggle('active', isYearly);

    if (isYearly) {
      proPrice.textContent = 'RM21';
      proPeriod.textContent = '/mo, billed yearly';
    } else {
      proPrice.textContent = 'RM29';
      proPeriod.textContent = '/month';
    }
  });

  // --- Chaos Icon Animation ---
  const container = document.getElementById('chaosIcons');
  const icons = container.querySelectorAll('.chaos-icon');
  const mouse = { x: -1000, y: -1000 };
  const REPEL_RADIUS = 100;
  const REPEL_STRENGTH = 3;

  // Track mouse relative to chaos container
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  container.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Initialize icon physics
  const particles = [];

  function initParticles() {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const iconSize = 60;
    const padding = 8;

    icons.forEach((icon) => {
      const x = padding + Math.random() * (w - iconSize - padding * 2);
      const y = padding + Math.random() * (h - iconSize - padding * 2);
      const speed = 0.05 + Math.random() * 0.1;
      const angle = Math.random() * Math.PI * 2;

      particles.push({
        el: icon,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        scale: 0.9 + Math.random() * 0.2,
        scaleDir: Math.random() > 0.5 ? 1 : -1,
      });
    });
  }

  function animate() {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const iconSize = 60;

    particles.forEach((p) => {
      // Mouse repulsion
      const dx = p.x + iconSize / 2 - mouse.x;
      const dy = p.y + iconSize / 2 - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Dampen velocity
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Ensure minimum speed so icons keep drifting
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const minSpeed = 0.04;
      if (speed < minSpeed && speed > 0) {
        p.vx = (p.vx / speed) * minSpeed;
        p.vy = (p.vy / speed) * minSpeed;
      }

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off walls
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > w - iconSize) { p.x = w - iconSize; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > h - iconSize) { p.y = h - iconSize; p.vy *= -1; }

      // Rotation
      p.rotation += p.rotSpeed;

      // Subtle scale pulse
      p.scale += p.scaleDir * 0.001;
      if (p.scale > 1.1) p.scaleDir = -1;
      if (p.scale < 0.85) p.scaleDir = 1;

      // Apply transform
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`;
    });

    requestAnimationFrame(animate);
  }

  // Start when visible
  const heroObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        initParticles();
        animate();
        heroObserver.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  heroObserver.observe(container);
})();
