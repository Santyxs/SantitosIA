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
  mobileGuestNav: document.querySelector('.nav-mobile-actions'),
  userNav: document.getElementById('navActionsUser'),
  userChip: document.getElementById('userChip'),
  userDisplayName: document.getElementById('userDisplayName'),
  accountMenu: document.getElementById('accountMenu'),
  accountMenuName: document.getElementById('accountMenuName'),
  mobileAccountMenu: document.getElementById('mobileAccountMenu'),
  mobileAccountName: document.getElementById('mobileAccountName'),
  mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
  accountFeedback: document.getElementById('accountFeedback'),
  logoutBtn: document.getElementById('logoutBtn'),
};

let mode = 'register'; // 'register' | 'login'
let currentAuthUser = null;

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
function displayNameFromEmail(email) {
  const localPart = String(email || '').split('@')[0].trim();
  if (!localPart) return 'Mi cuenta';
  // Convierte santy.xs o santy_xs en un nombre legible sin mostrar el correo completo.
  const words = localPart.replace(/[._+-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words ? words.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('es')) : 'Mi cuenta';
}

function closeAccountMenu() {
  if (els.accountMenu) els.accountMenu.hidden = true;
  if (els.userChip) els.userChip.setAttribute('aria-expanded', 'false');
}

function setUser(user) {
  currentAuthUser = user && user.email ? user : null;
  const email = user && user.email ? String(user.email).trim() : '';
  const loggedIn = !!email;

  if (loggedIn) {
    const displayName = displayNameFromEmail(email);
    if (els.guestNav) els.guestNav.hidden = true;
    if (els.mobileGuestNav) els.mobileGuestNav.hidden = true;
    if (els.userNav) els.userNav.hidden = false;
    if (els.userDisplayName) els.userDisplayName.textContent = displayName;
    if (els.userChip) {
      els.userChip.title = email;
      els.userChip.setAttribute('aria-label', `Menú de cuenta de ${displayName}`);
    }
    if (els.accountMenuName) els.accountMenuName.textContent = displayName;
    if (els.mobileAccountName) els.mobileAccountName.textContent = displayName;
    if (els.mobileAccountMenu) els.mobileAccountMenu.hidden = false;
  } else {
    if (els.guestNav) els.guestNav.hidden = false;
    if (els.mobileGuestNav) els.mobileGuestNav.hidden = false;
    if (els.userNav) els.userNav.hidden = true;
    if (els.userDisplayName) els.userDisplayName.textContent = '';
    if (els.userChip) {
      els.userChip.title = '';
      els.userChip.removeAttribute('aria-label');
    }
    if (els.accountMenuName) els.accountMenuName.textContent = '';
    if (els.mobileAccountName) els.mobileAccountName.textContent = '';
    if (els.mobileAccountMenu) els.mobileAccountMenu.hidden = true;
    closeAccountMenu();
  }
  updateChatUser(loggedIn ? user : null);
  // Mantener la ruta solicitada al recargar subpáginas protegidas.
  const currentRoute = routeFromLocation();
  if (loggedIn && currentRoute !== 'home') {
    showChatView();
    if (currentRoute === 'chat') {
      const active = activeSession();
      if (active) renderConversation(active.id); else showChatWelcome();
    } else {
      showPanel(currentRoute);
    }
  } else showLandingView();
}

function accountAction(action) {
  closeAccountMenu();
  if (els.accountFeedback) {
    const messages = {
      profile: 'La sección Perfil estará disponible próximamente.',
      settings: 'La sección Configuración estará disponible próximamente.',
      support: 'El centro de Soporte estará disponible próximamente.'
    };
    els.accountFeedback.textContent = messages[action] || '';
    els.accountFeedback.hidden = !messages[action];
    if (messages[action]) {
      window.clearTimeout(accountAction.feedbackTimer);
      accountAction.feedbackTimer = window.setTimeout(() => {
        if (els.accountFeedback) els.accountFeedback.hidden = true;
      }, 3500);
    }
  }
}

// ─── Auth ─────────────────────────────────────────────────
async function register(email, password) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL('./', window.location.href).href }
  });
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
    // Las llamadas a la acción principal deben reutilizar la sesión existente.
    if (t.dataset.openAuth === 'register' && currentAuthUser) {
      window.history.pushState({ section: 'chat' }, '', '/SantitosIA/chat');
      showChatView();
      return;
    }
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
if (els.mobileLogoutBtn) {
  els.mobileLogoutBtn.addEventListener('click', () => {
    logout().catch((err) => console.error(err));
  });
}
if (els.userChip) {
  els.userChip.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !!(els.accountMenu && els.accountMenu.hidden);
    if (els.accountMenu) els.accountMenu.hidden = !willOpen;
    els.userChip.setAttribute('aria-expanded', String(willOpen));
  });
}
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-account-action]')) {
    accountAction(event.target.closest('[data-account-action]').dataset.accountAction);
  }
  if (!event.target.closest('#accountDropdown')) closeAccountMenu();
});

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

// ─── SantitosIA workspace ─────────────────────────────────
const chatEls = {
  app: document.getElementById('chatApp'),
  sidebar: document.getElementById('chatSidebar'),
  welcome: document.getElementById('chatWelcome'),
  messages: document.getElementById('chatMessages'),
  stage: document.getElementById('chatStage'),
  form: document.getElementById('chatForm'),
  input: document.getElementById('chatInput'),
  send: document.getElementById('sendChatBtn'),
  fileInput: document.getElementById('chatFileInput'),
  attachmentPreview: document.getElementById('attachmentPreview'),
  previewNotice: document.getElementById('previewNotice'),
  recentList: document.getElementById('recentChatList'),
  toast: document.getElementById('chatToast'),
  userName: document.getElementById('chatUserName'),
  avatar: document.getElementById('chatAvatar'),
  userMenu: document.getElementById('chatUserMenu'),
  model: document.getElementById('modelSelect'),
  modelPicker: document.getElementById('modelPicker'),
  modelPickerBtn: document.getElementById('modelPickerBtn'),
  modelMenu: document.getElementById('modelMenu'),
  modelNameLabel: document.getElementById('modelNameLabel'),
  modelBadgeLabel: document.getElementById('modelBadgeLabel'),
  modelPickerMark: document.getElementById('modelPickerMark'),
};

let chatUserId = null;
let chatStorageKey = null;
let chatSessions = [];
let activeChatId = null;
let activeChatSection = 'chat';
let selectedAttachments = [];
let webSearchEnabled = false;
let toastTimer = null;
let aiRequestInProgress = false;
const COMPANION_PREFS_KEY = () => `santitosia:companion:${chatUserId || 'guest'}`;
// Se activa cuando exista un modelo Premium real y una verificación de pago del lado servidor.
const PREMIUM_PLAN_ENABLED = false;
const CHARACTER_INFO = {
  santitos: { name: 'SantitosIA', selectorName: 'SantitosIA · Masculino', description: 'Directo, maduro y con carácter', icon: '✦', color: 'santitos' },
  jr: { name: 'Santitos Jr.', selectorName: 'Santitos Jr.', description: 'Joven, cercano y expresivo', icon: '✧', color: 'jr' },
  syntia: { name: 'SantitosIA', selectorName: 'SantitosIA · Femenino', description: 'Ingeniosa, cercana y resolutiva', icon: '✦', color: 'syntia' },
};
function getCompanionPrefs() {
  let value = {};
  try { value = JSON.parse(safeRead(COMPANION_PREFS_KEY()) || '{}') || {}; } catch (_) {}
  return {
    character: Object.prototype.hasOwnProperty.call(CHARACTER_INFO, value.character) ? value.character : 'jr',
    appearance: value.appearance === 'wolf' ? 'wolf' : 'human',
    autoVoice: value.autoVoice === true,
    voiceURI: typeof value.voiceURI === 'string' ? value.voiceURI : '',
  };
}
function saveCompanionPrefs(next) {
  const current = getCompanionPrefs();
  const updated = { ...current, ...next };
  safeSave(COMPANION_PREFS_KEY(), JSON.stringify(updated));
  return updated;
}
function getCharacterInfo(id) { return CHARACTER_INFO[id] || CHARACTER_INFO.jr; }
function assistantAvatarMarkup(characterId, appearance) {
  const id = Object.prototype.hasOwnProperty.call(CHARACTER_INFO, characterId) ? characterId : 'jr';
  const src = appearance === 'wolf' ? 'assets/logo.png' : `assets/characters/${id}.svg`;
  return `<img src="${src}" alt="" />`;
}
function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
function speakText(text) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    showChatToast('La lectura en voz alta no está disponible en este navegador.');
    return false;
  }
  stopSpeaking();
  const prefs = getCompanionPrefs();
  const utterance = new SpeechSynthesisUtterance(String(text || '').slice(0, 12000));
  utterance.lang = 'es-ES';
  utterance.rate = prefs.character === 'jr' ? 1.04 : 0.96;
  utterance.pitch = prefs.character === 'syntia' ? 1.12 : (prefs.character === 'jr' ? 1.08 : 0.94);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find((voice) => voice.voiceURI === prefs.voiceURI);
  const spanishVoice = voices.find((voice) => /^es(-|_)/i.test(voice.lang));
  if (selectedVoice || spanishVoice) utterance.voice = selectedVoice || spanishVoice;
  utterance.onerror = () => showChatToast('No se ha podido reproducir la voz en este dispositivo.');
  window.speechSynthesis.speak(utterance);
  return true;
}
async function readAttachmentData(files) {
  const result = { text: '', images: [] };
  for (const file of (files || []).slice(0, 8)) {
    const name = String(file.name || 'archivo');
    const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const isImage = /^image\/(png|jpeg|webp|gif)$/i.test(file.type || '') && ['png','jpg','jpeg','webp','gif'].includes(extension);
    if (isImage) {
      if (file.size > 500000) { showChatToast(`La imagen «${name}» supera 500 KB y no se ha enviado.`); continue; }
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject; reader.readAsDataURL(file);
        });
        result.images.push({ name, dataUrl });
      } catch (_) { showChatToast(`No se ha podido leer la imagen «${name}».`); }
      continue;
    }
    const textExtensions = ['txt','md','json','yml','yaml','java','js','py','html','css','xml','properties','log','toml','sql','csv','gradle','kt','ts','tsx','jsx','ini','conf','cfg'];
    const appearsText = textExtensions.includes(extension) || /^text\//i.test(file.type || '') || /json|javascript|xml|yaml/i.test(file.type || '');
    if (appearsText) {
      if (file.size > 700000) { result.text += `

[${name}: archivo demasiado grande para procesarlo en una petición; límite 700 KB.]`; continue; }
      try {
        const content = await file.text();
        const clipped = content.slice(0, 80000);
        result.text += `

[Contenido de ${name}${content.length > clipped.length ? ' (contenido recortado a 80 000 caracteres)' : ''}]
${clipped}`;
      } catch (_) { result.text += `

[No se pudo leer ${name}.]`; }
    } else if (extension === 'zip') {
      result.text += `

[Se adjuntó ${name}, un ZIP. La lectura automática de archivos comprimidos todavía no está disponible; extrae y adjunta los archivos de texto que quieras analizar.]`;
    } else if (!isImage) {
      result.text += `

[Se adjuntó ${name}; este tipo de archivo no se ha podido leer como texto.]`;
    }
  }
  return result;
}
async function functionErrorMessage(error) {
  let message = '';
  try {
    if (error && error.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      message = body && (body.error || body.message) || '';
    }
  } catch (_) {}
  if (message) return message;
  const status = error && error.context && error.context.status;
  if (status === 404) return 'La función segura de IA no está desplegada en Supabase. Sigue las instrucciones del ZIP para publicarla.';
  if (status === 401) return 'Tu sesión no es válida. Cierra sesión e inicia sesión de nuevo.';
  if (status === 429) return 'Has alcanzado el límite de uso. Prueba más tarde o mañana.';
  return 'No se ha podido contactar con la IA. Comprueba la configuración de Supabase y vuelve a intentarlo.';
}

function showChatView() {
  if (!chatEls.app) return;
  chatEls.app.hidden = false;
  document.body.classList.add('chat-mode');
  if (chatEls.app) chatEls.app.classList.remove('sidebar-open');
  renderRecentChats();
}

function showLandingView() {
  if (!chatEls.app) return;
  chatEls.app.hidden = true;
  document.body.classList.remove('chat-mode');
  if (chatEls.app) chatEls.app.classList.remove('sidebar-open');
  if (chatEls.userMenu) chatEls.userMenu.hidden = true;
}

function updateChatUser(user) {
  chatUserId = user && user.id ? user.id : null;
  chatStorageKey = chatUserId ? `santitosia:chat-history:${chatUserId}` : null;
  const name = displayNameFromEmail(user && user.email);
  if (chatEls.userName) chatEls.userName.textContent = user ? name : 'Mi cuenta';
  if (chatEls.avatar) chatEls.avatar.textContent = (user ? name : 'S').charAt(0).toLocaleUpperCase('es');
  if (chatEls.model) {
    let preferred = safeRead(`santitosia:model:${chatUserId || 'guest'}`) || 'jr';
    if (preferred === 'pro' && (!PREMIUM_PLAN_ENABLED || !hasPremiumPlan())) preferred = 'jr';
    chatEls.model.value = preferred === 'pro' ? 'pro' : 'jr';
    if (preferred !== 'pro') safeSave(`santitosia:model:${chatUserId || 'guest'}`, 'jr');
    updatePlanCard();
  }
  chatSessions = loadChatSessions();
  activeChatId = chatSessions.length ? chatSessions[0].id : null;
  selectedAttachments = [];
  renderAttachmentPreview();
  if (activeChatId) renderConversation(activeChatId);
  else showChatWelcome();
  renderRecentChats();
  applyUiPreferences();
}

function safeRead(key) {
  try { return window.localStorage.getItem(key); } catch (_) { return null; }
}

const DEFAULT_USER_AVATAR = null; // sin imagen = inicial del nombre
function userAvatarStorageKey() {
  return `santitosia:user-avatar:${chatUserId || 'guest'}`;
}
function getCustomUserAvatar() {
  return safeRead(userAvatarStorageKey()) || null;
}
function clearCustomUserAvatar() {
  try { window.localStorage.removeItem(userAvatarStorageKey()); } catch (_) {}
}
function applyUserAvatarEverywhere() {
  const src = getCustomUserAvatar();
  // Avatar del sidebar del chat
  if (chatEls.avatar) {
    if (src) {
      chatEls.avatar.textContent = '';
      let img = chatEls.avatar.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Tu avatar';
        chatEls.avatar.append(img);
      }
      img.src = src;
      chatEls.avatar.classList.add('has-photo');
    } else {
      chatEls.avatar.classList.remove('has-photo');
      const img = chatEls.avatar.querySelector('img');
      if (img) img.remove();
      const name = (chatEls.userName && chatEls.userName.textContent) || 'S';
      chatEls.avatar.textContent = name.charAt(0).toLocaleUpperCase('es');
    }
  }
  // Avatares de mensajes del usuario
  document.querySelectorAll('.user-message .message-avatar').forEach((el) => {
    if (src) {
      el.textContent = '';
      let img = el.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Tú';
        el.append(img);
      }
      img.src = src;
      el.classList.add('has-photo');
    } else {
      el.classList.remove('has-photo');
      const img = el.querySelector('img');
      if (img) img.remove();
      const name = (chatEls.avatar && chatEls.avatar.textContent) || 'S';
      el.textContent = (name || 'S').charAt(0).toLocaleUpperCase('es');
    }
  });
  // Preview en configuración (solo foto de usuario, nunca el logo del modelo)
  document.querySelectorAll('.settings-user-avatar-preview, .settings-logo-preview').forEach((box) => {
    if (src) {
      box.classList.add('has-photo');
      let img = box.querySelector('img');
      const placeholder = box.querySelector('.settings-avatar-placeholder');
      if (placeholder) placeholder.remove();
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Tu avatar';
        box.append(img);
      }
      img.src = src;
    } else {
      box.classList.remove('has-photo');
      const img = box.querySelector('img');
      if (img) img.remove();
      let placeholder = box.querySelector('.settings-avatar-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('span');
        placeholder.className = 'settings-avatar-placeholder';
        box.append(placeholder);
      }
      const name = (chatEls.userName && chatEls.userName.textContent) || 'S';
      placeholder.textContent = name.charAt(0).toLocaleUpperCase('es');
    }
  });
  // Avatar en tarjeta de configuración
  const settingsAvatar = document.querySelector('.settings-account-avatar');
  if (settingsAvatar) {
    if (src) {
      settingsAvatar.textContent = '';
      let img = settingsAvatar.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.alt = 'Tu avatar';
        settingsAvatar.append(img);
      }
      img.src = src;
      settingsAvatar.classList.add('has-photo');
    } else {
      settingsAvatar.classList.remove('has-photo');
      const img = settingsAvatar.querySelector('img');
      if (img) img.remove();
      const name = (chatEls.userName && chatEls.userName.textContent) || 'S';
      settingsAvatar.textContent = name.charAt(0).toLocaleUpperCase('es');
    }
  }
}
function applyUiPreferences() {
  const compact = safeRead(`santitosia:compact:${chatUserId || 'guest'}`) === '1';
  const hints = safeRead(`santitosia:hints:${chatUserId || 'guest'}`) !== '0';
  document.body.classList.toggle('chat-compact', compact);
  document.body.classList.toggle('hide-shortcut-hints', !hints);
  applyUserAvatarEverywhere();
}

function loadChatSessions() {
  if (!chatStorageKey) return [];
  try {
    const data = JSON.parse(window.localStorage.getItem(chatStorageKey) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.messages))
      .slice(0, 30);
  } catch (_) { return []; }
}
function saveChatSessions() {
  if (!chatStorageKey) return;
  try { window.localStorage.setItem(chatStorageKey, JSON.stringify(chatSessions.slice(0, 30))); }
  catch (_) { showChatToast('No se ha podido guardar el historial en este navegador.'); }
}
function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function activeSession() {
  return chatSessions.find((item) => item.id === activeChatId) || null;
}
function updatePlanCard() {
  if (!chatEls.model) return;
  const pro = chatEls.model.value === 'pro';
  const name = document.getElementById('chatPlanName');
  const detail = document.getElementById('chatPlanDetail');
  const badge = document.getElementById('chatPlanBadge');
  if (name) name.textContent = pro ? 'Santitos' : 'Santitos Jr';
  if (detail) detail.textContent = pro ? 'Razonamiento avanzado' : 'Rápido · Gratis';
  if (badge) badge.textContent = pro ? 'PREMIUM' : 'GRATIS';
  // Sincroniza el botón del selector de modelos
  if (chatEls.modelNameLabel) chatEls.modelNameLabel.textContent = pro ? 'Santitos' : 'Santitos Jr';
  if (chatEls.modelBadgeLabel) {
    chatEls.modelBadgeLabel.textContent = pro ? 'Premium' : 'Gratis';
    chatEls.modelBadgeLabel.className = 'model-badge ' + (pro ? 'pro' : 'free');
  }
  if (chatEls.modelPickerMark) chatEls.modelPickerMark.textContent = pro ? '✧' : '↯';
  if (chatEls.modelMenu) {
    const unlocked = PREMIUM_PLAN_ENABLED && hasPremiumPlan();
    chatEls.modelMenu.querySelectorAll('.model-option').forEach((opt) => {
      const active = opt.dataset.model === (pro ? 'pro' : 'jr');
      opt.classList.toggle('active', active);
      opt.setAttribute('aria-selected', String(active));
      if (opt.dataset.model === 'pro') {
        opt.classList.toggle('locked', !unlocked);
        opt.title = unlocked ? '' : (PREMIUM_PLAN_ENABLED ? 'Requiere plan Premium' : 'Santitos Premium estará disponible cuando se conecten el modelo y el pago seguro');
      }
    });
  }
}

function closeModelMenu() {
  if (!chatEls.modelMenu || !chatEls.modelPickerBtn) return;
  chatEls.modelMenu.hidden = true;
  chatEls.modelPickerBtn.setAttribute('aria-expanded', 'false');
  if (chatEls.modelPicker) chatEls.modelPicker.classList.remove('open');
}


function planStorageKey() {
  return `santitosia:plan:${chatUserId || 'guest'}`;
}
function hasPremiumPlan() {
  return safeRead(planStorageKey()) === 'pro';
}
function requirePremiumOrCheckout() {
  if (PREMIUM_PLAN_ENABLED && hasPremiumPlan()) return true;
  showChatToast('Santitos Premium todavía no está disponible. No se realizarán cobros en esta versión.', { important: true });
  closeModelMenu();
  if (PREMIUM_PLAN_ENABLED && typeof openCheckout === 'function') window.setTimeout(() => openCheckout('pro'), 180);
  return false;
}

function setModelValue(value, options = {}) {
  if (!chatEls.model) return;
  const next = value === 'pro' ? 'pro' : 'jr';
  const skipPaywall = !!(options && options.skipPaywall);
  if (next === 'pro' && !PREMIUM_PLAN_ENABLED) {
    chatEls.model.value = 'jr';
    updatePlanCard();
    showChatToast('Santitos Premium estará disponible cuando el modelo y la activación del pago estén conectados de forma segura.', { important: true });
    closeModelMenu();
    return;
  }
  if (next === 'pro' && !skipPaywall && !hasPremiumPlan()) {
    // Forzar UI en Jr y abrir checkout
    chatEls.model.value = 'jr';
    updatePlanCard();
    requirePremiumOrCheckout();
    return;
  }
  if (chatEls.model.value === next) {
    closeModelMenu();
    return;
  }
  chatEls.model.value = next;
  updatePlanCard();
  safeSave(`santitosia:model:${chatUserId || 'guest'}`, next);
  showChatToast(next === 'pro' ? 'Santitos Premium activo.' : 'Santitos Jr seleccionado.');
  closeModelMenu();
}
function scrollChatToBottom(smooth) {
  if (!chatEls.stage) return;
  const run = () => {
    chatEls.stage.scrollTop = chatEls.stage.scrollHeight;
  };
  run();
  window.requestAnimationFrame(run);
  if (smooth) window.setTimeout(run, 60);
}
function showTypingIndicator() {
  if (!chatEls.messages) return null;
  const row = document.createElement('article');
  row.className = 'chat-message assistant-message typing-row';
  row.id = 'typingIndicator';
  row.setAttribute('aria-label', 'SantitosIA está escribiendo');
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  const typingPrefs = getCompanionPrefs();
  const typingAvatarUrl = typingPrefs.appearance === 'wolf' ? 'assets/logo.png' : `assets/characters/${Object.prototype.hasOwnProperty.call(CHARACTER_INFO, typingPrefs.character) ? typingPrefs.character : 'jr'}.svg`;
  if (chatEls.messages) chatEls.messages.style.setProperty('--chat-companion-image', `url("${typingAvatarUrl}")`);
  avatar.innerHTML = assistantAvatarMarkup(typingPrefs.character, typingPrefs.appearance);
  avatar.classList.add(`companion-avatar-${getCharacterInfo(getCompanionPrefs().character).color}`);
  const body = document.createElement('div');
  body.className = 'message-body';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble typing-bubble';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  body.append(bubble);
  row.append(avatar, body);
  chatEls.messages.append(row);
  scrollChatToBottom(true);
  return row;
}
function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}
function showChatToast(message, options = {}) {
  if (!chatEls.toast) return;
  const important = !!(options && options.important);
  chatEls.toast.textContent = message;
  chatEls.toast.classList.toggle('chat-toast-important', important);
  chatEls.toast.hidden = false;
  window.clearTimeout(toastTimer);
  const ms = important ? 5600 : 3400;
  toastTimer = window.setTimeout(() => {
    chatEls.toast.hidden = true;
    chatEls.toast.classList.remove('chat-toast-important');
  }, ms);
}
function setActiveNav(section) {
  activeChatSection = section;
  document.querySelectorAll('[data-chat-nav]').forEach((button) => {
    button.classList.toggle('active', button.dataset.chatNav === section && button.classList.contains('chat-nav-item'));
  });
}
function showChatWelcome() {
  setActiveNav('chat');
  if (chatEls.welcome) {
    chatEls.welcome.hidden = false;
    chatEls.welcome.removeAttribute('aria-hidden');
  }
  if (chatEls.messages) chatEls.messages.replaceChildren();
  if (chatEls.previewNotice) chatEls.previewNotice.hidden = false;
  if (chatEls.stage) chatEls.stage.scrollTop = 0;
}
function renderConversation(id) {
  const session = chatSessions.find((item) => item.id === id);
  if (!session) { showChatWelcome(); return; }
  activeChatId = id;
  setActiveNav('chat');
  if (chatEls.welcome) {
    chatEls.welcome.hidden = true;
    chatEls.welcome.setAttribute('aria-hidden', 'true');
  }
  chatEls.messages.replaceChildren();
  if (chatEls.previewNotice) chatEls.previewNotice.hidden = false;
  session.messages.forEach((item) => addMessageToDOM(item, false));
  scrollChatToBottom(true);
  renderRecentChats();
}
function createMessageNode(item, addActions) {
  const role = item.role === 'user' ? 'user' : 'assistant';
  const row = document.createElement('article');
  row.className = `chat-message ${role}-message`;
  const avatar = document.createElement('div');
  avatar.className = `message-avatar${role === 'user' ? ' user-avatar' : ''}`;
  if (role === 'assistant') {
    const prefs = getCompanionPrefs();
    const characterId = item.character || prefs.character;
    const appearance = item.appearance || prefs.appearance;
    const info = getCharacterInfo(characterId);
    avatar.classList.add(`companion-avatar-${info.color}`);
    const avatarUrl = appearance === 'wolf' ? 'assets/logo.png' : `assets/characters/${Object.prototype.hasOwnProperty.call(CHARACTER_INFO, characterId) ? characterId : 'jr'}.svg`;
    if (chatEls.messages) chatEls.messages.style.setProperty('--chat-companion-image', `url("${avatarUrl}")`);
    const image = document.createElement('img');
    image.src = avatarUrl;
    image.alt = `Avatar de ${info.name}${appearance === 'wolf' ? ' en forma de lobo' : ''}`;
    avatar.append(image);
  } else {
    const custom = getCustomUserAvatar();
    if (custom) {
      const uimg = document.createElement('img');
      uimg.src = custom;
      uimg.alt = 'Tú';
      avatar.append(uimg);
      avatar.classList.add('has-photo');
    } else {
      avatar.textContent = (chatEls.avatar && chatEls.avatar.textContent || 'S').slice(0, 1);
    }
  }
  const body = document.createElement('div'); body.className = 'message-body';
  const meta = document.createElement('div'); meta.className = 'message-meta';
  const name = document.createElement('span');
  const messageCharacter = item.character || getCompanionPrefs().character;
  name.textContent = role === 'user' ? 'Tú' : getCharacterInfo(messageCharacter).name;
  meta.append(name);
  if (role === 'assistant') {
    const tag = document.createElement('span'); tag.className = 'message-tag';
    tag.textContent = (item.plan || (chatEls.model && chatEls.model.value === 'pro' ? 'pro' : 'jr')) === 'pro' ? 'PREMIUM' : 'GRATIS'; meta.append(tag);
  }
  const time = document.createElement('time');
  const date = new Date(item.timestamp || Date.now());
  time.textContent = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); meta.append(time);
  const bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = item.content || '';
  body.append(meta, bubble);
  if (Array.isArray(item.attachments) && item.attachments.length) {
    const files = document.createElement('div'); files.className = 'message-actions';
    item.attachments.forEach((file) => {
      const pill = document.createElement('span'); pill.className = 'attachment-pill';
      pill.textContent = `▤ ${file.name}`; files.append(pill);
    });
    body.append(files);
  }
  if (role === 'assistant' && item.previewNote) {
    const note = document.createElement('div'); note.className = 'preview-response-note';
    const strong = document.createElement('strong'); strong.textContent = 'Modo de vista previa. ';
    note.append(strong, document.createTextNode(item.previewNote)); body.append(note);
  }
  if (role === 'assistant') {
    const actions = document.createElement('div'); actions.className = 'message-actions';
    const copy = document.createElement('button');
    copy.className = 'message-action';
    copy.type = 'button';
    copy.setAttribute('aria-label', 'Copiar');
    copy.innerHTML = '<svg class="message-action-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>Copiar</span>';
    copy.addEventListener('click', () => copyText(item.content || ''));
    actions.append(copy);
    const listen = document.createElement('button');
    listen.className = 'message-action'; listen.type = 'button';
    listen.setAttribute('aria-label', 'Escuchar respuesta');
    listen.innerHTML = '<svg class="message-action-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2.5 6v4h2.7l3.3 2.5v-9L5.2 6H2.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.2 3.8a6 6 0 0 1 0 8.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span>Escuchar</span>';
    listen.addEventListener('click', () => speakText(item.content || ''));
    actions.append(listen);
    if (addActions) {
      const regen = document.createElement('button');
      regen.className = 'message-action';
      regen.type = 'button';
      regen.setAttribute('aria-label', 'Reintentar');
      regen.innerHTML = '<svg class="message-action-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.2 8a4.8 4.8 0 0 1 8.2-3.3M12.8 8a4.8 4.8 0 0 1-8.2 3.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11.2 2.8v2.6H8.6M4.8 13.2v-2.6h2.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Reintentar</span>';
      regen.addEventListener('click', () => regenerateLastAssistant());
      actions.append(regen);
    }
    body.append(actions);
  } else if (role === 'user' && addActions) {
    const session = activeSession();
    const isLastUser = session && session.messages.length && session.messages.filter((m) => m.role === 'user').pop() === item;
    // Fallback: compare content+timestamp
    let lastUser = null;
    if (session) {
      for (let i = session.messages.length - 1; i >= 0; i--) {
        if (session.messages[i].role === 'user') { lastUser = session.messages[i]; break; }
      }
    }
    if (lastUser && lastUser.timestamp === item.timestamp && lastUser.content === item.content) {
      const actions = document.createElement('div'); actions.className = 'message-actions';
      const edit = document.createElement('button');
      edit.className = 'message-action';
      edit.type = 'button';
      edit.textContent = '✎ Editar';
      edit.addEventListener('click', () => editLastUserMessage());
      actions.append(edit);
      body.append(actions);
    }
  }
  if (role === 'user') row.append(body, avatar); else row.append(avatar, body);
  return row;
}
function addMessageToDOM(item, scroll = true) {
  chatEls.messages.append(createMessageNode(item, true));
  if (scroll) scrollChatToBottom(true);
}
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const helper = document.createElement('textarea'); helper.value = text; helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.append(helper); helper.select(); document.execCommand('copy'); helper.remove();
    }
    showChatToast('Texto copiado.');
  } catch (_) { showChatToast('No se ha podido copiar automáticamente.'); }
}
function renderRecentChats() {
  if (!chatEls.recentList) return;
  chatEls.recentList.replaceChildren();
  const recent = [...chatSessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 8);
  if (!recent.length) {
    const empty = document.createElement('button'); empty.type = 'button'; empty.className = 'recent-chat empty-recent'; empty.disabled = true;
    empty.textContent = 'Las conversaciones aparecerán aquí'; chatEls.recentList.append(empty); return;
  }
  recent.forEach((session) => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'recent-chat' + (session.id === activeChatId ? ' current' : '');
    button.title = session.title; button.textContent = session.title;
    button.addEventListener('click', () => { renderConversation(session.id); closeChatSidebar(); });
    chatEls.recentList.append(button);
  });
}
function renderAttachmentPreview() {
  if (!chatEls.attachmentPreview) return;
  chatEls.attachmentPreview.replaceChildren();
  chatEls.attachmentPreview.hidden = selectedAttachments.length === 0;
  selectedAttachments.forEach((file, index) => {
    const pill = document.createElement('div'); pill.className = 'attachment-pill';
    const icon = document.createElement('span'); icon.textContent = file.type.startsWith('image/') ? '▧' : '▤';
    const name = document.createElement('span'); name.textContent = file.name; name.title = file.name;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Quitar ${file.name}`);
    remove.addEventListener('click', () => { selectedAttachments.splice(index, 1); renderAttachmentPreview(); });
    pill.append(icon, name, remove); chatEls.attachmentPreview.append(pill);
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function renameSession(id) {
  const session = chatSessions.find((s) => s.id === id);
  if (!session) return;
  const next = window.prompt('Nuevo nombre de la conversación:', session.title || '');
  if (next === null) return;
  const title = next.trim().slice(0, 80);
  if (!title) { showChatToast('El nombre no puede estar vacío.'); return; }
  session.title = title;
  session.updatedAt = Date.now();
  saveChatSessions();
  renderRecentChats();
  showChatToast('Conversación renombrada.');
  if (activeChatSection === 'history') showPanel('history');
}
function deleteSession(id) {
  const session = chatSessions.find((s) => s.id === id);
  if (!session) return;
  const ok = window.confirm(`¿Borrar «${session.title}»? Esta acción no se puede deshacer.`);
  if (!ok) return;
  chatSessions = chatSessions.filter((s) => s.id !== id);
  if (activeChatId === id) {
    activeChatId = chatSessions[0] ? chatSessions[0].id : null;
  }
  saveChatSessions();
  renderRecentChats();
  showChatToast('Conversación eliminada.');
  if (activeChatId) renderConversation(activeChatId);
  else if (activeChatSection === 'history') showPanel('history');
  else showChatWelcome();
}
function exportSession(id, format) {
  const session = chatSessions.find((s) => s.id === id);
  if (!session) return;
  const lines = [];
  if (format === 'md') {
    lines.push(`# ${session.title || 'Chat'}`);
    lines.push('');
    session.messages.forEach((m) => {
      const who = m.role === 'user' ? 'Tú' : 'SantitosIA';
      lines.push(`## ${who}`);
      lines.push(m.content || '');
      lines.push('');
    });
  } else {
    lines.push(session.title || 'Chat');
    lines.push(''.padStart(40, '-'));
    session.messages.forEach((m) => {
      const who = m.role === 'user' ? 'Tú' : 'SantitosIA';
      lines.push(`[${who}] ${m.content || ''}`);
      lines.push('');
    });
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(session.title || 'chat').replace(/[^\w\-áéíóúñü ]+/gi, '').trim() || 'chat'}.${format === 'md' ? 'md' : 'txt'}`;
  a.click();
  URL.revokeObjectURL(a.href);
  showChatToast(format === 'md' ? 'Chat exportado en Markdown.' : 'Chat exportado en texto.');
}
function collectAllAttachments() {
  const list = [];
  chatSessions.forEach((session) => {
    (session.messages || []).forEach((m) => {
      (m.attachments || []).forEach((file) => {
        list.push({
          name: file.name,
          type: file.type || '',
          size: file.size || 0,
          sessionId: session.id,
          sessionTitle: session.title,
          timestamp: m.timestamp || session.updatedAt || 0,
        });
      });
    });
  });
  return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
async function callCompanionAI({ messages, mode: requestMode = 'chat', images = [] }) {
  const prefs = getCompanionPrefs();
  const plan = chatEls.model && chatEls.model.value === 'pro' ? 'pro' : 'jr';
  const { data, error } = await sb.functions.invoke('chat', {
    body: {
      mode: requestMode,
      plan,
      character: prefs.character,
      appearance: prefs.appearance,
      messages,
      images: images.slice(0, 2),
    },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
    throw new Error('La IA no devolvió una respuesta válida. Inténtalo de nuevo.');
  }
  return data;
}

async function callStandaloneAI(options) {
  if (aiRequestInProgress) throw new Error('Espera a que termine la respuesta actual.');
  aiRequestInProgress = true;
  try { return await callCompanionAI(options); }
  finally { aiRequestInProgress = false; }
}

async function generateReplyForSession(session, options = {}) {
  if (!session || aiRequestInProgress) return;
  aiRequestInProgress = true;
  if (chatEls.send) chatEls.send.disabled = true;
  showTypingIndicator();
  let assistantMessage;
  const prefs = getCompanionPrefs();
  const plan = chatEls.model && chatEls.model.value === 'pro' ? 'pro' : 'jr';
  try {
    const attachments = options.files ? await readAttachmentData(options.files) : { text: options.extraText || '', images: options.images || [] };
    if (attachments.text && session.messages.length) {
      for (let i = session.messages.length - 1; i >= 0; i--) {
        if (session.messages[i].role === 'user') {
          session.messages[i].aiContextText = attachments.text.slice(0, 80000);
          break;
        }
      }
    }
    const contextMessages = session.messages
      .filter((message) => !message.failed && (message.role === 'user' || message.role === 'assistant'))
      .slice(-16)
      .map((message) => ({
        role: message.role,
        content: `${String(message.content || '')}${message.role === 'user' && message.aiContextText ? `\n\n${message.aiContextText}` : ''}`.slice(0, 85000),
      }));
    const result = await callCompanionAI({ messages: contextMessages, images: attachments.images, mode: options.mode || 'chat' });
    assistantMessage = {
      role: 'assistant', timestamp: Date.now(), content: result.reply,
      character: prefs.character, appearance: prefs.appearance, plan,
      usage: result.usage || null,
    };
  } catch (error) {
    const message = error && error.message ? error.message : 'No se ha podido contactar con la IA.';
    assistantMessage = {
      role: 'assistant', timestamp: Date.now(), content: message,
      character: prefs.character, appearance: prefs.appearance, plan, failed: true,
    };
    showChatToast(message, { important: true });
  } finally {
    removeTypingIndicator();
    aiRequestInProgress = false;
    if (chatEls.send) chatEls.send.disabled = false;
  }
  session.messages.push(assistantMessage);
  session.updatedAt = Date.now();
  saveChatSessions();
  renderRecentChats();
  if (activeChatId === session.id && activeChatSection === 'chat') {
    renderConversation(session.id);
  }
  if (!assistantMessage.failed && prefs.autoVoice) speakText(assistantMessage.content);
}

function regenerateLastAssistant() {
  const session = activeSession();
  if (!session || aiRequestInProgress) return;
  let lastUserIndex = -1;
  for (let i = session.messages.length - 1; i >= 0; i--) {
    if (session.messages[i].role === 'user') { lastUserIndex = i; break; }
  }
  if (lastUserIndex < 0) return;
  session.messages = session.messages.slice(0, lastUserIndex + 1);
  session.updatedAt = Date.now();
  saveChatSessions();
  renderConversation(session.id);
  generateReplyForSession(session);
}

function editLastUserMessage() {
  const session = activeSession();
  if (!session || !session.messages.length || aiRequestInProgress) return;
  let lastIdx = -1;
  for (let i = session.messages.length - 1; i >= 0; i--) {
    if (session.messages[i].role === 'user') { lastIdx = i; break; }
  }
  if (lastIdx < 0) return;
  const current = session.messages[lastIdx].content || '';
  const next = window.prompt('Editar tu último mensaje:', current);
  if (next === null) return;
  const text = next.trim();
  if (!text) { showChatToast('El mensaje no puede estar vacío.'); return; }
  session.messages[lastIdx].content = text;
  session.messages = session.messages.slice(0, lastIdx + 1);
  session.updatedAt = Date.now();
  saveChatSessions();
  renderConversation(session.id);
  generateReplyForSession(session);
}

function makeFieldLabel(text, control) {
  const label = document.createElement('label');
  label.className = 'journal-field-label';
  label.append(document.createTextNode(text), control);
  return label;
}

function downloadTextFile(filename, text, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderDiaryPanel(panel, kicker, heading, description) {
  kicker.textContent = 'TU ESPACIO PERSONAL';
  heading.textContent = 'Mi diario';
  description.textContent = 'Escribe para ti, pide ayuda a la IA para redactar y decide entrada por entrada qué quieres compartir.';
  const tools = document.createElement('div'); tools.className = 'journal-toolbar';
  const newButton = document.createElement('button'); newButton.type = 'button'; newButton.className = 'new-chat-button'; newButton.textContent = '+ Nueva entrada';
  const summaryButton = document.createElement('button'); summaryButton.type = 'button'; summaryButton.className = 'panel-tool-btn'; summaryButton.textContent = 'Preparar resumen de hoy';
  const exportButton = document.createElement('button'); exportButton.type = 'button'; exportButton.className = 'panel-tool-btn'; exportButton.textContent = 'Exportar diario';
  tools.append(newButton, summaryButton, exportButton);

  const form = document.createElement('form'); form.className = 'journal-editor'; form.hidden = true;
  const formTitle = document.createElement('h3'); formTitle.textContent = 'Nueva entrada';
  const titleInput = document.createElement('input'); titleInput.className = 'journal-input'; titleInput.placeholder = 'Título de la entrada'; titleInput.maxLength = 160; titleInput.required = true;
  const categorySelect = document.createElement('select'); categorySelect.className = 'journal-input';
  ['Personal','Estudios','Trabajo','Objetivos','Recuerdos','Desahogo','Otros'].forEach((category) => {
    const option = document.createElement('option'); option.value = category; option.textContent = category; categorySelect.append(option);
  });
  const contentArea = document.createElement('textarea'); contentArea.className = 'journal-input journal-textarea'; contentArea.placeholder = '¿Qué te gustaría recordar?'; contentArea.rows = 7; contentArea.maxLength = 20000; contentArea.required = true;
  const visibilitySelect = document.createElement('select'); visibilitySelect.className = 'journal-input';
  [['private','Solo yo (privado)'],['companion','Compartir con mi compañero']].forEach(([value,label]) => {
    const option = document.createElement('option'); option.value = value; option.textContent = label; visibilitySelect.append(option);
  });
  const privacyHelp = document.createElement('p'); privacyHelp.className = 'settings-hint'; privacyHelp.textContent = 'Una entrada privada no se envía a la IA por defecto. Si compartes una entrada, solo se enviará al chat cuando pulses “Comentar con IA”.';
  const actions = document.createElement('div'); actions.className = 'journal-editor-actions';
  const saveButton = document.createElement('button'); saveButton.type = 'submit'; saveButton.className = 'btn btn-primary btn-small'; saveButton.textContent = 'Guardar entrada';
  const draftButton = document.createElement('button'); draftButton.type = 'button'; draftButton.className = 'panel-tool-btn'; draftButton.textContent = 'Redactar con IA';
  const cancelButton = document.createElement('button'); cancelButton.type = 'button'; cancelButton.className = 'panel-tool-btn'; cancelButton.textContent = 'Cancelar';
  actions.append(saveButton, draftButton, cancelButton);
  form.append(formTitle, makeFieldLabel('Título', titleInput), makeFieldLabel('Categoría', categorySelect), makeFieldLabel('Contenido', contentArea), makeFieldLabel('Privacidad', visibilitySelect), privacyHelp, actions);

  const searchInput = document.createElement('input'); searchInput.type = 'search'; searchInput.className = 'journal-search'; searchInput.placeholder = 'Buscar en tus entradas…'; searchInput.setAttribute('aria-label', 'Buscar en el diario por título, contenido o categoría');
  const listHeading = document.createElement('h3'); listHeading.className = 'journal-list-heading'; listHeading.textContent = 'Tus entradas';
  const list = document.createElement('div'); list.className = 'journal-list';
  const status = document.createElement('p'); status.className = 'settings-hint'; status.textContent = 'Cargando las entradas de tu diario…';
  list.append(status);
  panel.append(kicker, heading, description, tools, searchInput, form, listHeading, list);

  let entries = [];
  let editingId = null;
  const setStatus = (message, error = false) => {
    status.textContent = message; status.classList.toggle('journal-error', error); status.hidden = !message;
  };
  const openEditor = (entry = null) => {
    editingId = entry ? entry.id : null;
    formTitle.textContent = entry ? 'Editar entrada' : 'Nueva entrada';
    titleInput.value = entry ? entry.title : '';
    categorySelect.value = entry ? entry.category : 'Personal';
    contentArea.value = entry ? entry.content : '';
    visibilitySelect.value = entry ? entry.visibility : 'private';
    saveButton.textContent = entry ? 'Guardar cambios' : 'Guardar entrada';
    form.hidden = false; titleInput.focus();
  };
  newButton.addEventListener('click', () => openEditor());
  cancelButton.addEventListener('click', () => { form.hidden = true; editingId = null; });

  async function loadEntries() {
    if (!chatUserId) { list.replaceChildren(status); setStatus('Inicia sesión para utilizar tu diario.', true); return; }
    const { data, error } = await sb.from('journal_entries').select('id,title,content,category,visibility,created_at,updated_at').eq('user_id', chatUserId).order('updated_at', { ascending: false }).limit(100);
    if (error) {
      list.replaceChildren(status);
      setStatus('No se pudo cargar el diario. Comprueba que has ejecutado el archivo SQL de configuración incluido en el ZIP. No se ha guardado nada localmente.', true);
      console.error('Error loading journal:', error.message);
      return;
    }
    entries = data || [];
    renderEntries();
  }

  function renderEntries() {
    const query = searchInput.value.trim().toLocaleLowerCase('es');
    const visibleEntries = entries.filter((entry) => !query || [entry.title, entry.content, entry.category].some((value) => String(value || '').toLocaleLowerCase('es').includes(query)));
    list.replaceChildren(status);
    if (!visibleEntries.length) {
      setStatus(entries.length ? 'No hay entradas que coincidan con la búsqueda.' : 'Todavía no tienes entradas. Tu diario es privado por defecto.');
      return;
    }
    setStatus('');
    visibleEntries.forEach((entry) => {
      const card = document.createElement('article'); card.className = 'journal-entry-card';
      const head = document.createElement('div'); head.className = 'journal-entry-head';
      const entryTitle = document.createElement('h4'); entryTitle.textContent = entry.title;
      const meta = document.createElement('div'); meta.className = 'journal-entry-meta';
      const date = new Date(entry.updated_at || entry.created_at);
      meta.textContent = `${entry.category || 'Personal'} · ${date.toLocaleDateString('es-ES')} · ${entry.visibility === 'companion' ? 'Compartida con tu compañero' : 'Privada'}`;
      head.append(entryTitle, meta);
      const body = document.createElement('p'); body.className = 'journal-entry-content'; body.textContent = entry.content;
      const row = document.createElement('div'); row.className = 'journal-entry-actions';
      const tool = (label, handler, danger = false) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'panel-tool-btn' + (danger ? ' journal-danger' : ''); button.textContent = label; button.addEventListener('click', handler); return button;
      };
      row.append(tool('Editar', () => openEditor(entry)));
      row.append(tool('Descargar', () => downloadTextFile(`${(entry.title || 'diario').replace(/[^\w\- áéíóúñü]/gi, '').trim() || 'diario'}.md`, `# ${entry.title}\n\nFecha: ${date.toLocaleDateString('es-ES')}\nCategoría: ${entry.category}\nPrivacidad: ${entry.visibility === 'companion' ? 'Compartida con el compañero' : 'Privada'}\n\n${entry.content}\n`)));
      if (entry.visibility === 'companion') {
        row.append(tool('Comentar con IA', () => shareEntryWithChat(entry, false)));
      } else {
        row.append(tool('Compartir con compañero', () => shareEntryWithChat(entry, true)));
      }
      row.append(tool('Borrar', async () => {
        if (!window.confirm(`¿Borrar la entrada «${entry.title}»? Esta acción no se puede deshacer.`)) return;
        const { error: deleteError } = await sb.from('journal_entries').delete().eq('id', entry.id).eq('user_id', chatUserId);
        if (deleteError) { showChatToast('No se pudo borrar la entrada.', { important: true }); return; }
        showChatToast('Entrada eliminada.'); await loadEntries();
      }, true));
      card.append(head, body, row); list.append(card);
    });
  }

  searchInput.addEventListener('input', renderEntries);

  async function shareEntryWithChat(entry, changeVisibility) {
    if (aiRequestInProgress) { showChatToast('Espera a que termine la respuesta actual.'); return; }
    if (changeVisibility) {
      const confirmed = window.confirm(`Para comentar «${entry.title}», se compartirá esta entrada con tu compañero. La IA recibirá el contenido solo al abrir esta conversación. ¿Continuar?`);
      if (!confirmed) return;
      const { error } = await sb.from('journal_entries').update({ visibility: 'companion' }).eq('id', entry.id).eq('user_id', chatUserId);
      if (error) { showChatToast('No se pudo cambiar la privacidad de la entrada.', { important: true }); return; }
      entry.visibility = 'companion'; await loadEntries();
    } else {
      const confirmed = window.confirm(`Vas a enviar «${entry.title}» al chat con tu compañero para comentarla. ¿Continuar?`);
      if (!confirmed) return;
    }
    const prompt = `Quiero comentar contigo esta entrada de mi diario. Ayúdame a reflexionar sobre ella y escucha antes de dar consejos.\n\nTítulo: ${entry.title}\nCategoría: ${entry.category}\nContenido:\n${entry.content}`;
    openChatSection('chat');
    chatEls.input.value = prompt; resizeChatInput();
    const sendPromise = sendChatMessage(prompt);
    chatEls.input.value = ''; resizeChatInput();
    await sendPromise;
  }

  summaryButton.addEventListener('click', async () => {
    if (aiRequestInProgress) { showChatToast('Espera a que termine la respuesta actual.'); return; }
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEntries = entries.filter((entry) => new Date(entry.created_at).getTime() >= today.getTime());
    if (!todayEntries.length) { showChatToast('Todavía no hay entradas de hoy que resumir.'); return; }
    if (!window.confirm('Se enviará a la IA el contenido de las entradas de hoy que has guardado en el diario para preparar un resumen. ¿Continuar?')) return;
    summaryButton.disabled = true; summaryButton.textContent = 'Preparando…';
    try {
      const source = todayEntries.map((entry) => `- ${entry.title}: ${entry.content}`).join('\n');
      const result = await callStandaloneAI({ mode: 'journal_draft', messages: [{ role: 'user', content: `Prepara un resumen diario fiel y claro a partir de estas entradas. No inventes nada. Devuelve solo el resumen.\n\n${source}` }] });
      openEditor(); titleInput.value = `Resumen del día · ${new Date().toLocaleDateString('es-ES')}`; categorySelect.value = 'Recuerdos'; contentArea.value = result.reply; visibilitySelect.value = 'private';
      showChatToast('Resumen preparado como borrador; revísalo y guárdalo cuando quieras.');
    } catch (error) { showChatToast(error.message || 'No se pudo preparar el resumen.', { important: true }); }
    finally { summaryButton.disabled = false; summaryButton.textContent = 'Preparar resumen de hoy'; }
  });

  exportButton.addEventListener('click', () => {
    if (!entries.length) { showChatToast('Tu diario todavía está vacío.'); return; }
    const text = entries.map((entry) => `# ${entry.title}\nFecha: ${new Date(entry.created_at).toLocaleDateString('es-ES')}\nCategoría: ${entry.category}\nPrivacidad: ${entry.visibility === 'companion' ? 'Compartida' : 'Privada'}\n\n${entry.content}\n\n---\n`).join('\n');
    downloadTextFile('mi-diario-santitosia.md', text);
  });

  draftButton.addEventListener('click', async () => {
    const source = contentArea.value.trim();
    if (!source) { showChatToast('Escribe primero algunas ideas para que la IA las redacte.'); contentArea.focus(); return; }
    if (aiRequestInProgress) { showChatToast('Espera a que termine la respuesta actual.'); return; }
    draftButton.disabled = true; draftButton.textContent = 'Redactando…';
    try {
      const result = await callStandaloneAI({ mode: 'journal_draft', messages: [{ role: 'user', content: `Convierte estas notas en una entrada de diario natural y fiel. No inventes hechos ni emociones. Conserva la intención y el tono original.\n\n${source}` }] });
      contentArea.value = result.reply; showChatToast('Borrador preparado. Revísalo antes de guardarlo.');
    } catch (error) { showChatToast(error.message || 'No se pudo redactar la entrada.', { important: true }); }
    finally { draftButton.disabled = false; draftButton.textContent = 'Redactar con IA'; }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim(); const content = contentArea.value.trim();
    if (!title || !content) { showChatToast('Escribe un título y el contenido de la entrada.'); return; }
    if (content.length > 20000) { showChatToast('La entrada no puede superar los 20 000 caracteres.'); return; }
    saveButton.disabled = true; saveButton.textContent = 'Guardando…';
    const values = { title: title.slice(0,160), content, category: categorySelect.value, visibility: visibilitySelect.value };
    const result = editingId
      ? await sb.from('journal_entries').update(values).eq('id', editingId).eq('user_id', chatUserId)
      : await sb.from('journal_entries').insert({ ...values, user_id: chatUserId });
    saveButton.disabled = false; saveButton.textContent = editingId ? 'Guardar cambios' : 'Guardar entrada';
    if (result.error) { showChatToast('No se pudo guardar la entrada. Comprueba la configuración del diario en Supabase.', { important: true }); return; }
    showChatToast(editingId ? 'Entrada actualizada.' : 'Entrada guardada.'); form.hidden = true; editingId = null; await loadEntries();
  });
  loadEntries();
}

function renderCompanionPanel(panel, kicker, heading, description) {
  kicker.textContent = 'PERSONALIZA TU COMPAÑERO';
  heading.textContent = 'Elige tu avatar';
  description.textContent = 'Selecciona la apariencia de tu asistente. El avatar se mostrará junto a sus respuestas y puedes cambiarlo cuando quieras.';

  const prefs = getCompanionPrefs();
  const card = document.createElement('div');
  card.className = 'settings-card companion-settings-card';

  const preview = document.createElement('div');
  preview.className = 'companion-preview';
  const avatar = document.createElement('div');
  avatar.className = `companion-preview-avatar companion-avatar-${getCharacterInfo(prefs.character).color}`;
  const previewCopy = document.createElement('div');
  previewCopy.className = 'companion-preview-copy';
  const name = document.createElement('strong');
  name.className = 'companion-preview-name';
  const detail = document.createElement('p');
  detail.className = 'settings-hint';
  const status = document.createElement('span');
  status.className = 'companion-preview-status';
  status.textContent = 'AVATAR SELECCIONADO';
  previewCopy.append(name, detail, status);
  preview.append(avatar, previewCopy);

  const selectorHeading = document.createElement('div');
  selectorHeading.className = 'companion-selector-heading';
  const selectorTitle = document.createElement('strong');
  selectorTitle.textContent = 'Tu asistente';
  const selectorHelp = document.createElement('span');
  selectorHelp.textContent = '3 avatares disponibles';
  selectorHeading.append(selectorTitle, selectorHelp);

  const characterGrid = document.createElement('div');
  characterGrid.className = 'companion-character-grid';
  const characterButtons = new Map();
  const characterChoices = [
    { id: 'santitos', label: 'SantitosIA', type: 'Masculino', detail: 'Directo y resolutivo' },
    { id: 'syntia', label: 'SantitosIA', type: 'Femenino', detail: 'Cercana e ingeniosa' },
    { id: 'jr', label: 'Santitos Jr.', type: 'Joven', detail: 'Expresivo y desenfadado' },
  ];

  const appearanceSelect = document.createElement('select');
  appearanceSelect.className = 'settings-model-select';
  appearanceSelect.setAttribute('aria-label', 'Apariencia del avatar');
  [['human','Avatar humano'],['wolf','Forma de lobo']].forEach(([value,label]) => {
    const option = document.createElement('option'); option.value = value; option.textContent = label; appearanceSelect.append(option);
  });
  appearanceSelect.value = prefs.appearance;

  const voiceSelect = document.createElement('select');
  voiceSelect.className = 'settings-model-select';
  voiceSelect.setAttribute('aria-label', 'Voz del asistente');
  const updateVoiceList = () => {
    const previous = getCompanionPrefs().voiceURI;
    voiceSelect.replaceChildren();
    const auto = document.createElement('option'); auto.value = ''; auto.textContent = 'Voz en español predeterminada'; voiceSelect.append(auto);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices().filter((voice) => /^es(-|_)/i.test(voice.lang)).forEach((voice) => {
        const option = document.createElement('option'); option.value = voice.voiceURI; option.textContent = `${voice.name} (${voice.lang})`; voiceSelect.append(option);
      });
    }
    voiceSelect.value = Array.from(voiceSelect.options).some((option) => option.value === previous) ? previous : '';
  };
  updateVoiceList();
  if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = updateVoiceList;

  const autoRow = document.createElement('label'); autoRow.className = 'companion-voice-toggle';
  const autoCheckbox = document.createElement('input'); autoCheckbox.type = 'checkbox'; autoCheckbox.checked = prefs.autoVoice;
  const autoText = document.createElement('span'); autoText.textContent = 'Reproducir automáticamente las respuestas';
  autoRow.append(autoCheckbox, autoText);
  const voiceHelp = document.createElement('p'); voiceHelp.className = 'settings-hint';
  voiceHelp.textContent = 'La voz depende del sintetizador disponible en tu navegador o dispositivo.';

  const refreshPreview = () => {
    const current = getCompanionPrefs();
    const info = getCharacterInfo(current.character);
    name.textContent = info.name;
    const characterDescription = current.character === 'santitos'
      ? 'Avatar masculino · directo, maduro y con carácter'
      : current.character === 'syntia'
        ? 'Avatar femenino · cercana, ingeniosa y resolutiva'
        : 'Avatar juvenil · expresivo y desenfadado';
    detail.textContent = `${current.appearance === 'wolf' ? 'Forma de lobo' : characterDescription}`;
    avatar.className = `companion-preview-avatar companion-avatar-${info.color}${current.appearance === 'wolf' ? ' companion-preview-wolf' : ''}`;
    avatar.replaceChildren();
    const img = document.createElement('img');
    img.src = current.appearance === 'wolf' ? 'assets/logo.png' : `assets/characters/${current.character}.svg`;
    img.alt = `${info.selectorName || info.name}`;
    avatar.append(img);
    characterButtons.forEach((button, id) => {
      const selected = id === current.character;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      const mark = button.querySelector('.companion-character-check');
      if (mark) mark.textContent = selected ? '✓' : '+';
      const image = button.querySelector('img');
      if (image) {
        image.src = current.appearance === 'wolf' ? 'assets/logo.png' : `assets/characters/${id}.svg`;
        image.alt = `${getCharacterInfo(id).selectorName || getCharacterInfo(id).name}`;
      }
    });
  };

  characterChoices.forEach((choice) => {
    const info = getCharacterInfo(choice.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `companion-character-option companion-option-${info.color}`;
    button.dataset.character = choice.id;
    button.setAttribute('aria-label', `${choice.label}, ${choice.type}`);
    const imageFrame = document.createElement('span'); imageFrame.className = 'companion-character-image';
    const image = document.createElement('img'); image.src = `assets/characters/${choice.id}.svg`; image.alt = ''; image.loading = 'lazy';
    imageFrame.append(image);
    const copy = document.createElement('span'); copy.className = 'companion-character-copy';
    const title = document.createElement('strong'); title.textContent = choice.label;
    const type = document.createElement('small'); type.className = 'companion-character-type'; type.textContent = choice.type;
    const text = document.createElement('span'); text.className = 'companion-character-detail'; text.textContent = choice.detail;
    copy.append(title, type, text);
    const check = document.createElement('span'); check.className = 'companion-character-check'; check.setAttribute('aria-hidden', 'true');
    button.append(imageFrame, copy, check);
    button.addEventListener('click', () => {
      saveCompanionPrefs({ character: choice.id });
      refreshPreview();
    });
    characterButtons.set(choice.id, button);
    characterGrid.append(button);
  });

  appearanceSelect.addEventListener('change', () => { saveCompanionPrefs({ appearance: appearanceSelect.value }); refreshPreview(); });
  autoCheckbox.addEventListener('change', () => saveCompanionPrefs({ autoVoice: autoCheckbox.checked }));
  voiceSelect.addEventListener('change', () => saveCompanionPrefs({ voiceURI: voiceSelect.value }));

  const settingsDivider = document.createElement('div'); settingsDivider.className = 'companion-settings-divider';
  const appearanceLabel = makeFieldLabel('Apariencia', appearanceSelect);
  const voiceLabel = makeFieldLabel('Voz', voiceSelect);
  const voiceSettings = document.createElement('div'); voiceSettings.className = 'companion-voice-settings';
  voiceSettings.append(appearanceLabel, voiceLabel, autoRow, voiceHelp);
  const testRow = document.createElement('div'); testRow.className = 'settings-actions';
  const testVoice = document.createElement('button'); testVoice.type = 'button'; testVoice.className = 'panel-tool-btn'; testVoice.textContent = 'Probar voz';
  testVoice.addEventListener('click', () => speakText(`Hola, soy ${getCharacterInfo(getCompanionPrefs().character).name}. Esta es mi voz. ¿Qué te apetece hacer hoy?`));
  const stopVoice = document.createElement('button'); stopVoice.type = 'button'; stopVoice.className = 'panel-tool-btn'; stopVoice.textContent = 'Detener voz'; stopVoice.addEventListener('click', stopSpeaking);
  testRow.append(testVoice, stopVoice);
  card.append(preview, selectorHeading, characterGrid, settingsDivider, voiceSettings, testRow);
  panel.append(kicker, heading, description, card);
  refreshPreview();
}
function showPanel(section) {
  setActiveNav(section);
  // La pantalla "¿Qué tienes en mente?" solo pertenece al chat vacío; nunca en historial/archivos/configuración
  if (chatEls.welcome) {
    chatEls.welcome.hidden = true;
    chatEls.welcome.setAttribute('aria-hidden', 'true');
  }
  if (chatEls.messages) chatEls.messages.replaceChildren();
  if (chatEls.previewNotice) chatEls.previewNotice.hidden = true;
  const panel = document.createElement('section'); panel.className = 'chat-panel-view';
  const kicker = document.createElement('div'); kicker.className = 'panel-kicker';
  const heading = document.createElement('h2'); const description = document.createElement('p');
  if (section === 'history') {
    kicker.textContent = 'TUS CONVERSACIONES'; heading.textContent = 'Historial';
    description.textContent = chatSessions.length ? 'Busca, abre, renombra, exporta o borra tus conversaciones.' : 'Cuando empieces a conversar, tus chats recientes aparecerán aquí.';
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'panel-search';
    search.placeholder = 'Buscar por título…';
    search.setAttribute('aria-label', 'Buscar conversaciones');
    const list = document.createElement('div');
    list.className = 'panel-history-list';
    function paintHistory(filter) {
      list.replaceChildren();
      const q = (filter || '').trim().toLowerCase();
      const items = [...chatSessions]
        .sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .filter((s) => !q || String(s.title || '').toLowerCase().includes(q));
      if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'settings-hint';
        empty.textContent = chatSessions.length ? 'Ninguna conversación coincide con la búsqueda.' : 'Aún no hay conversaciones.';
        list.append(empty);
        return;
      }
      items.forEach((session) => {
        const row = document.createElement('div');
        row.className = 'panel-history-item panel-history-row';
        const main = document.createElement('button');
        main.type = 'button';
        main.className = 'panel-history-main';
        const title = document.createElement('strong'); title.textContent = session.title;
        const meta = document.createElement('small');
        meta.textContent = `${session.messages.length} mensajes · ${new Date(session.updatedAt || Date.now()).toLocaleDateString('es-ES')}`;
        main.append(title, meta);
        main.addEventListener('click', () => renderConversation(session.id));
        const tools = document.createElement('div');
        tools.className = 'panel-history-tools';
        const mk = (label, fn) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'panel-tool-btn';
          b.textContent = label;
          b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
          return b;
        };
        tools.append(
          mk('Renombrar', () => renameSession(session.id)),
          mk('Exportar', () => exportSession(session.id, 'md')),
          mk('Borrar', () => deleteSession(session.id))
        );
        row.append(main, tools);
        list.append(row);
      });
    }
    search.addEventListener('input', () => paintHistory(search.value));
    if (chatSessions.length) {
      panel.append(kicker, heading, description, search, list);
      paintHistory('');
    } else {
      panel.append(kicker, heading, description);
    }
  } else if (section === 'files') {
    kicker.textContent = 'DOCUMENTOS E IMÁGENES'; heading.textContent = 'Tus archivos';
    description.textContent = 'Archivos adjuntados en tus conversaciones de este navegador. Los archivos de texto compatibles y las imágenes pequeñas se procesan al enviarlos en el chat; los ZIP no se extraen automáticamente.';
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'new-chat-button';
    action.innerHTML = '<span class="new-chat-icon" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span> Seleccionar archivos';
    action.addEventListener('click', () => chatEls.fileInput && chatEls.fileInput.click());
    const files = collectAllAttachments();
    const list = document.createElement('div');
    list.className = 'panel-files-list';
    if (!files.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-hint';
      empty.textContent = 'Todavía no has adjuntado archivos en ningún chat.';
      list.append(empty);
    } else {
      files.slice(0, 40).forEach((file) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'panel-file-item';
        const icon = file.type.startsWith('image/') ? '▧' : '▤';
        row.innerHTML = `<span class="panel-file-icon">${icon}</span><span class="panel-file-copy"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(file.sessionTitle || 'Chat')} · ${new Date(file.timestamp || Date.now()).toLocaleDateString('es-ES')}</small></span>`;
        row.addEventListener('click', () => renderConversation(file.sessionId));
        list.append(row);
      });
    }
    panel.append(kicker, heading, description, action, list);
  } else if (section === 'diary') {
    renderDiaryPanel(panel, kicker, heading, description);
  } else if (section === 'companion') {
    renderCompanionPanel(panel, kicker, heading, description);
  } else if (section === 'settings') {
    kicker.textContent = 'PERSONALIZA TU EXPERIENCIA';
    heading.textContent = 'Configuración';
    description.textContent = 'Ajusta tu cuenta, tu avatar y las preferencias guardadas en este navegador.';

    const settingsBody = document.createElement('div');
    settingsBody.className = 'settings-body';

    // Account card
    const accountCard = document.createElement('div');
    accountCard.className = 'settings-card';
    const accountTitle = document.createElement('div');
    accountTitle.className = 'settings-card-title';
    accountTitle.innerHTML = '<span class="settings-card-icon">◉</span><span>Cuenta</span>';
    const accountRow = document.createElement('div');
    accountRow.className = 'settings-account-row';
    const accountAvatar = document.createElement('div');
    accountAvatar.className = 'settings-account-avatar';
    const existingAvatar = getCustomUserAvatar();
    if (existingAvatar) {
      const aimg = document.createElement('img');
      aimg.src = existingAvatar;
      aimg.alt = 'Tu avatar';
      accountAvatar.append(aimg);
      accountAvatar.classList.add('has-photo');
    } else {
      accountAvatar.textContent = ((chatEls.userName && chatEls.userName.textContent) || 'S').charAt(0).toLocaleUpperCase('es');
    }
    const accountMeta = document.createElement('div');
    accountMeta.className = 'settings-account-meta';
    const accountName = document.createElement('strong');
    accountName.textContent = (chatEls.userName && chatEls.userName.textContent) || 'Mi cuenta';
    const accountDetail = document.createElement('span');
    accountDetail.textContent = currentAuthUser && currentAuthUser.email
      ? currentAuthUser.email
      : 'Sesión local en este navegador';
    accountMeta.append(accountName, accountDetail);
    const planPill = document.createElement('span');
    planPill.className = 'settings-plan-pill' + ((chatEls.model && chatEls.model.value === 'pro') ? ' pro' : '');
    planPill.textContent = (chatEls.model && chatEls.model.value === 'pro') ? 'Premium' : 'Gratis';
    accountRow.append(accountAvatar, accountMeta, planPill);
    accountCard.append(accountTitle, accountRow);

    if (currentAuthUser && currentAuthUser.email) {
      const emailBlock = document.createElement('div');
      emailBlock.className = 'settings-email-block';
      const emailLabel = document.createElement('label');
      emailLabel.textContent = 'Cambiar correo';
      emailLabel.setAttribute('for', 'settingsEmailInput');
      const emailInput = document.createElement('input');
      emailInput.id = 'settingsEmailInput';
      emailInput.type = 'email';
      emailInput.className = 'settings-text-input';
      emailInput.value = currentAuthUser.email;
      emailInput.autocomplete = 'email';
      const emailBtn = document.createElement('button');
      emailBtn.type = 'button';
      emailBtn.className = 'settings-secondary-btn';
      emailBtn.textContent = 'Guardar correo';
      emailBtn.addEventListener('click', async () => {
        const next = (emailInput.value || '').trim();
        if (!next || !next.includes('@')) {
          showChatToast('Introduce un correo válido.');
          return;
        }
        if (next === currentAuthUser.email) {
          showChatToast('Es el mismo correo.');
          return;
        }
        emailBtn.disabled = true;
        emailBtn.textContent = 'Guardando…';
        try {
          const { data, error } = await sb.auth.updateUser({ email: next });
          if (error) throw error;
          showChatToast('Revisa el correo nuevo para confirmar el cambio.');
          if (data && data.user) setUser(data.user);
        } catch (err) {
          showChatToast((err && err.message) || 'No se pudo cambiar el correo.');
        } finally {
          emailBtn.disabled = false;
          emailBtn.textContent = 'Guardar correo';
        }
      });
      emailBlock.append(emailLabel, emailInput, emailBtn);
      accountCard.append(emailBlock);
    }

    // Avatar del usuario
    const logoCard = document.createElement('div');
    logoCard.className = 'settings-card';
    const logoTitle = document.createElement('div');
    logoTitle.className = 'settings-card-title';
    logoTitle.innerHTML = '<span class="settings-card-icon">◉</span><span>Tu avatar</span>';
    const logoHint = document.createElement('p');
    logoHint.className = 'settings-hint';
    logoHint.textContent = 'Esta imagen te representa a ti en el chat y en tu cuenta.';
    const logoRow = document.createElement('div');
    logoRow.className = 'settings-logo-row';
    const logoPreview = document.createElement('div');
    logoPreview.className = 'settings-logo-preview settings-user-avatar-preview';
    const customAvatar = getCustomUserAvatar();
    if (customAvatar) {
      const logoImg = document.createElement('img');
      logoImg.src = customAvatar;
      logoImg.alt = 'Tu avatar';
      logoPreview.append(logoImg);
      logoPreview.classList.add('has-photo');
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'settings-avatar-placeholder';
      placeholder.textContent = ((chatEls.userName && chatEls.userName.textContent) || 'S').charAt(0).toLocaleUpperCase('es');
      logoPreview.append(placeholder);
    }
    const logoActions = document.createElement('div');
    logoActions.className = 'settings-logo-actions';
    const logoFile = document.createElement('input');
    logoFile.type = 'file';
    logoFile.accept = 'image/png,image/jpeg,image/webp,image/gif';
    logoFile.hidden = true;
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'settings-secondary-btn';
    uploadBtn.textContent = 'Subir foto';
    uploadBtn.addEventListener('click', () => logoFile.click());
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'settings-ghost-btn';
    resetBtn.textContent = 'Quitar foto';
    resetBtn.addEventListener('click', () => {
      clearCustomUserAvatar();
      applyUserAvatarEverywhere();
      showChatToast('Avatar restablecido.');
      showPanel('settings');
    });
    logoFile.addEventListener('change', () => {
      const file = logoFile.files && logoFile.files[0];
      if (!file) return;
      if (file.size > 2.5 * 1024 * 1024) {
        showChatToast('La imagen es demasiado grande (máx. 2,5 MB).');
        logoFile.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (!dataUrl.startsWith('data:image/')) {
          showChatToast('No se pudo leer la imagen.');
          return;
        }
        safeSave(userAvatarStorageKey(), dataUrl);
        applyUserAvatarEverywhere();
        showChatToast('Avatar actualizado.');
        showPanel('settings');
      };
      reader.onerror = () => showChatToast('No se pudo cargar la imagen.');
      reader.readAsDataURL(file);
      logoFile.value = '';
    });
    logoActions.append(uploadBtn, resetBtn, logoFile);
    logoRow.append(logoPreview, logoActions);
    logoCard.append(logoTitle, logoHint, logoRow);

    // Preferences
    const prefsCard = document.createElement('div');
    prefsCard.className = 'settings-card';
    const prefsTitle = document.createElement('div');
    prefsTitle.className = 'settings-card-title';
    prefsTitle.innerHTML = '<span class="settings-card-icon">⚙</span><span>Preferencias</span>';

    function makeToggle(key, title, subtitle, initial, onChange) {
      const row = document.createElement('div');
      row.className = 'settings-toggle-row';
      const copy = document.createElement('div');
      copy.className = 'settings-toggle-copy';
      copy.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'settings-toggle' + (initial ? ' on' : '');
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(!!initial));
      toggle.innerHTML = '<span class="settings-toggle-knob"></span>';
      toggle.addEventListener('click', () => {
        const next = !toggle.classList.contains('on');
        toggle.classList.toggle('on', next);
        toggle.setAttribute('aria-checked', String(next));
        onChange(next);
      });
      row.append(copy, toggle);
      return row;
    }

    const webRow = makeToggle(
      'web',
      'Búsqueda web',
      'Activa el botón de búsqueda en la barra del chat (vista previa).',
      webSearchEnabled,
      (next) => {
        webSearchEnabled = next;
        const btn = document.getElementById('webSearchBtn');
        if (btn) btn.setAttribute('aria-pressed', String(next));
        showChatToast(next ? 'Búsqueda web activada (vista previa).' : 'Búsqueda web desactivada.');
      }
    );

    const compactInitial = safeRead(`santitosia:compact:${chatUserId || 'guest'}`) === '1';
    const compactRow = makeToggle(
      'compact',
      'Modo compacto',
      'Reduce el espacio entre mensajes para ver más conversación.',
      compactInitial,
      (next) => {
        safeSave(`santitosia:compact:${chatUserId || 'guest'}`, next ? '1' : '0');
        document.body.classList.toggle('chat-compact', next);
        showChatToast(next ? 'Modo compacto activado.' : 'Modo compacto desactivado.');
      }
    );

    const hintsInitial = safeRead(`santitosia:hints:${chatUserId || 'guest'}`) !== '0';
    const hintsRow = makeToggle(
      'hints',
      'Mostrar atajos',
      'Muestra la pista de Ctrl+K en la pantalla de bienvenida.',
      hintsInitial,
      (next) => {
        safeSave(`santitosia:hints:${chatUserId || 'guest'}`, next ? '1' : '0');
        document.body.classList.toggle('hide-shortcut-hints', !next);
        showChatToast(next ? 'Atajos visibles.' : 'Atajos ocultos.');
      }
    );

    prefsCard.append(prefsTitle, webRow, compactRow, hintsRow);

    // Data / storage
    const dataCard = document.createElement('div');
    dataCard.className = 'settings-card';
    const dataTitle = document.createElement('div');
    dataTitle.className = 'settings-card-title';
    dataTitle.innerHTML = '<span class="settings-card-icon">▤</span><span>Datos en este dispositivo</span>';
    const dataHint = document.createElement('p');
    dataHint.className = 'settings-hint';
    const chatCount = chatSessions.length;
    dataHint.textContent = chatCount
      ? `Tienes ${chatCount} conversación${chatCount === 1 ? '' : 'es'} guardada${chatCount === 1 ? '' : 's'} en este navegador.`
      : 'Todavía no hay conversaciones guardadas en este navegador.';
    const dataActions = document.createElement('div');
    dataActions.className = 'settings-actions';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'settings-danger-btn';
    clearBtn.textContent = 'Borrar historial local';
    clearBtn.addEventListener('click', () => {
      if (!chatSessions.length) {
        showChatToast('No hay historial que borrar.');
        return;
      }
      const ok = window.confirm('¿Borrar todas las conversaciones guardadas en este navegador? Esta acción no se puede deshacer.');
      if (!ok) return;
      chatSessions = [];
      activeChatId = null;
      saveChatSessions();
      renderRecentChats();
      showChatToast('Historial local eliminado.');
      showPanel('settings');
    });
    dataActions.append(clearBtn);
    dataCard.append(dataTitle, dataHint, dataActions);

    settingsBody.append(accountCard, logoCard, prefsCard, dataCard);
    panel.append(kicker, heading, description, settingsBody);
    applyUserAvatarEverywhere();
  }
  chatEls.messages.append(panel);
  chatEls.stage.scrollTop = 0;
}
function safeSave(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
function closeChatSidebar() { if (chatEls.app) chatEls.app.classList.remove('sidebar-open'); }
function openChatSection(section) {
  closeChatSidebar();
  const routes = { chat: 'chat', history: 'history', files: 'Files', diary: 'diary', companion: 'companion', settings: 'Configuration', profile: 'Profile', support: 'Support' };
  const route = routes[section] || 'chat';
  const target = `/SantitosIA/${route}`;
  if (section === 'chat') {
    if (window.location.pathname.replace(/\/+$/, '') !== '/SantitosIA/chat' || window.location.hash) {
      window.history.pushState({ section }, '', target);
    }
    const session = activeSession();
    if (session) renderConversation(session.id); else showChatWelcome();
  } else {
    window.history.pushState({ section }, '', target);
    showPanel(section);
  }
}
function startNewChat() {
  activeChatId = null; selectedAttachments = []; renderAttachmentPreview();
  if (window.location.pathname.replace(/\/+$/, '').toLowerCase() !== '/santitosia/chat' || window.location.hash) {
    window.history.pushState({ section: 'chat' }, '', '/SantitosIA/chat');
  }
  chatEls.input.value = ''; resizeChatInput();
  showChatWelcome(); renderRecentChats(); chatEls.input.focus(); closeChatSidebar();
}
function resizeChatInput() {
  if (!chatEls.input) return;
  chatEls.input.style.height = 'auto';
  chatEls.input.style.height = `${Math.min(chatEls.input.scrollHeight, 180)}px`;
}
async function sendChatMessage(text) {
  const content = String(text || '').trim();
  if ((!content && !selectedAttachments.length) || aiRequestInProgress) return;
  if (!chatUserId) { showLandingView(); openAuth('login'); return; }
  const filesToSend = [...selectedAttachments];
  const attached = filesToSend.map((file) => ({ name: file.name, type: file.type || 'application/octet-stream', size: file.size || 0 }));
  if (!activeSession()) {
    const firstLine = content.split(/\r?\n/)[0].trim();
    const title = firstLine ? (firstLine.length > 42 ? firstLine.slice(0, 39) + '…' : firstLine) : (attached[0] && attached[0].name) || 'Nuevo chat';
    const session = { id: makeId(), title, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    chatSessions.unshift(session); activeChatId = session.id;
  }
  const session = activeSession();
  if (!session) return;
  const userMessage = { role: 'user', content: content || 'Analiza los archivos que he adjuntado.', timestamp: Date.now(), attachments: attached };
  session.messages.push(userMessage);
  session.updatedAt = Date.now();
  if (chatEls.welcome) { chatEls.welcome.hidden = true; chatEls.welcome.setAttribute('aria-hidden', 'true'); }
  if (chatEls.previewNotice) chatEls.previewNotice.hidden = false;
  selectedAttachments = [];
  renderAttachmentPreview();
  saveChatSessions();
  renderRecentChats();
  if (activeChatSection !== 'chat') openChatSection('chat');
  else renderConversation(session.id);
  await generateReplyForSession(session, { files: filesToSend });
}

// Workspace event bindings
if (chatEls.form) {
  chatEls.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (aiRequestInProgress) { showChatToast('Espera a que termine la respuesta actual.'); return; }
    const text = chatEls.input.value;
    chatEls.input.value = ''; resizeChatInput();
    sendChatMessage(text);
  });
}
if (chatEls.input) {
  chatEls.input.addEventListener('input', resizeChatInput);
  chatEls.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); chatEls.form.requestSubmit();
    }
  });
}
if (chatEls.fileInput) {
  chatEls.fileInput.addEventListener('change', () => {
    const files = Array.from(chatEls.fileInput.files || []);
    const available = Math.max(0, 8 - selectedAttachments.length);
    selectedAttachments.push(...files.slice(0, available));
    if (files.length > available) showChatToast('Puedes seleccionar hasta 8 archivos por mensaje.');
    renderAttachmentPreview(); chatEls.fileInput.value = ''; chatEls.fileInput.accept = ALL_ATTACHMENT_TYPES;
  });
}
const ALL_ATTACHMENT_TYPES = 'image/*,.txt,.md,.json,.yml,.yaml,.java,.js,.py,.html,.css,.xml,.properties,.log,.zip,.toml,.sql,.csv,.gradle,.kt,.ts,.tsx,.jsx,.ini,.conf,.cfg';
document.getElementById('attachFileBtn')?.addEventListener('click', () => {
  if (!chatEls.fileInput) return;
  chatEls.fileInput.accept = ALL_ATTACHMENT_TYPES;
  chatEls.fileInput.click();
});
document.getElementById('imageFileBtn')?.addEventListener('click', () => {
  if (!chatEls.fileInput) return;
  chatEls.fileInput.accept = 'image/*';
  chatEls.fileInput.click();
});
document.getElementById('newChatBtn')?.addEventListener('click', startNewChat);
document.getElementById('chatBrandHome')?.addEventListener('click', (event) => { event.preventDefault(); window.location.hash = ''; showLandingView(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
document.getElementById('openChatSidebar')?.addEventListener('click', () => chatEls.app.classList.add('sidebar-open'));
document.getElementById('closeChatSidebar')?.addEventListener('click', closeChatSidebar);
chatEls.app?.addEventListener('click', (event) => {
  if (event.target === chatEls.app && chatEls.app.classList.contains('sidebar-open')) closeChatSidebar();
  const nav = event.target.closest('[data-chat-nav]');
  if (nav) openChatSection(nav.dataset.chatNav);
  const prompt = event.target.closest('[data-prompt]');
  if (prompt) { openChatSection('chat'); chatEls.input.value = prompt.dataset.prompt; resizeChatInput(); chatEls.input.focus(); }
  const accountButton = event.target.closest('[data-chat-account]');
  if (accountButton) { chatEls.userMenu.hidden = true; accountAction(accountButton.dataset.chatAccount); showChatToast(({profile:'La sección Perfil estará disponible próximamente.',settings:'La configuración completa estará disponible próximamente.',support:'El centro de Soporte estará disponible próximamente.'})[accountButton.dataset.chatAccount]); }
});
document.getElementById('chatUserMenuBtn')?.addEventListener('click', (event) => { event.stopPropagation(); chatEls.userMenu.hidden = !chatEls.userMenu.hidden; });
document.getElementById('chatLogoutBtn')?.addEventListener('click', () => logout().catch((error) => { console.error(error); showChatToast('No se ha podido cerrar la sesión.'); }));
document.addEventListener('click', (event) => {
  if (chatEls.userMenu && !event.target.closest('.chat-user-row')) chatEls.userMenu.hidden = true;
});
// Selector de modelos personalizado
if (chatEls.modelPickerBtn) {
  chatEls.modelPickerBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !!(chatEls.modelMenu && chatEls.modelMenu.hidden);
    if (chatEls.modelMenu) chatEls.modelMenu.hidden = !willOpen;
    chatEls.modelPickerBtn.setAttribute('aria-expanded', String(willOpen));
    if (chatEls.modelPicker) chatEls.modelPicker.classList.toggle('open', willOpen);
  });
}
if (chatEls.modelMenu) {
  chatEls.modelMenu.addEventListener('click', (event) => {
    const option = event.target.closest('[data-model]');
    if (option) setModelValue(option.dataset.model);
  });
}
document.addEventListener('click', (event) => {
  if (chatEls.modelPicker && !event.target.closest('#modelPicker')) closeModelMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModelMenu();
});
chatEls.model?.addEventListener('change', () => {
  if (chatEls.model.value === 'pro' && (!PREMIUM_PLAN_ENABLED || !hasPremiumPlan())) {
    chatEls.model.value = 'jr';
    updatePlanCard();
    requirePremiumOrCheckout();
    return;
  }
  safeSave(`santitosia:model:${chatUserId || 'guest'}`, chatEls.model.value === 'pro' ? 'pro' : 'jr');
  updatePlanCard();
});
document.getElementById('webSearchBtn')?.addEventListener('click', (event) => {
  webSearchEnabled = false;
  event.currentTarget.setAttribute('aria-pressed', 'false');
  showChatToast('La búsqueda web real todavía no está conectada. La IA no fingirá haber consultado internet.');
});
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !chatEls.app.hidden) { event.preventDefault(); startNewChat(); }
  if (event.key === 'Escape' && chatEls.app.classList.contains('sidebar-open')) closeChatSidebar();
});

// ─── Inicio y retorno de confirmación ──────────────────────
// No llamar a signOut() cuando aún no hay sesión: al volver del enlace
// de confirmación, el SDK puede estar procesando el code/token de la URL.
// Si se cierra sesión en ese momento, se puede borrar la sesión recién creada.
// Navegación por rutas: GitHub Pages sirve 404.html como fallback para rutas profundas.
function routeFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (path.endsWith('/chat')) return 'chat';
  if (path.endsWith('/history')) return 'history';
  if (path.endsWith('/configuration')) return 'settings';
  if (path.endsWith('/files')) return 'files';
  if (path.endsWith('/diary') || path.endsWith('/diario')) return 'diary';
  if (path.endsWith('/companion') || path.endsWith('/companero')) return 'companion';
  if (path.endsWith('/profile')) return 'profile';
  if (path.endsWith('/support')) return 'support';
  return 'home';
}
window.addEventListener('popstate', async () => {
  const route = routeFromLocation();
  if (route === 'home') { showLandingView(); return; }
  const { data } = await sb.auth.getSession();
  const user = data && data.session && data.session.user;
  if (!user) { showLandingView(); openAuth('login'); return; }
  // setUser ya abre la sección correspondiente a la ruta actual.
  setUser(user);
});

// Compatibilidad con enlaces antiguos que aún usen #chat.
window.addEventListener('hashchange', async () => {
  if (window.location.hash === '#chat') {
    window.history.replaceState({ section: 'chat' }, '', '/SantitosIA/chat');
    try {
      const { data } = await sb.auth.getSession();
      const user = data && data.session && data.session.user;
      if (user && user.email) { setUser(user); showChatView(); }
      else { showLandingView(); openAuth('login'); }
    } catch (error) { console.error('No se pudo abrir el chat:', error); showLandingView(); }
  } else {
    showLandingView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

(async function init() {
  const params = new URLSearchParams(window.location.search);
  const authError = params.get('error_description') || params.get('error');
  const confirmationReturn = params.has('code') || params.get('type') === 'signup' ||
    window.location.hash.includes('access_token=') || window.location.hash.includes('error=');

  sb.auth.onAuthStateChange((event, session) => {
    const user = session && session.user ? session.user : null;
    setUser(user && user.email ? user : null);

    if (event === 'SIGNED_IN' && confirmationReturn) {
      // El enlace de confirmación ha generado una sesión válida.
      msg('¡Correo confirmado! Has iniciado sesión en SantitosIA.');
      if (els.modal.classList.contains('open')) {
        setTimeout(closeAuth, 1400);
      }
      cleanAuthUrl();
    }
  });

  try {
    // getSession permite que el cliente termine de restaurar/procesar la sesión
    // sin cerrar sesión de forma preventiva.
    const { data } = await sb.auth.getSession();
    const user = data && data.session && data.session.user;
    if (user && user.email) setUser(user);

    if (authError) {
      openAuth('login');
      msg('No se pudo confirmar el correo: ' + decodeURIComponent(authError.replace(/\+/g, ' ')), true);
      cleanAuthUrl();
    } else if (confirmationReturn && user && user.email) {
      openAuth('login');
      msg('¡Correo confirmado! Has iniciado sesión en SantitosIA.');
      setTimeout(closeAuth, 1400);
      cleanAuthUrl();
    } else if (confirmationReturn) {
      // Si el proveedor confirma el correo pero no devuelve sesión, pedir login
      // de forma clara en lugar de dejar una página sin explicación.
      openAuth('login');
      msg('¡Enlace de confirmación procesado! Inicia sesión para continuar.');
      cleanAuthUrl();
    }
  } catch (err) {
    console.error('No se pudo restaurar la sesión de SantitosIA:', err);
    setUser(null);
  }
})();

function cleanAuthUrl() {
  // Elimina códigos/tokens de la barra de direcciones una vez procesados.
  const clean = window.location.pathname + window.location.hash.replace(/access_token=[^&]+&?/g, '').replace(/&$/, '');
  window.history.replaceState({}, document.title, clean || window.location.pathname);
}

// ─── Precios y checkout con PayPal ───────────────────────
// Pon aquí tu Client ID de PayPal (Dashboard → Apps & Credentials).
// Sandbox: usa credenciales de prueba. Live: credenciales de producción.
const PAYPAL_CLIENT_ID = 'BAAUy48CAf9uF28_OqlP6OsMGMCvlsESqDcaoYdO1Z3RWHdQ8pIChsRSg0uiem8EQbUMLsu-PeN51dG7kE';
const PAYPAL_CURRENCY = 'EUR';
const PAYPAL_PREMIUM_AMOUNT = '3.00';

let paypalSdkLoading = null;
let paypalButtonsRendered = false;

function loadPayPalSdk() {
  if (!PAYPAL_CLIENT_ID) return Promise.resolve(null);
  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalSdkLoading) return paypalSdkLoading;
  paypalSdkLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=${PAYPAL_CURRENCY}&intent=capture&components=buttons`;
    script.async = true;
    script.onload = () => resolve(window.paypal || null);
    script.onerror = () => reject(new Error('No se pudo cargar PayPal'));
    document.head.appendChild(script);
  });
  return paypalSdkLoading;
}

function activatePremiumLocally() {
  if (!PREMIUM_PLAN_ENABLED) {
    showChatToast('Premium todavía no está disponible; no se ha activado ninguna suscripción.', { important: true });
    return;
  }
  safeSave(planStorageKey(), 'pro');
  if (chatEls.model) setModelValue('pro', { skipPaywall: true });
  showChatToast('Premium activado.');
}

function renderPayPalButtons() {
  const host = document.getElementById('paypalButtons');
  const fallback = document.getElementById('checkoutConfirm');
  const hint = document.getElementById('checkoutPayPalHint');
  if (!host) return;

  host.innerHTML = '';
  paypalButtonsRendered = false;

  if (!PAYPAL_CLIENT_ID) {
    if (fallback) fallback.hidden = false;
    if (hint) {
      hint.textContent = 'Añade tu PAYPAL_CLIENT_ID en app.js para activar el botón oficial de PayPal. Mientras tanto puedes usar el botón de prueba.';
    }
    return;
  }

  if (fallback) fallback.hidden = true;
  if (hint) hint.textContent = 'El pago se procesa de forma segura. No almacenamos datos de tu tarjeta.';

  loadPayPalSdk()
    .then((paypal) => {
      if (!paypal || !paypal.Buttons) {
        if (fallback) fallback.hidden = false;
        showChatToast('PayPal no está disponible ahora mismo.');
        return;
      }
      paypal.Buttons({
        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', tagline: false },
        createOrder: (_data, actions) => actions.order.create({
          purchase_units: [{
            description: 'Santitos Premium (1 mes)',
            amount: { currency_code: PAYPAL_CURRENCY, value: PAYPAL_PREMIUM_AMOUNT },
          }],
        }),
        onApprove: async (_data, actions) => {
          try {
            const details = await actions.order.capture();
            closeCheckout();
            if (!currentAuthUser) {
              openAuth('register');
              showChatToast('Pago recibido. Crea o inicia sesión para vincular Premium a tu cuenta.');
              safeSave('santitosia:plan:guest', 'pro');
              return;
            }
            activatePremiumLocally();
            console.info('PayPal order', details && details.id);
          } catch (err) {
            console.error(err);
            showChatToast('El pago se autorizó pero hubo un problema al confirmarlo.');
          }
        },
        onCancel: () => showChatToast('Pago cancelado.'),
        onError: (err) => {
          console.error(err);
          showChatToast('Error con PayPal. Inténtalo de nuevo.');
        },
      }).render(host);
      paypalButtonsRendered = true;
    })
    .catch((err) => {
      console.error(err);
      if (fallback) fallback.hidden = false;
      showChatToast('No se pudo cargar PayPal.');
    });
}

function openCheckout(plan) {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  const isPro = plan === 'pro';
  const planName = isPro ? 'Santitos Premium' : 'Santitos Jr';
  const planPrice = isPro ? '3 € / mes' : 'Gratis';
  const title = document.getElementById('checkoutPlanName');
  const price = document.getElementById('checkoutPlanPrice');
  const note = document.getElementById('checkoutNote');
  const eyebrow = modal.querySelector('.eyebrow');
  if (eyebrow) eyebrow.textContent = isPro && !PREMIUM_PLAN_ENABLED ? 'PRÓXIMAMENTE' : (isPro ? 'PAGO' : 'PLAN GRATUITO');
  const host = document.getElementById('paypalButtons');
  const fallback = document.getElementById('checkoutConfirm');

  if (title) title.textContent = planName;
  if (price) price.textContent = planPrice;
  if (note) {
    note.textContent = isPro
      ? 'Revisa tu plan y completa el pago de forma segura.'
      : 'El plan Jr es gratuito. Crea una cuenta para empezar.';
  }
  modal.dataset.plan = isPro ? 'pro' : 'jr';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if (isPro && !PREMIUM_PLAN_ENABLED) {
    if (host) host.replaceChildren();
    if (fallback) { fallback.hidden = false; fallback.disabled = true; fallback.textContent = 'Próximamente'; }
    if (note) note.textContent = 'Santitos Premium estará disponible cuando la IA premium y la activación segura de la suscripción estén conectadas. Esta versión no realizará ningún cobro.';
    const hint = document.getElementById('checkoutPayPalHint');
    if (hint) hint.hidden = true;
    return;
  }
  if (fallback) fallback.disabled = false;
  const hint = document.getElementById('checkoutPayPalHint');
  if (hint) hint.hidden = true;

  if (!isPro) {
    if (host) host.innerHTML = '';
    if (fallback) {
      fallback.hidden = false;
      fallback.textContent = 'Empezar gratis';
    }
    return;
  }

  if (fallback) fallback.textContent = 'Continuar con el pago';
  renderPayPalButtons();
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (!document.getElementById('authModal')?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-open-checkout]');
  if (openBtn) {
    e.preventDefault();
    openCheckout(openBtn.dataset.openCheckout || 'pro');
    return;
  }
  if (e.target.id === 'closeCheckout' || e.target.id === 'checkoutModal') {
    closeCheckout();
  }
});

document.getElementById('checkoutConfirm')?.addEventListener('click', () => {
  const modal = document.getElementById('checkoutModal');
  const plan = modal?.dataset.plan || 'pro';
  if (plan === 'pro' && !PREMIUM_PLAN_ENABLED) {
    showChatToast('Premium todavía no está disponible y no se realizará ningún cobro.');
    return;
  }
  if (plan === 'jr') {
    closeCheckout();
    if (!currentAuthUser) openAuth('register');
    else {
      if (chatEls.model) setModelValue('jr');
      showChatToast('Plan Jr seleccionado.');
    }
    return;
  }
  // Fallback sin Client ID: flujo de prueba local
  if (!PAYPAL_CLIENT_ID) {
    closeCheckout();
    if (!currentAuthUser) {
      openAuth('register');
      showChatToast('Inicia sesión para vincular Premium. Configura PAYPAL_CLIENT_ID para cobros reales.');
      return;
    }
    activatePremiumLocally();
    showChatToast('Premium activado.');
    return;
  }
  showChatToast('Usa el botón de PayPal para completar el pago.');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCheckout();
});
