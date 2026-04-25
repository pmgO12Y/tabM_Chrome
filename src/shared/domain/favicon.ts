export function buildTabFaviconCandidates(pageUrl: string, favIconUrl: string | null): string[] {
  const candidates: string[] = [];

  if (favIconUrl) {
    candidates.push(favIconUrl);
  }

  const proxyCandidate = buildChromeFaviconProxyUrl(pageUrl);
  if (proxyCandidate) {
    candidates.push(proxyCandidate);
  }

  return dedupe(candidates);
}

export function buildChromeFaviconProxyUrl(pageUrl: string): string | null {
  if (!supportsChromeFaviconProxy(pageUrl)) {
    return null;
  }

  const baseUrl =
    typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL("_favicon/")
      : "/_favicon/";

  return `${baseUrl}?pageUrl=${encodeURIComponent(pageUrl)}&size=16`;
}

function supportsChromeFaviconProxy(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl);
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "file:" ||
      url.protocol === "chrome:" ||
      url.protocol === "chrome-extension:"
    );
  } catch {
    return false;
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
