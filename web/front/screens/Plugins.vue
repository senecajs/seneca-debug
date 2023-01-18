<template>
  <v-container>
    <navigation-drawer></navigation-drawer>
    <v-toolbar>
      <navigation-button title="Plugins"></navigation-button>
      <v-spacer />
      <v-text-field solo v-model="search_txt" type="search" placeholder="search..." />
    </v-toolbar>
    <v-layout justify-space-between pa-3>
      <v-flex>
        <v-treeview style="overflow-y: auto; height: calc(80vh); width: calc(46vw); margin-right: 5px" v-if="list"
          return-object :active.sync="active" activatable :items="list" active-class="selected-msg"
          class="grey lighten-5"></v-treeview>
      </v-flex>
      <v-flex style="width: 100%">
        <vue-json-pretty v-if="selectedPatternDetail" :deep="3" :data="selectedPatternDetail">
        </vue-json-pretty>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
export default {
  data() {
    return {
      baseList: [],
      list: [],
      active: [],
      selectedPatternDetail: undefined,
      search_txt: '',
    }
  },
  watch: {
    active(v) {
      const self = this;
      if (!v || !v.length) {
        self.selectedPatternDetail = undefined;
        return;
      };
      self.selectedPatternDetail = v[0].raw;
    },
    search_txt(v) {
      const currentList = this.baseList.filter(({ name }) => name.includes(v));
      if (currentList && currentList.length) {
        this.list = currentList;
      }
    }
  },
  mounted() {
    this.fetchMessages();
  },
  methods: {
    fetchMessages() {
      const self = this;
      const fetchData = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      fetch('/list-plugins', fetchData)
        .then((res) => {
          res.json()
            .then((pluginsList) => {
              if (!pluginsList) return;
              const mappedPluginList = Object.entries(pluginsList).map(([key, val], idx) => ({
                id: idx,
                name: key,
                raw: val,
              }));
              self.baseList = mappedPluginList;
              self.list = mappedPluginList;
            })
        })
        .catch((err) => {
          console.log(err);
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