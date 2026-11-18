# Responsible AI Gateway

A hackathon concept for evidence-backed review of enterprise AI use cases in UK banking. Start with a synthetic complaints investigation assistant.

A project team submits a business brief, architecture and data-flow diagrams, and vendor documentation. The gateway extracts reviewable facts and links each finding to its source. A reviewer confirms applicability, resolves gaps, and records the decision.

## Prototype scope

| Requirement | Review question |
| --- | --- |
| [UK GDPR Article 28](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/what-needs-to-be-included-in-the-contract/) | If the model provider acts as a processor, does the agreement cover the proposed processing? |
| [UK GDPR Chapter V](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/a-brief-guide-to-international-transfers/) | Does a data flow involve a restricted transfer, and what evidence supports the transfer mechanism? |
| [FCA DISP 1.4.1R](https://handbook.fca.org.uk/handbook/disp1) | What does the workflow show about how a handler investigates the complaint, reviews evidence, and approves a response? |

## Demo

The owner says complaint transcripts stay with the approved UK processor. The proposed release enables an overseas fallback. A judge opens the release configuration, vendor schedule and preloaded test evidence to see what happens on timeout. The reviewer sees why the assessment changed and records a request for the fallback agreement and transfer evidence.

[Product spec and demo acceptance criteria](docs/product-spec.md)

**Status:** Product design and a planned synthetic demo. A live sandbox is optional.
