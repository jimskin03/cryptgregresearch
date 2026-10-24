// Supabase combines the authorization path with the shared CryptGreg Site URL.
// Send only the opaque request ID to Bookmarks; approval and account credentials
// are handled on the Bookmarks consent page, never by this routing page.
export function initOAuthConsent() {
  const id = new URLSearchParams(window.location.search).get('authorization_id');
  const status = document.getElementById('consent-status');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    if (status) status.textContent = 'No valid authorization request was provided. Start the connection from your MCP client.';
    return;
  }
  const destination = new URL('https://bookmarks.cryptgregresearch.org/oauth/consent');
  destination.searchParams.set('authorization_id', id);
  window.location.replace(destination.href);
}
