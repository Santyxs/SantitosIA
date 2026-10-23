/**
 * SantitosIA — Auth (Supabase) + UI
 * Sistema reconstruido desde 0
 */

// ─── Config ───────────────────────────────────────────────
const SUPABASE_URL = 'https://tznuahhwpewbpxgmtkek.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yuGPJmCq_APMG9O32TnjsQ_wwswn9LK';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ARROW =
  '<svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ─── DOM ──────────────────────────────────────────────────
const els = {
  modal: document.getElementById('authModal'),
  title: document.getElementById('authTitle'),
  subtitle: document.getElementById('authSubtitle'),
  confirmWrap: document.getElementById('confirmWrap'),
  form: document.getElementById('authForm'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword'),
  submit: document.getElementById('authSubmit'),
  switch: document.getElementById('authSwitch'),
  note: document.getElementById('demoNote'),
  message: document.getElementById('formMessage'),
  closeBtn: document.getElementById('closeAuth'),
  topbar: document.getElementById('topbar'),
  navLinks: document.getElementById('navLinks'),
  menuBtn: document.getElementById('mobileMenu'),
  guestNav: document.getElementById('navActionsGuest'),
  userNav: document.getElementById('navActionsUser'),
  userChip: document.getElementById('userChip'),
  logoutBtn: document.getElementById('logoutBtn'),
};

let mode = 'register'; // 'register' | 'login'

// ─── Helpers UI ───────────────────────────────────────────
function msg(text, error) {
  els.message.textContent = text || '';
  els.message.className = 'form-message' + (error ? ' error' : '');
}

function loading(on) {
  els.submit.disabled = !!on;
  els.submit.style.opacity = on ? '0.7' : '';
  if (mode === 'register') {
    els.submit.innerHTML = on ? 'Creando cuenta…' : 'Crear cuenta ' + ARROW;
  } else {
    els.submit.innerHTML = on ? 'Entrando…' : 'Iniciar sesión ' + ARROW;
  }
}

function errorText(err) {
  const m = ((err && err.message) || String(err || '')).toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este correo ya está registrado. Inicia sesión.';
  if (m.includes('email not confirmed'))
    return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('password') && m.includes('least'))
    return 'La contraseña es demasiado corta.';
  if (m.includes('rate') || m.includes('too many'))
    return 'Demasiados intentos. Espera un momento.';
  if (m.includes('network') || m.includes('fetch'))
    return 'No se pudo conectar. Revisa tu conexión.';
  return (err && err.message) || 'Ha ocurrido un error.';
}

// ─── Modal ────────────────────────────────────────────────
function openAuth(nextMode) {
  mode = nextMode === 'login' ? 'login' : 'register';
  const reg = mode === 'register';

  els.title.textContent = reg ? 'Crea tu cuenta' : 'Qué alegría verte';
  els.subtitle.textContent = reg
    ? 'Empieza gratis con Santitos Jr.'
    : 'Inicia sesión para continuar.';
  els.confirmWrap.hidden = !reg;
  els.confirmPassword.required = reg;
  els.password.autocomplete = reg ? 'new-password' : 'current-password';
  els.submit.innerHTML = (reg ? 'Crear cuenta ' : 'Iniciar sesión ') + ARROW;
  els.switch.innerHTML = reg
    ? '¿Ya tienes cuenta? <button type="button" data-open-auth="login">Inicia sesión</button>'
    : '¿Todavía no tienes cuenta? <button type="button" data-open-auth="register">Regístrate</button>';
  if (els.note) {
    els.note.textContent = reg
      ? 'Registro con correo y contraseña. Plan inicial: gratis.'
      : 'Usa el correo con el que te registraste.';
  }

  msg('');
  loading(false);
  closeMenu();
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => els.email.focus(), 60);
}

function closeAuth() {
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  els.form.reset();
  msg('');
  loading(false);
}

// ─── Menú móvil ───────────────────────────────────────────
function openMenu() {
  els.navLinks.classList.add('mobile-open');
  els.topbar.classList.add('menu-open');
  els.menuBtn.setAttribute('aria-expanded', 'true');
  els.menuBtn.setAttribute('aria-label', 'Cerrar menú');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  els.navLinks.classList.remove('mobile-open');
  els.topbar.classList.remove('menu-open');
  els.menuBtn.setAttribute('aria-expanded', 'false');
  els.menuBtn.setAttribute('aria-label', 'Abrir menú');
  if (!els.modal.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

// ─── Sesión en la UI ──────────────────────────────────────
function setUser(user) {
  if (user) {
    if (els.guestNav) els.guestNav.hidden = true;
    if (els.userNav) els.userNav.hidden = false;
    if (els.userChip) {
      const mail = user.email || 'Cuenta';
      els.userChip.textContent = mail.length > 28 ? mail.slice(0, 26) + '…' : mail;
      els.userChip.title = mail;
    }
  } else {
    if (els.guestNav) els.guestNav.hidden = false;
    if (els.userNav) els.userNav.hidden = true;
    if (els.userChip) els.userChip.textContent = '';
  }
}

// ─── Auth ─────────────────────────────────────────────────
async function register(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;

  // El trigger de Supabase suele crear el perfil; esto es respaldo
  if (data.user) {
    await sb.from('profiles').upsert(
      { id: data.user.id, email: data.user.email, plan: 'free' },
      { onConflict: 'id' }
    );
  }

  if (data.session) {
    setUser(data.user);
    msg('¡Cuenta creada! Ya has iniciado sesión.');
    setTimeout(closeAuth, 1100);
  } else {
    msg('Cuenta creada. Revisa tu correo para confirmarla e inicia sesión.');
  }
}

async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  setUser(data.user);
  msg('¡Bienvenido de nuevo!');
  setTimeout(closeAuth, 900);
}

async function logout() {
  await sb.auth.signOut();
  setUser(null);
  closeMenu();
}

// ─── Eventos ──────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open-auth]');
  if (t) {
    e.preventDefault();
    openAuth(t.dataset.openAuth);
  }
});

els.closeBtn.addEventListener('click', closeAuth);
els.modal.addEventListener('click', (e) => {
  if (e.target === els.modal) closeAuth();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (els.modal.classList.contains('open')) closeAuth();
  else if (els.navLinks.classList.contains('mobile-open')) closeMenu();
});

els.menuBtn.addEventListener('click', () => {
  if (els.navLinks.classList.contains('mobile-open')) closeMenu();
  else openMenu();
});

els.navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', closeMenu);
});

if (els.logoutBtn) {
  els.logoutBtn.addEventListener('click', () => {
    logout().catch((err) => console.error(err));
  });
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = els.email.value.trim();
  const password = els.password.value;
  const confirm = els.confirmPassword.value;

  if (!email || !password) {
    msg('Completa todos los campos.', true);
    return;
  }
  if (password.length < 8) {
    msg('La contraseña debe tener al menos 8 caracteres.', true);
    return;
  }
  if (mode === 'register' && password !== confirm) {
    msg('Las contraseñas no coinciden.', true);
    return;
  }

  loading(true);
  msg('');
  try {
    if (mode === 'register') await register(email, password);
    else await login(email, password);
  } catch (err) {
    msg(errorText(err), true);
  } finally {
    loading(false);
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 850 && els.navLinks.classList.contains('mobile-open')) {
    closeMenu();
  }
});

// ─── Inicio ───────────────────────────────────────────────
(async function init() {
  const { data } = await sb.auth.getSession();
  setUser(data.session ? data.session.user : null);

  sb.auth.onAuthStateChange((_event, session) => {
    setUser(session ? session.user : null);
  });
})();
