const modal = document.getElementById('authModal');
const title = document.getElementById('authTitle');
const subtitle = document.getElementById('authSubtitle');
const confirmWrap = document.getElementById('confirmWrap');
const submit = document.getElementById('authSubmit');
const authSwitch = document.getElementById('authSwitch');
const demoNote = document.getElementById('demoNote');
const form = document.getElementById('authForm');
const message = document.getElementById('formMessage');
let authMode = 'register';

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  title.textContent = registering ? 'Crea tu cuenta' : 'Qué alegría verte';
  subtitle.textContent = registering ? 'Empieza gratis con Santitos Jr.' : 'Inicia sesión para continuar.';
  confirmWrap.hidden = !registering;
  document.getElementById('confirmPassword').required = registering;
  document.getElementById('password').autocomplete = registering ? 'new-password' : 'current-password';
  submit.innerHTML = registering ? 'Crear cuenta <span>→</span>' : 'Iniciar sesión <span>→</span>';
  authSwitch.innerHTML = registering
    ? '¿Ya tienes cuenta? <button type="button" data-open-auth="login">Inicia sesión</button>'
    : '¿Todavía no tienes cuenta? <button type="button" data-open-auth="register">Regístrate</button>';
  demoNote.textContent = 'Prototipo visual: el registro real se activará al conectar el backend.';
  message.textContent = '';
  message.className = 'form-message';
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
document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-open-auth]');
  if (trigger) { e.preventDefault(); setAuthMode(trigger.dataset.openAuth); }
});
document.getElementById('closeAuth').addEventListener('click', closeAuth);
modal.addEventListener('click', e => { if (e.target === modal) closeAuth(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeAuth(); });
document.getElementById('mobileMenu').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('mobile-open');
});
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => document.querySelector('.nav-links').classList.remove('mobile-open')));
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