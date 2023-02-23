"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_stringify_safe_1 = __importDefault(require("json-stringify-safe"));
const gubu_1 = require("gubu");
const uuid_1 = require("uuid");
const DebugDataStore_1 = __importDefault(require("./DebugDataStore"));
const { bootWebServers } = require('../web');
function newInward(seneca, spec, options) {
    const pluginName = spec.data.msg['plugin$'];
    if (pluginName && pluginName.name && pluginName.name === 'debug') {
        return;
    }
    if (!seneca.shared.active) {
        return;
    }
    const { data } = spec;
    data.debug_kind = 'in';
    let data_in = (0, json_stringify_safe_1.default)(data);
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
    const [fullTrace, needleTrace] = getFullAndNeedleTrace(data_in.meta);
    if (fullTrace && needleTrace) {
        data_in.trace = {};
        data_in.trace.trace_stack = fullTrace;
        data_in.trace.needle_stack = needleTrace;
        data_in.meta.caller = null;
    }
    return data_in;
}
function inward(seneca, spec, options) {
    const pluginName = spec.data.msg['plugin$'];
    if (pluginName && pluginName.name && pluginName.name === 'debug') {
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
    const [fullTrace, needleTrace] = getFullAndNeedleTrace(data_in.meta);
    if (fullTrace && needleTrace) {
        data_in.trace = {};
        data_in.trace.trace_stack = fullTrace;
        data_in.trace.needle_stack = needleTrace;
        data_in.meta.caller = null;
    }
    seneca.shared.wsServer.clients.forEach((c) => {
        c.send(JSON.stringify(data_in));
    });
}
function getFullAndNeedleTrace(meta) {
    const { caller } = meta;
    if (!caller) {
        return [null, null];
    }
    const fullTrace = caller.split('\n').map((str) => str.trim()).filter((str) => str.length);
    const needleTrace = fullTrace.filter((str) => !str.includes('node_modules') && !str.includes('node:internal'));
    return [fullTrace, needleTrace];
}
function newOutward(seneca, spec, options) {
    const pluginName = spec.data.msg['plugin$'];
    if (pluginName && pluginName.name && pluginName.name === 'debug') {
        return;
    }
    if (!seneca.shared.active) {
        return;
    }
    const { data } = spec;
    data.debug_kind = 'out';
    let data_out = (0, json_stringify_safe_1.default)(data);
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
    return data_out;
}
function outward(seneca, spec, options) {
    const pluginName = spec.data.msg['plugin$'];
    if (pluginName && pluginName.name && pluginName.name === 'debug') {
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
let isBootedCache = false;
function isBooted(seneca) {
    if (isBootedCache) {
        return isBootedCache;
    }
    const senecaShared = seneca.shared;
    if (!seneca.shared.expressIsReady) {
        return false;
    }
    if (!senecaShared.debugDataStores || !senecaShared.debugDataStores.length) {
        return false;
    }
    isBootedCache = true;
    return isBootedCache;
}
function debug(options) {
    const seneca = this;
    this.init(async function (done) {
        const sharedInstance = seneca.shared;
        const { expressApp, wsServer } = await bootWebServers(seneca, options);
        sharedInstance.expressApp = expressApp;
        sharedInstance.wsServer = wsServer;
        sharedInstance.expressIsReady = true;
        sharedInstance.active = true;
        sharedInstance.debugDataStores = [
            {
                id: 'default',
                debugDataStore: new DebugDataStore_1.default(),
                active: true,
            },
        ];
        done();
    });
    this.outward((ctxt, data) => {
        const finalData = {};
        finalData.data = ctxt.data || data;
        const outwardData = newOutward(seneca, finalData, options);
        if (!outwardData) {
            return;
        }
        const senecaShared = seneca.shared;
        if (!isBooted(seneca)) {
            return;
        }
        senecaShared.debugDataStores.forEach(({ active, debugDataStore }) => {
            if (active) {
                debugDataStore.handle(outwardData);
            }
        });
        // Legacy
        senecaShared.wsServer.clients.forEach((c) => {
            c.send(JSON.stringify(outwardData));
        });
    });
    this.inward((ctxt, data) => {
        const finalData = {};
        finalData.data = ctxt.data || data;
        // inward(seneca, finalData, options)
        const inwardData = newInward(seneca, finalData, options);
        if (!inwardData) {
            return;
        }
        const senecaShared = seneca.shared;
        if (!isBooted(seneca)) {
            return;
        }
        senecaShared.debugDataStores.forEach(({ active, debugDataStore }) => {
            if (active) {
                debugDataStore.handle(inwardData);
            }
        });
        // Legacy
        senecaShared.wsServer.clients.forEach((c) => {
            c.send(JSON.stringify(inwardData));
        });
    });
    this.add('role:seneca,cmd:close', function closeDebug(_msg, reply) {
        seneca.shared.expressApp.close();
        seneca.shared.wsServer.close();
        reply();
    });
    this.add('sys:debug,area:trace', function debugTraceActivation(msg, reply) {
        const { active } = msg;
        seneca.shared.active = Boolean(active);
        const { flame } = seneca.list_plugins();
        if (flame && options.flame) {
            seneca.act(`sys:flame,capture:${active}`, function cb() {
                reply();
            });
        }
        else {
            reply();
        }
    });
    this.add('sys:debug,cmd:create_debug_store', function createDebugStore(msg, reply) {
        const debugDataStore = new DebugDataStore_1.default();
        const id = (0, uuid_1.v4)();
        seneca.shared.debugDataStores.push({
            id,
            active: true,
            debugDataStore,
        });
        reply({ success: true, id });
    });
    this.add('sys:debug,cmd:destroy_debug_store', function destroyDebugStore(msg, reply) {
        const { id } = msg;
        if (!id) {
            return reply({ success: false, error: "Missing or incorrect parameter values, please provide 'id' parameter" });
        }
        const debugStore = seneca.shared.debugDataStores.find((debugStore) => debugStore.id === id);
        if (!debugStore) {
            return reply({ success: false, error: "No 'DebugStore' was found for the given 'id' parameter" });
        }
        const { msgmap, msgmapchildren, msgmapdata, top } = debugStore.debugDataStore.get();
        const newDebugStore = seneca.shared.debugDataStores.filter((debugStore) => debugStore.id !== id);
        seneca.shared.debugDataStores = newDebugStore;
        reply({
            success: true,
            msgmap, msgmapchildren, msgmapdata, top
        });
    });
    const { flame } = seneca.list_plugins();
    if (flame && options.flame) {
        setInterval(() => {
            seneca.act('sys:flame,cmd:get,cached:true', function response(err, out, meta) {
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
}
const defaults = (0, gubu_1.Open)({
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
});
async function preload(seneca) { }
Object.assign(debug, { defaults, preload });
exports.default = debug;
if ('undefined' !== typeof module) {
    module.exports = debug;
}
//# sourceMappingURL=debug.js.map