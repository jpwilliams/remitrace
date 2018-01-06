# remitrace

Utilises the [tracing metadata](#) available in [`remit`](https://github.com/jpwilliams/remit) >=2.2.0 to push captured messages to a queue (or to custom loggers) for storage and correlation.

``` sh
yarn add remitrace
```

``` js
const { remitrace } = require('remitrace')
const remit = require('remit')()
remitrace(remit)
```

See the [`examples`](#) folder for how you might go about parsing the information provided.

## Tracing with remitrace

`remitrace` on its own only allows the easy _capture_ of the data needed to trace your calls. It does, however, also provide a [parsing example](#) in code for how to correlate these calls. For clarity, I'll explain it here too.

`remit` >=2.2.0 provides some new metadata intended for tracing inside each `event` in a new `metadata` object.

* `originId` The ID of the initial request or emission that started the entire chain of calls. Every call in a chain will have the same ID here.
* `bubbleId` The "bubble" (see more below) that the action happened in.
* `fromBubbleId` The "bubble" (see more below) that the action was triggered from.
* `instanceId` A unique ID for each and every action.
* `flowType` Either `'entry'` to show it's an entrypoint to a bubble, `'exit'` to show it's an exit from a bubble or blank to show it is neither.

These five properties can be used to create a picture of not only how particular calls are triggered, but the effect that a single call can have on an entire system, accessible from any point.

## What's a bubble?

A bubble, in this context, is represented as all remit-related actions performed within a handler for an endpoint or listener.

A bubble is created whenever a _request_ or _emission_ is received by an _endpoint_ or _listener_. This is an `'entry'` (as dictated by the `flowType` metadata). `'exit'`s are the _requests_ or _emissions_ themselves.

## How does the information correlate?

_We'll assume for this section that all traces are stored as-is within a simple document store such as MongoDB._

First off, you can easily find all messages created from a single `originId` by just querying for exactly that:

``` json
{
  "originId": "01C31N0NMCMS5KX8E4GJ6BV0G2"
}
```

With that, you could list every single action that happened because of that origin message.

You can also, however, get a little better.

A more common practice would be to seek out the _cause_ of a particular event. A listener is receiving an emission, let's say, but you don't know why or where from. Following it through a complex production system would be horrendous, but with remitrace it's easily possible.

As above, an `instanceId` is a unique ID given to every action. Using this along with `flowType`'s entries and exits, we can easily find the direct route from cause to effect.

Find the trace of the `instanceId` you wish to track. If it's an `entry` point, you must find the `exit` that lead to it. If it's _not_ an `entry`, find the `entry`. An example in code:

``` js
async function findCause (query, traces = []) {
  // handle the initial sending of an instanceId
  if (typeof query === 'string') {
    query = { 'event.metadata.instanceId': query }
  }

  // find a trace and return early if it's the end of the line
  const nextTrace = await myCol.findOne(query)
  if (!nextTrace) return traces
  traces.push(nextTrace)
  if (!nextTrace.event.metadata.bubbleId) return traces

  // sort out what to search for next
  const nextQuery = nextTrace.event.metadata.flowType === 'entry' ? {
    'event.metadata.flowType': 'exit',
    'event.metadata.bubbleId': nextTrace.event.metadata.fromBubbleId,
    'event.eventId': nextTrace.event.eventId
  } : {
    'event.metadata.flowType': 'entry',
    'event.metadata.bubbleId': nextTrace.event.metadata.bubbleId
  }

  // go search for it
  return findCause(nextQuery, traces)
}

const traces = await findCause('01C31NWW065X38YPBGJTZXAHVV')
```

The result of this would be a list of traces which lead to the specified action.
