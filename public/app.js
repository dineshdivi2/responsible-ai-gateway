const at = selector => document.querySelector(selector);
const workspace = at('#workspace');
const runButton = at('#run-review');
const revision = at('#revision');
const drawer = at('#evidence');
let current;
let busy = false;

const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const esc = html;
const timestamp = value => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const tone = value => ({
  'Applies': 'purple', 'Out of scope': 'neutral', 'Unresolved': 'amber',
  'Partially evidenced': 'amber', 'Insufficient evidence': 'amber', 'Evidence missing': 'amber',
  'Confirmed gaps across all checks': 'red', 'Gap identified': 'red', 'Contradicted': 'red',
  'Fully evidenced': 'green', 'Evidenced in test': 'green', 'Evidenced in design': 'green',
  'Supported for tested path': 'green', 'Unverified': 'amber', 'Recorded test evidence': 'green',
})[value] ?? 'neutral';
const tag = value => '<span class="tag ' + tone(value) + '">' + esc(value) + '</span>';

async function api(path, payload) {
  const options = payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : undefined;
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

function evidenceButton(id, label) {
  return '<button type="button" class="evidence-link" data-evidence="' + esc(id) + '">' + esc(label) + ' <span aria-hidden="true">↗</span></button>';
}

function renderRequirement(rule, evidence) {
  const checks = rule.findings.map(finding =>
    '<div class="check"><div><strong>' + esc(finding.title) + '</strong>' + tag(finding.status) + '</div>' +
    '<p>' + esc(finding.detail) + '</p><div class="sources">' +
    finding.refs.map(id => evidenceButton(id, evidence.get(id).title)).join('') + '</div></div>'
  ).join('');
  return '<details class="requirement" id="' + esc(rule.id) + '">' +
    '<summary><div class="rule-name"><span>' + esc(rule.code) + '</span><strong>' + esc(rule.name) + '</strong></div>' +
    '<div class="rule-tags">' + tag(rule.applicability) + tag(rule.grade) +
    (rule.mismatch ? '<span class="tag red">Owner mismatch</span>' : '') + '</div><span class="chevron" aria-hidden="true">⌄</span></summary>' +
    '<div class="rule-content"><p class="declaration">Owner declared <strong>' + esc(rule.declared) +
    '</strong></p><p>' + esc(rule.summary) + '</p>' + checks +
    '<a class="source-link" href="' + esc(rule.url) + '" target="_blank" rel="noreferrer">Regulatory reference ↗</a></div></details>';
}

function render(run) {
  current = run;
  revision.value = run.variant;
  const s = run.submission;
  const evidence = new Map(run.evidence.map(entry => [entry.id, entry]));
  const latest = run.decisions.at(-1);
  const requests = run.requests.map((item, index) =>
    '<li><span class="req-index">' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + esc(item.title) +
    '</strong><span>' + esc(item.owner) + '</span></div><button type="button" class="text-link" data-rule="' +
    esc(item.requirement) + '">Open finding <span aria-hidden="true">↘</span></button></li>'
  ).join('');
  const trail = run.discrepancy.refs.map(id => evidenceButton(id, evidence.get(id).title)).join('');
  const history = run.decisions.slice().reverse().map(item =>
    '<li><strong>' + esc(item.action) + '</strong><span>' + esc(timestamp(item.recordedAt)) + '</span><p>' +
    esc(item.rationale) + '</p></li>'
  ).join('');
  workspace.innerHTML =
    '<section class="case-heading"><div class="case-meta"><span class="section-label">AI USE CASE REVIEW</span>' +
    tag('Revision ' + s.revision) + '</div><h1>' + esc(s.title) + '</h1><p class="case-details">' +
    esc(s.owner) + '<span aria-hidden="true">·</span>' + esc(s.environment) + '</p></section>' +
    '<div class="review-grid"><section class="panel requests"><div class="panel-heading"><div><h2>What needs to happen before sign-off?</h2>' +
    '<p>Follow-up evidence requested for this release</p></div><span class="count">' + run.requests.length + '</span></div><ol>' + requests + '</ol></section>' +
    '<section class="panel owner"><span class="section-label">OWNER DECLARATION</span><blockquote>“' + esc(s.boundary) +
    '”</blockquote><div class="sources">' + evidenceButton('owner', 'Business proposal') + evidenceButton('architecture', 'Architecture') + '</div></section></div>' +
    '<section class="discrepancy"><div class="finding-title">' + tag(run.discrepancy.status) + '<span class="muted">Data flow review</span></div><h2>' +
    esc(run.discrepancy.headline) + '</h2><p>' + esc(run.discrepancy.detail) + '</p><div class="sources">' + trail + '</div></section>' +
    '<section id="assessment" class="assessment"><div class="section-heading"><h2>Regulatory assessment</h2><span>' + esc(s.policy) +
    '</span></div>' + run.requirements.map(rule => renderRequirement(rule, evidence)).join('') + '</section>' +
    '<section id="decision" class="panel decision"><div class="panel-heading"><div><h2>Reviewer decision</h2><p>' +
    esc(latest ? 'Latest decision recorded ' + timestamp(latest.recordedAt) : 'Record a disposition for this assessment.') + '</p></div>' +
    tag(latest?.action ?? 'Pending review') + '</div><form id="decision-form">' +
    '<label for="action">Disposition</label><select id="action" name="action" required><option>Request evidence</option><option>Refer to specialist</option>' +
    '<option>Approve within assessed scope</option><option>Decline</option></select>' +
    '<label for="rationale">Rationale</label><textarea id="rationale" name="rationale" maxlength="2000" rows="3" required ' +
    'placeholder="Explain the decision for this release."></textarea><div class="form-actions">' +
    '<button class="primary" type="submit">Save decision</button><p id="decision-status" role="status"></p></div></form>' +
    (history ? '<details class="decision-history"><summary>Recorded decisions (' + run.decisions.length + ')</summary><ol>' +
      history + '</ol></details>' : '') + '</section><footer>Source ' + esc(s.sourceHash.slice(0, 12)) +
    ' · ' + esc(s.release) + ' · Assessed ' + esc(timestamp(run.createdAt)) + '</footer>';
}

async function refreshHistory() {
  const data = await api('/api/reviews');
  at('#history-list').innerHTML = data.history.map(item =>
    '<button type="button" data-review="' + esc(item.id) + '">Revision ' + esc(item.revision) +
    ' <small>' + esc(item.decision) + '</small></button>'
  ).join('') || '<p>No reviews yet.</p>';
  return data;
}

async function runSelected() {
  if (busy) return;
  busy = true;
  runButton.disabled = true;
  revision.disabled = true;
  runButton.textContent = 'Assessing…';
  try {
    render(await api('/api/reviews', { variant: revision.value }));
    await refreshHistory();
  } catch (error) {
    if (!current) workspace.textContent = error.message;
    else window.alert(error.message);
  } finally {
    runButton.disabled = false;
    revision.disabled = false;
    runButton.textContent = 'Run assessment';
    busy = false;
  }
}

runButton.addEventListener('click', runSelected);
at('.close').addEventListener('click', () => drawer.close());
drawer.addEventListener('click', event => { if (event.target === drawer) drawer.close(); });
document.addEventListener('click', async event => {
  const button = event.target.closest('button[data-evidence], button[data-rule], button[data-review]');
  if (!button) return;
  if (button.dataset.evidence) {
    const found = current.evidence.find(item => item.id === button.dataset.evidence);
    at('#evidence-kind').textContent = found.kind;
    at('#evidence-kind').className = 'tag ' + tone(found.kind);
    at('#evidence-title').textContent = found.title;
    at('#evidence-locator').textContent = found.locator;
    at('#evidence-body').textContent = found.body;
    drawer.showModal();
  } else if (button.dataset.rule) {
    const rule = document.getElementById(button.dataset.rule);
    rule.open = true;
    rule.scrollIntoView({ block: 'start' });
    rule.querySelector('summary').focus({ preventScroll: true });
  } else if (!busy) {
    try { render(await api('/api/reviews/' + button.dataset.review)); }
    catch (error) { window.alert(error.message); }
  }
});

workspace.addEventListener('submit', async event => {
  if (event.target.id !== 'decision-form') return;
  event.preventDefault();
  const submit = event.target.querySelector('[type=submit]');
  const payload = Object.fromEntries(new FormData(event.target));
  const runId = current.id;
  submit.disabled = true;
  try {
    const saved = await api('/api/reviews/' + runId + '/decisions', payload);
    if (current.id === runId) {
      render(saved);
      at('#decision-status').textContent = 'Decision saved.';
      at('#decision-status').scrollIntoView({ block: 'nearest' });
    }
    await refreshHistory();
  } catch (error) {
    if (current.id === runId) at('#decision-status').textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

try {
  const data = await refreshHistory();
  revision.innerHTML = data.variants.map(variant => '<option value="' + esc(variant.id) + '">' + esc(variant.label) + '</option>').join('');
  if (data.latest) render(data.latest);
  else await runSelected();
  revision.disabled = false;
  runButton.disabled = false;
} catch (error) {
  workspace.textContent = error.message;
}
