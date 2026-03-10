// Dark mode / theme toggle
// - Inicializa tema desde localStorage o preferencia del sistema
// - Alterna la clase `dark` en <html> para activar estilos `dark:*` (Tailwind)

const html = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');
const toggleText = document.getElementById('theme-toggle-text');
const toggleIcon = document.getElementById('theme-toggle-icon');

function initTheme() {
  const storedTheme = localStorage.getItem('theme');

  if (storedTheme === 'dark') {
    html.classList.add('dark');
  } else if (storedTheme === 'light') {
    html.classList.remove('dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.classList.add('dark');
  }
}

function updateButtonContent() {
  if (!toggleBtn) return;

  const isDark = html.classList.contains('dark');

  if (toggleText) {
    toggleText.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  }

  if (toggleIcon) {
    toggleIcon.dataset.icon = isDark ? 'sun' : 'moon';
  }

  toggleBtn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

function bindThemeToggle() {
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateButtonContent();
  });
}

initTheme();
updateButtonContent();
bindThemeToggle();

