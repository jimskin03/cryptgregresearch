import { getSupabaseClient } from '@/lib/supabase';

export function initOAuthConsent() {
  const statusEl = document.getElementById('consent-status');
  const errorEl = document.getElementById('consent-error');
  const detailsEl = document.getElementById('consent-details');
  const clientNameEl = document.getElementById('client-name');
  const redirectUriEl = document.getElementById('redirect-uri');
  const scopesListEl = document.getElementById('scopes-list');
  const allowBtn = document.getElementById('consent-allow-btn') as HTMLButtonElement | null;
  const cancelBtn = document.getElementById('consent-cancel-btn') as HTMLButtonElement | null;

  const showError = (message: string) => {
    if (statusEl) statusEl.hidden = true;
    if (detailsEl) detailsEl.hidden = true;
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  };

  const params = new URLSearchParams(window.location.search);
  const authorizationId = params.get('authorization_id');

  // 1. Read authorization_id from the query. If missing, show an error and no approve button.
  if (!authorizationId) {
    showError('Missing authorization_id parameter. An authorization request from a client application is required.');
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    showError('Authentication is not configured in this deployment.');
    return;
  }

  let hasLoaded = false;

  async function loadDetails() {
    if (hasLoaded || !supabase || !authorizationId) return;
    try {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = 'Loading authorization details…';
      }
      if (errorEl) errorEl.hidden = true;

      // 3. Call supabase.auth.oauth.getAuthorizationDetails(authorization_id)
      const res = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (res.error) {
        showError(res.error.message);
        return;
      }

      const data = res.data;
      if (!data) {
        showError('No authorization details returned.');
        return;
      }

      // If user already consented, redirect immediately
      if ('redirect_url' in data) {
        window.location.assign(data.redirect_url);
        return;
      }

      hasLoaded = true;
      if (statusEl) statusEl.hidden = true;

      // 4. Show client name, redirect URI, and the identity scopes Supabase returns. Nothing is pre-checked.
      if (clientNameEl) {
        clientNameEl.textContent = data.client?.name || data.client?.id || 'Unknown application';
      }
      if (redirectUriEl) {
        redirectUriEl.textContent = data.redirect_uri;
      }

      if (scopesListEl) {
        scopesListEl.replaceChildren();
        const rawScopes = (data.scope || '').split(/[\s,]+/).filter(Boolean);
        if (rawScopes.length === 0) {
          const empty = document.createElement('span');
          empty.className = 'muted';
          empty.style.fontSize = '0.85rem';
          empty.textContent = 'No additional scopes requested.';
          scopesListEl.appendChild(empty);
        } else {
          for (const scope of rawScopes) {
            const item = document.createElement('span');
            item.textContent = scope;
            item.style.fontSize = '0.88rem';
            item.style.color = 'var(--display)';
            scopesListEl.appendChild(item);
          }
        }
      }

      if (detailsEl) detailsEl.hidden = false;

      // 6. Allow and Cancel are visually equal. Allow calls approveAuthorization. Cancel calls denyAuthorization.
      // Approval is a button click only, never a query parameter.
      if (allowBtn) {
        allowBtn.onclick = async () => {
          allowBtn.disabled = true;
          if (cancelBtn) cancelBtn.disabled = true;
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = 'Authorizing…';
          }
          const approveRes = await supabase.auth.oauth.approveAuthorization(authorizationId);
          if (approveRes.error) {
            showError(approveRes.error.message);
            allowBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
          } else if (approveRes.data?.redirect_url) {
            window.location.assign(approveRes.data.redirect_url);
          }
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = async () => {
          cancelBtn.disabled = true;
          if (allowBtn) allowBtn.disabled = true;
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = 'Denying…';
          }
          const denyRes = await supabase.auth.oauth.denyAuthorization(authorizationId);
          if (denyRes.error) {
            showError(denyRes.error.message);
            cancelBtn.disabled = false;
            if (allowBtn) allowBtn.disabled = false;
          } else if (denyRes.data?.redirect_url) {
            window.location.assign(denyRes.data.redirect_url);
          }
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load authorization details.';
      showError(message);
    }
  }

  // 2. If there is no session, open the existing auth dialog and keep authorization_id in the URL. Do not redirect away and lose it.
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      const dialog = document.querySelector<HTMLDialogElement>('[data-auth-dialog]');
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    } else {
      loadDetails();
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && !hasLoaded) {
      loadDetails();
    }
  });
}
