// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://vlnocfdiexkqcnfbjhqt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ys0Cl98LLqAdNEiNY1f7Mg_lddIzr6F';
const ROOT_DOMAIN = 'cryptgregresearch.org';

function sharedCookieDomain() {
  const hostname = location.hostname;

  return hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)
    ? `; Domain=${ROOT_DOMAIN}`
    : '';
}

const sharedCookieStorage = {
  getItem(key) {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${key}=`));
    if (cookie) return decodeURIComponent(cookie.slice(key.length + 1));
    const legacy = window.localStorage.getItem(key);
    if (legacy) this.setItem(key, legacy);
    return legacy;
  },
  setItem(key, value) {
    const domain = sharedCookieDomain();
    document.cookie = `${key}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
    document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/${domain}; Secure; SameSite=Lax`;
    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    const domain = sharedCookieDomain();
    document.cookie = `${key}=; Max-Age=0; Path=/; Secure; SameSite=Lax`;
    document.cookie = `${key}=; Max-Age=0; Path=/${domain}; Secure; SameSite=Lax`;
    window.localStorage.removeItem(key);
  },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: sharedCookieStorage },
});

const dialog = document.querySelector('#auth-dialog');
const area = document.querySelector('#auth-area');
const form = document.querySelector('#auth-form');
const emailInput = document.querySelector('#auth-email-input');
const passwordInput = document.querySelector('#auth-password-input');
const status = document.querySelector('#auth-status');
const callbackUrl = `${window.location.origin}${window.location.pathname}`;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? 'var(--pink)' : '';
}

function renderAuth(session) {
  area.replaceChildren();
  if (session?.user) {
    const email = document.createElement('span');
    email.className = 'auth-email';
    email.textContent = session.user.email || 'Signed in';
    email.title = session.user.email || '';
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.textContent = 'SIGN OUT';
    logout.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) setStatus(error.message, true);
      else renderAuth(null);
    });
    area.append(email, logout);
    return;
  }
  const open = document.createElement('button');
  open.type = 'button';
  open.textContent = 'SIGN IN';
  open.addEventListener('click', () => { setStatus(''); dialog.showModal(); });
  area.append(open);
}

document.querySelector('#auth-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Signing in…');
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(), password: passwordInput.value,
  });
  if (error) { setStatus(error.message, true); return; }
  passwordInput.value = '';
  dialog.close();
});

document.querySelector('#auth-signup').addEventListener('click', async () => {
  if (!emailInput.reportValidity() || !passwordInput.reportValidity()) return;
  setStatus('Creating your account…');
  const { error } = await supabase.auth.signUp({
    email: emailInput.value.trim(), password: passwordInput.value,
    options: { emailRedirectTo: callbackUrl },
  });
  if (error) { setStatus(error.message, true); return; }
  passwordInput.value = '';
  setStatus('Check your email to confirm the account.');
});

document.querySelector('#auth-magic').addEventListener('click', async () => {
  if (!emailInput.reportValidity()) return;
  setStatus('Sending magic link…');
  const { error } = await supabase.auth.signInWithOtp({
    email: emailInput.value.trim(), options: { emailRedirectTo: callbackUrl },
  });
  if (error) { setStatus(error.message, true); return; }
  setStatus('Check your email for a one-time sign-in link.');
});

supabase.auth.onAuthStateChange((_event, session) => renderAuth(session));
const { data: { session } } = await supabase.auth.getSession();
renderAuth(session);
