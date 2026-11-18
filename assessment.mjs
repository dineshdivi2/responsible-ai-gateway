import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL('./demo/' + name, import.meta.url), 'utf8');
const fixture = JSON.parse(read('submission.json'));
const source = read('complaints.mjs');
const sourceHash = createHash('sha256').update(source).digest('hex');
const observations = JSON.parse(read('recorded-evidence.json'));
const policy = 'UK complaints pilot · v1';
const requirement = {
  article28: { name: 'Processor agreements', code: 'UK GDPR Article 28', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/' },
  chapterV: { name: 'International transfers', code: 'UK GDPR Chapter V', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/' },
  disp: { name: 'Complaints resolution', code: 'FCA DISP 1.4.1R', url: 'https://handbook.fca.org.uk/handbook/disp1' },
};

export const variants = Object.freeze({
  proposed: { label: 'Proposed release', revision: '1', configuration: fixture.configuration },
  missing: { label: 'Configuration missing', revision: '2', configuration: null },
  disabled: { label: 'Fallback disabled', revision: '3', configuration: { fallbackEnabled: false } },
});

const asJSON = value => JSON.stringify(value, null, 2);
const snippet = (first, last) => source.split('\n').slice(first - 1, last).map((line, i) => (first + i) + '  ' + line).join('\n');
const result = (title, status, detail, refs) => ({ title, status, detail, refs });
const unknown = 'Evidence missing';
const supported = 'Evidenced in design';
const gap = 'Gap identified';

export function grade(applicability, checks) {
  if (applicability === 'Out of scope') return 'Out of scope';
  if (applicability === 'Unresolved' || checks.length === 0) return 'Insufficient evidence';
  const verified = checks.filter(check => [supported, 'Evidenced in test'].includes(check.status)).length;
  if (verified === checks.length) return 'Fully evidenced';
  if (verified > 0) return 'Partially evidenced';
  if (checks.every(check => check.status === gap)) return 'Confirmed gaps across all checks';
  return 'Insufficient evidence';
}

export function assess(variantId) {
  if (!Object.hasOwn(variants, variantId)) throw new RangeError('Unknown submission revision');
  const variant = variants[variantId];
  const { configuration } = variant;
  const hasFallback = configuration?.fallbackEnabled;
  const recorded = observations.sourceHash === sourceHash && observations.release === fixture.release;
  const scenario = recorded && configuration && observations.scenarios.find(item =>
    item.id === (hasFallback ? 'primary_timeout' : 'primary_timeout_disabled') &&
    item.configuration.fallbackEnabled === hasFallback
  );
  const approval = recorded && observations.scenarios.find(item => item.id === 'reply_requires_approval');
  const sourceRef = 'demo/complaints.mjs · ' + sourceHash.slice(0, 12);
  const evidence = [
    { id: 'owner', kind: 'Business proposal', title: 'Owner declaration', locator: 'Submission · revision ' + variant.revision,
      body: fixture.purpose + '\n\n“' + fixture.boundary + '”\n\n' + asJSON(fixture.declarations) },
    { id: 'architecture', kind: 'Architecture', title: 'Submitted data flow', locator: 'Architecture · model routing',
      body: 'Complaint record feeds a transcript to the investigation assistant.\nThe diagram identifies the primary processor in the United Kingdom.\nThe handler reviews the draft before a customer response is sent.' },
    { id: 'source', kind: 'Source code', title: 'Timeout routing', locator: sourceRef + ' · lines 1–9', body: snippet(1, 9) },
    { id: 'config', kind: 'Release configuration', title: 'Target configuration', locator: fixture.environment + ' · revision ' + variant.revision,
      body: configuration ? asJSON(configuration) : 'The submission does not include configuration for this release.' },
    { id: 'vendor', kind: 'Vendor documentation', title: 'Vendor schedule', locator: 'Synthetic vendor schedule · §2',
      body: asJSON({ primary: fixture.primary, fallback: fixture.fallback }) },
    { id: 'contracts', kind: 'Vendor documentation', title: 'Processor agreements', locator: 'Synthetic primary agreement · processing schedule',
      body: asJSON(fixture.agreements) + '\n\nNo fallback agreement was supplied.' },
    { id: 'transfers', kind: 'Submission inventory', title: 'Transfer mechanism documentation', locator: 'Synthetic submission · transfer register',
      body: 'The register contains no transfer mechanism for the fallback flow.' },
    { id: 'workflow', kind: 'Operating procedure', title: 'Complaints handling workflow', locator: 'Synthetic handler procedure · §3',
      body: 'A handler must review and approve the draft. Contradictory evidence is escalated. The procedure does not specify access to source records.' },
    scenario
      ? { id: 'timeout', kind: observations.kind, title: 'Primary timeout observation',
        locator: fixture.release + ' · ' + scenario.id + ' · source ' + sourceHash.slice(0, 12),
        body: asJSON({ recordedAt: observations.recordedAt, ...scenario }) }
      : { id: 'timeout', kind: 'Unverified', title: 'Primary timeout observation', locator: fixture.release,
        body: 'No recorded observation matches the reviewed source and release configuration.' },
    approval
      ? { id: 'approval', kind: observations.kind, title: 'Handler approval observation',
        locator: fixture.release + ' · source ' + sourceHash.slice(0, 12), body: asJSON(approval) }
      : { id: 'approval', kind: 'Unverified', title: 'Handler approval observation', locator: fixture.release,
        body: 'No recorded observation matches the reviewed source.' },
  ];

  const flowRefs = ['source', 'config', 'vendor', 'timeout'];
  const activeProcessors = [fixture.primary, ...(hasFallback ? [fixture.fallback] : [])]
    .filter(provider => fixture.personalData && provider.role === 'Processor');
  const processorChecks = activeProcessors.map(provider => {
    const agreement = fixture.agreements.find(item => item.entity === provider.entity && item.service === provider.service);
    if (!agreement) return result(provider.entity + ' agreement', unknown, 'The packet does not include an agreement for this provider and service.', ['vendor', 'contracts']);
    const coversProcessing = agreement.transcriptsCovered && agreement.documentedInstructions && agreement.subprocessorTerms;
    return result(provider.entity + ' agreement', coversProcessing ? supported : gap,
      coversProcessing ? 'The submitted terms cover the selected transcript-processing checks.' : 'The agreement does not meet the selected terms.',
      ['vendor', 'contracts']);
  });
  if (hasFallback === undefined) processorChecks.push(result('Fallback processor coverage', unknown, 'Confirm the release configuration to establish whether the fallback requires review.', flowRefs));

  const restricted = hasFallback && fixture.personalData && fixture.ukGdprApplies &&
    fixture.bankInitiatesFlow && fixture.fallback.separateEntity && fixture.fallback.outsideUK;
  const hasMechanism = fixture.transferMechanisms.includes(fixture.fallback.entity);
  const transferChecks = restricted
    ? [result('Transfer mechanism for ' + fixture.fallback.entity,
        hasMechanism ? supported : unknown,
        hasMechanism ? 'The submission documents a mechanism for the fallback flow.'
          : 'The release enables the fallback to a separate overseas entity. The submission lacks evidence of a mechanism covering the flow.',
        [...flowRefs, 'transfers'])]
    : hasFallback === undefined ? [result('Fallback applicability', unknown, 'Confirm whether the fallback is enabled in this release.', flowRefs)] : [];
  const describeControl = value => value === true ? supported : value === false ? gap : unknown;
  const dispChecks = [
    result('Handler approval before a reply', approval ? 'Evidenced in test' : describeControl(fixture.workflow.handlerApproval),
      approval ? 'The reply stub recorded zero sends before approval and one after approval.' : 'The submitted workflow requires approval. Runtime verification is unavailable.',
      ['workflow', 'approval']),
    result('Handler access to source records', describeControl(fixture.workflow.sourceRecordAccess),
      'The submitted procedure does not establish what underlying records the handler can inspect.', ['workflow']),
    result('Escalate conflicting evidence', describeControl(fixture.workflow.conflictEscalation),
      'The procedure calls for escalation when evidence conflicts.', ['workflow']),
  ];
  function report(key, applicability, findings, summary) {
    const declared = fixture.declarations[key];
    return { id: key, ...requirement[key], applicability, declared, mismatch: applicability !== 'Unresolved' && applicability !== declared,
      grade: grade(applicability, findings), summary, findings };
  }
  const requirements = [
    report('article28', activeProcessors.length ? 'Applies' : 'Out of scope', processorChecks,
      hasFallback ? 'The primary agreement is evidenced. The configured fallback has no submitted agreement.' : 'The primary provider processes transcripts on behalf of the bank.'),
    report('chapterV', hasFallback === undefined ? 'Unresolved' : restricted ? 'Applies' : 'Out of scope', transferChecks,
      hasFallback === undefined ? 'The source shows a possible fallback. Its release configuration is missing.'
        : restricted ? 'The release enables a fallback to a separate overseas recipient. The transfer mechanism is missing.'
        : 'The reviewed configuration disables the identified overseas route.'),
    report('disp', fixture.complaintsInScope ? 'Applies' : 'Out of scope', dispChecks, 'Handler approval is documented. Access to the underlying complaint records still needs evidence.'),
  ];
  const requests = hasFallback ? [
    { title: 'Supply the fallback processor agreement', owner: 'Third-party risk', requirement: 'article28', evidence: 'contracts' },
    { title: 'Provide the transfer mechanism for the fallback flow', owner: 'Privacy', requirement: 'chapterV', evidence: 'transfers' },
  ] : hasFallback === undefined
    ? [{ title: 'Confirm the target release configuration', owner: 'Engineering', requirement: 'chapterV', evidence: 'config' }]
    : [{ title: 'Confirm handler access to source records', owner: 'Complaints operations', requirement: 'disp', evidence: 'workflow' }];
  const discrepancy = hasFallback ? {
    status: 'Contradicted', headline: 'The configured fallback sends transcripts overseas',
    detail: 'The timeout route sends transcripts to Meridian Inference Inc. The vendor schedule identifies the processor as a separate US entity.',
  } : hasFallback === undefined ? {
    status: 'Unverified', headline: 'The fallback path is possible',
    detail: 'The code contains a timeout route. The submission lacks the configuration needed to determine whether the route is enabled.',
  } : {
    status: 'Supported for tested path', headline: 'The reviewed release disables the fallback',
    detail: scenario ? 'The timeout check shows the case returning to a handler without invoking the fallback stub.'
      : 'The release configuration disables the fallback. No matching runtime observation is available.',
  };

  return {
    submission: { id: fixture.id, title: fixture.title, revision: variant.revision, owner: fixture.owner, environment: fixture.environment,
      release: fixture.release, sourceHash, policy, boundary: fixture.boundary },
    variant: variantId, requirements, requests, evidence, discrepancy: { ...discrepancy, refs: flowRefs },
  };
}
