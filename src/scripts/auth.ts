import { getSupabaseClient } from '@/lib/supabase';

export function initAuth() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-auth-dialog]');
  const opener = document.querySelector<HTMLElement>('[data-auth-open]');
  const closer = document.querySelector<HTMLElement>('[data-auth-close]');
  const form = document.querySelector<HTMLFormElement>('[data-auth-form]');
  const message = document.querySelector<HTMLElement>('[data-auth-message]');
  if (!dialog || !opener || !form) return;
  opener.addEventListener('click', () => dialog.showModal());
  closer?.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = new FormData(form).get('email');
    const supabase = getSupabaseClient();
    if (typeof email !== 'string' || !supabase) {
      if (message) message.textContent = 'Authentication is not configured in this deployment.';
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (message) message.textContent = error ? error.message : 'Check your inbox for a magic link.';
  });
}
