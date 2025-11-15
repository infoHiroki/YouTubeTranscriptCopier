/**
 * YouTube Transcript Copier - Landing Page
 * Interactive elements and animations
 */

// ==================== Smooth Scrolling ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ==================== Scroll Animations ====================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.card-cyber, section h2').forEach(el => {
  observer.observe(el);
});

// ==================== Add fade-in animation class ====================
const style = document.createElement('style');
style.textContent = `
  .fade-in {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Card hover enhancements */
  .card-cyber {
    transition: all 0.3s ease;
  }

  .card-cyber:hover {
    transform: translateY(-5px);
  }

  /* Glitch text effect on hover */
  .glitch-on-hover:hover {
    animation: glitch 0.3s ease-in-out;
  }

  /* Scanline animation speed adjustment */
  @media (prefers-reduced-motion: reduce) {
    .scanline, .noise {
      animation: none;
      opacity: 0.1;
    }
  }

  /* Link hover effects */
  a:not(.btn-cyber):not(.btn-cyber-magenta):not(.btn-cyber-cyan):hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(style);

// ==================== Copy Code Snippets ====================
document.querySelectorAll('code').forEach(code => {
  code.style.cursor = 'pointer';
  code.title = 'Click to copy';

  code.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      const originalText = code.textContent;
      code.textContent = 'COPIED!';
      code.style.color = '#00ff00';

      setTimeout(() => {
        code.textContent = originalText;
        code.style.color = '';
      }, 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
});

// ==================== Dynamic Year in Footer ====================
const currentYear = new Date().getFullYear();
document.querySelectorAll('footer').forEach(footer => {
  footer.innerHTML = footer.innerHTML.replace('©2025', `©${currentYear}`);
});

// ==================== Parallax Effect for Hero ====================
let ticking = false;

function updateParallax() {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('section');

  if (hero) {
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    hero.style.opacity = 1 - (scrolled / 800);
  }

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  }
});

// ==================== Random Glitch Effect ====================
function randomGlitch() {
  const title = document.querySelector('h1[data-text]');
  if (title && Math.random() > 0.97) {
    title.classList.add('glitch-effect');
    setTimeout(() => {
      title.classList.remove('glitch-effect');
    }, 200);
  }
}

// Trigger random glitch every 3 seconds
setInterval(randomGlitch, 3000);

// ==================== Console Easter Egg ====================
console.log(`
%c
╔═══════════════════════════════════════════════╗
║                                               ║
║   YOUTUBE TRANSCRIPT COPIER v1.1              ║
║   Cyberpunk Edition                           ║
║                                               ║
║   Thanks for checking the console! 🚀         ║
║   GitHub: github.com/yourusername/...         ║
║                                               ║
╚═══════════════════════════════════════════════╝
`,
'color: #ff00ff; font-family: monospace; font-size: 12px;'
);

console.log('%c[ SYSTEM READY ]', 'color: #00ff00; font-weight: bold; font-size: 14px;');
