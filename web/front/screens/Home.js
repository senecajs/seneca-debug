const top = {
  items: [],
}

var msgmap = {}
var msgmapchildren = {}
var msgmapdata = {}
var searchlist = []

import * as d3 from 'd3'
import * as d3flamegraph from 'd3-flame-graph'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

export default {
  components: {
    VueJsonPretty,
  },
  data() {
    return {
      items: top.items,
      active: [],
      open: [],
      search_txt: '',
      filter_txt: '',
      flamegraphdata: {
        name: 'root',
        value: 0,
        children: [],
      },
      flamegraphChart: null,
      toggleButtonMessage: 'Stop recording',
      allowChartUpdate: true,
      showDrilldownAlert: false,
      currentClickedStackTracePath: null,
      drilldownPath: [],
      currentSelectedFlamechartNode: null,
      flamechartCaptureStatus: '',
    }
  },
  created: function () {
    const self = this

    fetch(`/flame-capture-status`, {
      method: 'GET',
    })
      .then((rawResponse) => {
        rawResponse.json().then(({ status }) => {
          if (status) {
            self.flamechartCaptureStatus = 'Stop Flame Data Capture'
          } else {
            self.flamechartCaptureStatus = 'Start Flame Data Capture'
          }
        })
      })
      .catch((err) => {
        console.log('err', err)
      })

    this.$root.$on('msg', function (data) {
      self.addmsg(data)
      if (self.currentSelectedFlamechartNode) {
        self.applyDrilldown(self.currentSelectedFlamechartNode)
      }
    })
    this.$root.$on('flame', function (data) {
      // Got a bug here TODO
      self.handleFlameChart(data)
    })
  },
  computed: {
    selected: function () {
      if (!this.active.length) return undefined
      const id = this.active[0]
      return msgmapdata[id]
    },
  },

  watch: {
    currentClickedStackTracePath(prevClicked) {
      if (!prevClicked) {
        return
      }
      setTimeout(() => {
        this.currentClickedStackTracePath = null
      }, 300)
    },
    showDrilldownAlert(prevShowDrilldownAlertValue) {
      if (prevShowDrilldownAlertValue) {
        setTimeout(() => {
          this.showDrilldownAlert = false
        }, 1000)
      }
    },
    'items.length': function () {
      if (this.search_txt) this.search()
    },
    search_txt: function () {
      this.search()
    },
    filter_txt: function () {
      this.$root.$emit('filter', this.filter_txt)
    },
  },
  filters: {
    prettyJson(value) {
      if (!value) {
        return ''
      }
      return JSON.stringify(value, null, 2)
    },
  },

  methods: {
    handleMetaDataClick(nodeData) {
      const { content, path } = nodeData
      if (!this.currentClickedStackTracePath) {
        this.currentClickedStackTracePath = content
        return
      }
      const possiblePaths = ['root.trace_stack[', 'root.needle_stack[']
      const clickedInMetadata = possiblePaths.reduce((p, c) => {
        return p || path.includes(c)
      }, false)
      if (!clickedInMetadata) {
        return
      }
      const callPath = content
        .split(' ')
        .find((str) => str[0] === '(' && str[str.length - 1] === ')')
      if (!callPath) {
        return
      }
      const finalPath = callPath.substring(1, callPath.length - 1)
      fetch(`${this.$root.expressBaseUrl}/open-vscode`, {
        method: 'POST',
        body: JSON.stringify({ path: finalPath }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((err) => {
        console.log('err', err)
      })
    },
    clear: function () {
      searchlist = []
      msgmap = {}
      msgmapchildren = {}
      msgmapdata = {}
      this.items.splice(0, this.items.length)
    },
    toggle() {
      const active =
        this.toggleButtonMessage === 'Stop recording' ? false : true
      fetch(`${this.$root.expressBaseUrl}/toggle?active=${active}`, {
        method: 'POST',
      })
        .then((_) => {
          if (this.toggleButtonMessage === 'Stop recording') {
            this.toggleButtonMessage = 'Start recording'
          } else {
            this.toggleButtonMessage = 'Stop recording'
          }
        })
        .catch((err) => console.log('err', err))
    },
    toggleFlamechartCapture() {
      const active =
        this.flamechartCaptureStatus === 'Stop Flame Data Capture'
          ? false
          : true
      fetch(`/toggle-flame?active=${active}`, {
        method: 'POST',
      })
        .then(() => {
          if (this.flamechartCaptureStatus === 'Stop Flame Data Capture') {
            this.flamechartCaptureStatus = 'Start Flame Data Capture'
          } else {
            this.flamechartCaptureStatus = 'Stop Flame Data Capture'
          }
        })
        .catch((err) => console.log('err', err))
    },
    load_children: function (data) {
      data.children = msgmapchildren[data.id]
    },
    addmsg: function (data) {
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
          num_children: 0,
        }

        msgmapdata[meta.id] = {
          id: meta.id,
          name: data.name,
          data: data,
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
          parent: parent,
        }

        searchlist.push(searchListData)
      }
    },
    handleFlameChart(data) {
      const { message } = data
      this.flamegraphdata = message
      this.buildChart()
    },
    getIdsFromChartNode(node) {
      return node.data._inner.ids
    },
    getMessageMapParentListFromId(id) {
      let currentId = id
      const data = [currentId]
      const findParentById = (id) => {
        for (const parentId in msgmapchildren) {
          for (const children of msgmapchildren[parentId]) {
            if (children.id === id) {
              return parentId
            }
          }
        }
        return null
      }
      let counter = 0
      const MAXIMUM_LOOP_COUNTER = 1000000
      while (counter < MAXIMUM_LOOP_COUNTER) {
        const parentId = findParentById(currentId)
        if (!parentId) {
          break
        }
        currentId = parentId
        data.push(currentId)
        counter++
      }
      return data.reverse()
    },
    setDrilldownMessage(chartNode) {
      const getPatternName = (name) => {
        const splitted = name.split(' : ')
        if (!splitted || splitted.length !== 2) {
          return ''
        }
        return splitted[1].trim()
      }

      let chartDrilldown = []
      let currentNode = chartNode
      while (true) {
        const { data, parent } = currentNode
        const patternName = getPatternName(data.name)
        if (!patternName) {
          break
        }
        chartDrilldown.push(patternName)
        if (!parent) {
          break
        }
        currentNode = parent
      }
      this.drilldownPath = chartDrilldown
    },
    applyDrilldown(chartNode) {
      const nodeIds = this.getIdsFromChartNode(chartNode)
      if (nodeIds.length) {
        const clearVnodeClasses = () => {
          const tree = this.$refs.msgtree.nodes
          Object.keys(tree).forEach((treeKey) => {
            const node = tree[treeKey]
            const vnodeEl = node.vnode.$el
            if (vnodeEl) {
              vnodeEl.classList.remove('unhidable')
            }
          })
        }
        clearVnodeClasses()

        nodeIds.forEach((nodeId) => {
          const elem = this.getMessageMapParentListFromId(nodeId)

          const tree = this.$refs.msgtree.nodes
          const treeObjectKeyNames = Object.keys(tree)
          for (const treeKey of treeObjectKeyNames) {
            const node = tree[treeKey]
            if (!node) {
              continue
            }
            const vnodeEl = node.vnode.$el
            if (!vnodeEl) {
              continue
            }
            if (!elem.includes(treeKey)) {
              if (!vnodeEl.classList.contains('unhidable')) {
                vnodeEl.classList.add('hide')
              }
            } else {
              vnodeEl.classList.remove('hide')
              vnodeEl.classList.add('unhidable')
            }
          }
        })
        this.setDrilldownMessage(chartNode)
      } else {
        const tree = this.$refs.msgtree.nodes
        const treeObjectKeyNames = Object.keys(tree)
        for (const treeKey of treeObjectKeyNames) {
          const node = tree[treeKey]
          if (!node) {
            continue
          }
          const vnodeEl = node.vnode.$el
          if (vnodeEl) {
            vnodeEl.classList.remove('hide')
          }
        }
        this.drilldownPath = []
      }
      this.showDrilldownAlert = true
    },
    buildChart() {
      if (!this.flamegraphChart) {
        const chart = d3flamegraph.flamegraph().width(screen.width * 0.9)

        chart.label((d) => {
          const { data } = d
          const { name, value, _inner } = data
          const { count } = _inner
          return `Action name: ${name}  |  Average execution time: ${value}  |  Number of executions:${count}`
        })

        d3.select(this.$refs.graphRef).datum(this.flamegraphdata).call(chart)

        chart.onClick((node) => {
          this.currentSelectedFlamechartNode = node
          this.applyDrilldown(node)

          if (node.data.name !== 'root') {
            this.allowChartUpdate = false
          } else {
            this.allowChartUpdate = true
          }
        })

        this.flamegraphChart = chart
      } else {
        if (this.allowChartUpdate) {
          this.flamegraphChart.update(this.flamegraphdata)
        }
      }
    },

    search: function () {
      var self = this
      self.term = this.search_txt.toLowerCase()

      const list = self.$refs.msgtree.nodes

      for (var i = 0; i < searchlist.length; i++) {
        const item = searchlist[i]
        const found = self.term && item.text.indexOf(self.term) !== -1

        self.walkup(function (item) {
          const node = list[item.id]
          const vnode = node && node.vnode
          const el = vnode && vnode.$el
          if (el) {
            if (found) {
              el.classList.add('found-msg')
            } else {
              el.classList.remove('found-msg')
            }
          }
        }, item)
      }
    },

    walk: function (op, item) {
      if (item) {
        op(item)
      }

      const children = (item && item.children) || this.items
      for (var i = 0; i < children.length; i++) {
        this.walk(op, children[i])
      }
    },
    walkup: function (op, item, found) {
      if (item) {
        op(item, found)
      }
      const parent = item && item.parent
      if (!parent) return
      this.walkup(op, searchlist[parent], found)
    },
  },
}
