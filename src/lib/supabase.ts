import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vlnocfdiexkqcnfbjhqt.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ys0Cl98LLqAdNEiNY1f7Mg_lddIzr6F';

const sharedCookieStorage = {
  getItem(key: string) {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${key}=`));
    if (cookie) return decodeURIComponent(cookie.slice(key.length + 1));
    const legacy = window.localStorage.getItem(key);
    if (legacy) this.setItem(key, legacy);
    return legacy;
  },
  setItem(key: string, value: string) {
    const domain = location.hostname.endsWith('.cryptgregresearch.org') ? '; Domain=.cryptgregresearch.org' : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/${domain}; Secure; SameSite=Lax`;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    const domain = location.hostname.endsWith('.cryptgregresearch.org') ? '; Domain=.cryptgregresearch.org' : '';
    document.cookie = `${key}=; Max-Age=0; Path=/${domain}; Secure; SameSite=Lax`;
    window.localStorage.removeItem(key);
  },
};

export function getSupabaseClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { storage: sharedCookieStorage } });
}
