<template>
<div>
  <div id="flowMainCont" class="flow-main-cont" ref="Cont">
    <div style="width:2000px;height:1000px">
      <div 
      id="draw" 
      class="main-bg" 
      :style="{transform:`scale(${drawStyle.zoomRate})`,transformOrigin:`${drawStyle.origin}`}" 
      @drop.prevent="dropHandle" 
      @dragover.stop.prevent 
      @mousewheel.alt.prevent="wheelHandle" 
      >
        <svg id="drawSVG" style="width:2000px; height:1500px; display: block; position: absolute; background-image: none"> 
          <defs>
            <marker id="markerArrow" markerWidth="13" markerHeight="13" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 12 6 L 0 12  L 4 6" style="fill: rgb(0,0,0);" transform="scale(0.8)"></path>
            </marker>
          </defs>
          <foreignObject>
            <div v-show="showArrow && !isDragging" id="arrow" @mouseover="enterArrow" @mouseout="outArrow">
              <img src="~assets/arrow.png" alt="" :style="arrowStyle" class="arrow" draggable="false" data-direction="arrow">
            </div>
          </foreignObject>
          <g id="draw-line" style="cursor:row-resize;">

            <component :is="selLineType" :lineStyle="drawLineInfo.lineStyle" v-if="lineDrawing">
            </component>
            <component v-for="(item,index) in lineData" :text="item.text" :is="item.type" :key="index" :lineStyle="item.lineStyle" :id="item.id" v-line>
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
  <span>{{ mouseCoor }}</span>
  <flow-right :target="tar" @onNewNode="nodeHandle($event)" @onUpdateNode="nodeHandle($event)"></flow-right>
  </div>
</template>

<script>
import shapesMixin from "./shapes/shapesMixin.js";
import flowRight from "./FlowRight";
import { mapState, mapMutations } from "vuex";
import ToolMenu from "./ToolMenu";

export default {
  name: "flowMainCont",
  mixins: [shapesMixin],
  data() {
    return {
      mouseCoor: '',
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
      end: false,
      drawLineInfo: {
        isFirstNode: true,
        prevNode: "",
        startNode: "",
        type: "",
        lineStyle: {}
      },
      editable: false,
      lineDrawing: false,
      linePolyDrawing: false,
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
    flowRight
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
      };
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
          if (ev.button === 2) {
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
        _this.clickElementId = el.id;
        _this.clickInfo = JSON.parse(JSON.stringify(_this.selNodeInfo));
        if (_this.selLineType === "Mouse") {
          clearTimeout(_this.timer);
          _this.UPDATE_NODECOORDINATE({
            x: _this.nodeData[el.id].left,
            y: _this.nodeData[el.id].top
          });
          _this.SEL_NODENAME(ev.target.localName); //传输图形名称
          _this.clickResize = true;
          _this.UPDATE_NODECONTENT(_this.clickInfo.text);
        } else if (_this.selLineType === "StraightLine") {
          // 连线功能
          _this.showArrow = true;
          if (_this.drawLineInfo.startNode === "") {
            _this.drawLineStart(ev);
          } else {
            _this.drawLineInfo.prevNode = _this.drawLineInfo.startNode;
            _this.drawingLine(ev);
          }
        } else if (_this.selLineType === "LinePoly") {
          // 折线功能
          _this.$refs.Cont.addEventListener("mousemove", _this.drawLineStart);
          _this.$refs.Cont.addEventListener("click", _this.drawingLine);
        }
      };
      el.onmouseover = ev => {
        getNodeInfo();
      };
    },
    line(el, binding, vnode) {
      let _this = vnode.context;
      el.oncontextmenu = ev => {
        ev.preventDefault();
        _this.visible = true;
        let x = ev.offsetX;
        let y = ev.offsetY;
        _this.menuInfo.top = `${y}px`;
        _this.menuInfo.left = `${x}px`;
        _this.menuInfo.selType = el.id.replace(/-.*/g, "");
        _this.menuInfo.id = el.id;
      };
      el.onclick = ev => {
        _this.showArrow = false;
        _this.drawLineEnd();
        if (_this.selLineType === "Mouse") {
          _this.SEL_NODENAME(ev.target.localName);
          _this.UPDATE_NODECONTENT(_this.clickInfo.text);
          _this.UPDATE_NODECOORDINATE({
            x: {
              x1: _this.lineData[el.id].lineStyle.x1,
              y1: _this.lineData[el.id].lineStyle.y1
            },
            y: {
              x2: _this.nodeData[_this.lineData[el.id].startNode].left,
              y2: _this.nodeData[_this.lineData[el.id].startNode].top
            }
          });
          _this.clickElementId = el.id;
          _this.clickInfo = _this.deepCopy(_this.lineData[el.id]);
          _this.clickInfo.lineStyle.stroke = "#00a8ff";
          _this.clickInfo.lineStyle["stroke-dasharray"] = "3 3";
          _this.showLineSet = true;
        }
      };
      el.onmousedown = ev => {
        // if (_this.selLineType === "Mouse") {
        //   _this.lineDrawing = true;
        //   _this.drawLineInfo.lineStyle.path = "";
        // }
      };
    }
  },
  methods: {
    ...mapMutations("flow", [
      "SEL_NODENAME",
      "SEL_NODETYPE",
      "UPDATE_NODECOORDINATE",
      "UPDATE_NODECONTENT",
      "UPDATE_NODE",
      "UPDATE_LINE",
      "UPDATE_DRAWSTYLE"
    ]),
    nodeHandle(val) {
      switch (val.act) {
        case "new":
          if (this.selNodeType !== "") {
            let x = val.left;
            let y = val.top;
            let id = "node-" + new Date().getTime();
            this.UPDATE_NODE({
              [id]: {
                id: id,
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
          let id = this.clickElementId;
          if (val.type !== "line") {
            if (this.selNodeType !== "") {
              let x = val.left;
              let y = val.top;
              let coor = { x: val.left, y: val.top };
              this.UPDATE_NODECONTENT(val.content);
              this.UPDATE_NODECOORDINATE(coor);
              this.UPDATE_NODE({
                [id]: {
                  id: id,
                  type: this.selNodeType,
                  transform: `translate(${x},${y})`,
                  top: y,
                  left: x,
                  text: val.content
                }
              });
            }
          } else {
            this.UPDATE_LINE({
              [id]: {
                ...this.lineData[id],
                text: val.content
              }
            });
          }
      }
    },
    deleteNode(id = "", isUpdate = false, ev) {
      for (var key in this.lineData) {
        if (
          this.lineData[key].startNode === id ||
          this.lineData[key].prevNode === id
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
      this.clickResize = false;
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
    drawLineStart(ev) {
      this.lineDrawing = true;
      let { id, top, left, width, height } = this.clickInfo;
      switch (this.selLineType) {
        case "LinePoly":
          this.linePolyDrawing = true;
          let direction, points, l, t;
          if (Math.abs(ev.offsetX - left) - Math.abs(ev.offsetY - top) >= 0) {
            direction = `${ev.offsetX},${top}`;
            ev.offsetX - left > 0
              ? (l = left * 1 + width / 2)
              : (l = left - width / 2);
          } else {
            l = left;
          }
          if (Math.abs(ev.offsetY - top) - Math.abs(ev.offsetX - left) > 0) {
            direction = `${left},${ev.offsetY}`;
            ev.offsetY - top > 0
              ? (t = top * 1 + height / 2)
              : (t = top - height / 2);
          } else {
            t = top;
          }
          points = `${l},${t} ${direction}`;
          this.drawLineInfo = {
            ...this.drawLineInfo,
            lineStyle: {
              points
            },
            type: this.selLineType,
            prevNode: id
          };
          break;
        case "StraightLine":
          let style = {
            x1: left,
            y1: top,
            x2: left,
            y2: top
          };
          this.drawLineInfo = {
            ...this.drawLineInfo,
            lineStyle: {
              ...style
            },
            type: this.selLineType,
            startNode: id
          };
          break;
        default:
          break;
      }
    },
    drawingLine(ev) {
      if (!this.lineDrawing) {
        return;
      }
      let { id, top, left, width, height } = this.selNodeInfo;
      switch (this.selLineType) {
        case "LinePoly":
          if (this.linePolyDrawing) {
            this.$refs.Cont.removeEventListener(
              "mousemove",
              this.drawLineStart
            );
            let arr = this.drawLineInfo.lineStyle.points.split(" ");
            let updatePoints = this.drawLineInfo.lineStyle.points; //string
            let pointsCount = updatePoints.split(" "); //arr
            let direction;
            let update = ev => {
              if (this.linePolyDrawing) {
                // 正交方向判断
                Math.abs(ev.offsetX - arr[arr.length - 1].split(",")[0]) -
                  Math.abs(ev.offsetY - arr[arr.length - 1].split(",")[1]) >=
                0
                  ? (direction = `${ev.offsetX},${
                      arr[arr.length - 1].split(",")[1]
                    }`)
                  : (direction = `${arr[arr.length - 1].split(",")[0]},${
                      ev.offsetY
                    }`);
                this.drawLineInfo = {
                  ...this.drawLineInfo,
                  lineStyle: {
                    points: `${updatePoints} ${
                      arr[arr.length - 1]
                    } ${direction}`
                  }
                };
              }
            };
            if (this.drawLineInfo.prevNode !== id) {
              this.$refs.Cont.removeEventListener("mousemove", update);
              // 目标不为空 fix终点
              let { width, height } = this.clickInfo;
              let { left, top } = this.nodeData[id];
              let l = arr[arr.length - 2].split(",")[0];
              let t = arr[arr.length - 2].split(",")[1];
              let points, resultL, resultT;
              updatePoints = (() => {
                let temp = updatePoints.split(" ");
                temp.splice(-3, 3);
                return temp.join(" ");
              })();
              if (Math.abs(l - left) - Math.abs(t - top) > 0) {
                l - left > 0
                  ? (resultL = left + width / 2)
                  : (resultL = left - width / 2);
                points = `${updatePoints} ${l},${top} ${l},${top} ${resultL},${top}`;
              } else {
                t - top > 0
                  ? (resultT = top + height / 2)
                  : (resultT = top - height / 2);
                points = `${updatePoints} ${left},${t} ${left},${t} ${left},${resultT}`;
              }
              this.drawLineInfo = {
                ...this.drawLineInfo,
                startNode: id,
                lineStyle: {
                  points
                }
              };
              let data = this.deepCopy(this.drawLineInfo);
              let lineId = "line-" + new Date().getTime();
              data.id = lineId;
              this.UPDATE_LINE({
                [lineId]: data
              });
              this.drawLineEnd();
            } else if (pointsCount.length < 8) {
              this.drawLineInfo.lineStyle.points = "";
              this.$refs.Cont.addEventListener("mousemove", update);
            } else {
              this.$refs.Cont.removeEventListener("click", this.drawingLine);
              this.$refs.Cont.removeEventListener("mousemove", update);
              this.drawLineEnd();
            }
          }
          break;
        case "StraightLine" :
          if (this.drawLineInfo.prevNode !== id) {
            this.drawLineEnd();
            return;
          }
          let result = this.equalLineEnd({
            top,
            left,
            height,
            width,
            x: this.drawLineInfo.lineStyle.x1,
            y: this.drawLineInfo.lineStyle.y1
          });
          this.drawLineInfo.lineStyle.y2 = result.t;
          this.drawLineInfo.lineStyle.x2 = result.l;
          this.drawLineInfo.startNode = id;
          this.drawLineInfo.startCoor = { l: left, t: top };
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
          break;
        default:
          break;
      }
    },
    drawLineEnd() {
      this.drawLineInfo = {
        prevNode: "",
        startNode: "",
        type: this.selLineType,
        lineStyle: {}
      };
      this.showArrow = false;
      this.lineDrawing = false;
      this.linePolyDrawing = false;
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
              let arr = this.lineData[key].lineStyle.points.split(" "); //['xxx,xxx', 'xxx,xxx']
              // 与这个点进行比较 arr[arr.length-2]
              let vPoint = arr[2].split(",");
              let updatePoints = (() => {
                let temp = this.lineData[key].lineStyle.points.split(" ");
                temp.splice(0, 3);
                return temp.join(" ");
              })();
              let points;
              if (arr[2].split(",")[0] === arr[3].split(",")[0]) {
                left - vPoint[0] > 0
                  ? (points = `${left - width / 2},${top} ${vPoint[0]},${top} ${vPoint[0]},${top} ${updatePoints}`)
                  : (points = `${left + width / 2},${top} ${vPoint[0]},${top} ${vPoint[0]},${top} ${updatePoints}`);
              } else if (arr[2].split(",")[1] === arr[3].split(",")[1]) {
                top - vPoint[1] > 0
                  ? (points = `${left},${top - height / 2} ${left},${vPoint[1]} ${left},${vPoint[1]} ${updatePoints}`)
                  : (points = `${left},${top + height / 2} ${left},${vPoint[1]} ${left},${vPoint[1]} ${updatePoints}`);
              }
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  points
                }
              };
              break;
            case "StraightLine":
              let result = this.equalLineEnd({
                height,
                width,
                top: this.lineData[key].startCoor.t,
                left: this.lineData[key].startCoor.l,
                x: left,
                y: top
              });
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  x1: left,
                  y1: top,
                  x2: result.l,
                  y2: result.t
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
              let arr = this.lineData[key].lineStyle.points.split(" "); //['xxx,xxx', 'xxx,xxx']
              // 与这个点进行比较 arr[arr.length-2]
              let vPoint = arr[arr.length - 3].split(",");
              let updatePoints = (() => {
                let temp = this.lineData[key].lineStyle.points.split(" ");
                temp.splice(-3);
                return temp.join(" ");
              })();
              let points;
              console.log(arr[arr.length - 1].split(",")[0])
              if (arr[arr.length - 3].split(",")[0] === arr[arr.length - 4].split(",")[0]) {
                left - vPoint[0] > 0
                  ? (points = `${updatePoints} ${vPoint[0]},${top} ${vPoint[0]},${top} ${left - width / 2},${top}`)
                  : (points = `${updatePoints} ${vPoint[0]},${top} ${vPoint[0]},${top} ${left + width / 2},${top}`);
              } else if (arr[1].split(",")[1] === arr[2].split(",")[1]) {
                top - vPoint[1] > 0
                  ? (points = `${updatePoints} ${left},${vPoint[1]} ${left},${vPoint[1]} ${left},${top - height / 2}`)
                  : (points = `${updatePoints} ${left},${vPoint[1]} ${left},${vPoint[1]} ${left},${top + height / 2}`);
              }
              data[key] = {
                ...this.lineData[key],
                lineStyle: {
                  points
                }
              };
              break;
            case "StraightLine":
              let result = this.equalLineEnd({
                height,
                width,
                top,
                left,
                x: this.lineData[key].lineStyle.x1,
                y: this.lineData[key].lineStyle.y1
              });
              data[key] = {
                ...this.lineData[key],
                startCoor: { l: result.l, t: result.t },
                lineStyle: {
                  ...this.lineData[key].lineStyle,
                  x2: result.l,
                  y2: result.t
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
    },
    equalLineEnd(opt) {
      let { x, y, height, width, top, left } = opt;
      let RA = Math.atan(height / width);
      let versus = Math.abs((y - top) / (x - left));
      let l, t;
      if (Math.atan(versus) > RA) {
        y - top > 0 ? (t = top + height / 2) : (t = top * 1 - height / 2);
        x - left > 0
          ? (l = left * 1 + height / 2 / Math.atan(versus) - 15)
          : (l = left * 1 + height / -2 / Math.atan(versus) + 15);
      } else {
        y - top > 0
          ? (t = top - height / 2 * Math.atan(versus))
          : (t = top * 1 + height / -2 * Math.atan(versus));
        x - left > 0 ? (l = left * 1 + width / 2) : (l = left - width / 2);
      }
      return { l, t };
    }
  },
  mounted() {
    this.tar = this.$refs.Cont;
    this.$refs.Cont.addEventListener("mousemove", ev => {
      this.mouseCoor = `${ev.offsetX},${ev.offsetY}`
    });
    document.addEventListener("mouseup", ev => {
      if (
        this.selLineType === "StraightLine" &&
        ev.target.localName === "svg" &&
        this.lineDrawing
      ) {
        this.drawLineEnd();
      }
      if (this.selNodeType) {
        this.SEL_NODETYPE("");
      }
      if (this.clickResize || this.showLineSet) {
        this.clickInfo = {};
        this.clickResize = false;
        this.showArrow = false;
        this.showLineSet = false;
      }
    });
    document.addEventListener("contextmenu", ev => {
      ev.preventDefault();
    });
    // 阻止右键事件button
    document.addEventListener("keydown", ev => {
      switch (ev.keyCode) {
        case 46:
          if (this.clickInfo.id) {
            let { id } = this.clickInfo;
            let selType = id.replace(/-.*/, "");
            if (selType === "node") {
              this.deleteNode(id);
              this.clickResize = false;
            } else {
              //line
              delete this.lineData[id];
              this.UPDATE_NODE(this.lineData);
              this.showLineSet = false;
              this.clickInfo = {};
            }
          }
          break;
        case 27:
          if (this.lineDrawing && this.selLineType === "LinePoly") {
            this.drawLineEnd();
            this.$refs.Cont.removeEventListener;
          }
          break;
        default:
          break;
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
    &:hover {
      opacity: 1;
    }
  }
}
</style>

<style scoped>
span{
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 9999;
}
</style>
