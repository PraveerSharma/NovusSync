# Fact Review Competitor Signal

**Research date:** 19 July 2026  
**Scope:** Official product documentation only

## Observed signal

Zoho CRM exposes centralized approval queues, approve/reject/delegate actions, record locking while approval is pending, and chronological approval history. Its separate review process works at field level: reviewers validate marked fields individually and can reject with a reason.

Primary sources:

- [Working on records in approval process](https://help.zoho.com/portal/en/kb/crm/process-management/approval-process/articles/working-on-records-in-approval-process)
- [Review Process](https://help.zoho.com/portal/en/kb/crm/process-management/review-process/articles/review-process)
- [FAQs: Approval Process](https://help.zoho.com/portal/en/kb/crm/faqs/approval-process/articles/faqs-on-approval-process)

## Product implication

The queue-and-history pattern is established, so it is not sufficient differentiation. NovusSync should remain narrower and more evidence-driven:

- Review individual business facts, not lock an entire CRM record.
- Show source provenance, extractor version, confidence, and the current approved value in one decision surface.
- Require a named conflict-resolution path instead of allowing ordinary approval to overwrite disagreement.
- Preserve immutable versions and rejection evidence.
- Keep approval separate from profile application, campaign generation, publishing, messaging, booking, and spending effects.

This is a product inference from the cited official workflows, not evidence that competitor internals use the same data model.
