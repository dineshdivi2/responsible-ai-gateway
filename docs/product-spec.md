# Responsible AI Gateway

## Business knowledge pack for the hackathon

**Scope.** Pre-deployment review of an AI assistant that investigates retail complaints and drafts a response for a human handler. NatWest has publicly described trialling a complaints investigation agent. The design, vendors and documents below are synthetic. [NatWest’s public trial description](https://www.natwestgroup.com/news-and-insights/latest-stories/ai-and-data/2026/may/collaborating-with-the-financial-conduct-authority-on-testing-ag.html)

**Decision.** Give the Responsible AI reviewer a record of which requirements apply, which controls the submitted design evidences, what needs clarification and who owns each next action. A reviewer confirms the facts and records the disposition.

## Facts to capture once

| Source | Facts the reviewer needs |
|---|---|
| Business proposal | Use-case owner, AI purpose, complaint type, intended users, who investigates and who sends the final response. |
| Architecture and data-flow diagram | Which personal data flows from which system to which legal entity, for what purpose, and where storage, inference, logging or support access can occur. Capture the initiator of each relevant flow and who can access the data. |
| Vendor terms and processing schedule | Contracting legal entity, processor role, service covered, documented instructions, subprocessor terms and any transfer mechanism with its scope. |
| Complaints workflow and control evidence | Handler access to source records, exception handling for missing or contradictory evidence, and an approval step before sending the final reply. |

Keep a source reference for each fact, including document revision and page, clause or diagram label. Mark missing and conflicting facts explicitly. Require the reviewer to resolve a conflict before treating that fact as confirmed. For implementation evidence, capture the repository commit, file and line, target environment and relevant configuration or test reference.

## Review process

1. **Record the owner's declaration.** Capture the operating boundaries the owner is promising and their proposed applicability for each requirement. Split broad claims into facts that can be checked. For example, “UK-only” could mean UK storage, UK model processing or no access by overseas third parties. Record each separately and retain the original declaration.
2. **Reconstruct the system from evidence.** Review the architecture, then trace the relevant workflows in code and in the configuration for the target environment. Record each path with its inputs, conditions, destinations and effects. Use the vendor agreement or deployment evidence to establish facts such as the receiving legal entity and where access occurs.
3. **Look for counterexamples.** For each declared boundary, check normal operation and relevant alternatives such as fallback providers, retries, background jobs, logging and support access. Record the shortest evidence chain that supports or challenges the owner’s claim. A path in source code establishes a possibility. Target-environment configuration or appropriate tests can establish that the path is enabled or reachable. Record coverage gaps where the evidence cannot settle the question.
4. **Derive applicability independently.** Assess all three requirements against the reconstructed facts using the versioned checklist. Compare the result with the owner's declared applicability afterward. Show *Applies*, *Out of scope* or *Unresolved* per requirement or flow, alongside the owner's answer. Track omitted declarations and changes in factual claims even where the applicability result stays the same.
5. **Resolve and recheck.** The reviewer can ask for better evidence, request a design or code change, or ask the owner to correct the declaration. Record the decision against the reviewed artefact revisions. Recheck affected findings when the owner resubmits.

### How the gateway distinguishes findings

| Question | Output |
|---|---|
| Does the evidence support the owner's claim? | **Supported**, **Contradicted** or **Unverified** for the named release and environment. |
| Does the requirement apply to the system as evidenced? | **Applies**, **Out of scope** or **Unresolved**. Compare with the owner's answer and flag a mismatch or omission. |
| What does the evidence show about the selected control? | **Evidenced in design**, **Evidence missing**, **Gap identified** or **Specialist review needed**. Report the evidence level, such as design, configured implementation or test. |

For example, the owner may correctly declare that FCA DISP applies while incorrectly promising that every response receives handler approval. That produces a **control gap without an applicability mismatch**. Conversely, a newly evidenced restricted transfer can change Chapter V applicability even if a valid transfer mechanism is already present.

## The three requirements

### 1. UK GDPR Article 28 · Processor contract

- **Applies when** a provider processes personal data on the bank’s behalf. Refer ambiguous controller or processor roles to Privacy.
- **Evidence to request** is the binding agreement and processing schedule for the legal entity and service in the architecture. The schedule should cover the proposed data and purpose. Article 28 also specifies required terms, including documented instructions and subprocessor conditions.
- **MVP check.** Match the provider, service and processing scope to the submitted agreement. Cite relevant terms. If the submission contains no agreement for the provider, record **Evidence missing**. If the agreement explicitly excludes the proposed transcript processing, record **Gap identified**. Matching the demo criteria supports the selected check only.
- **Owner.** Privacy or third-party risk confirms the role and contract coverage. [ICO guidance on Article 28 contract terms](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/)

### 2. UK GDPR Chapter V · Restricted transfers

- **Applies to a flow** when UK GDPR applies to the processing, the bank initiates making the information available to an organisation outside the UK, and the recipient is a separate legal entity. Assess the initiator for each relevant flow, including onward flows.
- **Evidence to request** is the recipient entity, location and access path, plus the applicable transfer mechanism for any confirmed restricted transfer. A mechanism may be adequacy regulations, appropriate safeguards or an applicable exception. Where appropriate safeguards are relied on, request the supporting transfer risk assessment.
- **MVP check.** Screen each flow using the three conditions. UK application hosting alone leaves overseas access open. If the recipient or access location is unclear, set applicability to **Unresolved**. If a restricted transfer is confirmed but the submission lacks a mechanism, mark **Evidence missing** and refer to Privacy.
- **Owner.** Privacy confirms applicability and whether the mechanism covers the specific transfer. [ICO international transfers guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/)

### 3. FCA Handbook DISP 1.4.1R · Complaints resolution

- **Applies to the demo** because the proposed assistant supports the investigation of retail complaints in scope of the rule. The firm must investigate competently and impartially, assess fairly and promptly, and explain the outcome clearly and without misleading the complainant.
- **Evidence to request** is the workflow and test evidence showing the handler can inspect the underlying evidence, resolve contradictions and approve the final response. These are proposed product controls that support the rule.
- **MVP check.** If the workflow shows mandatory human approval but omits source-record access, mark approval **Evidenced in design** and source-record access **Evidence missing**. If the workflow explicitly lets the assistant send the final response before the required approval, flag a **Gap identified** against the proposed approval control.
- **Owner.** The complaints control owner confirms coverage and decides what operational testing is needed. [FCA Handbook DISP 1](https://handbook.fca.org.uk/handbook/disp1)

## Finding format

Every finding records the **requirement and version**, **use-case revision**, **applicability** (Applies, Out of scope or Unresolved), **evidence status** (Evidenced in design, Evidence missing, Gap identified or Specialist review needed), **owner declaration and comparison**, **evidence level**, **source references**, **reason**, **next action** and **owner**. The reviewer confirms and records the disposition. Preserve the earlier finding when a document revision changes the result.

## Demo and acceptance criteria

The owner submits a synthetic complaints assistant and declares that no overseas third party can access customer transcripts, so they mark Chapter V out of scope. They declare Article 28 and FCA DISP in scope, and promise mandatory handler approval. The architecture shows a UK primary model. The submission includes the application code, target-environment configuration and vendor documents.

| Evidence presented | Expected reviewer result |
|---|---|
| The repo contains a fallback model path, but the submission omits the target-environment setting. | The UK-only claim is **Unverified** for the release. Chapter V applicability is **Unresolved**. Request the setting and recipient details. |
| The repo shows the request includes transcripts. The target configuration enables fallback. Vendor evidence identifies a separate overseas recipient, and the case establishes that the bank initiates the transfer and UK GDPR applies. | The UK-only claim is **Contradicted**. Chapter V changes to **Applies**, against the owner's **Out of scope** declaration. If the packet lacks the transfer mechanism, show **Evidence missing** separately. |
| The fallback provider acts as a processor, but the packet supplies an agreement for the primary provider alone. | Article 28 remains **Applies**. Raise an evidence gap for the fallback processor, with no applicability mismatch. |
| The architecture shows mandatory handler approval. The implementation and a test confirm the reply waits for that approval on the reviewed path, while the packet omits evidence of the handler's source-record access. | FCA DISP remains **Applies**. Record the evidence supporting the approval control on that path. Request evidence of source-record access. |
| The owner resubmits with fallback disabled in the target configuration. | Recheck the affected findings. Retain the prior assessment. Treat Chapter V as out of scope for the reviewed flow only if the evidence also resolves any remaining relevant access or transfer paths. |

The demo succeeds if the reviewer can open the evidence behind a mismatch, distinguish a reachable path from a possible one, and see which decision changes on resubmission.

## Sandbox review and repair

The prototype uses a synthetic codebase, stubbed model providers and synthetic complaint data. Each run records the source commit, test configuration and version of the approved controls.

1. **Approve the checks.** A reviewer translates the declared boundaries into testable assertions. The demo checks whether a primary-provider timeout routes the case to a human handler without sending the transcript to a fallback provider. A second check confirms that the normal investigation still completes.
2. **Run the baseline.** In an isolated sandbox, force the primary stub to time out. The fallback stub records receipt of the synthetic transcript. Link the failing test to the source path and configuration that enabled it.
3. **Propose the repair.** Give a coding agent the failed assertion, evidence and a narrow change scope. Its proposed patch routes a timeout to a handler. The gateway retains control of the acceptance checks.
4. **Verify in a fresh sandbox.** Apply the candidate diff and run the same checks. Record the baseline and patched results, the diff and any scenarios that could not be verified. The reviewer decides whether to accept the change.
5. **Reassess the affected flows.** Update findings for the reviewed release. Tests establish behaviour under the tested conditions. Processor agreements and transfer mechanisms still need their own evidence where applicable.

The sandbox uses isolated storage and preloaded dependencies. Keep production credentials and outbound network access outside the prototype sandbox.
