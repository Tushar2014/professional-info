---
title: End-user support conversational assistant
summary: A staged request pipeline behind an end-user support assistant, built as primary author.
tags: [llm, backend, python]
role: Primary author
timeframe: 2026–now
stack: [Python, FastAPI, Redis, DynamoDB]
featured: true
order: 1
---

## Problem

End users asking questions about their account needed answers grounded in
real documentation rather than a model's recollection. Every request had to
be checked for safety, understood well enough to route, and answered from
retrieved sources, fast enough that a person would wait for it.

## Approach

I designed the request path as explicit stages rather than one prompt.
Safety classification and intent classification run concurrently, because
neither depends on the other, and intent work is cancelled the moment
safety rejects a request. Only requests that survive both pay for retrieval.

Multi-turn questions are condensed into a standalone query before retrieval,
so a follow-up like "and the other one?" retrieves against what the person
actually meant.

Conversation state was the harder problem. The first design treated a cache
as the source of truth, which is fine until a process restarts mid-stream. I
moved the system of record to a durable document store and left the cache as
a cache, then added an idempotency key per message and a single-active-stream
lock per conversation so a reconnecting client resumes rather than duplicates.

## Outcome

The assistant supports end users. The staged design meant a rejected request
costs one classification call instead of a full retrieval
and generation cycle, and crash-mid-response no longer loses a conversation
turn.
