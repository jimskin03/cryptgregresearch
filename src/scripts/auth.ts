import { getSupabaseClient } from '@/lib/supabase';

export function initAuth() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-auth-dialog]');
  const opener = document.querySelector<HTMLElement>('[data-auth-open]');
  const closer = document.querySelector<HTMLElement>('[data-auth-close]');
  const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
  const emailInput = document.querySelector<HTMLInputElement>('#auth-email');
  const passwordInput = document.querySelector<HTMLInputElement>('#auth-password');
  const magic = document.querySelector<HTMLButtonElement>('[data-auth-magic]');
  const message = document.querySelector<HTMLElement>('[data-auth-message]');
  if (!dialog || !opener || !form || !emailInput || !passwordInput || !magic) return;

  const setMessage = (text: string) => { if (message) message.textContent = text; };
  opener.addEventListener('click', () => dialog.showModal());
  closer?.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('Signing in…');
    const supabase = getSupabaseClient();
    if (!supabase) { setMessage('Authentication is not configured in this deployment.'); return; }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.value.trim(), password: passwordInput.value,
    });
    if (error) { setMessage(error.message); return; }
    passwordInput.value = '';
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
