# Architecture

## Overview

CX Support Agent is a TypeScript monorepo for AI-powered customer support:

- **Widget** — embeddable customer chat (SSE streaming)
- **Web** — Next.js admin dashboard
- **API** — NestJS REST + SSE endpoints
- **Worker** — BullMQ document ingestion
- **AI package** — LangGraph-style agent orchestration, RAG retrieval, tools

## Data flow

1. Admin uploads FAQ/note content → API enqueues ingestion job
2. Worker chunks + embeds content → pgvector storage
3. Customer sends widget message → API runs support agent
4. Agent classifies intent → retrieves KB / looks up order / creates ticket
5. Response streams back via SSE with citations
6. Admin reviews conversations, tickets, analytics

## Deployment target

- Web: Vercel
- API + worker: Fly.io or Railway
- Postgres: Neon (pgvector)
- Redis: Upstash

See [ADR 0001](./adr/0001-stack.md) for stack decisions.
