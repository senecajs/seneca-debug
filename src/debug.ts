import express, { Express } from "express";
import stringify from "json-stringify-safe";
import { Server } from 'node:http';
import ws from 'ws';
import Intern from "./intern";

/*
  TODO LIST:
    1. Intern doesn't work.
    2. Improve code quality.
*/

type GLOBALS = {
  LOG_TO_CONSOLE: boolean,
  LOG_TO_CONSOLE_USERS: any,
  EXPRESS_READY: boolean,
  WSPATH: string | null,
  EXPRESS_SERVER: Server | null,
  WS_SERVER: ws.Server<ws.WebSocket> | null,
}

const GLOBALS: GLOBALS = {
  LOG_TO_CONSOLE: false,
  LOG_TO_CONSOLE_USERS: {},
  EXPRESS_READY: false,
  WSPATH: null,
  EXPRESS_SERVER: null,
  WS_SERVER: null,
}

function inward(seneca: any, spec: any, options: any, intern: Intern) {
  const { data } = spec;
  data.debug_kind = 'in'

    let data_in: any;
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

    if (GLOBALS.EXPRESS_READY) {
      if (!options.prod) {
        GLOBALS.WS_SERVER!.emit(GLOBALS.WSPATH!, data);
      }
      try {
        data_in = stringify(data)

        let logged = false
        if (GLOBALS.LOG_TO_CONSOLE) {
          logged = true
          console.log(data_in)
        }

        if (!logged) {
          for (let u in GLOBALS.LOG_TO_CONSOLE_USERS) {
            if (
              GLOBALS.LOG_TO_CONSOLE_USERS[u] &&
              data.meta.custom.principal.user.handle === u
            ) {
              console.log(data_in)
            }
          }
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

        GLOBALS.WS_SERVER!.clients.forEach((c) => {
          c.send(JSON.stringify(data_in))
        });
      } catch (e) {
        console.log('error', e)
      }
    }
}

function outward(seneca: any, spec: any, options: any, intern: Intern) {
  const { data } = spec;
  data.debug_kind = 'out'

  let data_out: any;

  if (options.store) {
    const trace_node = intern.map[data.meta.id]

    // NOTE: some outward events are virtual from default$ directives
    // TODO: this needs review in Seneca core
    if (trace_node) {
      trace_node.res = data.res
      trace_node.err = data.err
    }
  }

  if (GLOBALS.EXPRESS_READY) {
    if (!options.prod) {
      GLOBALS.WS_SERVER!.emit(GLOBALS.WSPATH!, data);
    }

    try {
      data_out = stringify(data)

      var logged = false

      if (GLOBALS.LOG_TO_CONSOLE) {
        logged = true
        console.log(data_out)
      }
      if (!logged) {
        for (let u in GLOBALS.LOG_TO_CONSOLE_USERS) {
          if (
            GLOBALS.LOG_TO_CONSOLE_USERS[u] &&
            data.meta.custom.principal.user.handle === u
          )
            console.log(data_out)
        }
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

      GLOBALS.WS_SERVER!.clients.forEach((c) => {
          c.send(JSON.stringify(data_out))
        });
      }
    catch (e) {
      console.log(e)
    }
  }
}

function debug(this: any, options: any) {
  const seneca = this;
  let intern: Intern;

  seneca.ready(() => {
    if (options.intern_log) {
      intern = new Intern(seneca);
      intern.handlePrintTree();
    }
  })

  this.outward((ctxt: any, data: any) => {
    // Dirty fix
    if (ctxt.data) {
      outward(seneca, ctxt, options, intern);
    } else if (data) {
      outward(seneca, { data }, options, intern);
    }
  })

  this.inward((ctxt: any, data: any) => {
    // Dirty fix
    if (ctxt.data) {
      inward(seneca, ctxt, options, intern);
    } else if (data) {
      inward(seneca, { data }, options, intern);
    }
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
    port: 8898,
  },
  intern_log: false,
  wspath: '/debug',
  store: false,
  test: false,
  prod: false
}

function bootExpress(options: any) {
  const { express: expOptions, ws: wsConfig } = options;
  const app = express();

  app.use(express.static(`${__dirname}/../dist`));

  app.get('/', (req, res) => {
    res.sendFile('index.html');
  });

  app.get('/config', (req, res) => {
    return res.status(200).json({
      port: wsConfig.port,
    })
  });

  app.get('/console', (req, res) => {
    GLOBALS.LOG_TO_CONSOLE = true;

    setTimeout(() => {
      if (GLOBALS.LOG_TO_CONSOLE) {
        GLOBALS.LOG_TO_CONSOLE = false;
      }
    }, 60000);

    return res.status(200).json('ok');
  });

  app.get('/console_user/:user', (req, res) => {
    const user = req.params.user;
    GLOBALS.LOG_TO_CONSOLE_USERS[user] = true

    setTimeout(() => {
      if (GLOBALS.LOG_TO_CONSOLE_USERS[user])
        delete GLOBALS.LOG_TO_CONSOLE_USERS[user];
    }, 60000);

    return res.status(200).json(user);
  })

  const expressApp = app.listen(expOptions.port, () => {
    GLOBALS.EXPRESS_READY = true;
    GLOBALS.WSPATH = options.wspath;
  });

  GLOBALS.EXPRESS_SERVER = expressApp;

  const wsServer = new ws.Server({
    port: wsConfig.port,
  });

  GLOBALS.WS_SERVER = wsServer;
}

async function preload(this: any, opts: any) {
  const { options } = opts;
  
  bootExpress(options);
}

Object.assign(debug, { defaults, preload });

export default debug

if ('undefined' !== typeof (module)) {
  module.exports = debug
}