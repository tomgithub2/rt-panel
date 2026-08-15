// 体检中心：一键全面健康检查
import api from '../api.js'
import { fmtTime } from '../util.js'

export default {
  data() {
    return { loading: false, report: null, timer: null }
  },
  mounted() { this.run() },
  beforeUnmount() { clearInterval(this.timer) },
  methods: {
    fmtTime,
    async run() {
      this.loading = true
      try {
        this.report = await api.get('/healthcheck/run')
      } catch (e) {} finally { this.loading = false }
    },
    scoreColor(s) {
      return s >= 90 ? 'var(--success)' : s >= 75 ? 'var(--warning)' : 'var(--danger)'
    },
    circleStyle() {
      const s = this.report?.score ?? 0
      return {
        background: `conic-gradient(${this.scoreColor(s)} ${s * 3.6}deg, var(--bg-elevated) 0deg)`,
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))',
        webkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))',
      }
    },
  },
  render: (function(){ const { resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, createTextVNode: _createTextVNode, createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, normalizeStyle: _normalizeStyle, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, createBlock: _createBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = {
  key: 0,
  style: {"display":"flex","gap":"20px","align-items":"center","flex-wrap":"wrap","margin-bottom":"20px"}
}
const _hoisted_6 = { style: {"flex":"1","min-width":"260px"} }
const _hoisted_7 = { style: {"color":"var(--text-regular)","margin-top":"8px","line-height":"1.9"} }
const _hoisted_8 = { style: {"color":"var(--success)"} }
const _hoisted_9 = { style: {"color":"var(--danger)"} }

return function render(_ctx, _cache) {
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[1] || (_cache[1] = _createTextVNode("一键体检 ", -1 /* CACHED */)),
        _createVNode(_component_el_button, {
          size: "small",
          type: "primary",
          style: {"margin-left":"auto"},
          loading: _ctx.loading,
          onClick: _ctx.run
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Refresh)
              ]),
              _: 1 /* STABLE */
            }),
            _cache[0] || (_cache[0] = _createTextVNode(" 重新体检 ", -1 /* CACHED */))
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["loading", "onClick"])
      ]),
      _createElementVNode("div", _hoisted_4, [
        (_ctx.report)
          ? (_openBlock(), _createElementBlock("div", _hoisted_5, [
              _createElementVNode("div", {
                style: _normalizeStyle([_ctx.circleStyle(), {"width":"120px","height":"120px","border-radius":"50%","display":"flex","flex-direction":"column","align-items":"center","justify-content":"center","flex-shrink":"0","border":"6px solid transparent"}])
              }, [
                _createElementVNode("div", {
                  style: _normalizeStyle([{"font-size":"34px","font-weight":"800"}, {color: _ctx.scoreColor(_ctx.report.score)}])
                }, _toDisplayString(_ctx.report.score), 5 /* TEXT, STYLE */),
                _cache[2] || (_cache[2] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px"} }, "健康评分", -1 /* CACHED */))
              ], 4 /* STYLE */),
              _createElementVNode("div", _hoisted_6, [
                _createElementVNode("div", {
                  style: _normalizeStyle([{"font-size":"22px","font-weight":"700"}, {color: _ctx.scoreColor(_ctx.report.score)}])
                }, " 系统状态：" + _toDisplayString(_ctx.report.level), 5 /* TEXT, STYLE */),
                _createElementVNode("div", _hoisted_7, [
                  _createTextVNode(" 共检查 " + _toDisplayString(_ctx.report.total) + " 项 ｜ ", 1 /* TEXT */),
                  _createElementVNode("b", _hoisted_8, _toDisplayString(_ctx.report.passed) + " 项通过", 1 /* TEXT */),
                  _cache[3] || (_cache[3] = _createTextVNode(" ｜ ", -1 /* CACHED */)),
                  _createElementVNode("b", _hoisted_9, _toDisplayString(_ctx.report.failed) + " 项需关注", 1 /* TEXT */),
                  _cache[4] || (_cache[4] = _createElementVNode("br", null, null, -1 /* CACHED */)),
                  _createTextVNode(" 体检时间：" + _toDisplayString(_ctx.fmtTime(_ctx.report.ts)), 1 /* TEXT */)
                ])
              ])
            ]))
          : _createCommentVNode("v-if", true),
        (_ctx.report)
          ? (_openBlock(), _createBlock(_component_el_table, {
              key: 1,
              data: _ctx.report.checks,
              size: "small"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  label: "状态",
                  width: "90"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_tag, {
                      size: "small",
                      type: s.row.ok ? 'success' : 'danger'
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(s.row.ok ? '通过' : '关注'), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_table_column, {
                  prop: "item",
                  label: "检查项",
                  width: "200"
                }),
                _createVNode(_component_el_table_column, {
                  prop: "detail",
                  label: "详情",
                  "min-width": "220",
                  "show-overflow-tooltip": ""
                }),
                _createVNode(_component_el_table_column, {
                  prop: "suggestion",
                  label: "建议",
                  "min-width": "240",
                  "show-overflow-tooltip": ""
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"]))
          : _createCommentVNode("v-if", true)
      ])
    ])
  ]))
} })()
}
