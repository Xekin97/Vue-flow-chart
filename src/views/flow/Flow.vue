<template>
  <div id="flow" class="flow" @click="resetComponent">
    <flow-main-cont></flow-main-cont>
  </div>
</template>

<script>
import FlowMainCont from "./FlowMainCont";
import { eventBus } from "../../eventBus";
export default {
  name: "flow",
  components: {
    FlowMainCont
  },
  methods: {
    resetComponent() {
      eventBus.$emit("resetComponent");
    }
  }
};
</script>

<style lang="scss">
@import "flow.scss";
</style>