import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { investigate, sendReply } from './complaints.mjs';

const fixture = JSON.parse(await readFile(new URL('./submission.json', import.meta.url)));
const source = await readFile(new URL('./complaints.mjs', import.meta.url));
const sourceHash = createHash('sha256').update(source).digest('hex');
const transcript = 'Synthetic complaint about a duplicate account fee.';
const draft = { id: 'draft-1', text: 'Your complaint has been reviewed.' };

function providers(observed, timeout) {
  return {
    primary: { async summarize(input) {
      assert.equal(input, transcript);
      observed.push({ destination: 'primary', received: 'synthetic transcript' });
      if (timeout) throw Object.assign(new Error('Test timeout'), { code: 'MODEL_TIMEOUT' });
      return draft;
    } },
    fallback: { async summarize(input) {
      assert.equal(input, transcript);
      observed.push({ destination: 'fallback', received: 'synthetic transcript' });
      return draft;
    } },
  };
}

const normal = [];
assert.deepEqual(await investigate(transcript, fixture.configuration, providers(normal, false)), draft);
assert.deepEqual(normal.map(item => item.destination), ['primary']);

const timeout = [];
assert.deepEqual(await investigate(transcript, fixture.configuration, providers(timeout, true)), draft);
assert.deepEqual(timeout.map(item => item.destination), ['primary', 'fallback']);

const disabled = [];
const disabledConfig = { fallbackEnabled: false };
assert.deepEqual(await investigate(transcript, disabledConfig, providers(disabled, true)), { handoff: 'complaint-handler' });
assert.deepEqual(disabled.map(item => item.destination), ['primary']);

const sent = [];
const delivery = { send: value => sent.push(value.id) };
assert.deepEqual(sendReply(draft, undefined, delivery), { sent: false });
assert.equal(sent.length, 0);
assert.deepEqual(sendReply(draft, { draftId: draft.id, role: 'complaint-handler' }, delivery), { sent: true });
assert.equal(sent.length, 1);

const record = {
  kind: 'Recorded test evidence',
  release: fixture.release,
  sourceHash,
  recordedAt: new Date().toISOString(),
  scenarios: [
    { id: 'primary_success', configuration: fixture.configuration, observed: normal },
    { id: 'primary_timeout', configuration: fixture.configuration, observed: timeout },
    { id: 'primary_timeout_disabled', configuration: disabledConfig, observed: disabled, handoff: 'complaint-handler' },
    { id: 'reply_requires_approval', observed: { sendsBeforeApproval: 0, sendsAfterApproval: 1 } },
  ],
};

await writeFile(new URL('./recorded-evidence.json', import.meta.url), JSON.stringify(record, null, 2) + '\n');
console.log('Recorded four scenarios against ' + sourceHash.slice(0, 12));
