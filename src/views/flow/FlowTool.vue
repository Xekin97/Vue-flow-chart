<template>
  <div id="flowTool" class="flow-tool">
    <div class="container">
      <div class="shapeList" v-show="showList">
        <div class="listItem">
          <div @mousedown="selNode(item.type)" 
          v-for="(item,index) in shapeList" :key="index" :title="item.title" 
          class="item" 
          draggable="true">    <!-- 拖拽SVG -->
            <svg>
              <component :is="item.type"></component>
            </svg>
          </div>
        </div>
      </div>         
    </div>
  </div>
</template>

<script>
import shapesMixin from "./shapes/shapesMixin.js";
import { mapMutations, mapState } from "vuex";

export default {
  name: "flow-tool",
  mixins: [shapesMixin],
  data() {
    return {
      arrow: "down-arrow",
      showList: true,
      shapeList: [
        {
          type: "Start",
          title: "开始"
        },
        {
          type: "General",
          title: "流程"
        },
        {
          type: "Decision",
          title: "判断"
        }
      ],
      svgStyle: {}
    };
  },
  computed: {
    ...mapState("flow", ["inDrawArea", "selNodeType"])
  },
  methods: {
    ...mapMutations("flow", ["SEL_NODETYPE", "SET_DRAGGING", "SET_INDRAWAREA"]),
    selNode(type) {
      this.SEL_NODETYPE(type);
    }
  }
};
</script>

<style>

</style>
