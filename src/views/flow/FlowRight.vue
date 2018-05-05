<template>
  <div id="flowRight" class="flow-right">
    <div class="container">
        <span class="title">新建节点</span>
        <div class="proSet">
            名称：<sel :selections="tabs" @on-change="setTab($event)"></sel><br>
            L：<input type="number" ref="newHor"> <br>
            T：<input type="number" ref="newVer"> <br>
            内容：<br><textarea cols="20" rows="2" ref="newCon"></textarea><br>          
            <button @click="selnode(tab)">创建</button>
        </div>
        <br>
        <span class="title">节点属性</span>
        <div class="proSet">
            名称：<span>{{ SVGName }}</span><br><br>
            L：<input :class="{cantClick: SVGName === ''}" type="number" v-model="coordinate.left" ref="hor" @input="updateNode" > <br>
            T：<input :class="{cantClick: SVGName === ''}" type="number" v-model="coordinate.top" ref="ver" @input="updateNode" > <br>
            内容：<br><textarea :class="{cantClick: SVGName === ''}" cols="20" rows="2" ref="updateContent" :value="nodeContents" @input="updateNode" ></textarea>
        </div>
        <br>
        <span class="title">节点搜索</span>
        <div class="proSet">
            按内容检索：<br><textarea cols="20" rows="2" v-model="search"></textarea>
        </div>
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
      } else {
        this.$refs.hor.removeAttribute("disabled");
        this.$refs.ver.removeAttribute("disabled");
        this.$refs.updateContent.removeAttribute("disabled", "disabled");
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
      return { left: this.nodeCoordinate.x, top: this.nodeCoordinate.y };
    },
    SVGName() {
      return this.nodeName
        ? this.nodeName === "rect"
          ? "矩形"
          : this.nodeName === "path" ? "菱形" : "椭圆"
        : "";
    }
  },
  methods: {
    setTab(val) {
      this.tab = val.type;
    },
    selnode(val) {
      if (this.$refs.newHor.value !== "" && this.$refs.newVer.value !== "") {
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
      if (this.$refs.hor.value !== "" && this.$refs.ver.value !== "") {
        let type = this.nodeName
          ? this.nodeName === "rect"
            ? "General"
            : this.nodeName === "path" ? "Decision" : "Start"
          : "";
        this.SEL_NODETYPE(type);
        this.$emit("onUpdateNode", {
          left: this.$refs.hor.value,
          top: this.$refs.ver.value,
          content: this.$refs.updateContent.value,
          act: "update"
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
    this.$refs.hor.setAttribute("disabled", "disabled");
    this.$refs.ver.setAttribute("disabled", "disabled");
    this.$refs.updateContent.setAttribute("disabled", "disabled");
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
