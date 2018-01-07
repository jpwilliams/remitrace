function shouldIgnore (event, ignored) {
  return ignored.some((re) => {
    return event.match(re)
  })
}

function track (action, opts = {}) {
  return (event) => {
    if (shouldIgnore(event.eventType, opts.ignoredPaths)) {
      return
    }

    const trace = {
      event: event,
      action: action,
      time: new Date()
    }

    opts.emit(trace)

    if (opts.customLoggers && opts.customLoggers.length) {
      opts.customLoggers.forEach(fn => fn(trace))
    }
  }
}

module.exports = { track }
