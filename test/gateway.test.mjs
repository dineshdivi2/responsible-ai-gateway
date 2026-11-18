import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assess, grade } from '../assessment.mjs';
import { createGateway } from '../server.mjs';

const finding = (run, id) => run.requirements.find(item => item.id === id);

test('seeded case links the owner mismatch to real recorded evidence and two requests', () => {
  const run = assess('proposed');
  assert.equal(finding(run, 'chapterV').applicability, 'Applies');
  assert.equal(finding(run, 'chapterV').grade, 'Insufficient evidence');
  assert.equal(finding(run, 'chapterV').mismatch, true);
  assert.equal(finding(run, 'article28').grade, 'Partially evidenced');
  assert.equal(finding(run, 'disp').applicability, 'Applies');
  assert.equal(finding(run, 'disp').findings[0].status, 'Evidenced in test');
  assert.deepEqual(run.requests.map(item => item.owner), ['Third-party risk', 'Privacy']);
  const timeout = run.evidence.find(item => item.id === 'timeout');
  assert.equal(timeout.kind, 'Recorded test evidence');
  assert.deepEqual(JSON.parse(timeout.body).observed.map(item => item.destination), ['primary', 'fallback']);
  for (const id of [...run.discrepancy.refs, ...run.requirements.flatMap(rule => rule.findings.flatMap(check => check.refs))]) {
    assert.ok(run.evidence.some(item => item.id === id), 'Evidence link ' + id + ' resolves');
  }
});

test('missing configuration and disabled fallback produce different applicability', () => {
  const missing = assess('missing');
  assert.equal(finding(missing, 'chapterV').applicability, 'Unresolved');
  assert.equal(finding(missing, 'chapterV').mismatch, false);
  assert.equal(missing.evidence.find(item => item.id === 'timeout').kind, 'Unverified');
  const disabled = assess('disabled');
  assert.equal(finding(disabled, 'chapterV').applicability, 'Out of scope');
  assert.equal(finding(disabled, 'article28').grade, 'Fully evidenced');
  assert.equal(disabled.evidence.find(item => item.id === 'timeout').kind, 'Recorded test evidence');
});

test('unknown evidence never produces an all-gaps or fully evidenced grade', () => {
  assert.equal(grade('Applies', [{ status: 'Evidence missing' }]), 'Insufficient evidence');
  assert.equal(grade('Applies', [{ status: 'Gap identified' }]), 'Confirmed gaps across all checks');
  assert.equal(grade('Applies', [{ status: 'Evidenced in design' }, { status: 'Evidence missing' }]), 'Partially evidenced');
});

test('review and decision survive a server restart without changing the assessment', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gateway-test-'));
  let server;
  async function open() {
    server = createGateway(directory).listen(0, '127.0.0.1');
    await once(server, 'listening');
    return 'http://127.0.0.1:' + server.address().port;
  }
  async function close() {
    const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    server.closeAllConnections?.();
    await closed;
    server = null;
  }
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    let base = await open();
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await post(base + '/api/reviews', { variant: '__proto__' })).status, 400);
    const created = await post(base + '/api/reviews', { variant: 'proposed' });
    assert.equal(created.status, 201);
    const run = await created.json();
    const decisionUrl = base + '/api/reviews/' + run.id + '/decisions';
    assert.equal((await post(decisionUrl, { action: 'Request evidence', rationale: ' ' })).status, 400);
    const decision = await post(decisionUrl, { action: 'Request evidence', rationale: 'Need agreement and transfer evidence.' });
    assert.equal(decision.status, 201);
    await post(base + '/api/reviews', { variant: 'missing' });
    await close();
    base = await open();
    const list = await (await fetch(base + '/api/reviews')).json();
    assert.equal(list.latest.variant, 'missing');
    assert.equal(list.history.length, 2);
    const saved = await (await fetch(base + '/api/reviews/' + run.id)).json();
    assert.deepEqual(saved.requirements, run.requirements);
    assert.deepEqual(saved.evidence, run.evidence);
    assert.equal(saved.decisions[0].action, 'Request evidence');
    assert.deepEqual(saved.decisions[0].requests, run.requests);
  } finally {
    if (server) await close();
    await rm(directory, { recursive: true, force: true });
  }
});
