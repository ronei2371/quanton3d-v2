import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serverJs = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('Helmet: importado e aplicado como middleware', () => {
  assert.match(serverJs, /import helmet from ['"]helmet['"]/);
  assert.match(serverJs, /app\.use\(\s*helmet\(/);
});

test('Helmet: x-powered-by desabilitado', () => {
  assert.match(serverJs, /app\.disable\(['"]x-powered-by['"]\)/);
});

test('Helmet: Content-Security-Policy configurada com diretivas essenciais', () => {
  assert.match(serverJs, /contentSecurityPolicy/);
  assert.match(serverJs, /defaultSrc/);
  assert.match(serverJs, /scriptSrc/);
  assert.match(serverJs, /objectSrc/);
});

test('Helmet: CSP inclui domínios GA4 e GTM na allowlist', () => {
  assert.match(serverJs, /googletagmanager\.com/);
  assert.match(serverJs, /google-analytics\.com/);
});

test('Helmet: crossOriginEmbedderPolicy desabilitado (necessário para GA4 e imagens R2)', () => {
  assert.match(serverJs, /crossOriginEmbedderPolicy\s*:\s*false/);
});

test('Helmet: crossOriginResourcePolicy permite cross-origin (CDN R2)', () => {
  assert.match(serverJs, /crossOriginResourcePolicy/);
  assert.match(serverJs, /cross-origin/);
});

test('Helmet: Referrer-Policy configurada', () => {
  assert.match(serverJs, /referrerPolicy/);
  assert.match(serverJs, /strict-origin-when-cross-origin/);
});
