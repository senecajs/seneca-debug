import Vue from 'vue';
import VueRouter from 'vue-router/dist/vue-router';
// const VueRouter = require('vue-router');
import Home from "./screens/Home.vue";
import Messages from './screens/Messages.vue';
import Plugins from './screens/Plugins.vue';
import Vuetify from "vuetify";
import VueJsonPretty from "vue-json-pretty";
import NavigationButton from './components/NavigationButton.vue';
import NavigationDrawer from './components/NavigationDrawer.vue';

import "vuetify/dist/vuetify.min.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";

Vue.use(Vuetify, {
  iconfont: "md"
});
Vue.config.productionTip = false;

Vue.use(VueRouter);

Vue.component("vue-json-pretty", VueJsonPretty);
Vue.component('navigation-button', NavigationButton);
Vue.component('navigation-drawer', NavigationDrawer);

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

  const routes = [
    { path: '/', component: Home },
    { path: '/messages', component: Messages },
    { path: '/plugins', component: Plugins },
  ];

  const router = new VueRouter({
    routes,
  });

  const app = new Vue({
   /*  data: function() {
      return {};
    }, */
    router,
    // render: h => h(App)
    // render: h => h(Home)
  });

  return app;
}
