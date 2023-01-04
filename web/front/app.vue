<template src="./app.html"></template>

<script src="./app.js"></script>

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
