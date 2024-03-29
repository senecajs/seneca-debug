<template>
  <div>
    <v-alert :value="showDrilldownAlert" type="info" class="drilldownAlert">
      Data has been drilled
    </v-alert>
    <v-app>
      <v-content>
        <navigation-drawer></navigation-drawer>
        <v-container>
          <v-toolbar>
            <navigation-button title="Tracing"></navigation-button>
            <v-spacer />
            <v-btn @click="clear" solo>Clear</v-btn>
            <v-btn @click="toggle" solo>{{ toggleButtonMessage }}</v-btn>
            <v-btn @click="toggleFlamechartCapture" solo>{{
              flamechartCaptureStatus
            }}</v-btn>
            <v-spacer />
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
              <v-card v-if="drilldownPath.length">
                <v-card-title class="headline font-weight-bold"
                  >Drilldown filter pattern:</v-card-title
                >
                <div style="margin-left: 16px">
                  <v-card-text
                    class="drilldownParagraph"
                    style="padding-right: 0px; padding-left: 0px"
                    v-for="(item, index) in drilldownPath"
                  >
                    <p class="drilldownParagraph subheading">{{ item }}</p>
                    <p
                      class="drilldownParagraph caption grey--text darken-1"
                      v-if="index !== drilldownPath.length - 1"
                    >
                      =>
                    </p>
                  </v-card-text>
                </div>
              </v-card>
              <v-treeview
                ref="msgtree"
                :active.sync="active"
                :open="open"
                :items="items"
                active-class="selected-msg"
                class="grey lighten-5"
                :load-children="load_children"
                transition
                activatable
                style="
                  overflow-y: auto;
                  height: calc(80vh);
                  width: calc(46vw);
                  margin-right: 5px;
                "
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
            <v-flex d-flex>
              <v-card
                v-if="selected"
                :key="selected.id"
                class="pt-4 mx-auto"
                flat
                max-width="50vw"
                max-height="calc(80vh)"
                style="
                  overflow-y: scroll;
                  overflow-x: auto;
                  position: sticky;
                  top: 0px;
                "
              >
                <v-card-text>
                  <h3 class="headline mb-2">Data</h3>
                  <vue-json-pretty :deep="3" :data="selected.data.msg">
                  </vue-json-pretty>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-text>
                  <h4 class="headline mb-2">Result</h4>

                  <div v-if="selected.data.result_length">
                    Result size {{ selected.data.result_length }} (not sent for
                    performance)
                  </div>
                  <vue-json-pretty
                    :deep="3"
                    :data="selected.data.res || selected.data.err"
                  >
                  </vue-json-pretty>
                </v-card-text>

                <v-divider></v-divider>
                <v-card-text>
                  <h4 class="headline mb-2">
                    Stack Trace<span class="ml-2 caption grey--text darken-1"
                      >(Double click to open in VSCode)</span
                    >
                  </h4>

                  <vue-json-pretty
                    :deep="3"
                    :data="selected.data.trace"
                    @node-click="handleMetaDataClick"
                  >
                  </vue-json-pretty>
                </v-card-text>
                <v-card-text>
                  <h4 class="headline mb-2">Meta</h4>

                  <vue-json-pretty :deep="3" :data="selected.data.meta">
                  </vue-json-pretty>
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>
        </v-container>
        <div style="margin: 50px 15px; max-width: calc(80vw)">
          <div ref="graphRef"></div>
        </div>
      </v-content>
    </v-app>
  </div>
</template>

<script src="./Home.js"></script>

<style>
.container {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100vw !important;
}

.selected-msg {
  border: 1px solid green;
}

.found-msg {
  background-color: #ccf;
}

.v-treeview-node__content {
  cursor: pointer;
}

.hide {
  display: none;
}

.drilldownAlert {
  max-width: 200px;
  position: fixed !important;
  z-index: 999;
  bottom: 30px;
  right: 10%;
}

.treeNodeLabel {
  max-width: 33vw;
  text-overflow: ellipsis;
  overflow: hidden;
  margin-bottom: 0;
}

.drilldownParagraph {
  display: inline;
}
</style>
