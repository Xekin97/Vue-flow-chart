<template>
  <g v-bind="gStyle">
    <slot></slot>
    <g>
      <polyline v-bind="shadowStyle" />
      <polyline v-bind="style" />
    </g>
    <foreignObject :pointer-events="editable ? 'all': 'none'" :transform="textStyle">
      <div contenteditable="plaintext-only" class="line-text">
        {{text}}
      </div>
    </foreignObject>
  </g>
</template>

<script>
export default {
  name: 'LinePoly',
  data () {
    return {
      defaultStyle: {
        points: '',
        stroke: '#333',
        'stroke-width': 1.2,
        'fill': 'none',
        'marker-end': 'url(#markerArrow)'
      },
      defaultShadow: {
        'stroke-width': 15,
        'visibility': 'hidden',
        'pointer-events': 'stroke',
        'marker-end': ''
      }
    }
  },
  computed: {
    svgTransform () {
      let obj = {
        transform: this.transform
      }
      return obj
    },
    textStyle () {
      let points = this.lineStyle.points
      if (points) {
        let arr = points.split(' ')
        let m1 = arr[0].split(',')
        let m2 = arr[1].split(',')
        let x1 = +m1[0]
        let y1 = +m1[1]
        let x2 = +m2[0]
        let y2 = +m2[1]
        let x, y
        if (y1 === y2) {
          y = y1 - 10
        } else {
          y = +((y2 + y1) / 2)
        }
        if (x1 === x2) {
          x = x1
        } else {
          x = +(x1 + x2)/2
        }
        return `translate(${x},${y})`
      }
    },
    style () {
      return Object.assign({}, this.defaultStyle, this.lineStyle)
    },
    shadowStyle () {
      return Object.assign({}, this.defaultStyle, this.defaultShadow, this.lineStyle)
    }
  },
  props: {
    lineStyle: {
      type: Object
    },
    gStyle: {
      type: Object
    },
    editable: {
      type: Boolean
    },
    text: {
      type: String
    }
  }
}
</script>