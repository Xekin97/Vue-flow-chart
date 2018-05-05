// MyVueTest SVG组件 剖析优化方案

// 入口文件
/main.js ==> `全局注册了 icon 组件`
/router/index.js   ==>  views/flow/Flow.vue

Flow.vue ==> conponents { FlowHeader FlowLeftTool FlowMainCont FlowRight FlowTopTool }

// 组件交互

# FlowHeader 头部组件 单文件组件，无与其它组件交互，没有数据流动
# FlowLeftTool 左侧工具栏
// 数据
[ mapMutation, mapState ] from 'vuex'
shapesMixin from './shapes/shapesMixin.js'

// SVG 绘画组件 mixins
shapesMixin ==> conponents { Start, StraightLine, LinePoly, General, Decision } 

# FlowMainCont 中间画布 (主执行文件)
大小 width:2000px height: 1000px
// 数据
[ mapMutation, mapState ] from 'vuex'
shapesMixin from './shapes/shapesMixin.js'

ToolMenu from './ToolMenu' 

// 流程

创建 ==> 点击事件 ==> 拖拽 ==> 拖拽回调 ==> 更新节点 ==> 响应数据
重渲染 ==> 传递渲染参数 ==> 复制原节点并传入参数 ==> 删除原节点

组件数据:
// 节点相关
      isDragging: false,
      selNodeInfo: {},
      showArrow: false,
      showResize: false,
      showLineSet: false,
      clickInfo: {},
// Store 数据
      nodeName: '',
      nodeCoordinate: {},
      nodeContent:'',
      selNodeType: '',
      nodeData: {},
      lineData: {},
      drawStyle: {
        zoomRate: 1 
      },
      selLineType: 'StraightLine',
      historyLength: 0,
      historyIndex: 0
// selNodeInfo 临时数据存储
      height
      id
      left
      text
      top
      transform
      type
      width
// clickInfo 复制临时数据存储当前点击对象 
// nodeData 数据 存储cont中当前id的数据
      id: 
         id
         left
         text
         top
         transform
         type

// lineData 数据 存储 line 数据
      id:
         id,
         isFirstNode,
         lineStyle:{x1,x2,y1,y2}
         prevNode
         StartNode

Cont ==> FlowRight
点击事件
    Cont点击 响应创建时的数据传递给 FlowRight
拖拽事件
    拖拽完成后 响应当前数据

连线功能设计
    使用直线点击图形节点触发连线(每一回都点击)
 "drawLineStart" 
    设置 this.showArrow 设置为 true 标志连接开始
    存储当前节点中心位置（即连线起点）
  "drawingLine" 
    判断画布是否触发点击事件，触发则进入end阶段；
    判断终点节点是否和前一个节点位置相同，若相同则进入end阶段；
    若不同，则记录当前节点中心位置，并连接前一个节点中心点
  "drawLineEnd" 
    将 this.showArrow 设置为 false 标志连接结束
    将连线数据深拷贝保存，清除drawInfo
FlowRight ==> Cont

折线：折线功能不应为固定方向的折线，这点应该由用户决定，个人想法为结合上述直线功能，我们在做折线的时候一是需要在使用折线的时候只能提供上下左右四个方向的直线位移，二是通过用户点击，选择折线转折点，折线连接目标节点时不会指向节点中心坐标






##  ToolMenu 子组件
    // 传值
    props: 
    visible 可视(Boo) 
    menuData 菜单数据(Arr) 这里从画布传入的是一个只有 title: '删除' 的对象
    ulStyle 列表样式(Str)
    // 组件内容
    渲染 menuData 列表
    // 原理
    利用 sync 修饰符和父组件进行双向数据绑定，由内部方法向外 emit visible 控制开关

# FlowTopTool Top选择栏 (工具列表组件)
// 数据 
ToolMenu from './ToolMenu' 这里传入的 menuData 为百分比title对象

[ mapMutation, mapState ] from 'vuex' 
shapesMixin from './shapes/shapesMixin.js'
// `双向绑定 vuex 数据流传输的数据`
computed { this.drawStyle.zoomRate historyLength historyIndex }

使用 `...mapmutation` commit 给 Mutation commit 对应参数传输的方法
methods { 'flow',['SEL_LINETYPE', 
                'UPDATE_DRAWSTYLE', 
                'UNDO', 'REDO'] 
                toolDelegate(event) }

// 原理
与 store 中的数据绑定,通过在渲染函数map每个节点

// 主要参数 topTool 中的对象格式{ type title icon size separator event }

//渲染结构
labelCont,iconCont ===> items
items 为 topTool 的每一个对象

# FlowRight 信息栏（属性栏）
// 数据
{mapState} from 'vuex' 主要获取数据为 store 里的 nodeData 和 lineData
// 使用
将 nodeData 和 lineData 绑定在右侧数据栏中的 textarea 中


# SVG 实现
// icon.js shapesMixin


# Vuex store 数据
// 引入 
/store/index.js 主 store 入口文件
plugin: [undoRedoPlugin]   撤销重做方法组件
modules: flow.js 引入flowjs模块

// 使用
在 index.js 中使用 store.subscribe 监听 Mutation 和 state
定义 UPDATE_NODE 和 UPDATE_LINE


/store/flow.js store 数据文件 state mutation 
state 数据初始化      state{ selNodeType nodeData lineData 
                            drawStyle{ zoomRate } 
                            selLineType historyLength historyIndex }

                
mutation 动态异步传输方法
    SEL_NODETYPE ===> 将 selNodeType 存为 value 值 
    SEL_LINETYPE ===> 将 selLineType 存为 value 值  传入的 val 为字符串String

    UPDATE_DRAWSTYLE   
    UPDATE_NODE 
    UPDATE_LINE
    ===> state.drawStyle state.nodeData state.lineData 更新 传入的val 为对象

    UPDATE_HISTORY ===> 将 state.historyLength 存为 value 值 
    UPDATE_HISTORYINDEX ===> 将 state.historyIndex 存为 value 值 

    UNDO
    REDO
