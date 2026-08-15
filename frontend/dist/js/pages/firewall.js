// 防火墙
import api from '../api.js'
import { hasPerm } from '../util.js'

export default {
  data() {
    return { status: null, rules: [], error: '',
             openForm: { show: false, port: 80, protocol: 'tcp', name: '', remote_ip: '' },
             blockForm: { show: false, ip: '' },
             quickPorts: [
               { port: 22, name: 'SSH', proto: 'tcp' },
               { port: 80, name: 'HTTP', proto: 'tcp' },
               { port: 443, name: 'HTTPS', proto: 'tcp' },
               { port: 3306, name: 'MySQL', proto: 'tcp' },
               { port: 5432, name: 'PostgreSQL', proto: 'tcp' },
               { port: 6379, name: 'Redis', proto: 'tcp' },
               { port: 27017, name: 'MongoDB', proto: 'tcp' },
               { port: 8888, name: '常用管理', proto: 'tcp' },
               { port: 53, name: 'DNS', proto: 'udp' },
             ] }
  },
  mounted() { this.load() },
  methods: {
    hasPerm,
    quickPort(p) {
      // 智能放行：点常用端口标签自动填好端口/协议/规则名
      this.openForm.port = p.port
      this.openForm.protocol = p.proto
      this.openForm.name = p.name
    },
    async load() {
      try {
        this.status = await api.get('/firewall/status')
        const r = await api.get('/firewall/rules')
        this.rules = r.list || []
        this.error = r.error || ''
      } catch (e) {}
    },
    async openPort() {
      try {
        await api.post('/firewall/open-port', this.openForm)
        this.$message.success(`端口 ${this.openForm.port}/${this.openForm.protocol} 已放行`)
        this.openForm.show = false
        this.load()
      } catch (e) {}
    },
    async closeRule(row) {
      try {
        await this.$confirm(`关闭端口 ${row.port || row.detail}？`, '确认', { type: 'warning' })
        await api.post('/firewall/close-port', { port: row.port, protocol: 'tcp' })
        this.$message.success('已关闭')
        this.load()
      } catch (e) {}
    },
    async blockIp() {
      try {
        await api.post('/firewall/block-ip', { ip: this.blockForm.ip })
        this.$message.success(`IP ${this.blockForm.ip} 已封禁`)
        this.blockForm.show = false
        this.load()
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, toDisplayString: _toDisplayString, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, normalizeStyle: _normalizeStyle, createTextVNode: _createTextVNode, createCommentVNode: _createCommentVNode, createBlock: _createBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid-2" }
const _hoisted_3 = { class: "op-card stat-card" }
const _hoisted_4 = { class: "stat-head" }
const _hoisted_5 = { class: "stat-icon" }
const _hoisted_6 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_7 = { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_8 = { key: 0 }
const _hoisted_9 = { class: "op-card" }
const _hoisted_10 = { class: "card-body" }
const _hoisted_11 = { class: "op-card" }
const _hoisted_12 = { class: "card-title" }
const _hoisted_13 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_14 = { class: "card-body" }
const _hoisted_15 = { class: "dialog-footer" }
const _hoisted_16 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_Lock = _resolveComponent("Lock")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_Unlock = _resolveComponent("Unlock")
  const _component_el_button = _resolveComponent("el-button")
  const _component_CircleCloseFilled = _resolveComponent("CircleCloseFilled")
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _cache[11] || (_cache[11] = _createElementVNode("span", { class: "stat-label" }, "防火墙状态", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_5, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Lock)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_6, _toDisplayString(_ctx.status?.mode || '检测中'), 1 /* TEXT */),
        _createElementVNode("div", _hoisted_7, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.status?.profiles || [], (p) => {
            return (_openBlock(), _createElementBlock("span", {
              key: p.name,
              style: {"margin-right":"10px"}
            }, [
              _createTextVNode(_toDisplayString(p.name) + ": ", 1 /* TEXT */),
              _createElementVNode("b", {
                style: _normalizeStyle({color: p.enabled ? 'var(--success)' : 'var(--danger)'})
              }, _toDisplayString(p.enabled ? '开' : '关'), 5 /* TEXT, STYLE */)
            ]))
          }), 128 /* KEYED_FRAGMENT */)),
          (_ctx.status?.state)
            ? (_openBlock(), _createElementBlock("span", _hoisted_8, _toDisplayString(_ctx.status.state), 1 /* TEXT */))
            : _createCommentVNode("v-if", true)
        ]),
        (_ctx.status && _ctx.status.elevated === false)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              type: "warning",
              closable: false,
              style: {"margin-top":"10px"},
              title: "当前进程无管理员权限，防火墙修改可能失败"
            }))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_9, [
        _cache[16] || (_cache[16] = _createElementVNode("div", { class: "card-title" }, "快捷操作", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_10, [
          (_ctx.hasPerm('firewall:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                type: "primary",
                onClick: _cache[0] || (_cache[0] = $event => (_ctx.openForm.show = true))
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Unlock)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[12] || (_cache[12] = _createTextVNode(" 开放端口 ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true),
          (_ctx.hasPerm('firewall:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 1,
                type: "danger",
                plain: "",
                onClick: _cache[1] || (_cache[1] = $event => (_ctx.blockForm.show = true))
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_CircleCloseFilled)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[13] || (_cache[13] = _createTextVNode(" 封禁 IP ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true),
          _createVNode(_component_el_button, { onClick: _ctx.load }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Refresh)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[14] || (_cache[14] = _createTextVNode(" 刷新", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"]),
          _cache[15] || (_cache[15] = _createElementVNode("div", { style: {"margin-top":"12px","color":"var(--text-secondary)","font-size":"12px"} }, " 防火墙规则直接影响服务器安全，操作将被审计记录。建议只开放必要端口。 ", -1 /* CACHED */))
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_11, [
      _createElementVNode("div", _hoisted_12, [
        _cache[17] || (_cache[17] = _createTextVNode("入站规则 ", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_13, _toDisplayString(_ctx.rules.length) + " 条", 1 /* TEXT */)
      ]),
      _createElementVNode("div", _hoisted_14, [
        (_ctx.error)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              title: _ctx.error,
              type: "warning",
              closable: false,
              style: {"margin-bottom":"10px"}
            }, null, 8 /* PROPS */, ["title"]))
          : _createCommentVNode("v-if", true),
        _createVNode(_component_el_table, {
          data: _ctx.rules,
          size: "small",
          height: "440"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "规则名",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "action",
              label: "动作",
              width: "100"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: (s.row.action || '').toLowerCase().includes('allow') ? 'success' : 'danger'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.action), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "port",
              label: "端口",
              width: "90"
            }),
            _createVNode(_component_el_table_column, {
              prop: "source",
              label: "来源",
              "min-width": "130",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "detail",
              label: "详情",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            (_ctx.hasPerm('firewall:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "100"
                }, {
                  default: _withCtx((s) => [
                    (s.row.port)
                      ? (_openBlock(), _createBlock(_component_el_button, {
                          key: 0,
                          size: "small",
                          type: "danger",
                          plain: "",
                          onClick: $event => (_ctx.closeRule(s.row))
                        }, {
                          default: _withCtx(() => [...(_cache[18] || (_cache[18] = [
                            _createTextVNode("关闭", -1 /* CACHED */)
                          ]))]),
                          _: 1 /* STABLE */
                        }, 8 /* PROPS */, ["onClick"]))
                      : _createCommentVNode("v-if", true)
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
      modelValue: _ctx.openForm.show,
      "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.openForm.show) = $event)),
      title: "开放端口",
      width: "440px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_15, [
          _createVNode(_component_el_button, {
            onClick: _cache[6] || (_cache[6] = $event => (_ctx.openForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.openPort
          }, {
            default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
              _createTextVNode("放行", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "常用端口" }, {
              default: _withCtx(() => [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.quickPorts, (p) => {
                  return (_openBlock(), _createBlock(_component_el_tag, {
                    key: p.port + p.proto,
                    effect: "plain",
                    onClick: _cache[23] || (_cache[23] = $event => (_ctx.quickPort(p))),
                    style: {"cursor":"pointer","margin":"2px 6px 2px 0"}
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(p.port) + " " + _toDisplayString(p.name), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 8 /* PROPS */, ["onClick"]))
                }), 256 /* UNKEYED_FRAGMENT */))
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "端口" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.openForm.port,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.openForm.port) = $event)),
                  min: 1,
                  max: 65535,
                  style: {"width":"100%"}
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "协议" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.openForm.protocol,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.openForm.protocol) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "TCP",
                      value: "tcp"
                    }),
                    _createVNode(_component_el_option, {
                      label: "UDP",
                      value: "udp"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "规则名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.openForm.name,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.openForm.name) = $event)),
                  placeholder: "留空自动命名"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "来源限制" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.openForm.remote_ip,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.openForm.remote_ip) = $event)),
                  placeholder: "留空=允许所有来源，如 1.2.3.4"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.blockForm.show,
      "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.blockForm.show) = $event)),
      title: "封禁 IP",
      width: "400px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_16, [
          _createVNode(_component_el_button, {
            onClick: _cache[9] || (_cache[9] = $event => (_ctx.blockForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "danger",
            onClick: _ctx.blockIp
          }, {
            default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
              _createTextVNode("封禁", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_input, {
          modelValue: _ctx.blockForm.ip,
          "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.blockForm.ip) = $event)),
          placeholder: "如 203.0.113.5"
        }, null, 8 /* PROPS */, ["modelValue"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })()
}
