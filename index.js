const { track } = require('./lib/track')

function remitrace (remit, opts = {}) {
  opts.queueName = opts.queueName || 'remitrace'
  opts.customLoggers = opts.customLoggers || []
  opts.ignoredPaths = opts.ignoredPaths || [new RegExp(`^${opts.queueName}$`)]

  opts.ignoredPaths.forEach((ignoredPath) => {
    if (!(ignoredPath instanceof RegExp)) {
      throw new Error('Invalid ignored path; must be regex')
    }
  })

  opts.emit = remit.emit(opts.queueName)

  remit.endpoint.on(
    'data',
    track(
      'ENDP RECV',
      opts
    )
  )

  remit.endpoint.on(
    'sent',
    track(
      'ENDP SENT',
      opts
    )
  )

  remit.listen.on(
    'data',
    track(
      'LIST RECV',
      opts
    )
  )

  remit.request.on(
    'data',
    track(
      'REQU RECV',
      opts
    )
  )

  remit.request.on(
    'sent',
    track(
      'REQU SENT',
      opts
    )
  )

  remit.emit.on(
    'sent',
    track(
      'EMIT SENT',
      opts
    )
  )
}

module.exports = { remitrace }
