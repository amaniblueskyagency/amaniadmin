import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { config } from '../netlify/functions/api-proxy.mjs';

const oldFetch = globalThis.fetch;
const oldOrigin = process.env.AMANI_BACKEND_ORIGIN;
const oldKey = process.env.ADMIN_API_KEY;
function configure() {
  process.env.AMANI_BACKEND_ORIGIN = 'https://amanibackend.onrender.com';
  process.env.ADMIN_API_KEY = 'test-secret-not-a-real-key';
}
function restore() {
  globalThis.fetch = oldFetch;
  if (oldOrigin === undefined) delete process.env.AMANI_BACKEND_ORIGIN;
  else process.env.AMANI_BACKEND_ORIGIN = oldOrigin;
  if (oldKey === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = oldKey;
}
test.after(restore);

test('native Netlify paths cover both health and nested admin routes', () => {
  assert.deepEqual(config.path, ['/health', '/api/*']);
});

test('health proxies to Render; drops invalid compressed length headers', async () => {
  configure();
  let upstreamUrl, upstreamOptions;
  globalThis.fetch = async (url, options) => {
    upstreamUrl = url.toString(); upstreamOptions = options;
    return new Response('{"success":true,"data":{"status":"ok"}}', {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip', 'content-length': '501',
        'set-cookie': 'session=test',
      },
    });
  };
  const response = await handler(new Request('https://amaniadmin.netlify.app/health', {
    headers: {cookie: 'private=1', 'accept-encoding': 'gzip', accept: 'application/json'},
  }));
  assert.equal(upstreamUrl, 'https://amanibackend.onrender.com/health');
  assert.equal(upstreamOptions.headers.get('x-admin-api-key'), 'test-secret-not-a-real-key');
  assert.equal(upstreamOptions.headers.get('cookie'), null);
  assert.equal(upstreamOptions.headers.get('accept-encoding'), 'identity');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-encoding'), null);
  assert.equal(response.headers.get('content-length'), null);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal((await response.json()).data.status, 'ok');
});

test('analytics preserves the entire API path and query string', async () => {
  configure();
  let url;
  globalThis.fetch = async (u) => {
    url = u.toString();
    return new Response('{"success":true,"data":{}}', {status: 200,headers:{'content-type':'application/json'}});
  };
  const response = await handler(new Request('https://amaniadmin.netlify.app/api/admin/live/analytics?scope=all'));
  assert.equal(url, 'https://amanibackend.onrender.com/api/admin/live/analytics?scope=all');
  assert.equal(response.status, 200);
});

test('PATCH forwards JSON body and does not expose the secret', async () => {
  configure();
  let url, options;
  globalThis.fetch = async (u,o) => {
    url=u.toString();options=o;
    return new Response('{"success":true}',{status:200,headers:{'content-type':'application/json'}});
  };
  const response=await handler(new Request('https://amaniadmin.netlify.app/api/admin/live/properties/123', {
    method:'PATCH', headers:{'content-type':'application/json','x-admin-api-key':'injected-browser-key'},
    body:'{"title":"Updated"}',
  }));
  assert.equal(url,'https://amanibackend.onrender.com/api/admin/live/properties/123');
  assert.equal(options.method, 'PATCH');
  assert.equal(options.headers.get('x-admin-api-key'), 'test-secret-not-a-real-key');
  assert.equal(Buffer.from(options.body).toString(),'{'+'"title":"Updated"}');
  assert.equal(response.status,200);
  assert.equal((await response.text()).includes('test-secret'),false);
});

test('preserves backend 401/404 codes without decoding errors', async () => {
  configure();
  globalThis.fetch=async()=>new Response('{"success":false,"error":"Unauthorized"}',{
    status:401,headers:{'content-type':'application/json','content-encoding':'br'}
  });
  const response=await handler(new Request('https://amaniadmin.netlify.app/api/admin/live/analytics'));
  assert.equal(response.status,401);
  assert.equal(response.headers.get('content-encoding'),null);
  assert.equal((await response.json()).error,'Unauthorized');
});

test('unconfigured environment returns 503 without calling Render', async () => {
  delete process.env.ADMIN_API_KEY;
  configure();
  delete process.env.ADMIN_API_KEY;
  globalThis.fetch = async () => {throw new Error('should not run');};
  const response=await handler(new Request('https://amaniadmin.netlify.app/health'));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'Admin proxy is not configured');
});

test('unrecognized paths cannot be proxied', async () => {
  configure();
  globalThis.fetch = async () => {throw new Error('should not run');};
  const response=await handler(new Request('https://amaniadmin.netlify.app/internal')); 
  assert.equal(response.status,404);
});

test('backend network failures return safe 502 JSON', async () => {
  configure();
  globalThis.fetch=async()=>{throw new Error('network down');};
  const response=await handler(new Request('https://amaniadmin.netlify.app/health'));
  assert.equal(response.status,502);
  assert.equal((await response.json()).error,'Admin backend is unavailable');
});
