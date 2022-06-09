import stringify from 'json-stringify-safe'
import { Server } from 'node:http'
import ws from 'ws'
const { bootWebServers } = require('../web');

import Intern from './intern'

/*
  TODO LIST:
    1. Intern doesn't work.
    2. Improve code quality.
*/

type SharedSenecaState = {
  expressIsReady: boolean
  expressServer: Server | null
  wsServer: ws.Server<ws.WebSocket> | null
  intern: Intern | null
}

function inward(seneca: any, spec: any, options: any, intern: Intern) {
  const { logToConsole, wspath } = options
  const { data } = spec
  data.debug_kind = 'in'

  let data_in: any
  if (options.store) {
    const meta = data.meta
    const parent = meta.parents[0] ? meta.parents[0][1] : null

    const parent_trace = parent
      ? intern.map[parent]
        ? intern.map[parent]
        : intern.trace
      : intern.trace

    const trace_node = {
      meta: meta,
      msg: data.msg,
      children: []
    }

    parent_trace.children.push(trace_node)
    intern.map[meta.id] = trace_node
  }

  if (seneca.shared.expressIsReady) {
    if (!options.prod) {
      seneca.shared.wsServer!.emit(wspath, data)
    }
    data_in = stringify(data)

    if (logToConsole) {
      console.log(data_in)
    }

    data_in = JSON.parse(data_in)
    if (options.prod) {
      data_in.msg = seneca.util.clean(data_in.msg)
      data_in.meta = {
        id: data.meta.id,
        start: data.meta.start,
        end: data.meta.end,
        pattern: data.meta.pattern,
        plugin: data.meta.plugin,
        instance: data.meta.instance
      }

      if (data.meta.parents && data.meta.parents.length > 1) {
        data_in.meta.parents = null
        data_in.meta.parent = data.meta.parents[0][1]
      } else {
        data_in.meta.parents = data.meta.parents
        data_in.meta.custom = data.meta.custom
      }
    }

    seneca.shared.wsServer!.clients.forEach((c: any) => {
      c.send(JSON.stringify(data_in))
    })
  }
}

function outward(seneca: any, spec: any, options: any, intern: Intern) {
  const { logToConsole, wspath } = options
  const { data } = spec
  data.debug_kind = 'out'

  let data_out: any

  if (options.store) {
    const trace_node = intern.map[data.meta.id]

    // NOTE: some outward events are virtual from default$ directives
    // TODO: this needs review in Seneca core
    if (trace_node) {
      trace_node.res = data.res
      trace_node.err = data.err
    }
  }

  if (seneca.shared.expressIsReady) {
    if (!options.prod) {
      seneca.shared.wsServer!.emit(wspath, data)
    }
    data_out = stringify(data)

    if (logToConsole) {
      console.log(data_out)
    }

    data_out = JSON.parse(data_out)
    data_out.err = data.meta.err
    data_out.error = data.meta.error

    if (options.prod) {
      data_out.msg = {}
      data_out.meta = {
        id: data.meta.id,
        start: data.meta.start,
        end: data.meta.end,
        pattern: data.meta.pattern,
        parents: data.meta.parents
      }

      data_out.err = data.meta.err
      data_out.error = data.meta.error

      if (data.meta.parents && data.meta.parents.length > 1) {
        data_out.result_length = JSON.stringify(data_out.res).length
        data_out.res = null
        data_out.meta.parents = null
        data_out.meta.parent = data.meta.parents[0][1]
      }
    }

    seneca.shared.wsServer!.clients.forEach((c: any) => {
      c.send(JSON.stringify(data_out))
    })
  }
}

function debug(this: any, options: any) {
  const seneca = this
  let intern: Intern

  this.add({ init: 'seneca-debug' }, function(_args: any, done: () => any) {
    if (options.internLog) {
      seneca.shared.intern = new Intern(seneca)
      seneca.shared.intern.handlePrintTree()
    }
    done()
  })

  this.outward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    outward(seneca, finalData, options, intern)
  })

  this.inward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    inward(seneca, finalData, options, intern)
  })

  return {
    exports: {
      native: () => ({})
    }
  }
}

const defaults = {
  express: {
    port: 8899,
    host: 'localhost'
  },
  ws: {
    port: 8898
  },
  internLog: false,
  wspath: '/debug',
  store: false,
  test: false,
  prod: false,
  logToConsole: false
}

async function preload(this: any, opts: any) {
  const { options } = opts
  this.shared = {} as SharedSenecaState

  bootWebServers(this, options)
}

Object.assign(debug, { defaults, preload })

export default debug

if ('undefined' !== typeof module) {
  module.exports = debug
}
