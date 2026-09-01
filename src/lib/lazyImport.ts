import { lazy, type ComponentType } from 'react';

/**
 * Wraps React.lazy() so that a failed chunk load (most commonly: the app was
 * redeployed and the browser still has an old index.html referencing a chunk
 * hash that no longer exists on the server) triggers one automatic full
 * reload instead of permanently crashing to the top-level error boundary.
 *
 * Without this, clicking a nav link after a new deploy throws inside the
 * dynamic import(), React throws, the root ErrorBoundary (which sits above
 * the router) unmounts the whole app, and the only way out is a manual
 * refresh — even though refreshing alone fixes it, because it fetches the
 * current index.html with correct chunk references.
 *
 * `name` must be unique per lazily-imported component; it's used as the
 * sessionStorage key so we only retry once per chunk per tab session,
 * avoiding an infinite reload loop if the failure is a real, persistent bug.
 */
export function lazyImport<T extends { default: ComponentType<any> }>(
  importer: () => Promise<T>,
  name: string
) {
  return lazy(() =>
    importer().catch((error) => {
      const key = `lazy-retry:${name}`;
      const alreadyRetried = sessionStorage.getItem(key);

      if (!alreadyRetried) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        // Never resolve — the reload will replace this page before React
        // has a chance to render anything from a rejected state.
        return new Promise<T>(() => {});
      }

      // Already retried once this session and it's still failing —
      // this is a real error, let it surface normally.
      throw error;
    })
  );
}
