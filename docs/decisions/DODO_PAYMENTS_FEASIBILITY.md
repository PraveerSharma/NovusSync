# Dodo Payments Feasibility for the Managed Pilot

**Status:** OD-031 pilot terms accepted; Dodo provider/integration not yet approved  
**Reviewed:** 14 July 2026  
**Related decision:** OD-031

## Founder input

The founder has approximately USD 1,000 in Dodo Payments credits and would prefer to use them if the commercial model is eligible and operationally sound.

The product is intended for global commerce: an eligible customer in any activated country should be able to purchase using an approved local/global payment method and currency. “Global” means supported and legally activated jurisdictions, not sanctioned, prohibited, or provider-unsupported countries.

The founder will provide Dodo account/access details when the approved billing integration enters development. Do not request, store, or test those details during product/architecture decision work.

The accepted first-five pilot uses accountant-approved manual India invoicing: INR 4,999 plus applicable tax per 28-day cycle through 100 new Leads or INR 6,999 preselected for 101–200, with an INR 1,000 deposit fully credited to cycle one and no setup fee. Dodo is not used for these payments unless it later approves the exact offer in writing.

## Material finding

Dodo Payments is a Merchant of Record for SaaS, AI, and digital products. Its current Merchant Acceptance Policy expressly excludes manual digital services when most of the value is human labour, including custom design, development, coaching, freelancing, and consulting. The same policy says a fixed, pre-defined productized service with limited, repeatable human operational work may be reviewed, but approval is not guaranteed.

The initial offer is a product-assisted managed marketing and Lead-handling pilot. Two internal operators will perform material Instagram, WhatsApp, onboarding, QA, reconciliation, and support work. It may eventually fit Dodo's productized-service review path if its deliverables become fixed and the software supplies most of the value, but we cannot assume that the initial bundled pilot fee is eligible, regardless of available credits.

The credits are a cost advantage, not permission to misclassify the offer. Artificially separating an ineligible managed service into a nominal software line would create payment, refund, tax, and account-suspension risk.

## Recommendation

1. **Managed pilot:** issue an accountant-approved Indian invoice and collect through the approved business bank/payment route. Keep automated billing outside the MVP.
2. **Dodo remains the preferred future software-billing candidate:** use it only when the paid product delivers substantial standalone software value and Dodo confirms the exact offer in writing.
3. **Productized or hybrid bundle:** do not activate Dodo checkout until Dodo reviews the actual sales page, fixed deliverables, human-service component, pricing, cancellation/refund terms, and confirms eligibility in writing.
4. **Credits:** obtain the written credit grant/expiry/eligible-fee terms. Public documentation does not establish what this specific USD 1,000 grant covers.
5. **If approved later:** use hosted checkout/customer portal first, keep card data out of the product, and integrate through an application-owned billing boundary plus signed, idempotent, out-of-order-safe webhook inbox. Dodo records are evidence; the application owns customer access and commercial state.
6. **Global commerce:** model ISO country/currency, localized price/tax presentation, supported payment methods, billing address/tax ID, refund/cancellation policy version, settlement/reconciliation, and country activation as configurable billing policy. Do not hard-code INR even though the first managed pilot invoices in India.

## Written confirmations required from Dodo

- Is the exact product-assisted managed-marketing/Lead-handling offer permitted, and what maximum human-service component is acceptable?
- If only the software subscription is permitted, what separation of deliverables and invoices does Dodo require?
- Which legal Dodo entity is seller of record for an India-based supplier and Indian studio buyer?
- What GST/tax invoice, withholding/TDS, settlement currency, payout timing, reserve, and reconciliation treatment applies?
- Do the founder's USD 1,000 credits cover transaction, subscription, refund, dispute, FX, or payout fees; when do they expire?
- What refund/cancellation disclosure is required for the exact product?
- Which DPA, controller/processor roles, processing locations, and subprocessors apply to Indian buyers?
- Which buyer and supplier countries, presentment/settlement currencies, local payment methods, sanctions/restrictions, tax registrations, and localized invoices are supported for the intended global launch sequence?

## Current implementation boundary

No Dodo SDK, API key, checkout, webhook, subscription entitlement, or payment-dependent application access is part of the initial managed-pilot build. A future approved implementation must add a `BillingPort`, environment-level sensitive credentials, a signed/idempotent webhook inbox, normalized country/currency/tax/invoice/payment/refund/dispute references, reconciliation, country allow-listing, and explicit failure/ambiguity handling. Request the Dodo account details from the founder only when that implementation task is ready.

## Official sources checked

- [Dodo Payments Merchant Acceptance Policy](https://docs.dodopayments.com/miscellaneous/merchant-acceptance)
- [Dodo Payments pricing](https://dodopayments.com/pricing/)
- [Dodo Payments webhooks](https://docs.dodopayments.com/developer-resources/webhooks)
- [Dodo Payments Data Processing Agreement](https://dodopayments.com/legal/data-processing-agreement)
- [Dodo Payments Master Service Agreement](https://dodopayments.com/legal/terms-of-use)
