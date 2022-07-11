"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_stringify_safe_1 = __importDefault(require("json-stringify-safe"));
const { bootWebServers } = require('../web');
function inward(seneca, spec, options) {
    if (spec.data.msg.plugin === 'flame') {
        return;
    }
    if (!seneca.shared.active) {
        return;
    }
    const { logToConsole, wspath } = options;
    const { data } = spec;
    data.debug_kind = 'in';
    let data_in;
    if (!seneca.shared.expressIsReady) {
        return;
    }
    if (!options.prod && seneca.shared.wsServer) {
        seneca.shared.wsServer.emit(wspath, data);
    }
    data_in = (0, json_stringify_safe_1.default)(data);
    if (logToConsole) {
        console.log(data_in);
    }
    data_in = JSON.parse(data_in);
    if (options.prod) {
        data_in.msg = seneca.util.clean(data_in.msg);
        data_in.meta = {
            id: data.meta.id,
            start: data.meta.start,
            end: data.meta.end,
            pattern: data.meta.pattern,
            plugin: data.meta.plugin,
            instance: data.meta.instance
        };
        if (data.meta.parents && data.meta.parents.length > 1) {
            data_in.meta.parents = null;
            data_in.meta.parent = data.meta.parents[0][1];
        }
        else {
            data_in.meta.parents = data.meta.parents;
            data_in.meta.custom = data.meta.custom;
        }
    }
    seneca.shared.wsServer.clients.forEach((c) => {
        c.send(JSON.stringify(data_in));
    });
}
function outward(seneca, spec, options) {
    if (spec.data.msg.plugin === 'flame') {
        return;
    }
    if (!seneca.shared.active) {
        return;
    }
    const { logToConsole, wspath } = options;
    const { data } = spec;
    data.debug_kind = 'out';
    let data_out;
    if (!seneca.shared.expressIsReady) {
        return;
    }
    if (!options.prod && seneca.shared.wsServer) {
        seneca.shared.wsServer.emit(wspath, data);
    }
    data_out = (0, json_stringify_safe_1.default)(data);
    if (logToConsole) {
        console.log(data_out);
    }
    data_out = JSON.parse(data_out);
    data_out.err = data.meta.err;
    data_out.error = data.meta.error;
    if (options.prod) {
        data_out.msg = {};
        data_out.meta = {
            id: data.meta.id,
            start: data.meta.start,
            end: data.meta.end,
            pattern: data.meta.pattern,
            parents: data.meta.parents
        };
        data_out.err = data.meta.err;
        data_out.error = data.meta.error;
        if (data.meta.parents && data.meta.parents.length > 1) {
            data_out.result_length = JSON.stringify(data_out.res).length;
            data_out.res = null;
            data_out.meta.parents = null;
            data_out.meta.parent = data.meta.parents[0][1];
        }
    }
    seneca.shared.wsServer.clients.forEach((c) => {
        c.send(JSON.stringify(data_out));
    });
}
function debug(options) {
    const seneca = this;
    this.init(async function (done) {
        seneca.shared = {};
        const { expressApp, wsServer } = await bootWebServers(seneca, options);
        seneca.shared.expressApp = expressApp;
        seneca.shared.wsServer = wsServer;
        seneca.shared.expressIsReady = true;
        seneca.shared.active = true;
        done();
    });
    this.outward((ctxt, data) => {
        const finalData = {};
        finalData.data = ctxt.data || data;
        outward(seneca, finalData, options);
    });
    this.inward((ctxt, data) => {
        const finalData = {};
        finalData.data = ctxt.data || data;
        inward(seneca, finalData, options);
    });
    this.add('role:seneca,cmd:close', function (_msg, reply) {
        seneca.shared.expressApp.close();
        seneca.shared.wsServer.close();
        reply();
    });
    this.add('role:seneca,plugin:debug,cmd:toggle', function (_msg, reply) {
        seneca.shared.active = !seneca.shared.active;
        const { flame } = seneca.list_plugins();
        if (flame && options.flame) {
            seneca.act('role:seneca,plugin:flame,cmd:toggle', function cb() {
                reply();
            });
        }
        else {
            reply();
        }
    });
    const { flame } = seneca.list_plugins();
    if (flame && options.flame) {
        setInterval(() => {
            seneca.act('plugin:flame,command:get', function response(err, out, meta) {
                if (err) {
                    return;
                }
                seneca.shared.wsServer.clients.forEach((c) => {
                    c.send(JSON.stringify({
                        message: out,
                        feature: 'flame'
                    }));
                });
            });
        }, 3000);
    }
    return {
        exports: {
            native: () => ({})
        }
    };
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
    test: false,
    prod: false,
    logToConsole: false
};
async function preload(seneca) { }
Object.assign(debug, { defaults, preload });
exports.default = debug;
if ('undefined' !== typeof module) {
    module.exports = debug;
}
//# sourceMappingURL=debug.js.map