<template>
  <v-navigation-drawer
    v-on:toggle-drawer="toggleDrawer"
    @toggle-drawer="toggleDrawer"
    v-model="drawer"
    absolute
    temporary
  >
    <v-list class="pt-0" dense>
      <v-divider></v-divider>
      <v-list class="pt-0" dense>
        <v-divider></v-divider>
        <v-list-tile
          @click="travel(item)"
          v-for="item in drawerItems"
          :key="item.title"
        >
          <v-list-tile-content>
            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-list>
  </v-navigation-drawer>
</template>
<script>
export default {
  props: ['title'],
  data() {
    return {
      drawer: false,
      drawerItems: [
        { title: 'Tracing', path: '/' },
        { title: 'Messages', path: '/messages' },
        { title: 'Plugins', path: '/plugins' },
        { title: 'Frame', path: '/frame' },
      ],
    }
  },
  created() {
    this.$root.$on('toggle-drawer', () => {
      this.drawer = !this.drawer
    })
  },
  methods: {
    travel(drawerItem) {
      const { path } = this.$router.currentRoute
      if (path !== drawerItem.path) {
        this.$router.push(drawerItem.path)
      } else {
        this.drawer = false
      }
    },
    toggleDrawer() {
      this.drawer = !this.drawer
    },
  },
}
</script>
