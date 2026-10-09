# Android showcase

`src/pages/android.astro` introduces Friendly and Spend Wise. Both apps are in
Google Play closed testing. The access buttons compose an email to
info@cryptgregresearch.org asking for a tester invitation; they do not imply
public installation is available.

The homepage project registry includes Android immediately after Bookmarks,
and both navigation components link to `/android`.

## Publication

The existing GitHub Pages workflow publishes `/android` when this change is
merged into `main`. The main site's CNAME remains unchanged.

GitHub Pages serves one custom domain per repository. To serve the showcase
at `https://android.cryptgregresearch.org/` without changing the main site's
hosting, import this repository into a separate Vercel project. The checked-in
`vercel.json` builds the static Astro site and rewrites the subdomain root to
`/android`.

1. Import this repository into Vercel and deploy the main branch.
2. Add `android.cryptgregresearch.org` to that project's custom domains.
3. Add the DNS record provided by Vercel at the domain's DNS provider. Use the
   exact current target shown by Vercel, and remove conflicting records only
   for the `android` hostname.
4. Wait for domain verification and HTTPS issuance. Confirm the root URL shows
   both apps and its stylesheet loads.
5. Once HTTPS works, change the Android registry `externalUrl` in
   `src/data/records.ts` and navigation Android links to the subdomain URL.

Until domain setup is complete, the homepage uses the functional main-site
`/android` route. The page's canonical URL reserves the requested subdomain.
No DNS or Vercel changes are performed by committing this configuration.

The supplied Play Store screenshots inform the descriptions and Early Access
labels. They are not published as assets because they contain account-specific
Play Store UI and personal activity.
