<template>
  <v-container>
    <navigation-drawer></navigation-drawer>
    <v-toolbar>
      <navigation-button title="Messages"></navigation-button>
      <v-spacer />
      <v-text-field
        solo
        v-model="search_txt"
        type="search"
        placeholder="search..."
      />
    </v-toolbar>
    <v-layout justify-space-between pa-3>
      <v-flex>
        <v-progress-circular
          :width="2"
          :size="75"
          color="blue"
          indeterminate
          v-if="!filteredList.length"
          style="position: absolute; top: 50%; left: 50%"
        ></v-progress-circular>
        <v-treeview
          style="
            overflow-y: auto;
            height: calc(80vh);
            width: calc(46vw);
            margin-right: 5px;
          "
          v-if="filteredList"
          return-object
          :active.sync="active"
          activatable
          :items="filteredList"
          active-class="selected-msg"
          class="grey lighten-5"
        ></v-treeview>
      </v-flex>
      <v-flex style="width: 100%">
        <v-card v-if="selectedPatternDetail">
          <v-card-text>
            <h3 class="headline mb-2">Data</h3>
            <vue-json-pretty
              :deep="3"
              :data="{ ...selectedPatternDetail, priordef: undefined }"
            >
            </vue-json-pretty>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text v-if="selectedPatternPriors">
            <h3 class="headline mb-2">Priors</h3>
            <vue-json-pretty :deep="3" :data="selectedPatternPriors">
            </vue-json-pretty>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import debounce from 'lodash/debounce'
export default {
  data() {
    return {
      list: [],
      filteredList: [],
      active: [],
      selectedPatternDetail: undefined,
      search_txt: '',
    }
  },
  computed: {
    selectedPatternPriors() {
      if (!this.selectedPatternDetail) return null
      const priors = []
      let currentPrior = this.selectedPatternDetail
      while (currentPrior.priordef) {
        priors.unshift({ ...currentPrior, priordef: undefined })
        currentPrior = currentPrior.priordef
      }
      return priors
    },
  },
  watch: {
    active(v) {
      const self = this
      if (!v || !v.length) {
        self.selectedPatternDetail = undefined
        return
      }
      const currentActive = v[0]
      self.selectedPatternDetail = currentActive.pattern
    },
    search_txt(v) {
      this.searchForName(v)
    },
  },
  mounted() {
    this.fetchMessages()
  },
  methods: {
    searchForName: debounce(function (v) {
      if (!v || !v.length) {
        this.filteredList = this.list
        // this.fetchMessages();
        return
      }
      const filteredList = this.list.filter(({ name }) => {
        return name
          .toString()
          .toLowerCase()
          .includes(v.toString().toLowerCase())
      })
      if (filteredList.length) {
        this.filteredList = filteredList
      } else {
        this.filteredList = this.list
      }
    }, 850),
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
    buildListName(object, pattern) {
      const ObjectEntries = Object.entries(object)
      const baseStr = ObjectEntries.reduce((prev, [key, value], idx) => {
        const spread = idx === ObjectEntries.length - 1 ? '' : ', '
        const current = `${key}:${value}${spread}`
        return `${prev} ${current}`
      }, '')
      return baseStr + ' - ' + ((pattern && pattern.id) || '')
    },
    fetchMessages(data) {
      const self = this
      const fetchData = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      if (data) {
        fetchData.body = JSON.stringify({ pattern: data })
      }
      fetch('/list-messages', fetchData)
        .then((res) => {
          res.json().then((actionsList) => {
            if (!actionsList || !actionsList.length) return
            const mappedList = actionsList.map((action, idx) => {
              return self.findPattern(action).then((pattern) => ({
                id: idx,
                name: self.buildListName(action, pattern),
                raw: action,
                pattern,
              }))
            })
            Promise.all(mappedList).then((results) => {
              self.list = results
              self.filteredList = results
            })
          })
        })
        .catch((err) => {
          console.log(err)
        })
    },
  },
}
</script>
<style>
.container {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100vw !important;
}

.selected-msg {
  border: 1px solid green;
}

.v-treeview-node__content {
  cursor: pointer;
}
</style>
