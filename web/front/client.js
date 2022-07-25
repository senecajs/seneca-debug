import Vue from "vue";
import App from "./app.vue";
import Vuetify from "vuetify";
import VueJsonPretty from "vue-json-pretty";

import "vuetify/dist/vuetify.min.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";

Vue.use(Vuetify, {
  iconfont: "md"
});
Vue.config.productionTip = false;

Vue.component("vue-json-pretty", VueJsonPretty);

const app = createApp();
app.$mount("#app");

function createApp() {
  fetch("/config")
    .then(function(res) {
      return res.json();
    })
    .then(function(config) {
      const wsClient = new WebSocket("ws://localhost:" + config.port);
      
      app.$root.expressBaseUrl = `http://localhost:${config.expressPort}`;

      wsClient.onmessage = (event) => {
        const { data } = event;
        const parsedData = JSON.parse(data);
        if (parsedData.feature) {
          if (parsedData.message.children) {
            app.$root.$emit('flame', parsedData)
          }
        } else {
          app.$root.$emit('msg', parsedData);
        }
      }

      Vue.prototype.client$ = wsClient;
    });

  const app = new Vue({
    data: function() {
      return {};
    },
    render: h => h(App)
  });

  return app;
}
