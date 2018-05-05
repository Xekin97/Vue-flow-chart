<template>
  <g v-bind="svgTransform">
    <slot></slot>
    <g transform="translate(0.5,0.5)">
      <ellipse v-bind="style"></ellipse>
    </g>
    <foreignObject :pointer-events="editable ? 'all': 'none'" v-if="inDraw">
      <div contenteditable="plaintext-only" class="shape-text">
        {{text}}
      </div>
    </foreignObject>
  </g>
</template>

<script>
import tplMixin from './tplMixin'
export default {
  name: 'start',
  mixins: [tplMixin],
  data () {
    return {
      defaultStyle: {
        cx: '18',
        cy: '18',
        rx: '15',
        ry: '9',
        fill: '#fff',
        stroke: '#000',
        'stroke-width': 1,
        'cursor': 'move'
      },
      drawStyle: {
        rx: '50',
        ry: '30',
        cx: '0',
        cy: '0'
      }
    }
  }
}
</script>