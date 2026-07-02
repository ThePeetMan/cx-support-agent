# ADR 0002: Human-in-the-loop escalation

## Status

Accepted

## Context

CX AI systems must balance automation with safe handoff to human agents. Pure LLM answers without guardrails create trust and compliance risk in customer support.

## Decision

Escalate to a support ticket when:

1. The user explicitly asks for a human agent (intent classification).
2. Retrieval confidence is below `0.55` (top citation score + hedging phrase detection).
3. The draft answer suggests escalation language.

Tickets are linked to chat sessions. Admins can mark sessions for human takeover from the dashboard.

## Consequences

- Adds measurable `escalationRate` to analytics.
- Demo portfolio shows responsible AI design, not chatbot-only automation.
- Future work: route tickets to Zendesk/Intercom via webhook.
