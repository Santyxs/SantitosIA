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
  // La portada permanece en /SantitosIA/ y el chat usa la ruta /SantitosIA/chat.
  if (loggedIn && routeFromLocation() === 'chat') showChatView();
  else showLandingView();
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

// ─── SantitosIA chat workspace (UI preview; the AI provider is not connected yet) ───
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
    const preferred = safeRead(`santitosia:model:${chatUserId || 'guest'}`) || 'jr';
    chatEls.model.value = preferred === 'pro' ? 'pro' : 'jr';
    updatePlanCard();
  }
  chatSessions = loadChatSessions();
  activeChatId = chatSessions.length ? chatSessions[0].id : null;
  selectedAttachments = [];
  renderAttachmentPreview();
  if (activeChatId) renderConversation(activeChatId);
  else showChatWelcome();
  renderRecentChats();
}

function safeRead(key) {
  try { return window.localStorage.getItem(key); } catch (_) { return null; }
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
    chatEls.modelMenu.querySelectorAll('.model-option').forEach((opt) => {
      const active = opt.dataset.model === (pro ? 'pro' : 'jr');
      opt.classList.toggle('active', active);
      opt.setAttribute('aria-selected', String(active));
    });
  }
}

function closeModelMenu() {
  if (!chatEls.modelMenu || !chatEls.modelPickerBtn) return;
  chatEls.modelMenu.hidden = true;
  chatEls.modelPickerBtn.setAttribute('aria-expanded', 'false');
  if (chatEls.modelPicker) chatEls.modelPicker.classList.remove('open');
}

function setModelValue(value) {
  if (!chatEls.model) return;
  const next = value === 'pro' ? 'pro' : 'jr';
  if (chatEls.model.value === next) {
    closeModelMenu();
    return;
  }
  chatEls.model.value = next;
  updatePlanCard();
  safeSave(`santitosia:model:${chatUserId || 'guest'}`, next);
  showChatToast(next === 'pro' ? 'Santitos seleccionado (vista previa).' : 'Santitos Jr seleccionado (vista previa).');
  closeModelMenu();
}
function showChatToast(message) {
  if (!chatEls.toast) return;
  chatEls.toast.textContent = message;
  chatEls.toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { chatEls.toast.hidden = true; }, 3400);
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
  chatEls.stage.scrollTop = chatEls.stage.scrollHeight;
  renderRecentChats();
}
function createMessageNode(item, addActions) {
  const role = item.role === 'user' ? 'user' : 'assistant';
  const row = document.createElement('article');
  row.className = `chat-message ${role}-message`;
  const avatar = document.createElement('div');
  avatar.className = `message-avatar${role === 'user' ? ' user-avatar' : ''}`;
  if (role === 'assistant') {
    const image = document.createElement('img');
    image.src = 'assets/wolf-mark.png'; image.alt = 'SantitosIA'; avatar.append(image);
  } else {
    avatar.textContent = (chatEls.avatar && chatEls.avatar.textContent || 'S').slice(0, 1);
  }
  const body = document.createElement('div'); body.className = 'message-body';
  const meta = document.createElement('div'); meta.className = 'message-meta';
  const name = document.createElement('span'); name.textContent = role === 'user' ? 'Tú' : 'SantitosIA'; meta.append(name);
  if (role === 'assistant') {
    const tag = document.createElement('span'); tag.className = 'message-tag';
    tag.textContent = chatEls.model && chatEls.model.value === 'pro' ? 'SANTITOS' : 'SANTITOS JR'; meta.append(tag);
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
  if (role === 'assistant' && addActions) {
    const actions = document.createElement('div'); actions.className = 'message-actions';
    const copy = document.createElement('button'); copy.className = 'message-action'; copy.type = 'button'; copy.textContent = '▢ Copiar';
    copy.addEventListener('click', () => copyText(item.content || ''));
    actions.append(copy); body.append(actions);
  } else if (role === 'assistant' && !addActions) {
    const actions = document.createElement('div'); actions.className = 'message-actions';
    const copy = document.createElement('button'); copy.className = 'message-action'; copy.type = 'button'; copy.textContent = '▢ Copiar';
    copy.addEventListener('click', () => copyText(item.content || ''));
    actions.append(copy); body.append(actions);
  }
  if (role === 'user') row.append(body, avatar); else row.append(avatar, body);
  return row;
}
function addMessageToDOM(item, scroll = true) {
  chatEls.messages.append(createMessageNode(item, true));
  if (scroll) chatEls.stage.scrollTo({ top: chatEls.stage.scrollHeight, behavior: 'smooth' });
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
    description.textContent = chatSessions.length ? 'Abre una conversación anterior para continuar donde lo dejaste.' : 'Cuando empieces a conversar, tus chats recientes aparecerán aquí.';
    if (chatSessions.length) {
      const list = document.createElement('div'); list.className = 'panel-history-list';
      [...chatSessions].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).forEach((session) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'panel-history-item';
        const title = document.createElement('strong'); title.textContent = session.title;
        const meta = document.createElement('small'); meta.textContent = `${session.messages.length} mensajes · ${new Date(session.updatedAt || Date.now()).toLocaleDateString('es-ES')}`;
        button.append(title, meta); button.addEventListener('click', () => renderConversation(session.id)); list.append(button);
      }); panel.append(kicker, heading, description, list);
    } else panel.append(kicker, heading, description);
  } else if (section === 'files') {
    kicker.textContent = 'DOCUMENTOS E IMÁGENES'; heading.textContent = 'Tus archivos';
    description.textContent = 'Puedes adjuntar imágenes o archivos desde el botón del clip junto al cuadro de mensaje. En esta versión de vista previa, los archivos solo se muestran en la conversación; todavía no se procesan con un modelo de IA.';
    const action = document.createElement('button'); action.type = 'button'; action.className = 'new-chat-button'; action.innerHTML = '<span class="new-chat-icon" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span> Seleccionar archivos'; action.addEventListener('click', () => chatEls.fileInput.click());
    panel.append(kicker, heading, description, action);
  } else if (section === 'settings') {
    kicker.textContent = 'PERSONALIZA TU EXPERIENCIA'; heading.textContent = 'Configuración';
    description.textContent = 'Elige qué experiencia quieres probar. La selección se guarda en este navegador para tu cuenta.';
    const label = document.createElement('label'); label.textContent = 'Modelo de conversación'; label.style.cssText = 'display:block;font-size:12px;color:#b6bfdb;margin:18px 0 8px';
    const select = document.createElement('select'); select.className = 'settings-model-select'; select.innerHTML = '<option value="jr">Santitos Jr · Gratis</option><option value="pro">Santitos · Premium</option>'; select.value = chatEls.model.value;
    select.addEventListener('change', () => { chatEls.model.value = select.value; updatePlanCard(); safeSave(`santitosia:model:${chatUserId || 'guest'}`, select.value); showChatToast('Modelo seleccionado para esta vista previa.'); });
    panel.append(kicker, heading, description, label, select);
  }
  chatEls.messages.append(panel);
  chatEls.stage.scrollTop = 0;
}
function safeSave(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
function closeChatSidebar() { if (chatEls.app) chatEls.app.classList.remove('sidebar-open'); }
function openChatSection(section) {
  closeChatSidebar();
  const routes = { chat: 'chat', history: 'history', files: 'Files', settings: 'Configuration', profile: 'Profile', support: 'Support' };
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
  chatEls.input.value = ''; resizeChatInput();
  showChatWelcome(); renderRecentChats(); chatEls.input.focus(); closeChatSidebar();
}
function resizeChatInput() {
  if (!chatEls.input) return;
  chatEls.input.style.height = 'auto';
  chatEls.input.style.height = `${Math.min(chatEls.input.scrollHeight, 180)}px`;
}
function sendChatMessage(text) {
  const content = String(text || '').trim();
  if (!content && !selectedAttachments.length) return;
  if (!chatUserId) { showLandingView(); openAuth('login'); return; }
  // User text and attachment names stay local in this UI preview; no AI service is called.
  if (!activeSession()) {
    const firstLine = content.split(/\r?\n/)[0].trim();
    const title = firstLine ? (firstLine.length > 42 ? firstLine.slice(0, 39) + '…' : firstLine) : (selectedAttachments[0] && selectedAttachments[0].name) || 'Nuevo chat';
    const session = { id: makeId(), title, createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
    chatSessions.unshift(session); activeChatId = session.id;
  }
  const session = activeSession();
  if (!session) return;
  const attached = selectedAttachments.map((file) => ({ name: file.name, type: file.type || 'application/octet-stream', size: file.size || 0 }));
  const userMessage = { role: 'user', content: content || 'He adjuntado archivos.', timestamp: Date.now(), attachments: attached };
  session.messages.push(userMessage);
  chatEls.welcome.hidden = true;
  chatEls.messages.replaceChildren(...session.messages.slice(0, -1).map((item) => createMessageNode(item, true)));
  addMessageToDOM(userMessage);
  const hasFiles = attached.length > 0;
  const assistantMessage = {
    role: 'assistant', timestamp: Date.now() + 1,
    content: 'La interfaz de conversación está funcionando, pero el modelo de IA todavía no está conectado. Tu mensaje se ha guardado en este navegador y no se ha enviado a ningún servicio de IA.',
    previewNote: hasFiles ? 'Los nombres de los archivos se han añadido al chat, pero su contenido todavía no se ha enviado ni analizado.' : 'Cuando conectemos el proveedor de IA, aquí aparecerá una respuesta real a tu pregunta.'
  };
  session.messages.push(assistantMessage); session.updatedAt = Date.now();
  selectedAttachments = []; renderAttachmentPreview();
  window.setTimeout(() => {
    if (activeChatId !== session.id || activeChatSection !== 'chat') return;
    addMessageToDOM(assistantMessage);
    chatEls.stage.scrollTop = chatEls.stage.scrollHeight;
  }, 320);
  saveChatSessions(); renderRecentChats();
  if (activeChatSection !== 'chat') renderConversation(session.id);
}

// Workspace event bindings
if (chatEls.form) {
  chatEls.form.addEventListener('submit', (event) => {
    event.preventDefault();
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
    if (files.length > available) showChatToast('Puedes seleccionar hasta 8 archivos por mensaje en esta vista previa.');
    renderAttachmentPreview(); chatEls.fileInput.value = '';
  });
}
document.getElementById('attachFileBtn')?.addEventListener('click', () => chatEls.fileInput.click());
document.getElementById('imageFileBtn')?.addEventListener('click', () => { chatEls.fileInput.accept = 'image/*'; chatEls.fileInput.click(); chatEls.fileInput.accept = 'image/*,.txt,.md,.json,.yml,.yaml,.java,.js,.py,.html,.css,.xml,.properties,.log,.zip'; });
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
  updatePlanCard();
});
document.getElementById('webSearchBtn')?.addEventListener('click', (event) => {
  webSearchEnabled = !webSearchEnabled;
  event.currentTarget.setAttribute('aria-pressed', String(webSearchEnabled));
  showChatToast(webSearchEnabled ? 'Búsqueda web activada visualmente; falta conectar la herramienta.' : 'Búsqueda web desactivada.');
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
  setUser(user); showChatView();
  if (route === 'chat') openChatSection('chat');
  else showPanel(route);
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
