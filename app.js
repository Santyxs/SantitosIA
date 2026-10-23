/* SantitosIA — Auth con Supabase */
const SUPABASE_URL = 'https://tznuahhwpewbpxgmtkek.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yuGPJmCq_APMG9O32TnjsQ_wwswn9LK';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ARROW_SVG =
  '<svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9m0 0L9 4.5M12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
const navGuest = document.getElementById('navActionsGuest');
const navUser = document.getElementById('navActionsUser');
const userChip = document.getElementById('userChip');
const logoutBtn = document.getElementById('logoutBtn');

let authMode = 'register';
let currentUser = null;

function translateAuthError(err) {
  const msg = (err && (err.message || err.error_description || String(err))) || 'Error desconocido';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Este correo ya está registrado. Inicia sesión.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja.';
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'La contraseña es demasiado corta (mínimo 6–8 caracteres).';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'No se pudo conectar. Revisa tu conexión.';
  }
  return msg;
}

function setMessage(text, isError) {
  message.textContent = text || '';
  message.className = 'form-message' + (isError ? ' error' : '');
}

function setLoading(loading) {
  submit.disabled = loading;
  submit.style.opacity = loading ? '0.7' : '';
  if (authMode === 'register') {
    submit.innerHTML = loading ? 'Creando cuenta…' : 'Crear cuenta ' + ARROW_SVG;
  } else {
    submit.innerHTML = loading ? 'Entrando…' : 'Iniciar sesión ' + ARROW_SVG;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  title.textContent = registering ? 'Crea tu cuenta' : 'Qué alegría verte';
  subtitle.textContent = registering
    ? 'Empieza gratis con Santitos Jr.'
    : 'Inicia sesión para continuar.';
  confirmWrap.hidden = !registering;
  document.getElementById('confirmPassword').required = registering;
  document.getElementById('password').autocomplete = registering ? 'new-password' : 'current-password';
  submit.innerHTML = registering
    ? 'Crear cuenta ' + ARROW_SVG
    : 'Iniciar sesión ' + ARROW_SVG;
  authSwitch.innerHTML = registering
    ? '¿Ya tienes cuenta? <button type="button" data-open-auth="login">Inicia sesión</button>'
    : '¿Todavía no tienes cuenta? <button type="button" data-open-auth="register">Regístrate</button>';
  if (demoNote) {
    demoNote.textContent = registering
      ? 'Tu cuenta se crea con correo y contraseña. Plan inicial: Santitos Jr (gratis).'
      : 'Usa el mismo correo con el que te registraste.';
  }
  setMessage('');
  closeMobileMenu();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(function () {
    document.getElementById('email').focus();
  }, 80);
}

function closeAuth() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  form.reset();
  setMessage('');
  setLoading(false);
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
  if (navLinks.classList.contains('mobile-open')) closeMobileMenu();
  else openMobileMenu();
}

function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    if (navGuest) navGuest.hidden = true;
    if (navUser) navUser.hidden = false;
    if (userChip) {
      var label = user.email || 'Cuenta';
      userChip.textContent = label.length > 28 ? label.slice(0, 26) + '…' : label;
      userChip.title = label;
    }
  } else {
    if (navGuest) navGuest.hidden = false;
    if (navUser) navUser.hidden = true;
    if (userChip) userChip.textContent = '';
  }
}

async function ensureProfile(user) {
  if (!user) return;
  var row = {
    id: user.id,
    email: user.email,
    plan: 'free'
  };
  var result = await supabaseClient.from('profiles').upsert(row, {
    onConflict: 'id'
  });
  if (result.error) {
    console.warn('No se pudo guardar el perfil:', result.error.message);
  }
}

async function handleRegister(email, password) {
  var result = await supabaseClient.auth.signUp({ email: email, password: password });
  if (result.error) throw result.error;

  if (result.data.user) {
    await ensureProfile(result.data.user);
  }

  if (result.data.session) {
    updateAuthUI(result.data.user);
    setMessage('¡Cuenta creada! Ya has iniciado sesión.');
    setTimeout(closeAuth, 1200);
  } else {
    setMessage(
      'Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.'
    );
  }
}

async function handleLogin(email, password) {
  var result = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (result.error) throw result.error;
  if (result.data.user) {
    await ensureProfile(result.data.user);
    updateAuthUI(result.data.user);
    setMessage('¡Bienvenido de nuevo!');
    setTimeout(closeAuth, 900);
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  updateAuthUI(null);
  closeMobileMenu();
}

document.addEventListener('click', function (e) {
  var trigger = e.target.closest('[data-open-auth]');
  if (trigger) {
    e.preventDefault();
    setAuthMode(trigger.dataset.openAuth);
  }
});

document.getElementById('closeAuth').addEventListener('click', closeAuth);
modal.addEventListener('click', function (e) {
  if (e.target === modal) closeAuth();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (modal.classList.contains('open')) closeAuth();
    else if (navLinks.classList.contains('mobile-open')) closeMobileMenu();
  }
});

mobileMenuBtn.addEventListener('click', toggleMobileMenu);
navLinks.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', closeMobileMenu);
});

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var confirm = document.getElementById('confirmPassword').value;

  if (!email || !password) {
    setMessage('Completa todos los campos.', true);
    return;
  }
  if (password.length < 8) {
    setMessage('La contraseña debe tener al menos 8 caracteres.', true);
    return;
  }
  if (authMode === 'register' && password !== confirm) {
    setMessage('Las contraseñas no coinciden.', true);
    return;
  }

  setLoading(true);
  setMessage('');
  try {
    if (authMode === 'register') {
      await handleRegister(email, password);
    } else {
      await handleLogin(email, password);
    }
  } catch (err) {
    setMessage(translateAuthError(err), true);
  } finally {
    setLoading(false);
  }
});

window.addEventListener('resize', function () {
  if (window.innerWidth > 850 && navLinks.classList.contains('mobile-open')) {
    closeMobileMenu();
  }
});

(async function initAuth() {
  var sessionRes = await supabaseClient.auth.getSession();
  updateAuthUI(sessionRes.data.session ? sessionRes.data.session.user : null);

  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    updateAuthUI(session ? session.user : null);
  });
})();
