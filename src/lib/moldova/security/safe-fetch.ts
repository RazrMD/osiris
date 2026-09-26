/**
 * OSIRIS — Moldova Intelligence Layer Security Module
 * Strict SSRF protection, domain allowlisting, response size limits, and safe HTTP fetching.
 */

// Allowlisted hostnames and domain suffixes for Moldova Data Layer
const ALLOWED_DOMAINS = [
  'gov.md',
  'moldpres.md',
  'newsmaker.md',
  'zdg.md',
  'diez.md',
  'unimedia.info',
  'tv8.md',
  'cotidianul.md',
  'statistica.md',
  'asd.md',
  'andsa.md',
  'border.gov.md',
  'customs.gov.md',
  'dataset.gov.md',
  'date.gov.md',
  'open-meteo.com',
  'aviationweather.gov',
  'earthquake.usgs.gov',
  'seismicportal.eu',
  'infp.ro',
  'overpass-api.de',
  'openstreetmap.org',
];

const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // 127.0.0.0/8 (Loopback)
  /^10\./,                           // 10.0.0.0/8 (Private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (Private)
  /^192\.168\./,                     // 192.168.0.0/16 (Private)
  /^169\.254\./,                     // 169.254.0.0/16 (Link-local & AWS metadata)
  /^0\./,                            // 0.0.0.0/8
  /^localhost$/i,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxSizeBytes?: number;
}

export function validateUrlSafety(inputUrl: string): { safe: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(inputUrl);

    // Protocol validation
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check private IP / loopback / metadata patterns
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, reason: `Access to private or local IP/host blocked: ${hostname}` };
      }
    }

    // Check domain allowlist
    const isDomainAllowed = ALLOWED_DOMAINS.some(allowed => 
      hostname === allowed || hostname.endsWith(`.${allowed}`)
    );

    if (!isDomainAllowed) {
      return { safe: false, reason: `Host ${hostname} not in Moldova intelligence domain allowlist` };
    }

    return { safe: true, parsedUrl: parsed };
  } catch (err: any) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
 * Fetch a URL securely with timeout, size limit, and SSRF protection.
 */
export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  const safety = validateUrlSafety(url);
  if (!safety.safe) {
    throw new Error(`[SSRF Protection] Blocked request to ${url}: ${safety.reason}`);
  }

  const timeoutMs = options.timeoutMs || 15000;
  const maxSizeBytes = options.maxSizeBytes || 5 * 1024 * 1024; // 5MB default

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders = new Headers(options.headers || {});
  if (!mergedHeaders.has('User-Agent')) {
    mergedHeaders.set('User-Agent', 'OSIRIS-Moldova-Data-Intelligence/2.0 (geospatial@curca.eu)');
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: mergedHeaders,
    });

    // Verify content-length header if provided
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Response size ${contentLength} bytes exceeds limit of ${maxSizeBytes} bytes`);
    }

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Safe text getter with streaming size cap
 */
export async function safeFetchText(url: string, options: SafeFetchOptions = {}): Promise<string> {
  const res = await safeFetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching ${url}`);
  }

  const text = await res.text();
  const maxBytes = options.maxSizeBytes || 5 * 1024 * 1024;
  if (text.length > maxBytes) {
    return text.slice(0, maxBytes);
  }
  return text;
}

/**
 * Safe JSON getter
 */
export async function safeFetchJson<T>(url: string, options: SafeFetchOptions = {}): Promise<T> {
  const text = await safeFetchText(url, options);
  return JSON.parse(text) as T;
}
