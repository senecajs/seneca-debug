<template>
  <v-container>
    <navigation-drawer></navigation-drawer>
    <v-toolbar>
      <navigation-button title="Frame"></navigation-button>
      <v-spacer />
    </v-toolbar>
    <v-layout justify-space-between>
      <v-flex>
        <div @click="handleRecording" v-if="!recording" class="btn">
          <v-icon color="red" large>play_arrow</v-icon>
        </div>
        <div @click="handleRecording" class="btn" v-if="recording">
          <v-icon color="red" large>stop</v-icon>
        </div>
        <v-expansion-panel>
          <v-expansion-panel-content v-for="(item, i) in frames" :key="i">
            <template v-slot:header>
              <div>{{ getMenuBarTime(item) }}</div>
            </template>
            <v-expansion-panel expand>
              <v-expansion-panel-content>
                <template v-slot:header>
                  <p>Flame Graph</p>
                </template>
                <div style="margin: 50px 15px; max-width: calc(80vw)">
                  <div :ref="`graphRef-${item.id}`"></div>
                </div>
              </v-expansion-panel-content>
              <v-expansion-panel-content>
                <template v-slot:header>
                  <p>Messages</p>
                </template>
                <v-layout justify-space-between pa-3>
                  <v-flex>
                    <v-treeview
                      @update:active="(e) => handleSelected(e, i)"
                      style="
                        overflow-y: auto;
                        height: calc(80vh);
                        width: calc(46vw);
                        margin-right: 5px;
                      "
                      v-if="item.messageData"
                      return-object
                      activatable
                      :items="item.messageData"
                      active-class="selected-msg"
                      class="grey lighten-5"
                    ></v-treeview>
                  </v-flex>
                  <v-flex
                    style="
                      overflow-y: auto;
                      height: calc(80vh);
                      width: calc(46vw);
                    "
                  >
                    <v-card
                      v-if="item.activeMessage && item.activeMessage.length"
                    >
                      <v-card-text>
                        <h3 class="headline mb-2">Data</h3>
                        <vue-json-pretty
                          :deep="3"
                          :data="{
                            ...item.activeMessage[0].raw,
                            priordef: undefined,
                          }"
                        >
                        </vue-json-pretty>
                      </v-card-text>
                      <v-divider></v-divider>
                      <v-card-text v-if="item.activeMessagePriors">
                        <h3 class="headline mb-2">Priors</h3>
                        <vue-json-pretty
                          :deep="3"
                          :data="item.activeMessagePriors"
                        >
                        </vue-json-pretty>
                      </v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-expansion-panel-content>
              <v-expansion-panel-content>
                <template v-slot:header>
                  <p>Tracing</p>
                </template>
                <v-layout justify-space-between pa-3>
                  <v-flex>
                    <!-- <p v-if="item">{{  JSON.stringify(item, null, 2) }}</p> -->
                    <v-treeview
                      style="
                        overflow-y: auto;
                        height: calc(80vh);
                        width: calc(46vw);
                        margin-right: 5px;
                      "
                      @update:active="(e) => handleSelectedTrace(e, i)"
                      v-if="item.top && item.top.items"
                      :items="item.top.items"
                      return-object
                      activatable
                    >
                      <template v-slot:prepend="{ item, open }">
                        {{ item.num_children }}
                        <v-icon v-if="item.error"> warning </v-icon>
                      </template>

                      <template v-slot:label="{ item }">
                        <p class="treeNodeLabel">
                          {{ item.name }}
                        </p>
                      </template>

                      <template v-slot:append="{ item, open }">
                        {{ item.duration }}ms
                      </template>
                    </v-treeview>
                  </v-flex>
                  <v-flex
                    style="
                      overflow-y: auto;
                      height: calc(80vh);
                      width: calc(46vw);
                    "
                  >
                    <v-card v-if="item.activeTrace && item.activeTrace.length">
                      <vue-json-pretty
                        :deep="3"
                        :data="item.activeTrace"
                      ></vue-json-pretty>
                    </v-card>
                  </v-flex>
                </v-layout>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import * as d3 from 'd3'
import { flamegraph } from 'd3-flame-graph'
import allSettled from 'promise.allsettled'

const top = {}
const msgmap = {}
const msgmapchildren = {}
const msgmapdata = {}

export default {
  data() {
    return {
      recording: false,
      frames: [],
      currentRecordingId: null,
      currentDebugRecordingId: null,
      open: [],
      active: [],
      currentActiveMessage: null,
    }
  },
  computed: {
    selected() {
      if (!this.active.length) return undefined
      const id = this.active[0]
      return msgmapdata[id]
    },
  },
  created: function () {
    const self = this
    this.$root.$on('msg', function (data) {
      if (!self.currentRecordingId) return
      self.addMsg(data)
    })
  },
  methods: {
    getDebugList(recordingId) {
      return top[recordingId] || []
    },
    handleRecording() {
      const vue = this
      if (!this.recording) {
        fetch('/boot-frame', {
          method: 'POST',
        })
          .then((rawResponse) => rawResponse.json())
          .then(({ id }) => {
            fetch('/boot-debug', {
              method: 'POST',
            })
              .then((rawResponse) => rawResponse.json())
              .then((response) => {
                if (!response.success) return
                vue.frames.push({
                  flameData: null,
                  id,
                  debugId: response.id,
                  start: Date.now(),
                  finish: null,
                })
                vue.currentRecordingId = id
                vue.currentDebugRecordingId = response.id
                vue.recording = true
              })
          })
          .catch((err) => {
            console.error(err)
          })
      } else {
        if (!vue.currentRecordingId || !vue.currentDebugRecordingId) return
        fetch('/get-and-destroy-frame', {
          method: 'POST',
          body: JSON.stringify({ id: vue.currentRecordingId }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((rawResponse) => rawResponse.json())
          .then(async ({ success, data }) => {
            if (!success) return
            fetch('/get-and-destroy-debug', {
              method: 'POST',
              body: JSON.stringify({ id: vue.currentDebugRecordingId }),
              headers: {
                'Content-Type': 'application/json',
              },
            })
              .then((rawResponse) => rawResponse.json())
              .then(async (response) => {
                if (!response.success) return
                const { msgmap, msgmapchildren, msgmapdata, top } = response
                const stack = []
                const actionsCollections = []
                let currentNode
                stack.push(data)
                while (stack.length) {
                  currentNode = stack.pop()
                  if (!currentNode) break
                  if (currentNode.children && currentNode.children.length) {
                    currentNode.children.forEach((children) => {
                      stack.push(children)
                    })
                  }
                  if (currentNode.name) {
                    actionsCollections.push(currentNode.name)
                  }
                }
                const uniqueActions = [...new Set(actionsCollections)]
                const messages = [
                  ...new Set(
                    actionsCollections
                      .filter((actionName) => actionName.includes(' : '))
                      .map((actionName) => actionName.split(' : ')[1])
                  ),
                ].map((pattern) => vue.findPattern(pattern))
                const settledResponses = await allSettled(messages)
                const messagePaterns = settledResponses
                  .filter((r) => r.status === 'fulfilled')
                  .map(({ value }) => {
                    if (!value || !value.id) return null
                    return {
                      id: value.id,
                      name: `${value.pattern} - ${value.id}`,
                      raw: value,
                    }
                  })
                  .filter((val) => !!val)
                const frame = vue.frames.find(
                  ({ id }) => id === vue.currentRecordingId
                )
                if (frame) {
                  const old = vue.frames.filter(
                    ({ id }) => id !== vue.currentRecordingId
                  )
                  frame.flameData = data
                  frame.messageData = messagePaterns
                  frame.activeMessage = null
                  frame.activeTrace = null
                  frame.activeMessagePriors = null
                  frame.treemodel = []
                  frame.finish = Date.now()
                  // msgmap, msgmapchildren, msgmapdata, top
                  frame.msgmap = msgmap
                  frame.msgmapchildren = msgmapchildren
                  frame.msgmapdata = msgmapdata
                  // VITOR AQUI

                  // console.log('msgmapchildren', msgmapchildren)
                  // console.log('top, top', top)
                  const buildFullTop = (msgmapchildren, top) => {
                    const topItems = top.items

                    let count = 0
                    const max = Math.pow(Math.max(topItems.length, 10), 3)

                    for (const item of topItems) {
                      let currentItem = item
                      count = 0
                      while (true && count < max) {
                        if (
                          currentItem.children &&
                          currentItem.children.length
                        ) {
                          currentItem = currentItem.children[0]
                        } else {
                          const exists = msgmapchildren[currentItem.id]
                          if (exists) {
                            currentItem.children = exists
                          } else {
                            break
                          }
                        }
                        count += 1
                      }
                    }
                  }
                  buildFullTop(msgmapchildren, top)

                  frame.top = top
                  vue.frames = [...old, frame]
                  vue.buildChart(frame, frame.id)
                }
                vue.recording = false
                vue.currentRecordingId = null
                vue.currentDebugRecordingId = null
              })
          })
      }
    },
    findPattern(pattern) {
      return new Promise((resolve, reject) => {
        fetch('/find-pattern', {
          method: 'POST',
          body: JSON.stringify({ pattern }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((rawResponse) => rawResponse.json())
          .then((parsedResponse) => {
            resolve(parsedResponse)
          })
          .catch((err) => reject(err))
      })
    },
    buildChart(dataObject, id) {
      const chart = flamegraph().width(screen.width * 0.9)

      chart.label((d) => {
        const { data } = d
        const { name, value, _inner } = data
        const { count } = _inner
        return `Action name: ${name}  |  Average execution time: ${value}  |  Number of executions:${count}`
      })

      d3.select(this.$refs[`graphRef-${id}`][0])
        .datum(dataObject.flameData)
        .call(chart)

      /*
      chart.onClick((node) => {
        this.currentSelectedFlamechartNode = node;
        this.applyDrilldown(node)
        
        if (node.data.name !== 'root') {
          this.allowChartUpdate = false
        } else {
          this.allowChartUpdate = true
        }
      })
      */
    },
    addMsg(data) {
      const currentId = this.currentRecordingId
      if (!top[currentId]) {
        top[currentId] = []
      }
      if (!msgmap[currentId]) {
        msgmap[currentId] = {}
      }
      if (!msgmapchildren[currentId]) {
        msgmapchildren[currentId] = {}
      }
      if (!msgmapdata[currentId]) {
        msgmapdata[currentId] = {}
      }
      const meta = data.meta
      const parent = meta.parent
        ? meta.parent
        : meta.parents[0]
        ? meta.parents[0][1]
        : null

      if ('in' === data.debug_kind && !msgmap[currentId][meta.id]) {
        const parent_children = parent
          ? msgmapchildren[currentId][parent]
            ? msgmapchildren[currentId][parent]
            : top[currentId]
          : top[currentId]

        const entry = {
          id: data.meta.id,
          name: (data.meta.start % 10000000) + ' ' + data.meta.pattern,
          children: [],
          error: false,
          duration: null,
          num_children: 0,
        }

        msgmapdata[currentId][meta.id] = {
          id: meta.id,
          name: data.name,
          data: data,
        }

        parent_children.unshift(entry)
        msgmap[currentId][meta.id] = entry
        msgmapchildren[currentId][meta.id] = []
      } else if ('out' === data.debug_kind && msgmap[currentId][meta.id]) {
        msgmap[currentId][meta.id].error = data.error
        msgmap[currentId][meta.id].duration = meta.end - meta.start
        msgmap[currentId][meta.id].num_children =
          msgmapchildren[currentId][meta.id].length

        msgmapdata[currentId][meta.id].data.res = data.res
        msgmapdata[currentId][meta.id].data.err = data.err
        msgmapdata[currentId][meta.id].data.error = data.error
        msgmapdata[currentId][meta.id].data.meta.end = meta.end
        msgmapdata[currentId][meta.id].data.result_length = data.result_length
      }
    },
    load_children: function (data) {
      data.children = msgmapchildren[this.currentRecordingId][data.id]
    },
    myLoadChildren(item) {
      return (data) => {
        console.log('data', data)
        console.log('item', item)
        data.children = item.msgmapchildren[data.id][0]
      }
    },
    loadChildren(id) {
      return (data) => {
        data.children = msgmapchildren[id][data.id]
      }
    },
    getMessagePriors(message) {
      if (!message || !message.length) return null
      const priors = []
      let currentPrior = message[0].raw
      while (currentPrior.priordef) {
        priors.unshift({ ...currentPrior, priordef: undefined })
        currentPrior = currentPrior.priordef
      }
      return priors
    },
    handleSelected(event, index) {
      const vue = this
      vue.frames[index].activeMessage = event
      vue.frames[index].activeMessagePriors = vue.getMessagePriors(event)
      // Enforce update
      vue.frames = [...vue.frames]
    },
    handleSelectedTrace(event, index) {
      const vue = this
      vue.frames[index].activeTrace = event

      // Enforce update
      vue.frames = [...vue.frames]
    },
    getMenuBarTime(item) {
      const options = {
        year: undefined,
        month: undefined,
        weekday: undefined,
        day: undefined,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }
      const startDate = new Date(item.start).toLocaleDateString(
        'en-US',
        options
      )
      let finishDate = 'Active'
      if (!!item.finish) {
        finishDate = new Date(item.finish).toLocaleDateString('en-US', options)
      }
      return `${startDate} ------- ${finishDate}`
    },
  },
}
</script>
<style>
.btn {
  align-items: center;
  border-radius: 2px;
  display: inline-flex;
  height: 36px;
  flex: 0 0 auto;
  justify-content: center;
  margin: 6px 8px;
  min-width: 88px;
  outline: 0;
  text-transform: uppercase;
  text-decoration: none;
  position: relative;
  vertical-align: middle;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  cursor: pointer;
}
</style>
