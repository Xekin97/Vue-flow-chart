<template>
  <div id="flowLeftTool" class="flow-left-tool">
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
  name: "flow-left-tool",
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

<style lang="scss">
.flow-left-tool {
  width: 208px;
  height: 32px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 354px;
  overflow: auto;
  background: whiteSmoke;
  svg {
    width: 40px;
    height: 32px;
    display: block;
    position: relative;
    bottom: 2px;
    overflow: hidden;
    cursor: move;
  }
  .container {
    a {
      cursor: pointer;
    }
    .title {
      color: #333;
      background: #eee;
      padding: 6px 0px 6px 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4em;
      font-size: 9pt;
      display: flex;
      align-items: center;
    }
    .icon {
      margin-right: 8px;
    }
    .shapeList {
      display: flex;
      flex-wrap: wrap;
      background: #f5f5f5;
      .listItem {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: move;
        .item {
          width: 40px;
          height: 32px;
          overflow: hidden;
          cursor: move;
          background: none;
          margin-left: 10px;
        }
      }
    }
  }
}
</style>
