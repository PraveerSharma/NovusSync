# Synthetic Discovery Examples

Every file in this folder is fictional training data. It is safe for local rehearsal but must never be imported into the real research denominator or cited as customer evidence.

- `synthetic_redacted_handoff.csv` exercises the offline handoff checker with 10 fictional eligible interviews and one fictional ineligible conversation.

Run:

```sh
ruby scripts/discovery/analyze_handoff.rb docs/discovery/examples/synthetic_redacted_handoff.csv
```

Expected recommendation: `PROCEED_TO_REMAINING_G0_VALIDATION`. This means only that the fictional interview checkpoint passes the script's minimum calculation; it does not pass any real Gate G0 row.

The checker also has a dependency-free synthetic regression suite covering every recommendation branch, duplicate studio handling, explicit exclusions, malformed contradictions, missing reasons/flags, malformed CSV, and the blank template:

```sh
ruby scripts/discovery/test_analyze_handoff.rb
```

The fixtures under `scripts/discovery/fixtures/` are fictional tooling inputs. They must never enter the real research denominator.
