// 服务管理（Windows 服务 / systemd）
import api from '../api.js'
import { hasPerm } from '../util.js'

export default {
  data() {
    return { list: [], search: '', error: '', statusFilter: '', timer: null,
             detail: { show: false, name: '', raw: '' } }
  },
  mounted() { this.load(); this.timer = setInterval(() => this.load(), 20000) },
  beforeUnmount() { clearInterval(this.timer) },
  computed: {
    filtered() {
      return this.list.filter(s => {
        const okSearch = !this.search || s.name.includes(this.search) || (s.display || '').includes(this.search)
        const okStatus = !this.statusFilter || s.status === this.statusFilter
        return okSearch && okStatus
      })
    },
  },
  methods: {
    hasPerm,
    async load() {
      try {
        const r = await api.get('/services/list')
        this.list = r.list || []
        this.error = r.error || ''
      } catch (e) {}
    },
    statusType(st) {
      return { running: 'success', active: 'success', stopped: 'danger', inactive: 'danger',
               failed: 'danger', exited: 'warning', dead: 'info', paused: 'warning' }[st] || 'info'
    },
    statusText(st) {
      const map = { running: '运行中', active: '运行中', stopped: '已停止', inactive: '已停止',
                    failed: '失败', exited: '已退出', dead: '失效', paused: '已暂停' }
      return map[st] || st
    },
    async action(row, act) {
      const names = { start: '启动', stop: '停止', restart: '重启', reload: '重载', enable: '启用自启', disable: '禁用自启' }
      try {
        await this.$confirm(`确定对服务 ${row.name} 执行「${names[act]}」？`, '服务操作', { type: act === 'stop' || act === 'disable' ? 'warning' : 'info' })
        await api.post('/services/action', { name: row.name, action: act })
        this.$message.success('操作完成')
        setTimeout(() => this.load(), 1500)
      } catch (e) {}
    },
    async showDetail(row) {
      try {
        const r = await api.get(`/services/status/${encodeURIComponent(row.name)}`)
        this.detail = { show: true, name: row.name, raw: r.raw }
      } catch (e) {}
    },
  },
  render: (function(){ const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createVNode: _createVNode, withCtx: _withCtx, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_5 = { class: "card-body" }
const _hoisted_6 = {
  class: "op-toolbar",
  style: {"margin-bottom":"10px"}
}
const _hoisted_7 = { style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"14px","max-height":"480px","overflow":"auto","font-size":"12px","margin":"0","white-space":"pre-wrap","word-break":"break-all"} }

return function render(_ctx, _cache) {
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[3] || (_cache[3] = _createTextVNode("服务管理 ", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_4, "共 " + _toDisplayString(_ctx.list.length) + " 个服务", 1 /* TEXT */)
      ]),
      _createElementVNode("div", _hoisted_5, [
        (_ctx.error)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              title: _ctx.error,
              type: "warning",
              closable: false,
              style: {"margin-bottom":"10px"}
            }, null, 8 /* PROPS */, ["title"]))
          : _createCommentVNode("v-if", true),
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_input, {
            modelValue: _ctx.search,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.search) = $event)),
            placeholder: "搜索服务名 / 描述",
            style: {"width":"260px"},
            clearable: ""
          }, null, 8 /* PROPS */, ["modelValue"]),
          _createVNode(_component_el_select, {
            modelValue: _ctx.statusFilter,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.statusFilter) = $event)),
            style: {"width":"130px"},
            clearable: "",
            placeholder: "全部状态"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_option, {
                label: "运行中",
                value: "running"
              }),
              _createVNode(_component_el_option, {
                label: "已停止",
                value: "stopped"
              }),
              _createVNode(_component_el_option, {
                label: "失败",
                value: "failed"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue"]),
          _cache[4] || (_cache[4] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
          _createVNode(_component_el_button, {
            icon: 'Refresh',
            circle: "",
            onClick: _ctx.load
          }, null, 8 /* PROPS */, ["onClick"])
        ]),
        _createVNode(_component_el_table, {
          data: _ctx.filtered,
          size: "small",
          height: "560"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "服务名",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "display",
              label: "描述",
              "min-width": "200",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "状态",
              width: "110"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  type: _ctx.statusType(s.row.status),
                  size: "small"
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.statusText(s.row.status)), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "start_type",
              label: "启动方式",
              width: "110"
            }),
            (_ctx.hasPerm('services:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "340",
                  fixed: "right"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "success",
                      plain: "",
                      disabled: s.row.status === 'running' || s.row.status === 'active',
                      onClick: $event => (_ctx.action(s.row, 'start'))
                    }, {
                      default: _withCtx(() => [...(_cache[5] || (_cache[5] = [
                        _createTextVNode("启动", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["disabled", "onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "warning",
                      plain: "",
                      disabled: s.row.status !== 'running' && s.row.status !== 'active',
                      onClick: $event => (_ctx.action(s.row, 'stop'))
                    }, {
                      default: _withCtx(() => [...(_cache[6] || (_cache[6] = [
                        _createTextVNode("停止", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["disabled", "onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      plain: "",
                      onClick: $event => (_ctx.action(s.row, 'restart'))
                    }, {
                      default: _withCtx(() => [...(_cache[7] || (_cache[7] = [
                        _createTextVNode("重启", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.showDetail(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
                        _createTextVNode("详情", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true)
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data"])
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.detail.show,
      "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.detail.show) = $event)),
      title: '服务详情 ' + _ctx.detail.name,
      width: "720px"
    }, {
      default: _withCtx(() => [
        _createElementVNode("pre", _hoisted_7, _toDisplayString(_ctx.detail.raw), 1 /* TEXT */)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
