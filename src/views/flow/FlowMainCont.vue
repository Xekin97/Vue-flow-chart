<template>
<div>
  <flow-left-tool></flow-left-tool>
  <div id="flowMainCont" class="flow-main-cont" ref="Cont" @click="toggleSelected">
    <div style="width:2000px;height:1000px">
      <div 
      id="draw" 
      class="main-bg" 
      :style="{transform:`scale(${drawStyle.zoomRate})`,transformOrigin:`${drawStyle.origin}`}" 
      @drop.prevent="dropHandle" 
      @dragover.stop.prevent 
      @mousewheel.alt.prevent="wheelHandle" 
      >
        <svg id="drawSVG" style="width:2000px; height:1500px; display: block; position: absolute; background-image: none;"> 
          <defs>
            <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 12 6 L 0 12  L 4 6" style="fill: rgb(0,0,0);" transform="scale(0.8)"></path>
            </marker>
          </defs>
          <foreignObject>
            <div v-show="showArrow && !isDragging" id="arrow" @mouseover="enterArrow" @mouseout="outArrow">
              <img src="~assets/arrow.png" alt="" :style="arrowStyle" class="arrow" draggable="false" data-direction="arrow">
              <!-- <img src="~assets/arrow.png" alt="" :style="arrowStyle.t" class="arrow" draggable="false" data-direction="t">
              <img src="~assets/arrow.png" alt="" :style="arrowStyle.b" class="arrow arrow-bottom" draggable="false" data-direction="b">
              <img src="~assets/arrow.png" alt="" :style="arrowStyle.l" class="arrow arrow-left" draggable="false" data-direction="l">
              <img src="~assets/arrow.png" alt="" :style="arrowStyle.r" class="arrow arrow-right" draggable="false" data-direction="r"> -->
            </div>
          </foreignObject>
          <g id="draw-line" style="cursor:row-resize;">

            <component :is="selLineType" :lineStyle="drawLineInfo.lineStyle" v-if="lineDrawing">
            </component>
            <component v-for="(item,index) in lineData" :is="item.type" :key="index" :lineStyle="item.lineStyle" :id="item.id" v-line>
            </component>
            <component :is="clickInfo.type" :lineStyle="clickInfo.lineStyle" v-show="showLineSet">
            </component>
            
          </g>
          <g id="draw-node">
            <component :is="selNodeInfo.type" :transform="selNodeInfo.transform" v-if="isDragging" inDraw>
            </component>

            <!-- 真实节点 -->
            <component v-for="(item,index) in nodeData" :text="item.text" :editable="editable" :is="item.type" :key="index" :transform="item.transform" :id="item.id" v-node inDraw>
            </component>

            <!-- 修改节点大小 未实现-->
            <g v-if="clickResize">
              <g :style="{cursor: `${key}-resize`}" :transform="`translate(${item.x},${item.y})`" v-for="(item,key,index) of clickStyle" :key="index" v-if="key!=='rect'">
                <image x="-8" y="-8" width="17" height="17" xlink:href="~assets/point.png"></image>
              </g>
              <g :transform="`translate(${clickStyle.rect.x},${clickStyle.rect.y})`" style="cursor: move; visibility: visible;">
                <rect :width="clickStyle.rect.w" :height="clickStyle.rect.h" fill="none" stroke="#00a8ff" stroke-dasharray="3 3" pointer-events="none"></rect>
              </g>
            </g>
          </g>
        </svg>
        <tool-menu :ulStyle="'width:100px;text-align:center'" :visible.sync="visible" :menuData="menuData" @selItme="deleteHandle" :style="{top:menuInfo.top,left:menuInfo.left}"></tool-menu>
      </div>
    </div>
  </div>
  <flow-right :target="tar" @onNewNode="handle($event)" @onUpdateNode="handle($event)"></flow-right>
  </div>
</template>

<script>
import shapesMixin from "./shapes/shapesMixin.js";
import flowLeftTool from "./FlowLeftTool";
import flowRight from "./FlowRight";
import { mapState, mapMutations } from "vuex";
import ToolMenu from "./ToolMenu";

export default {
  name: "flowMainCont",
  mixins: [shapesMixin],
  data() {
    return {
      tar: "",
      // 节点相关
      updateTrans: {},
      isDragging: false,
      selNodeInfo: {},
      clickResize: false,
      showLineSet: false,
      clickInfo: {},
      showArrow: false,
      // 连线相关
      drawLineInfo: {
        isFirstNode: true,
        prevNode: "",
        startNode: "",
        // type: 'StraightLine',
        type: "",
        lineStyle: {
          // x1: '',
          // y1: '',
          // x2: '',
          // y2: ''
        }
      },
      editable: false,
      lineDrawing: false,
      arrowPadding: 15,
      timer: null,
      drawScale: 2,
      zoomType: "zoomIn",
      visible: false,
      menuData: [{ title: "删除这个" }],
      menuInfo: {
        top: 0,
        left: 0,
        selType: "",
        selId: ""
      }
    };
  },
  components: {
    ToolMenu,
    flowRight,
    flowLeftTool
  },
  computed: {
    ...mapState("flow", [
      "nodeName",
      "nodeContent",
      "nodeData",
      "selNodeType",
      "dragging",
      "lineData",
      "selLineType",
      "drawStyle"
    ]),
    arrowStyle() {
      let { top, left } = this.selNodeInfo;
      let objH = 15;
      let objW = 15;
      return {
        top: top - 1 / 2 * objH + "px",
        left: left - 1 / 2 * objW + "px"
      };
    },
    clickStyle() {
      let { width, height, top, left } = this.clickInfo;
      let w = width / 2;
      let h = height / 2;
        return {
          nw: { x: left - w, y: top - h },
          n: { x: left, y: top - h },
          ne: { x: left * 1 + w, y: top - h },
          w: { x: left - w, y: top },
          e: { x: left * 1 + w, y: top },
          sw: { x: left - w, y: top * 1 + h },
          s: { x: left, y: top * 1 + h },
          se: { x: left * 1 + w, y: top * 1 + h },
          rect: {
            w: width,
            h: height,
            x: left - w,
            y: top - h
          }
        }
    }
  },
  directives: {
    node(el, binding, vnode) {
      // vnode.context 相当于 this
      let _this = vnode.context;
      let x, y, val;
      // 获取节点信息
      let getNodeInfo = () => {
        // 防止缩放后元素大小更改故除以缩放比例
        let obj = el.getElementsByTagName("g")[0];
        let w = obj.getBoundingClientRect().width / _this.drawStyle.zoomRate;
        let h = obj.getBoundingClientRect().height / _this.drawStyle.zoomRate;
        let wh = {
          width: w,
          height: h
        };
        let nodeInfo = _this.nodeData[el.id];
        _this.selNodeInfo = Object.assign({}, nodeInfo, wh);
      };
      el.onmousedown = ev => {
        if (_this.selLineType === "Mouse") {
          _this.SEL_NODENAME(ev.target.localName); // 拖拽函数
          if (ev.buttons === 2) {
            return;
          }
          clearTimeout(_this.timer);
          _this.timer = setTimeout(() => {
            _this.isDragging = true;
            // 节点移动回调
            let fn = ev => {
              x = ev.offsetX;
              y = ev.offsetY;
              val = `translate(${x},${y})`;
              _this.UPDATE_NODECOORDINATE({ x: ev.offsetX, y: ev.offsetY });
              _this.selNodeInfo.transform = val;
            };

            // 节点移动结束后更新节点
            let updata = ev => {
              if (_this.isDragging) {
                x = ev.offsetX;
                y = ev.offsetY;
                val = `translate(${x},${y})`;

                _this.UPDATE_NODE({
                  [el.id]: {
                    ..._this.nodeData[el.id],
                    transform: val,
                    top: y,
                    left: x
                  }
                });
                getNodeInfo();
              }
              _this.isDragging = false;
              _this.updateLine();
              // 移除画布事件
              document
                .querySelector("#draw")
                .removeEventListener("mousemove", fn);
              document
                .querySelector("#draw")
                .removeEventListener("mouseup", updata);
              document
                .querySelector("#draw")
                .removeEventListener("mouseleave", leaveFn);
            };

            // 离开画布后触发的方法
            let leaveFn = ev => {
              if (_this.isDragging) {
                updata(ev);
                // _this.showArrow = false;
              }
            };
            // 添加画布事件
            document.querySelector("#draw").addEventListener("mousemove", fn);
            document.querySelector("#draw").addEventListener("mouseup", updata);
            document
              .querySelector("#draw")
              .addEventListener("mouseleave", leaveFn);
          }, 200);
        }
      };
      el.onclick = ev => {
        //单击事件
        if (_this.selLineType === "Mouse") {
          clearTimeout(_this.timer);
          _this.UPDATE_NODECOORDINATE({
            x: _this.nodeData[el.id].left,
            y: _this.nodeData[el.id].top
          });
          _this.SEL_NODENAME(ev.target.localName); //传输图形名称
          _this.clickResize = true;
          _this.clickElementId = el.id;
          _this.clickInfo = JSON.parse(JSON.stringify(_this.selNodeInfo));
          _this.UPDATE_NODECONTENT(_this.clickInfo.text);
        } else {
          // 连线功能
          _this.showArrow = true;
          if (_this.drawLineInfo.startNode === "") {
            _this.drawLineStart(ev);
          } else {
            _this.drawLineInfo.prevNode = _this.drawLineInfo.startNode;
            _this.drawingLine(ev);
          }
        }
      };
      el.onmouseover = ev => {
        getNodeInfo();
      };
    },
    line(el, binding, vnode) {
      let _this = vnode.context;
      // el.oncontextmenu = ev => {
      //   ev.preventDefault();
      //   _this.visible = true;
      //   let x = ev.offsetX;
      //   let y = ev.offsetY;
      //   _this.menuInfo.top = `${y}px`;
      //   _this.menuInfo.left = `${x}px`;
      //   _this.menuInfo.selType = el.id.replace(/-.*/g, "");
      //   _this.menuInfo.id = el.id;
      // };
      // el.onclick = ev => {
      //   if (_this.selLineType === "Mouse") {
      //     _this.clickInfo = _this.deepCopy(_this.lineData[el.id]);
      //     _this.clickInfo.lineStyle.stroke = "#00a8ff";
      //     _this.clickInfo.lineStyle["stroke-dasharray"] = "3 3";
      //     _this.showLineSet = true;
      //   }
      // };
      // el.onmousedown = ev => {
      //   if (_this.selLineType === "Mouse") {
      //     _this.lineDrawing = true;
      //     _this.drawLineInfo.lineStyle.path = "";
      //   }
      // };
      // el.ondblclick = ev => {
      //   _this.editable = true;
      //   let editor = el.querySelector(".line-text");
      //   el.querySelector("foreignObject").setAttribute("pointer-events", "all");
      //   editor.focus();
      //   let fn = () => {
      //     let text = editor.innerHTML;
      //     let result = _this.deepCopy(_this.lineData[el.id]);
      //     result.text = text;
      //     _this.UPDATE_LINE({ [el.id]: result });
      //     _this.editable = false;
      //     document.querySelector(".line-text").removeEventListener("blur", fn);
      //   };
      //   document.querySelector(".line-text").addEventListener("blur", fn);
      // };
    }
  },
  methods: {
    toggleSelected() {
      if(this.selLineType === "Mouse"){
        this.showArrow = false;
      }else{
        this.clickResize = false;
      }
    },
    test() {
      console.log(this.drawLineInfo.prevNode, this.drawLineInfo.startNode);
    },
    ...mapMutations("flow", [
      "SEL_NODENAME",
      "SEL_NODETYPE",
      "UPDATE_NODECOORDINATE",
      "UPDATE_NODECONTENT",
      "UPDATE_NODE",
      "UPDATE_LINE",
      "UPDATE_DRAWSTYLE"
    ]),
    handle(val) {
      switch (val.act) {
        case "new":
          if (this.selNodeType !== "") {
            let x = val.left;
            let y = val.top;
            let id = "node-" + new Date().getTime();
            this.UPDATE_NODE({
              [id]: {
                id: "node-" + new Date().getTime(),
                type: this.selNodeType,
                transform: `translate(${x},${y})`,
                top: y,
                left: x,
                text: val.content
              }
            });
          }
          break;
        case "update":
          this.deleteNode(this.clickElementId, true);
          if (this.selNodeType !== "") {
            let x = val.left;
            let y = val.top;
            let id = this.clickElementId;
            let coor = { x: val.left, y: val.top };
            this.UPDATE_NODECONTENT(val.content);
            this.UPDATE_NODECOORDINATE(coor);
            this.UPDATE_NODE({
              [id]: {
                id: this.clickElementId,
                type: this.selNodeType,
                transform: `translate(${x},${y})`,
                top: y,
                left: x,
                text: val.content
              }
            });
          }
          break;
        default:
          break;
      }
    },
    deleteNode(id = "", isUpdate = false) {
      for (var key in this.lineData) {
        if (
          this.lineData[key].startNode === id ||
          this.lineData[key].endNode === id
        ) {
          delete this.lineData[key];
          this.UPDATE_LINE(this.lineData);
        }
      }
      delete this.nodeData[id];
      this.UPDATE_NODE(this.nodeData);
      this.UPDATE_NODECONTENT("");
      this.UPDATE_NODECOORDINATE({ x: "", y: "" });
      if (!isUpdate) {
        this.SEL_NODENAME("");
      }
      this.showArrow = false;
      this.showResize = false;
    },
    deleteHandle(ev) {
      let { id, selType } = this.menuInfo;
      switch (selType) {
        case "node":
          this.deleteNode(id);
          break;
        case "line":
          delete this.lineData[id];
          this.UPDATE_NODE(this.lineData);
          break;
        default:
          break;
      }
    },
    wheelHandle(ev) {
      if (ev.deltaY < 0) {
        this.zoomType = "zoomIn";
      } else {
        this.zoomType = "zoomOut";
      }
      let x = ev.offsetX;
      let y = ev.offsetY;
      if (this.zoomType === "zoomIn") {
        if (this.drawStyle.zoomRate < 3) {
          let zoomRate = this.drawStyle.zoomRate + 0.25;
          this.UPDATE_DRAWSTYLE({ zoomRate, origin: `${x}px ${y}px` });
        }
      } else if (this.zoomType === "zoomOut") {
        if (this.drawStyle.zoomRate > 0.25) {
          let zoomRate = this.drawStyle.zoomRate - 0.25;
          this.UPDATE_DRAWSTYLE({ zoomRate, origin: `${x}px ${y}px` });
        }
      }
    },
    dropHandle(ev) {
      if (this.selNodeType !== "") {
        let x = ev.offsetX;
        let y = ev.offsetY;
        let id = "node-" + new Date().getTime();
        this.UPDATE_NODE({
          [id]: {
            id: "node-" + new Date().getTime(),
            type: this.selNodeType,
            transform: `translate(${x},${y})`,
            top: y,
            left: x,
            text: ""
          }
        });
      }
    },
    // 鼠标进出透明度变化
    enterArrow(ev) {
      ev.target.style.opacity = 1;
    },
    outArrow(ev) {
      ev.target.style.opacity = 0.5;
    },
    computePolyLine(start, end, direction) {
      let startPoint = {
        x: +start.split(",")[0],
        y: +start.split(",")[1]
      };
      let endPoint = {
        x: +end.split(",")[0],
        y: +end.split(",")[1]
      };
      let m1, m2;
      switch (direction) {
        case "t":
        case "b":
          let mY = startPoint.y + (endPoint.y - startPoint.y) / 2;
          m1 = {
            x: startPoint.x,
            y: mY
          };
          m2 = {
            x: endPoint.x,
            y: mY
          };
          break;
        case "l":
        case "r":
          let mX = startPoint.x + (endPoint.x - startPoint.x) / 2;
          m1 = {
            x: mX,
            y: startPoint.y
          };
          m2 = {
            x: mX,
            y: endPoint.y
          };
          break;
        default:
          break;
      }

      return `${startPoint.x},${startPoint.y} ${m1.x},${m1.y} ${m2.x},${m2.y} ${
        endPoint.x
      },${endPoint.y}`;
    },
    drawLineStart(ev) {
      if (ev.button === 2) {
        this.drawLineEnd();
      }
      this.lineDrawing = true;
      let { id, top, left } = this.selNodeInfo;
      let style = {};
      switch (this.selLineType) {
        case "LinePoly":
          style = {
            points: `${al},${at}`
          };
          break;
        case "StraightLine":
          style = {
            x1: left,
            y1: top,
            x2: left,
            y2: top
          };
          break;
        default:
          break;
      }
      this.drawLineInfo = {
        ...this.drawLineInfo,
        lineStyle: {
          ...style
        },
        type: this.selLineType,
        startNode: id
      };
    },
    drawingLine(ev) {
      let { id, top, left, width, height } = this.selNodeInfo;
      if(this.drawLineInfo.prevNode === id){
        this.drawLineEnd();
        return
      }
      let RA = Math.atan(height / width);
      let x = this.drawLineInfo.lineStyle.x1;
      let y = this.drawLineInfo.lineStyle.y1;
      let versus = Math.abs((y - top) / (x - left));
      switch (this.selLineType) {
        case "LinePoly":
          let startP = this.drawLineInfo.lineStyle.points.split(" ")[0];
          let endP = `${left},${top}`;
          this.drawLineInfo.lineStyle.points = this.computePolyLine(
            startP,
            endP,
            direction
          );
          break;
        case "StraightLine":
          if (Math.atan(versus) > RA) {
            y - top > 0
              ? (this.drawLineInfo.lineStyle.y2 = top + height / 2)
              : (this.drawLineInfo.lineStyle.y2 = top * 1 - height / 2);
            x - left > 0
              ? (this.drawLineInfo.lineStyle.x2 =
                  left * 1 + height / 2 / Math.atan(versus) - 15)
              : (this.drawLineInfo.lineStyle.x2 =
                  left * 1 + height / -2 / Math.atan(versus) + 15);
          } else {
            y - top > 0
              ? (this.drawLineInfo.lineStyle.y2 =
                  top - height / 2 * Math.atan(versus))
              : (this.drawLineInfo.lineStyle.y2 =
                  top * 1 + height / -2 * Math.atan(versus));
            x - left > 0
              ? (this.drawLineInfo.lineStyle.x2 = left * 1 + width / 2)
              : (this.drawLineInfo.lineStyle.x2 = left - width / 2);
          }
          break;
        default:
          break;
      }
      this.drawLineInfo.startNode = id;
      let data = this.deepCopy(this.drawLineInfo);
      let lineId = "line-" + new Date().getTime();
      data.id = lineId;
      this.UPDATE_LINE({
        [lineId]: data
      });

      this.drawLineInfo = {
        ...this.drawLineInfo,
        lineStyle: {
          x1: left,
          y1: top,
          x2: left,
          y2: top
        }
      };
    },
    drawLineEnd() {
      console.log("3");
      this.drawLineInfo = {
        prevNode: "",
        startNode: "",
        type: this.selLineType,
        lineStyle: {}
      };
      this.showArrow = false;
      this.lineDrawing = false;
    },
    updateLine() {
      let { id, left, top, width, height } = this.selNodeInfo;
      let data = {};

      for (var key in this.lineData) {
        if (this.lineData[key].prevNode === id) {
          // 获取开始端口坐标
          let type = this.lineData[key].type;

          switch (type) {
            case "LinePoly":
              let arr = this.lineData[key].lineStyle.points.split(" ");
              let startP = `${left},${top}`;
              let endP = arr[arr.length - 1];
              let points = this.computePolyLine(startP, endP, direction);
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  points
                }
              };
              break;
            case "StraightLine":
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  x1: left,
                  y1: top
                }
              };
              break;
            default:
              break;
          }
        } else if (this.lineData[key].startNode === id) {
          // 获取结束端口坐标
          let type = this.lineData[key].type;
          switch (type) {
            case "LinePoly":
              let arr = this.lineData[key].lineStyle.points.split(" "); //[x1,y1,x2,y2]
              let startP = arr[0];
              let endP = `${left},${top}`;
              let points = this.computePolyLine(startP, endP, direction);
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  points
                }
              };
              break;
            case "StraightLine":
              let RA = Math.atan(height / width);
              let x = this.lineData[key].lineStyle.x1;
              let y = this.lineData[key].lineStyle.y1;
              let versus = Math.abs((y - top) / (x - left));
              let l, t;
              if (Math.atan(versus) > RA) {
                y - top > 0
                  ? (t = top + height / 2)
                  : (t = top * 1 - height / 2);
                x - left > 0
                  ? (l = left * 1 + height / 2 / Math.atan(versus) - 15)
                  : (l = left * 1 + height / -2 / Math.atan(versus) + 15);
              } else {
                y - top > 0
                  ? (t = top - height / 2 * Math.atan(versus))
                  : (t = top * 1 + height / -2 * Math.atan(versus));
                x - left > 0
                  ? (l = left * 1 + width / 2)
                  : (l = left - width / 2);
              }
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  x2: l,
                  y2: t
                }
              };
              break;
            default:
              break;
          }
        }
        this.UPDATE_LINE(data);
      }
    },
    deepCopy(s, t = {}) {
      for (var i in s) {
        if (typeof s[i] === "object") {
          t[i] = s[i].constructor === Array ? [] : {};
          this.deepCopy(s[i], t[i]);
        } else {
          t[i] = s[i];
        }
      }
      return t;
    }
  },
  mounted() {
    this.tar = this.$refs.Cont;
    document.addEventListener("mouseup", ev => {
      if (this.selNodeType) {
        this.SEL_NODETYPE("");
      }
      if (this.showResize || this.showLineSet) {
        this.clickInfo = {};
        this.clickResize = false;
        this.showLineSet = false;
      }
    });
    // 阻止右键事件
    document.addEventListener("keydown", ev => {
      if (this.clickInfo.id) {
        switch (ev.keyCode) {
          case 46:
            let { id } = this.clickInfo;
            let selType = id.replace(/-.*/, "");
            switch (selType) {
              case "node":
                this.deleteNode(id);
                this.clickResize = false;
                break;
              case "line":
                delete this.lineData[id];
                this.UPDATE_NODE(this.lineData);
                this.showLineSet = false;
                this.clickInfo = {};
                break;
              default:
                break;
            }
            break;
          default:
            break;
        }
      }
    });
  }
};
</script>

<style lang="scss">
.flow-main-cont {
  right: 208px;
  top: 34px;
  left: 0;
  bottom: 0;
  touch-action: none;
  overflow: auto;
  background: #ebebeb;
  position: absolute;
  .main-bg {
    overflow: hidden;
    width: 2000px;
    height: 1500px;
    border: 1px solid #cacaca;
    background: url("../../assets/bg.svg") #fff -1px -1px;
    // transform-origin: 50% 50%;
  }
  .shape-text {
    width: 400px;
    margin-left: -200px;
    text-align: center;
    outline: none;
    margin-top: -10px;
  }
  .line-text {
    width: 400px;
    margin-left: -200px;
    text-align: center;
    outline: none;
    margin-top: -10px;
    z-index: 9999;
    cursor: pointer;
  }
  .arrow {
    position: absolute;
    opacity: 0.3;
    z-index: 9999;
    cursor: move;
    // &-bottom {
    //   transform: rotate(-180deg);
    // }
    // &-left {
    //   transform: rotate(-90deg);
    // }
    // &-right {
    //   transform: rotate(90deg);
    // }
    &:hover {
      opacity: 1;
    }
  }
}
</style>