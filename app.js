const modal = document.getElementById('authModal');
const title = document.getElementById('authTitle');
const subtitle = document.getElementById('authSubtitle');
const confirmWrap = document.getElementById('confirmWrap');
const submit = document.getElementById('authSubmit');
const authSwitch = document.getElementById('authSwitch');
const demoNote = document.getElementById('demoNote');
const form = document.getElementById('authForm');
const message = document.getElementById('formMessage');
const topbar = document.getElementById('topbar');
const navLinks = document.getElementById('navLinks');
const mobileMenuBtn = document.getElementById('mobileMenu');
let authMode = 'register';

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  title.textContent = registering ? 'Crea tu cuenta' : 'Qué alegría verte';
  subtitle.textContent = registering ? 'Empieza gratis con Santitos Jr.' : 'Inicia sesión para continuar.';
  confirmWrap.hidden = !registering;
  document.getElementById('confirmPassword').required = registering;
  document.getElementById('password').autocomplete = registering ? 'new-password' : 'current-password';
  const arrow = '<svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  submit.innerHTML = registering ? 'Crear cuenta ' + arrow : 'Iniciar sesión ' + arrow;
  authSwitch.innerHTML = registering
    ? '¿Ya tienes cuenta? <button type="button" data-open-auth="login">Inicia sesión</button>'
    : '¿Todavía no tienes cuenta? <button type="button" data-open-auth="register">Regístrate</button>';
  demoNote.textContent = 'Prototipo visual: el registro real se activará al conectar el backend.';
  message.textContent = '';
  message.className = 'form-message';
  closeMobileMenu();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('email').focus(), 80);
}

function closeAuth() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  form.reset();
  message.textContent = '';
}

function openMobileMenu() {
  navLinks.classList.add('mobile-open');
  topbar.classList.add('menu-open');
  mobileMenuBtn.setAttribute('aria-expanded', 'true');
  mobileMenuBtn.setAttribute('aria-label', 'Cerrar menú');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  navLinks.classList.remove('mobile-open');
  topbar.classList.remove('menu-open');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
  mobileMenuBtn.setAttribute('aria-label', 'Abrir menú');
  if (!modal.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function toggleMobileMenu() {
  if (navLinks.classList.contains('mobile-open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-open-auth]');
  if (trigger) {
    e.preventDefault();
    setAuthMode(trigger.dataset.openAuth);
  }
});

document.getElementById('closeAuth').addEventListener('click', closeAuth);
modal.addEventListener('click', e => {
  if (e.target === modal) closeAuth();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modal.classList.contains('open')) closeAuth();
    else if (navLinks.classList.contains('mobile-open')) closeMobileMenu();
  }
});

mobileMenuBtn.addEventListener('click', toggleMobileMenu);

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', closeMobileMenu);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;
  if (authMode === 'register' && password !== confirm) {
    message.textContent = 'Las contraseñas no coinciden.';
    message.className = 'form-message error';
    return;
  }
  message.textContent = authMode === 'register'
    ? 'La interfaz está lista. El registro se habilitará al conectar el servidor.'
    : 'El inicio de sesión se habilitará al conectar el servidor.';
  message.className = 'form-message';
});

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 850 && navLinks.classList.contains('mobile-open')) {
    closeMobileMenu();
  }
});
