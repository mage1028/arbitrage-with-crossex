import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { HOST, makeTestApp } from './helpers/gate-nock';

// /api/credentials never talks to Gate, so guard behavior is isolated here.
const URL = '/api/credentials';

describe('host/origin guard', () => {
  let app: FastifyInstance;
  afterEach(async () => {
    await app?.close();
  });

  it('rejects a foreign Host header (DNS rebinding)', async () => {
    app = makeTestApp();
    const res = await app.inject({ method: 'GET', url: URL, headers: { host: 'evil.com' } });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      ok: false,
      error: { category: 'auth', message: 'forbidden host/origin' },
    });
  });

  it('accepts loopback host with a localhost origin', async () => {
    app = makeTestApp();
    const res = await app.inject({
      method: 'GET',
      url: URL,
      headers: { ...HOST, origin: 'http://localhost:6688' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
    expect(res.headers['access-control-allow-origin']).toBeUndefined(); // no CORS, ever
  });

  it('rejects a foreign Origin even with a valid Host (CSRF)', async () => {
    app = makeTestApp();
    const res = await app.inject({
      method: 'GET',
      url: URL,
      headers: { host: 'localhost:6688', origin: 'https://evil.com' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.category).toBe('auth');
  });

  it('accepts bare localhost without a port', async () => {
    app = makeTestApp();
    const res = await app.inject({
      method: 'GET',
      url: URL,
      headers: { ...HOST, host: 'localhost' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts an exact configured HTTPS host and origin', async () => {
    app = makeTestApp({ trustedOrigins: ['https://crossarb.asunamage.xyz'] });
    const res = await app.inject({
      method: 'GET',
      url: URL,
      headers: {
        'x-arb-token': HOST['x-arb-token'],
        host: 'crossarb.asunamage.xyz',
        origin: 'https://crossarb.asunamage.xyz',
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it('does not trust a sibling or suffix host', async () => {
    app = makeTestApp({ trustedOrigins: ['https://crossarb.asunamage.xyz'] });
    for (const host of ['evil.asunamage.xyz', 'crossarb.asunamage.xyz.evil.test']) {
      const res = await app.inject({ method: 'GET', url: URL, headers: { ...HOST, host } });
      expect(res.statusCode).toBe(403);
    }
  });

  it('still rejects a foreign origin on the configured host', async () => {
    app = makeTestApp({ trustedOrigins: ['https://crossarb.asunamage.xyz'] });
    const res = await app.inject({
      method: 'GET',
      url: URL,
      headers: {
        'x-arb-token': HOST['x-arb-token'],
        host: 'crossarb.asunamage.xyz',
        origin: 'https://evil.asunamage.xyz',
      },
    });
    expect(res.statusCode).toBe(403);
  });

  // A framed page is same-origin with /api, so the Host/Origin guard above lets
  // its requests straight through — anti-framing headers are the only thing
  // standing between a browsed website and a one-click Convert/Stop.
  it('refuses to be framed', async () => {
    app = makeTestApp();
    const res = await app.inject({ method: 'GET', url: URL, headers: { host: 'localhost' } });
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toBe("frame-ancestors 'none'");
  });

  it('sends the anti-framing headers on a rejected request too', async () => {
    app = makeTestApp();
    const res = await app.inject({ method: 'GET', url: URL, headers: { host: 'evil.com' } });
    expect(res.statusCode).toBe(403);
    expect(res.headers['x-frame-options']).toBe('DENY');
  });
});
