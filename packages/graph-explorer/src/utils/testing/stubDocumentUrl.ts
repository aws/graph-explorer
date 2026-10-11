import type { DetachedWindowAPI } from "happy-dom";

const defaultUrl = "http://localhost/explorer/";

/**
 * Navigates the happy-dom test document to the given URL without triggering
 * an actual page load, so code reading `location` (e.g. `apiUrl`) sees it.
 */
export function stubDocumentUrl(href: string = defaultUrl) {
  (window as unknown as { happyDOM: DetachedWindowAPI }).happyDOM.setURL(href);
}
