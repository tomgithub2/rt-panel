// Created by 小杜 on 2026/08

// 体检中心：一键全面健康检查
// 版式：英雄卡（SVG 评分环 + 结论 + 统计 + 复检按钮）→ 需关注项清单（带去处理）
//      → 全部检查项紧凑网格（通过项不再占一行表格）
import api from '../api.js'
import { fmtTime } from '../util.js'

const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

// 常见问题的处理入口：点"去处理"直接跳到对应页面
const FIX_ROUTES = [
  [/防火墙/, '/firewall'],
  [/源码完整性|SSL|证书/, '/security'],
  [/登录安全/, '/logs'],
  [/默认密码|面板版本|账户绑定/, '/settings'],
  [/计划任务/, '/cron'],
  [/备份/, '/backups'],
  [/磁盘|内存|交换|CPU/, '/monitor'],
]

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
    ringDash() { return RING_C },
    ringOffset() {
      const s = Math.max(0, Math.min(100, (this.report && this.report.score) || 0))
      return RING_C * (1 - s / 100)
    },
    problems() {
      const list = (this.report && this.report.checks) || []
      return list.filter((c) => !c.ok)
    },
    okList() {
      const list = (this.report && this.report.checks) || []
      return list.filter((c) => c.ok)
    },
    fixRoute(item) {
      for (const [re, path] of FIX_ROUTES) if (re.test(item || '')) return path
      return ''
    },
    go(path) {
      if (path && this.$router) this.$router.push(path)
    },
  },
  render: (function(){ const { resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, createTextVNode: _createTextVNode, createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, normalizeStyle: _normalizeStyle, normalizeClass: _normalizeClass, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, createBlock: _createBlock, renderList: _renderList, Fragment: _Fragment } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card hc-hero" }
const _hoisted_3 = { class: "hc-gauge" }
const _hoisted_4 = { class: "hc-ring", viewBox: "0 0 120 120" }
const _hoisted_5 = { cx: "60", cy: "60", r: "52", class: "hc-ring-bg" }
const _hoisted_6 = { cx: "60", cy: "60", r: "52", class: "hc-ring-fg" }
const _hoisted_7 = { class: "hc-score" }
const _hoisted_8 = { class: "hc-head" }
const _hoisted_9 = { class: "hc-title" }
const _hoisted_10 = { class: "hc-meta" }
const _hoisted_11 = { class: "hc-chips" }
const _hoisted_12 = { class: "hc-chip is-ok" }
const _hoisted_13 = { class: "hc-chip is-bad" }
const _hoisted_14 = { class: "hc-chip" }
const _hoisted_15 = { class: "op-card" }
const _hoisted_16 = { class: "card-title" }
const _hoisted_17 = { class: "card-body hc-list" }
const _hoisted_18 = { class: "hc-list-item is-bad" }
const _hoisted_19 = { class: "hc-li-main" }
const _hoisted_20 = { class: "hc-li-name" }
const _hoisted_21 = { class: "hc-li-detail" }
const _hoisted_22 = { class: "hc-li-tip" }
const _hoisted_23 = { class: "op-card" }
const _hoisted_24 = { class: "card-title" }
const _hoisted_25 = { class: "card-body hc-grid" }

return function render(_ctx, _cache) {
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    // ---------- 英雄卡：评分环 + 结论 + 统计 + 复检 ----------
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("svg", _hoisted_4, [
          _createElementVNode("circle", _hoisted_5, null, -1 /* CACHED */),
          _createElementVNode("circle", {
            cx: "60", cy: "60", r: "52", class: "hc-ring-fg",
            style: _normalizeStyle({
              stroke: _ctx.scoreColor(_ctx.report ? _ctx.report.score : 0),
              strokeDasharray: _ctx.ringDash(),
              strokeDashoffset: _ctx.ringOffset()
            })
          }, null, 4 /* STYLE */)
        ]),
        _createElementVNode("div", _hoisted_7, [
          _createElementVNode("b", {
            style: _normalizeStyle({ color: _ctx.scoreColor(_ctx.report ? _ctx.report.score : 0) })
          }, _toDisplayString(_ctx.report ? _ctx.report.score : '--'), 5 /* TEXT, STYLE */),
          _cache[0] || (_cache[0] = _createElementVNode("span", null, "健康评分", -1 /* CACHED */))
        ])
      ]),
      _createElementVNode("div", _hoisted_8, [
        _createElementVNode("div", _hoisted_9, [
          _createTextVNode("系统状态：", -1 /* CACHED */),
          _createElementVNode("b", {
            style: _normalizeStyle({ color: _ctx.scoreColor(_ctx.report ? _ctx.report.score : 0) })
          }, _toDisplayString(_ctx.report ? _ctx.report.level : '检查中…'), 5 /* TEXT, STYLE */)
        ]),
        _createElementVNode("div", _hoisted_10, [
          (_ctx.report)
            ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                _createTextVNode(" 体检时间 " + _toDisplayString(_ctx.fmtTime(_ctx.report.ts)) + " ｜ 共检查 " + _toDisplayString(_ctx.report.total) + " 项 ", 1 /* TEXT */)
              ], 64 /* STABLE_FRAGMENT */))
            : _createCommentVNode("v-if", true)
        ]),
        _createElementVNode("div", _hoisted_11, [
          _createElementVNode("span", _hoisted_12, [
            _cache[1] || (_cache[1] = _createTextVNode("通过 ", -1 /* CACHED */)),
            _createElementVNode("b", null, _toDisplayString(_ctx.report ? _ctx.report.passed : 0), 1 /* TEXT */)
          ]),
          _createElementVNode("span", _hoisted_13, [
            _cache[2] || (_cache[2] = _createTextVNode("需关注 ", -1 /* CACHED */)),
            _createElementVNode("b", null, _toDisplayString(_ctx.report ? _ctx.report.failed : 0), 1 /* TEXT */)
          ]),
          _createElementVNode("span", _hoisted_14, [
            _cache[3] || (_cache[3] = _createTextVNode("检查项 ", -1 /* CACHED */)),
            _createElementVNode("b", null, _toDisplayString(_ctx.report ? _ctx.report.total : 0), 1 /* TEXT */)
          ])
        ])
      ]),
      _createVNode(_component_el_button, {
        type: "primary",
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
          _cache[4] || (_cache[4] = _createTextVNode(" 一键体检 ", -1 /* CACHED */))
        ]),
        _: 1 /* STABLE */
      }, 8 /* PROPS */, ["loading", "onClick"])
    ]),
    // ---------- 需关注项：只列问题，带处理入口 ----------
    (_ctx.problems().length)
      ? (_openBlock(), _createElementBlock("div", { key: 0, class: "op-card" }, [
          _createElementVNode("div", _hoisted_16, [
            _createTextVNode(" 需关注 " + _toDisplayString(_ctx.problems().length) + " 项 ", 1 /* TEXT */)
          ]),
          _createElementVNode("div", _hoisted_17, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.problems(), (c) => {
              return (_openBlock(), _createElementBlock("div", {
                class: "hc-list-item is-bad",
                key: c.item
              }, [
                _createElementVNode("div", _hoisted_19, [
                  _createElementVNode("div", _hoisted_20, _toDisplayString(c.item), 1 /* TEXT */),
                  _createElementVNode("div", _hoisted_21, _toDisplayString(c.detail), 1 /* TEXT */)
                ]),
                _createElementVNode("div", _hoisted_22, _toDisplayString(c.suggestion), 1 /* TEXT */),
                _ctx.fixRoute(c.item)
                  ? (_openBlock(), _createElementBlock("span", {
                      key: 0,
                      class: "hc-go",
                      onClick: $event => (_ctx.go(_ctx.fixRoute(c.item)))
                    }, " 去处理 › ", 8 /* PROPS */, ["onClick"]))
                  : _createCommentVNode("v-if", true)
              ]))
            }), 128 /* KEYED_FRAGMENT */))
          ])
        ]))
      : _createCommentVNode("v-if", true),
    // ---------- 全部检查项：紧凑网格（图标 + 名称 + 详情） ----------
    (_ctx.report)
      ? (_openBlock(), _createElementBlock("div", { key: 1, class: "op-card" }, [
          _createElementVNode("div", _hoisted_24, [
            _createTextVNode(" 全部检查项 " + _toDisplayString(_ctx.report.total) + " 项 ", 1 /* TEXT */)
          ]),
          _createElementVNode("div", _hoisted_25, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.report.checks, (c) => {
              return (_openBlock(), _createElementBlock("div", {
                class: _normalizeClass(["hc-item", { 'is-bad': !c.ok }]),
                key: c.item
              }, [
                _createElementVNode("span", { class: "hc-dot" }, null, -1 /* CACHED */),
                _createElementVNode("div", null, [
                  _createElementVNode("div", { class: "hc-item-name" }, _toDisplayString(c.item), 1 /* TEXT */),
                  _createElementVNode("div", { class: "hc-item-detail" }, _toDisplayString(c.detail), 1 /* TEXT */)
                ])
              ], 2 /* CLASS */))
            }), 128 /* KEYED_FRAGMENT */))
          ])
        ]))
      : _createCommentVNode("v-if", true)
  ]))
} })()
}
