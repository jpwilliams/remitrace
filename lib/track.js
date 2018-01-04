function track (action, opts = {}) {
  return (event) => {
    if (opts.ignoredPaths.includes(event.eventType)) {
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
