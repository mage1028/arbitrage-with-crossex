/** App-level constants: where this tool lives and how it is installed.
 *
 * Was `lib/landing.ts`, when one codebase built both the terminal and the
 * public site. The site now lives in its own repo (arbitrage-landing), so all
 * that survives here is what the TERMINAL itself needs: the repo it updates
 * from, and the install commands the update prompt shows.
 */
export const REPO_SLUG = 'mage1028/arbitrage-with-crossex';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

/** Manual update commands always fetch the installer from the exact commit the
 * update API advertised. The installer receives the same ref for its archive. */
export const installCmd = (ref: string): string =>
  `BOROS_REF=${ref} BOROS_REPO=${REPO_SLUG} /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/${ref}/install.sh)"`;

export const installCmdWindows = (ref: string): string =>
  `$env:BOROS_REF='${ref}'; $env:BOROS_REPO='${REPO_SLUG}'; irm https://raw.githubusercontent.com/${REPO_SLUG}/${ref}/install.ps1 | iex`;

export const LOCAL_APP_URL = 'http://localhost:6688';
