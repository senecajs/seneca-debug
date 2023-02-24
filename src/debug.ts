import Stringify from 'json-stringify-safe'
import { Open } from 'gubu'
import { SenecaSharedInstance } from './types'
import { v4 as uuidv4 } from 'uuid'
import DebugDataStore from './DebugDataStore'
const { bootWebServers } = require('../web')

function newInward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$']
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return
  }
  if (!seneca.shared.active) {
    return
  }
  const { data } = spec
  data.debug_kind = 'in'

  let data_in: any = Stringify(data)

  data_in = JSON.parse(data_in)

  if (options.prod) {
    data_in.msg = seneca.util.clean(data_in.msg)
    data_in.meta = {
      id: data.meta.id,
      start: data.meta.start,
      end: data.meta.end,
      pattern: data.meta.pattern,
      plugin: data.meta.plugin,
      instance: data.meta.instance,
    }

    if (data.meta.parents && data.meta.parents.length > 1) {
      data_in.meta.parents = null
      data_in.meta.parent = data.meta.parents[0][1]
    } else {
      data_in.meta.parents = data.meta.parents
      data_in.meta.custom = data.meta.custom
    }
  }

  const [fullTrace, needleTrace] = getFullAndNeedleTrace(data_in.meta)
  if (fullTrace && needleTrace) {
    data_in.trace = {}
    data_in.trace.trace_stack = fullTrace
    data_in.trace.needle_stack = needleTrace
    data_in.meta.caller = null
  }

  return data_in
}

function inward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$']
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return
  }
  if (!seneca.shared.active) {
    return
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
      instance: data.meta.instance,
    }

    if (data.meta.parents && data.meta.parents.length > 1) {
      data_in.meta.parents = null
      data_in.meta.parent = data.meta.parents[0][1]
    } else {
      data_in.meta.parents = data.meta.parents
      data_in.meta.custom = data.meta.custom
    }
  }

  const [fullTrace, needleTrace] = getFullAndNeedleTrace(data_in.meta)
  if (fullTrace && needleTrace) {
    data_in.trace = {}
    data_in.trace.trace_stack = fullTrace
    data_in.trace.needle_stack = needleTrace
    data_in.meta.caller = null
  }

  seneca.shared.wsServer!.clients.forEach((c: any) => {
    c.send(JSON.stringify(data_in))
  })
}

function getFullAndNeedleTrace(meta: any): [string[], string[]] | [null, null] {
  const { caller } = meta
  if (!caller) {
    return [null, null]
  }
  const fullTrace = caller
    .split('\n')
    .map((str: string) => str.trim())
    .filter((str: string) => str.length)
  const needleTrace = fullTrace.filter(
    (str: string) =>
      !str.includes('node_modules') && !str.includes('node:internal')
  )
  return [fullTrace, needleTrace]
}

function newOutward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$']
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return
  }
  if (!seneca.shared.active) {
    return
  }
  const { data } = spec
  data.debug_kind = 'out'

  let data_out: any = Stringify(data)

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
      parents: data.meta.parents,
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
  return data_out
}

function outward(seneca: any, spec: any, options: any) {
  const pluginName = spec.data.msg['plugin$']
  if (pluginName && pluginName.name && pluginName.name === 'debug') {
    return
  }
  if (!seneca.shared.active) {
    return
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
      parents: data.meta.parents,
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

let isBootedCache = false
function isBooted(seneca: any) {
  if (isBootedCache) {
    return isBootedCache
  }
  const senecaShared = seneca.shared as SenecaSharedInstance

  if (!seneca.shared.expressIsReady) {
    return false
  }
  if (!senecaShared.debugDataStores || !senecaShared.debugDataStores.length) {
    return false
  }
  isBootedCache = true
  return isBootedCache
}

function debug(this: any, options: any) {
  const seneca = this

  this.init(async function (done: () => any) {
    const sharedInstance = seneca.shared as SenecaSharedInstance

    const { expressApp, wsServer } = await bootWebServers(seneca, options)
    sharedInstance.expressApp = expressApp
    sharedInstance.wsServer = wsServer
    sharedInstance.expressIsReady = true
    sharedInstance.active = true
    sharedInstance.debugDataStores = [
      {
        id: 'default',
        debugDataStore: new DebugDataStore(),
        active: true,
      },
    ]
    done()
  })

  this.outward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    const outwardData = newOutward(seneca, finalData, options)
    if (!outwardData) {
      return
    }
    const senecaShared = seneca.shared as SenecaSharedInstance
    if (!isBooted(seneca)) {
      return
    }
    senecaShared.debugDataStores.forEach(({ active, debugDataStore }) => {
      if (active) {
        debugDataStore.handle(outwardData)
      }
    })

    // Legacy
    senecaShared.wsServer.clients.forEach((c: any) => {
      c.send(JSON.stringify(outwardData))
    })
  })

  this.inward((ctxt: any, data: any) => {
    const finalData = {} as { data: any }
    finalData.data = ctxt.data || data
    // inward(seneca, finalData, options)
    const inwardData = newInward(seneca, finalData, options)
    if (!inwardData) {
      return
    }
    const senecaShared = seneca.shared as SenecaSharedInstance
    if (!isBooted(seneca)) {
      return
    }
    senecaShared.debugDataStores.forEach(({ active, debugDataStore }) => {
      if (active) {
        debugDataStore.handle(inwardData)
      }
    })

    // Legacy
    senecaShared.wsServer.clients.forEach((c: any) => {
      c.send(JSON.stringify(inwardData))
    })
  })

  this.add(
    'role:seneca,cmd:close',
    function closeDebug(this: any, _msg: any, reply: any) {
      seneca.shared.expressApp.close()
      seneca.shared.wsServer.close()

      reply()
    }
  )

  this.add(
    'sys:debug,area:trace',
    function debugTraceActivation(this: any, msg: any, reply: any) {
      const { active } = msg
      seneca.shared.active = Boolean(active)
      const { flame } = seneca.list_plugins()
      if (flame && options.flame) {
        seneca.act(`sys:flame,capture:${active}`, function cb() {
          reply()
        })
      } else {
        reply()
      }
    }
  )

  this.add(
    'sys:debug,cmd:create_debug_store',
    function createDebugStore(this: any, msg: any, reply: any) {
      const debugDataStore = new DebugDataStore()
      const id = uuidv4()
      ;(seneca.shared as SenecaSharedInstance).debugDataStores.push({
        id,
        active: true,
        debugDataStore,
      })
      reply({ success: true, id })
    }
  )

  this.add(
    'sys:debug,cmd:destroy_debug_store',
    function destroyDebugStore(this: any, msg: any, reply: any) {
      const { id } = msg
      if (!id) {
        return reply({
          success: false,
          error:
            "Missing or incorrect parameter values, please provide 'id' parameter",
        })
      }
      const debugStore = (
        seneca.shared as SenecaSharedInstance
      ).debugDataStores.find((debugStore) => debugStore.id === id)
      if (!debugStore) {
        return reply({
          success: false,
          error: "No 'DebugStore' was found for the given 'id' parameter",
        })
      }
      const { msgmap, msgmapchildren, msgmapdata, top } =
        debugStore.debugDataStore.get()
      const newDebugStore = (
        seneca.shared as SenecaSharedInstance
      ).debugDataStores.filter((debugStore) => debugStore.id !== id)
      ;(seneca.shared as SenecaSharedInstance).debugDataStores = newDebugStore
      reply({
        success: true,
        msgmap,
        msgmapchildren,
        msgmapdata,
        top,
      })
    }
  )

  const { flame } = seneca.list_plugins()
  if (flame && options.flame) {
    setInterval(() => {
      seneca.act(
        'sys:flame,cmd:get,cached:true',
        function response(err: any, out: any, meta: any) {
          if (err) {
            return
          }
          seneca.shared.wsServer!.clients.forEach((c: any) => {
            c.send(
              JSON.stringify({
                message: out,
                feature: 'flame',
              })
            )
          })
        }
      )
    }, 3000)
  }
}

const defaults = Open({
  /*
   * Express server config
   */
  express: {
    port: 8899,
    host: 'localhost',
  },
  /*
   * WebSocket server config
   */
  ws: {
    port: 8898,
  },
  /*
   * WebSocket path to push data
   */
  wspath: '/debug',
  prod: false,
  /*
   * Will log the metadata to the console
   */
  logToConsole: false,
})

async function preload(seneca: any) {}

Object.assign(debug, { defaults, preload })

export default debug

if ('undefined' !== typeof module) {
  module.exports = debug
}
