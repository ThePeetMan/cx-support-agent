# ADR 0001: Stack choices

## Status

Accepted

## Context

Portfolio project targeting mid-level CX AI Solutions roles. Needs to demonstrate RAG, agents, escalation, and production patterns without overengineering.

## Decision

- **TypeScript monorepo** with pnpm workspaces
- **NestJS** API for structured modules and Swagger
- **Next.js** admin UI
- **Drizzle + Postgres + pgvector** for relational + vector data in one DB
- **BullMQ + Redis** for async ingestion
- **OpenAI** embeddings + chat (`text-embedding-3-small`, `gpt-4o-mini`)
- **Custom agent orchestration** in `@cx/ai` (classify → retrieve → tools → escalate)

## Consequences

- Strong alignment with CX AI job descriptions (TypeScript, React, RAG, agents)
- No separate vector DB to operate
- NestJS adds boilerplate but signals enterprise readiness
- LangGraph.js can be adopted incrementally; current agent module is interview-friendly and testable
