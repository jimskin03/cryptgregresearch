import { getSupabaseClient } from '@/lib/supabase';

export function initAuth() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-auth-dialog]');
  const opener = document.querySelector<HTMLElement>('[data-auth-open]');
  const closer = document.querySelector<HTMLElement>('[data-auth-close]');
  const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
  const emailInput = document.querySelector<HTMLInputElement>('#auth-email');
  const passwordInput = document.querySelector<HTMLInputElement>('#auth-password');
  const magic = document.querySelector<HTMLButtonElement>('[data-auth-magic]');
  const signup = document.querySelector<HTMLButtonElement>('[data-auth-signup]');
  const submit = document.querySelector<HTMLButtonElement>('[data-auth-submit]');
  const title = document.querySelector<HTMLElement>('#auth-title');
  const message = document.querySelector<HTMLElement>('[data-auth-message]');
  const authArea = document.querySelector<HTMLElement>('#auth-area');
  const supabase = getSupabaseClient();
  if (!dialog || !opener || !form || !emailInput || !passwordInput || !magic || !signup || !submit || !supabase) return;

  let mode: 'signin' | 'signup' = 'signin';
  const setMode = (nextMode: 'signin' | 'signup') => {
    mode = nextMode;
    const signingUp = mode === 'signup';
    if (title) title.textContent = signingUp ? 'Create your research account.' : 'Save your research trail.';
    submit.textContent = signingUp ? 'CREATE ACCOUNT →' : 'SIGN IN →';
    signup.hidden = signingUp;
    passwordInput.autocomplete = signingUp ? 'new-password' : 'current-password';
    setMessage('');
  };

  const setMessage = (text: string) => { if (message) message.textContent = text; };
  const openDialog = () => dialog.showModal();
  opener.addEventListener('click', openDialog);
  closer?.addEventListener('click', () => dialog.close());
  signup.addEventListener('click', () => setMode('signup'));

  const renderSession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
    if (!authArea) return;
    authArea.replaceChildren();
    if (!session?.user) {
      const signIn = document.createElement('button');
      signIn.type = 'button';
      signIn.textContent = 'SIGN IN';
      signIn.addEventListener('click', openDialog);
      authArea.append(signIn);
      return;
    }

    const email = document.createElement('span');
    email.className = 'auth-email';
    email.textContent = session.user.email || 'SIGNED IN';
    email.title = session.user.email || 'SIGNED IN';
    const signOut = document.createElement('button');
    signOut.type = 'button';
    signOut.textContent = 'SIGN OUT';
    signOut.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) setMessage(error.message);
    });
    authArea.append(email, signOut);
  };

  supabase.auth.onAuthStateChange((_event, session) => renderSession(session));
  supabase.auth.getSession().then(({ data: { session } }) => renderSession(session));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('Signing in…');
    const supabase = getSupabaseClient();
    if (!supabase) { setMessage('Authentication is not configured in this deployment.'); return; }
    const { error, data } = mode === 'signup'
      ? await supabase.auth.signUp({ email: emailInput.value.trim(), password: passwordInput.value, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value });
    if (error) { setMessage(error.message); return; }
    passwordInput.value = '';
    if (mode === 'signup' && !data.session) { setMessage('Account created. Check your email to confirm your address, then sign in.'); return; }
    dialog.close();
  });

  magic.addEventListener('click', async () => {
    if (!emailInput.reportValidity()) return;
    setMessage('Sending magic link…');
    const supabase = getSupabaseClient();
    if (!supabase) { setMessage('Authentication is not configured in this deployment.'); return; }
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput.value.trim(), options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : 'Check your inbox for a one-time sign-in link.');
  });
}
