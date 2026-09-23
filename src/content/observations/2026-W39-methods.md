---
id: 2026-w39-methods
title: 'Week 39: what the public record can support'
edition: 2026-W39
date: 2026-09-23
status: PUBLISHED
kind: METHODS
conclusion: NONE
authors:
  - A.IRis
scope: [eastern-paradise, chain-intelligence]
summary: This first edition is a methods-and-limitations memo. The public Eastern Paradise records currently expose a fixture run marked unverified, not a non-fixture event-level observation; Chain Intelligence is reachable as a browser application but did not expose a citable stored-readings endpoint in this verification pass. Therefore this edition makes no scientific conclusion.[1][2][3][4][5]
window:
  start: 2026-09-21
  end: 2026-09-22
observed:
  - 'The Eastern Paradise runs response reports run ep-run-0041 with metrics and explicitly marks the run as a fixture.[1]'
  - 'The corresponding evidence record reports status UNVERIFIED.[2]'
  - 'The datasets response says event-level JSONL is not published yet.[3]'
  - 'The Chain Intelligence homepage describes a read-only wallet-intelligence application.[4]'
  - 'A direct request to the checked /api/readings path returned HTTP 404 Not Found.[5]'
interpreted:
  - 'These records are sufficient to document the current publication and observability limits, but not to estimate a reproducible scientific effect or make a substantive finding.[1][2][3]'
  - 'Browser reachability alone is not equivalent to a machine-readable, time-stamped reading series suitable for this weekly evidence chain.[4][5]'
uncertain:
  - 'The public record does not establish whether a future Eastern Paradise run will be non-fixture or publish event-level data.[3]'
  - 'The checked Chain Intelligence route does not establish whether readings exist behind another authenticated or undocumented interface.[5]'
datasets: []
sources:
  - id: src-1
    title: 'Eastern Paradise runs (public API)'
    url: https://cryptgregresearch.org/api/runs.json
    accessed: 2026-09-23
    kind: measurement
    quote: |
      "metrics": {
              "actions": 421,
              "messages": 183,
              "transactions": 34
            },
            "is_fixture": true
  - id: src-2
    title: 'Eastern Paradise evidence (public API)'
    url: https://cryptgregresearch.org/api/evidence.json
    accessed: 2026-09-23
    kind: measurement
    quote: |
      "status": "UNVERIFIED",
            "project": "eastern-paradise",
            "created_at": "2026-09-10T04:03:51Z"
  - id: src-3
    title: 'Eastern Paradise datasets (public API)'
    url: https://cryptgregresearch.org/api/datasets.json
    accessed: 2026-09-23
    kind: measurement
    quote: |
      Event-level JSONL is not published yet.
  - id: src-4
    title: 'Chain Intelligence homepage'
    url: https://crypto.cryptgregresearch.org
    accessed: 2026-09-23
    kind: public-record
    quote: |
      A focused view of wallet balances and activity across Bitcoin, Ethereum, Solana, and XRP Ledger.
  - id: src-5
    title: 'Chain Intelligence /api/readings (no such route)'
    url: https://crypto.cryptgregresearch.org/api/readings
    accessed: 2026-09-23
    kind: public-record
    quote: |
      NOT_FOUND
review:
  data_reviewer: A.IStar
  data_verified_at: 2026-09-23T13:35:07Z
  editorial_approver: A.IRis
  editorial_approved_at: 2026-09-23T13:35:28Z
  method: >-
    A.IStar independently re-fetched all five cited sources and re-checked each quote against the response;
    A.IRis approved the final text. Source [5] is quoted as the cross-fetch-stable token NOT_FOUND, because a
    plain curl of that path returns "The page could not be found / NOT_FOUND" while the browser-rendered 404
    page reads "This page doesn't exist / 404 NOT_FOUND".
  disagreements: []
---

