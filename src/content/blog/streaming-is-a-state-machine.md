---
title: Streaming is a state machine, not a pipe
description: What breaks when you treat a token stream as a connection rather than as resumable state.
pubDate: 2026-09-04
tags: [streaming, distributed-systems]
draft: false
---

Treating a streamed response as a pipe works until the pipe breaks. Then you
discover the question you skipped: where does the half-finished answer live?

The pipe model is seductive because the happy path is so short. A request
arrives, you open a server-sent event stream, you forward tokens as the model
produces them, you close. There is no state to speak of. The connection *is*
the state, and the client's screen is your only buffer.

Every failure mode falls out of that one decision.

## The failure modes are all the same failure

A user on a train loses signal for four seconds. A container gets rescheduled
mid-generation. A load balancer trims an idle connection because your token
stream paused while a retrieval step ran. A user hits refresh because the
first token was slow.

Under the pipe model these are four different bugs. Under a state model they
are one: the client and the server disagree about how much of the answer
exists, and there is no shared place to look it up.

The tell is what your reconnect logic does. If the client's only recovery is
to resend the original request, you do not have streaming. You have a
best-effort optimisation over a request-response call, and you are paying for
generation twice.

## What resumable state actually requires

Three things, and none of them is exotic.

**The answer needs an identity before it has content.** Allocate the message
id when the request arrives, not when generation finishes. A client that
reconnects asks about *this message*, not "whatever you were doing for me".

**Partial output needs somewhere durable to accumulate.** A cache is a
reasonable place to accumulate it and a terrible place to define it. If the
cache is the source of truth, a restart does not lose a buffer, it loses a
turn of the conversation, and the user's next message now refers to something
the system cannot see. Write the turn to a durable store and let the cache be
what caches are for.

**Concurrent writers need arbitrating.** Two tabs, or a retry racing the
original, will both try to generate into the same message. Something has to
decide which one wins. A per-conversation lock on the active stream is
usually enough, provided the lock outlives the process that took it.

Add those and reconnection stops being error handling. The client asks what
exists so far, gets it, and subscribes to the rest. The same code path serves
a fresh request and a resumed one, because "resumed" is just a request whose
prefix is already known.

## The part that is genuinely harder

Idempotency. A user who sends the same message twice, or a client that retries
because it never saw an acknowledgement, must not produce two answers. The
usual fix is a key per message and a uniqueness constraint that a retry
collides with rather than a check-then-write that a race slips through.

That is not streaming-specific. It is the same reasoning any payment system
applies to a double-submitted transfer, which is a good hint that the
underlying problem is old and the tooling is well understood.

The mistake is not that streaming is hard. It is that a token stream looks so
much like a pipe that you can build the whole thing before noticing you
skipped the state design.
