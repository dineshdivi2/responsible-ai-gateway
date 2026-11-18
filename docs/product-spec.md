# Responsible AI Gateway

## Business knowledge pack for the hackathon

**Scope.** Pre-deployment review of an AI assistant that investigates retail complaints and drafts a response for a human handler. NatWest has publicly described trialling a complaints investigation agent. The design, vendors and documents below are synthetic. [NatWest’s public trial description](https://www.natwestgroup.com/news-and-insights/latest-stories/ai-and-data/2026/may/collaborating-with-the-financial-conduct-authority-on-testing-ag.html)

**Product promise.** Before signing off an AI use case, the Responsible AI reviewer can see which owner claims the evidence supports, where the proposed release behaves differently, and what evidence is needed next. The gateway recommends findings and the reviewer records the decision.

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
5. **Record the decision.** The reviewer can request evidence, ask the owner to clarify a declaration, or record a scoped disposition with a rationale. Bind the decision to the reviewed artefact revisions. When the owner resubmits, recheck affected findings and preserve the earlier review.

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

## Reviewer decision screen

Lead with **What needs to happen before sign-off?** For the seeded case, show two requests: the agreement covering the fallback processor and evidence of the transfer mechanism for that flow. Give each request an owner and a link to the finding that raised it.

Show three answers for each requirement:

| Reviewer question | What the gateway shows |
| --- | --- |
| Does it apply? | **Applies**, **Out of scope**, or **Unresolved**, alongside the owner's declaration and any mismatch. |
| What do the checks substantiate? | A scoped evidence grade for applicable checks, with the individual findings and cited evidence. |
| What did the reviewer decide? | A recorded disposition and rationale, such as **Request evidence**, kept alongside the gateway's original assessment. |

| Evidence grade | Meaning |
| --- | --- |
| **Fully evidenced** | Evidence supports every applicable check in the selected scope. |
| **Partially evidenced** | Evidence supports at least one applicable check, and one or more other checks have a gap or remain open. |
| **Confirmed gaps across all checks** | Evidence establishes a gap on every applicable check. |
| **Insufficient evidence** | Applicability is unresolved, or no applicable check is supported and at least one remains unverified. |

Each finding cites the document revision and page, contract clause, or code and configuration reference. A test observation identifies the scenario, source revision, configuration and result. The report also retains the requirement version, submission revision, finding rationale and next action.

## Judge walkthrough

1. **Open the submission.** The owner declares that complaint transcripts stay with the approved UK processor and marks Chapter V out of scope. The submitted diagram shows the primary provider.
2. **Open the discrepancy.** The repository shows a timeout route, the release configuration enables it, and the vendor schedule identifies a separate overseas recipient. A recorded test shows the fallback stub receiving a synthetic transcript for that scenario. The seeded case establishes that UK GDPR applies and the bank initiates the flow.
3. **Review the three findings.** Chapter V is **Applies / Insufficient evidence** because the packet lacks evidence of a transfer mechanism. Article 28 is **Applies / Partially evidenced** because the primary agreement supports the selected checks for that processor and the submission lacks a fallback agreement. DISP remains **Applies**, with evidence shown separately for each selected complaints control.
4. **Record the decision.** Select **Request evidence**. The review record identifies the two requested items, their owners, the affected release and the rationale for keeping sign-off pending.

## Demo acceptance criteria

- In about 90 seconds, a judge can explain what the owner declared, why the assessment differs, and which evidence is needed next.
- The judge can open the configuration, vendor schedule and recorded observation behind the fallback finding in one click from the finding.
- A test record is labelled **Recorded test evidence** and shows the scenario, reviewed release and observed result. If the demo uses an illustrative fixture before any test has run, label it **Simulated evidence**. Where no usable observation exists, expose that check as unverified.
- In a variant with missing release configuration, the source path remains possible and the fallback transfer stays **Unresolved** unless other evidence establishes the flow for that release.
- Saving **Request evidence** preserves the original assessment and its citations.

The primary demo uses preloaded synthetic evidence. A live sandbox is an optional source of test evidence when a reviewer needs to reproduce behaviour. The gateway reviews the proposed release and records the evidence needed for a human decision.
