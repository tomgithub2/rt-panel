// 日志管理
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return { sources: [], active: 'audit', data: null, search: '', lines: 200, tailFile: '' }
  },
  mounted() { this.loadSources(); this.load() },
  methods: {
    fmtTime, hasPerm,
    async loadSources() {
      try { this.sources = (await api.get('/logs/sources')).list } catch (e) {}
    },
    async load() {
      try {
        this.data = await api.get('/logs/read', { params: { key: this.active, lines: this.lines, search: this.search } })
      } catch (e) {}
    },
    switchSource(key) { this.active = key; this.load() },
    async tail() {
      if (!this.tailFile) return this.$message.warning('请输入日志文件路径')
      try {
        const r = await api.get('/logs/tail', { params: { path: this.tailFile, lines: 200 } })
        this.data = { type: 'raw', content: r.content }
      } catch (e) {}
    },
    async clearAudit() {
      try {
        await this.$confirm('清空面板审计日志？', '确认', { type: 'warning' })
        await api.delete('/logs/audit')
        this.$message.success('已清空')
        this.load()
      } catch (e) {}
    },
  },
  render: (function(){ const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, createElementVNode: _createElementVNode, renderList: _renderList, Fragment: _Fragment, createBlock: _createBlock, withKeys: _withKeys, toDisplayString: _toDisplayString } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = {
  key: 0,
  style: {"margin-left":"auto","display":"flex","gap":"8px"}
}
const _hoisted_5 = { class: "card-body" }
const _hoisted_6 = {
  class: "op-toolbar",
  style: {"margin-bottom":"12px"}
}
const _hoisted_7 = {
  key: 1,
  style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"14px","height":"520px","overflow":"auto","font-size":"12px","margin":"0","white-space":"pre-wrap","word-break":"break-all"}
}

return function render(_ctx, _cache) {
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_input = _resolveComponent("el-input")
  const _component_Search = _resolveComponent("Search")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[5] || (_cache[5] = _createTextVNode("日志管理 ", -1 /* CACHED */)),
        (_ctx.hasPerm('logs:clear'))
          ? (_openBlock(), _createElementBlock("div", _hoisted_4, [
              _createVNode(_component_el_button, {
                size: "small",
                type: "danger",
                plain: "",
                onClick: _ctx.clearAudit
              }, {
                default: _withCtx(() => [...(_cache[4] || (_cache[4] = [
                  _createTextVNode("清空审计日志", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"])
            ]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_select, {
            modelValue: _ctx.active,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.active) = $event)),
            style: {"width":"230px"},
            onChange: _ctx.switchSource
          }, {
            default: _withCtx(() => [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.sources, (s) => {
                return (_openBlock(), _createBlock(_component_el_option, {
                  key: s.key,
                  label: s.name,
                  value: s.key
                }, null, 8 /* PROPS */, ["label", "value"]))
              }), 128 /* KEYED_FRAGMENT */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"]),
          _createVNode(_component_el_input, {
            modelValue: _ctx.search,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.search) = $event)),
            placeholder: "搜索（仅面板日志）",
            style: {"width":"220px"},
            clearable: "",
            onKeyup: _withKeys(_ctx.load, ["enter"])
          }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
          _createVNode(_component_el_select, {
            modelValue: _ctx.lines,
            "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.lines) = $event)),
            style: {"width":"110px"},
            onChange: _ctx.load
          }, {
            default: _withCtx(() => [
              (_openBlock(), _createElementBlock(_Fragment, null, _renderList([100, 200, 500, 1000], (n) => {
                return _createVNode(_component_el_option, {
                  label: '最近 ' + n + ' 条',
                  value: n,
                  key: n
                }, null, 8 /* PROPS */, ["label", "value"])
              }), 64 /* STABLE_FRAGMENT */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"]),
          _createVNode(_component_el_button, { onClick: _ctx.load }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Search)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"]),
          _cache[7] || (_cache[7] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
          _createVNode(_component_el_input, {
            modelValue: _ctx.tailFile,
            "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.tailFile) = $event)),
            placeholder: "任意日志文件路径 tail",
            style: {"width":"240px"},
            onKeyup: _withKeys(_ctx.tail, ["enter"])
          }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
          _createVNode(_component_el_button, { onClick: _ctx.tail }, {
            default: _withCtx(() => [...(_cache[6] || (_cache[6] = [
              _createTextVNode("Tail", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ]),
        (_ctx.data?.type === 'table')
          ? (_openBlock(), _createBlock(_component_el_table, {
              key: 0,
              data: _ctx.data.rows,
              size: "small",
              height: "520"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  label: "时间",
                  width: "165"
                }, {
                  default: _withCtx((s) => [
                    _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.ts)), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.data.cols.slice(1), (c, i) => {
                  return (_openBlock(), _createBlock(_component_el_table_column, {
                    key: i,
                    label: c,
                    prop: Object.keys(_ctx.data.rows[0] || {})[i+1],
                    "min-width": "120",
                    "show-overflow-tooltip": ""
                  }, {
                    default: _withCtx((s) => [
                      (c === '结果')
                        ? (_openBlock(), _createBlock(_component_el_tag, {
                            key: 0,
                            size: "small",
                            type: s.row.ok ? 'success' : 'danger'
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(s.row.ok ? '成功' : '失败'), 1 /* TEXT */)
                            ]),
                            _: 2 /* DYNAMIC */
                          }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"]))
                        : (c === '级别')
                          ? (_openBlock(), _createBlock(_component_el_tag, {
                              key: 1,
                              size: "small",
                              type: s.row.level === 'warning' ? 'warning' : 'info'
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(s.row.level), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"]))
                          : (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                              _createTextVNode(_toDisplayString(s.row[Object.keys(s.row)[i+1]]), 1 /* TEXT */)
                            ], 64 /* STABLE_FRAGMENT */))
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["label", "prop"]))
                }), 128 /* KEYED_FRAGMENT */))
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"]))
          : (_ctx.data?.type === 'raw')
            ? (_openBlock(), _createElementBlock("pre", _hoisted_7, _toDisplayString(_ctx.data.content), 1 /* TEXT */))
            : _createCommentVNode("v-if", true)
      ])
    ])
  ]))
} })()
}
