<template>
  <v-btn @click="emitToggleDrawer">
    <v-toolbar-title>{{ title }}</v-toolbar-title>
  </v-btn>
</template>
<script>
export default {
  props: ['title'],
  methods: {
    emitToggleDrawer() {
      this.$root.$emit('toggle-drawer')
    },
  },
}
</script>
