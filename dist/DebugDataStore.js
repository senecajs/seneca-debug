"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DebugDataStore {
    constructor() {
        this.top = {
            items: []
        };
        this.msgmap = {};
        this.msgmapchildren = {};
        this.msgmapdata = {};
    }
    get() {
        return {
            msgmap: this.msgmap,
            top: this.top,
            msgmapchildren: this.msgmapchildren,
            msgmapdata: this.msgmapdata,
        };
    }
    handle(data) {
        const meta = data.meta;
        const parent = meta.parent
            ? meta.parent
            : meta.parents[0]
                ? meta.parents[0][1]
                : null;
        if ('in' === data.debug_kind && !this.msgmap[meta.id]) {
            const parent_children = parent
                ? this.msgmapchildren[parent]
                    ? this.msgmapchildren[parent]
                    : this.top.items
                : this.top.items;
            const entry = {
                id: data.meta.id,
                name: (data.meta.start % 10000000) + ' ' + data.meta.pattern,
                children: [],
                error: false,
                duration: null,
                num_children: 0
            };
            this.msgmapdata[meta.id] = {
                id: meta.id,
                name: data.name,
                data: data
            };
            parent_children.unshift(entry);
            this.msgmap[meta.id] = entry;
            this.msgmapchildren[meta.id] = [];
        }
        else if ('out' === data.debug_kind && this.msgmap[meta.id]) {
            this.msgmap[meta.id].error = data.error;
            this.msgmap[meta.id].duration = meta.end - meta.start;
            this.msgmap[meta.id].num_children = this.msgmapchildren[meta.id].length;
            this.msgmapdata[meta.id].data.res = data.res;
            this.msgmapdata[meta.id].data.err = data.err;
            this.msgmapdata[meta.id].data.error = data.error;
            this.msgmapdata[meta.id].data.meta.end = meta.end;
            this.msgmapdata[meta.id].data.result_length = data.result_length;
            /*
            const searchListData = {
              id: meta.id,
              text: JSON.stringify(this.msgmapdata[meta.id].data).toLowerCase(),
              parent: parent
            }
    
            this.searchlist.push(searchListData)
            */
        }
    }
}
exports.default = DebugDataStore;
/*
const top = {
  items: []
}

var msgmap = {}
var msgmapchildren = {}
var msgmapdata = {}
var searchlist = []


addmsg: function(data) {
      const meta = data.meta
      const parent = meta.parent
        ? meta.parent
        : meta.parents[0]
        ? meta.parents[0][1]
        : null

      if ('in' === data.debug_kind && !msgmap[meta.id]) {
        const parent_children = parent
          ? msgmapchildren[parent]
            ? msgmapchildren[parent]
            : top.items
          : top.items

        const entry = {
          id: data.meta.id,
          name: (data.meta.start % 10000000) + ' ' + data.meta.pattern,
          children: [],
          error: false,
          duration: null,
          num_children: 0
        }

        msgmapdata[meta.id] = {
          id: meta.id,
          name: data.name,
          data: data
        }

        parent_children.unshift(entry)
        msgmap[meta.id] = entry
        msgmapchildren[meta.id] = []
      } else if ('out' === data.debug_kind && msgmap[meta.id]) {
        msgmap[meta.id].error = data.error
        msgmap[meta.id].duration = meta.end - meta.start
        msgmap[meta.id].num_children = msgmapchildren[meta.id].length

        msgmapdata[meta.id].data.res = data.res
        msgmapdata[meta.id].data.err = data.err
        msgmapdata[meta.id].data.error = data.error
        msgmapdata[meta.id].data.meta.end = meta.end
        msgmapdata[meta.id].data.result_length = data.result_length

        const searchListData = {
          id: meta.id,
          text: JSON.stringify(msgmapdata[meta.id].data).toLowerCase(),
          parent: parent
        }

        searchlist.push(searchListData)
      }
    },
*/ 
//# sourceMappingURL=DebugDataStore.js.map