// Amani admin's authenticated server-side proxy.
// Netlify routes these URLs directly to this function, without fragile
// wildcard-to-query-string redirect substitutions.
export const config = {
  path: ['/health', '/api/*'],
};

function jsonError(status, message) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default async function handler(request) {
  const origin = (process.env.AMANI_BACKEND_ORIGIN || '').trim().replace(/\/+$/, '');
  const key = (process.env.ADMIN_API_KEY || '').trim();
  if (!origin || !key) return jsonError(503, 'Admin proxy is not configured');

  const incoming = new URL(request.url);
  const pathname = incoming.pathname;
  if (pathname !== '/health' && !pathname.startsWith('/api/')) {
    return jsonError(404, 'Admin proxy route not found');
  }

  // Limit the upstream base to HTTPS in production. Only localhost may use HTTP.
  let base;
  try {
    base = new URL(origin);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
    if (!['http:', 'https:'].includes(base.protocol) ||
        (base.protocol !== 'https:' && !local) ||
        base.username || base.password || base.search || base.hash || base.pathname !== '/') {
      return jsonError(503, 'Admin proxy backend origin is invalid');
    }
  } catch {
    return jsonError(503, 'Admin proxy backend origin is invalid');
  }

  const target = new URL(pathname + incoming.search, base);
  const headers = new Headers();
  // Pass only application headers; do not forward cookies, browser credentials,
  // host, or accept-encoding. The server-side credential is inserted here.
  for (const name of ['accept', 'accept-language', 'content-type', 'if-match', 'if-none-match']) {
    if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  }
  headers.set('x-admin-api-key', key);
  headers.set('accept-encoding', 'identity');

  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers(upstream.headers);
    // fetch() can transparently decompress the body while retaining the
    // original encoding and byte length. Forwarding those headers causes
    // Chrome ERR_CONTENT_DECODING_FAILED and truncated responses.
    for (const name of [
      'content-encoding', 'content-length', 'transfer-encoding',
      'connection', 'keep-alive', 'set-cookie', 'set-cookie2',
    ]) {
      outHeaders.delete(name);
    }
    outHeaders.set('cache-control', 'no-store');
    outHeaders.set('x-content-type-options', 'nosniff');
    const emptyBody = request.method === 'HEAD' || [204, 205, 304].includes(upstream.status);
    return new Response(emptyBody ? null : upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (error) {
    console.error('[Amani admin] Backend proxy request failed:', error?.message || 'Unknown fetch error');
    return jsonError(502, 'Admin backend is unavailable');
  }
}
