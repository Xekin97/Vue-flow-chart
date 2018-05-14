<template>
  <div id="flowRight" class="flow-right">
    <div class="container">
        <span class="title">新建节点</span>
        <div class="proSet">
            名称：<sel :selections="tabs" @on-change="setTab($event)"></sel><br>
            L：<input type="number" ref="newHor"> <br>
            T：<input type="number" ref="newVer"> <br>
            内容：<br><textarea cols="20" rows="2" ref="newCon"></textarea><br>          
            <button class="newBtn" @click="selnode(tab)">创建</button>
        </div>
        <br>
        <span class="title">节点属性</span>
        <div class="proSet">
            名称：<span>{{ SVGName }}</span><br>
            
            <div class="line-form" v-if="clickType === 'line'">
            起点：<span>({{ coordinate.x.x1 }}, {{coordinate.x.y1}})</span> <br>
            终点：<span>({{ coordinate.y.x2 }}, {{coordinate.y.y2}})</span> <br>
            </div>
            <div class="node-form" v-else="clickType === 'node'">  
            L：<input :class="{cantClick: SVGName === '' }" type="number" v-model="coordinate.x" ref="hor" @input="updateNode" > <br>
            T：<input :class="{cantClick: SVGName === '' }" type="number" v-model="coordinate.y" ref="ver" @input="updateNode" > <br>
            </div>

            内容：<br><textarea :class="{cantClick: SVGName === '' }" cols="20" rows="2" ref="updateContent" :value="nodeContents" @input="updateNode" ></textarea>
        </div>
        <br>
    </div>
  </div>
</template>

<script>
import common from "./utils/common.js";
import sel from "../../components/selection";
import { mapState, mapMutations } from "vuex";
export default {
  name: "flow-right",
  components: { sel },
  data() {
    return {
      search: "",
      newHor: 0,
      newVer: 0,
      tab: "Start",
      clickType:'node',
      tabs: [
        { label: "椭圆", type: "Start" },
        { label: "矩形", type: "General" },
        { label: "菱形", type: "Decision" }
      ]
    };
  },
  watch: {
    search() {
      common(document.getElementById("flowMainCont"), this.search);
    },
    SVGName() {
      if (this.SVGName === "") {
        this.$refs.hor.setAttribute("disabled", "disabled");
        this.$refs.ver.setAttribute("disabled", "disabled");
        this.$refs.updateContent.setAttribute("disabled", "disabled");
      } else if (this.SVGName === "直线" || this.SVGName === "折线") {
        this.clickType = 'line';
        this.$refs.updateContent.removeAttribute("disabled");
      } else {
        this.clickType = 'node';
        this.$nextTick(() => { // watch异步回调 由于视图更新顺序，在这里需要使用回调API
        this.$refs.hor.removeAttribute("disabled");
        this.$refs.ver.removeAttribute("disabled");
        this.$refs.updateContent.removeAttribute("disabled");
        })  
      }
    },
    enterCoor() {
      this.$emit("on-change", {
        x: this.$refs.hor.value,
        y: this.$refs.ver.value
      });
    }
  },
  computed: {
    ...mapState("flow", [
      "nodeName",
      "nodeCoordinate",
      "nodeContent",
      "lineData",
      "nodeData"
    ]),
    node() {
      return JSON.parse(JSON.stringify(this.nodeData));
    },
    line() {
      return JSON.stringify(this.lineData);
    },
    nodeContents() {
      return this.nodeContent;
    },
    coordinate() {
      return { x: this.nodeCoordinate.x, y: this.nodeCoordinate.y };
    },
    SVGName() {
      switch (this.nodeName) {
        case "rect":
          return "矩形";
        case "path":
          return "菱形";
        case "ellipse":
          return "椭圆";
        case "line":
          return "直线";
        case "polyline":
          return "折线";
        default:
          return "";
          break;
      }
    }
  },
  methods: {
    setTab(val) {
      this.tab = val.type;
    },
    selnode(val) {
      if (this.$refs.newHor.value !== "" && this.$refs.newVer.value !== "") { //当input的值不为空时将值传给画布
        this.SEL_NODETYPE(this.tab);
        this.$emit("onNewNode", {
          left: this.$refs.newHor.value,
          top: this.$refs.newVer.value,
          content: this.$refs.newCon.value,
          act: "new"
        });
      }
      this.$refs.newCon.value = "";
      this.$refs.newVer.value = "";
      this.$refs.newHor.value = "";
    },
    updateNode() {
      let type;
      switch (this.nodeName) {
        case "rect":
          type = "General";
          break;
        case "path":
          type = "Decision";
          break;
        case "ellipse":
          type = "Start";
          break;
        case "line":
          type = "line";
          break;
        case "polyline":
          type = "polyline";
        default:
          break;
      }
      if (type !== 'line' && type !== 'polyline' && this.$refs.hor.value && this.$refs.ver.value) {
        this.SEL_NODETYPE(type);
        this.$emit("onUpdateNode", {
          left: this.$refs.hor.value,
          top: this.$refs.ver.value,
          content: this.$refs.updateContent.value,
          act: "update",
          type: type
        });
      }else {
        this.SEL_NODETYPE(type);
        this.$emit("onUpdateNode", {
          content: this.$refs.updateContent.value,
          act: "update",
          type: type
        });
      }
    },
    checkNum(num) {
      num = Math.abs(parseFloat(this.number));
      num > this.max ? (this.number = this.max) : false;
    },
    ...mapMutations("flow", [
      "SEL_NODENAME",
      "SEL_NODETYPE",
      "UPDATE_NODECOORDINATE",
      "UPDATE_NODECONTENT",
      "UPDATE_NODE",
      "UPDATE_LINE",
      "UPDATE_DRAWSTYLE"
    ])
  },
  mounted() {
    this.$refs.hor.disabled = "disabled";
    this.$refs.ver.disabled = "disabled";
    this.$refs.updateContent.disabled = "disabled";
  }
};
</script>

<style lang="scss">
.flow-right {
  width: 208px;
  position: absolute;
  top: 34px;
  bottom: 0;
  overflow: auto;
  right: 0;
  background: whiteSmoke;
  svg {
    width: 36px;
    height: 36px;
    display: block;
    position: relative;
    overflow: hidden;
    cursor: move;
    left: 2px;
    top: 2px;
  }
  .container {
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
    .proSet {
      padding: 5px;
      .newBtn {
        width: 50%;
      }
      input {
        margin-top: 10px;
        width: auto;
      }
      textarea {
        width: 100%;
      }
      .cantClick {
        background: #eee;
        cursor: not-allowed;
      }
    }
  }
}
.data-textarea {
  width: 100%;
  height: 200px;
}
</style>
