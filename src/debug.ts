import Stringify from 'json-stringify-safe'
const { bootWebServers } = require('../web')

function inward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$'];
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return;
  }
  if (!seneca.shared.active) {
    return;
  }
  const { logToConsole, wspath } = options
  const { data } = spec
  data.debug_kind = 'in'

  let data_in: any

  if (!seneca.shared.expressIsReady) {
    return
  }

  if (!options.prod && seneca.shared.wsServer) {
    seneca.shared.wsServer.emit(wspath, data)
  }
  data_in = Stringify(data)

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

function outward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$'];
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return;
  }
  if (!seneca.shared.active) {
    return;
  }
  const { logToConsole, wspath } = options
  const { data } = spec
  data.debug_kind = 'out'

  let data_out: any

  if (!seneca.shared.expressIsReady) {
    return
  }

  if (!options.prod && seneca.shared.wsServer) {
    seneca.shared.wsServer.emit(wspath, data)
  }
  data_out = Stringify(data)

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

function debug(this: any, options: any) {
  const seneca = this

  this.init(async function(done: () => any) {
    seneca.shared = {} as Record<string, any>

    const { expressApp, wsServer } = await bootWebServers(seneca, options)
    seneca.shared.expressApp = expressApp
    seneca.shared.wsServer = wsServer
    seneca.shared.expressIsReady = true
    seneca.shared.active = true;
    done();
  })

  this.outward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    outward(seneca, finalData, options)
  })

  this.inward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    inward(seneca, finalData, options)
  })

  this.add('role:seneca,cmd:close', function closeDebug(this: any, _msg: any, reply: any) {

    seneca.shared.expressApp.close()
    seneca.shared.wsServer.close()

    reply()
  })

  this.add('sys:debug,area:trace', function debugTraceActivation(this: any, msg: any, reply: any) {
    const { active } = msg;
    seneca.shared.active = Boolean(active)
    const { flame } = seneca.list_plugins();
    if (flame && options.flame) {
      seneca.act(`sys:flame,capture:${active}`, function cb() {
        reply()
      })
    } else {
      reply();
    }
  });

  const { flame } = seneca.list_plugins();
  if (flame && options.flame) {
    setInterval(() => {
      seneca.act('sys:flame,cmd:get,cached:true', function response(err: any, out: any, meta: any) {
        if (err) {
          return;
        }
        seneca.shared.wsServer!.clients.forEach((c: any) => {
          c.send(JSON.stringify({
            message: out,
            feature: 'flame'
          }))
        })
      });
    }, 3000)
  }
}

const defaults = {
  /*
   * Express server config
  */
  express: {
    port: 8899,
    host: 'localhost'
  },
  /*
   * WebSocket server config
  */
  ws: {
    port: 8898
  },
  /*
   * WebSocket path to push data
  */
  wspath: '/debug',
  prod: false,
  /*
   * Will log the metadata to the console
  */
  logToConsole: false
}

async function preload(seneca: any) { }

Object.assign(debug, { defaults, preload })

export default debug

if ('undefined' !== typeof module) {
  module.exports = debug
}
