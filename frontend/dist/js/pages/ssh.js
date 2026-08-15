// Created by 小杜 on 2026/08

// SSH 管理（自研）
import api from '../api.js'
import { hasPerm } from '../util.js'

const { ElMessage } = window.ElementPlus

export default {
  data() {
    return {
      status: { supported: true, service: 'unknown', config: {}, error: '', message: '' },
      form: { port: 22, permit_root: 'yes', password_auth: 'yes', pubkey_auth: 'yes' },
      hardening: [],
      saving: false,
    }
  },
  mounted() { this.load() },
  methods: {
    hasPerm,
    serviceLabel() {
      const s = this.status.service
      if (s === 'active' || s === 'running') return '运行中'
      if (s === 'unsupported') return '不支持'
      if (s === 'inactive' || s === 'failed') return '已停止'
      return s || '未知'
    },
    yesnoLabel(v) {
      if (v === 'yes') return '允许'
      if (v === 'no') return '禁止'
      if (v === 'prohibit-password' || v === 'without-password') return '仅密钥'
      return v || '-'
    },
    statusTagType(s) {
      return { ok: 'success', warn: 'warning', danger: 'danger', info: 'info' }[s] || 'info'
    },
    statusLabel(s) {
      return { ok: '安全', warn: '建议', danger: '危险', info: '提示' }[s] || '提示'
    },
    async load() {
      try {
        this.status = await api.get('/ssh/status')
        const c = this.status.config || {}
        this.form.port = c.port || 22
        this.form.permit_root = c.permit_root === 'yes' ? 'yes' : 'no'
        this.form.password_auth = c.password_auth === 'no' ? 'no' : 'yes'
        this.form.pubkey_auth = c.pubkey_auth === 'no' ? 'no' : 'yes'
        this.hardening = (await api.get('/ssh/hardening')).list || []
      } catch (e) {}
    },
    async save() {
      this.saving = true
      try {
        const r = await api.put('/ssh/config', this.form)
        if (r.ok) ElMessage.success(r.message || '已重启 SSH 服务')
        this.load()
      } catch (e) {} finally {
        this.saving = false
      }
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, toDisplayString: _toDisplayString, normalizeStyle: _normalizeStyle, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createTextVNode: _createTextVNode, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid-2" }
const _hoisted_3 = { class: "op-card stat-card" }
const _hoisted_4 = { class: "stat-head" }
const _hoisted_5 = { class: "stat-icon" }
const _hoisted_6 = { class: "op-card stat-card" }
const _hoisted_7 = { class: "stat-head" }
const _hoisted_8 = { class: "stat-icon" }
const _hoisted_9 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_10 = { class: "op-card stat-card" }
const _hoisted_11 = { class: "stat-head" }
const _hoisted_12 = { class: "stat-icon" }
const _hoisted_13 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_14 = { class: "op-card stat-card" }
const _hoisted_15 = { class: "stat-head" }
const _hoisted_16 = { class: "stat-icon" }
const _hoisted_17 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_18 = { class: "op-card" }
const _hoisted_19 = { class: "card-body" }
const _hoisted_20 = { class: "op-card" }
const _hoisted_21 = { class: "card-body" }
const _hoisted_22 = { style: {"display":"grid","grid-template-columns":"repeat(auto-fill,minmax(280px,1fr))","gap":"10px"} }
const _hoisted_23 = { style: {"display":"flex","align-items":"center","justify-content":"space-between","margin-bottom":"6px"} }
const _hoisted_24 = { style: {"font-size":"13px"} }
const _hoisted_25 = { style: {"color":"var(--text-secondary)","font-size":"12px","line-height":"1.6"} }
const _hoisted_26 = {
  key: 0,
  style: {"color":"var(--accent-light)","font-size":"12px","margin-top":"4px"}
}

return function render(_ctx, _cache) {
  const _component_Monitor = _resolveComponent("Monitor")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_Connection = _resolveComponent("Connection")
  const _component_Lock = _resolveComponent("Lock")
  const _component_Key = _resolveComponent("Key")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_tag = _resolveComponent("el-tag")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _cache[4] || (_cache[4] = _createElementVNode("span", { class: "stat-label" }, "SSH 服务状态", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_5, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Monitor)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", {
          class: "stat-num",
          style: _normalizeStyle({ fontSize: '22px', color: _ctx.status.service === 'active' ? 'var(--success)' : 'var(--danger)' })
        }, _toDisplayString(_ctx.serviceLabel()), 5 /* TEXT, STYLE */),
        _cache[5] || (_cache[5] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }, "sshd 运行状态", -1 /* CACHED */))
      ]),
      _createElementVNode("div", _hoisted_6, [
        _createElementVNode("div", _hoisted_7, [
          _cache[6] || (_cache[6] = _createElementVNode("span", { class: "stat-label" }, "监听端口", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_8, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Connection)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_9, _toDisplayString(_ctx.status.config.port || 22), 1 /* TEXT */),
        _cache[7] || (_cache[7] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }, "SSH 服务端口", -1 /* CACHED */))
      ]),
      _createElementVNode("div", _hoisted_10, [
        _createElementVNode("div", _hoisted_11, [
          _cache[8] || (_cache[8] = _createElementVNode("span", { class: "stat-label" }, "Root 登录", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_12, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Lock)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_13, _toDisplayString(_ctx.yesnoLabel(_ctx.status.config.permit_root)), 1 /* TEXT */),
        _cache[9] || (_cache[9] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }, "PermitRootLogin", -1 /* CACHED */))
      ]),
      _createElementVNode("div", _hoisted_14, [
        _createElementVNode("div", _hoisted_15, [
          _cache[10] || (_cache[10] = _createElementVNode("span", { class: "stat-label" }, "密码登录", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_16, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Key)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_17, _toDisplayString(_ctx.yesnoLabel(_ctx.status.config.password_auth)), 1 /* TEXT */),
        _cache[11] || (_cache[11] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }, "PasswordAuthentication", -1 /* CACHED */))
      ])
    ]),
    _createElementVNode("div", _hoisted_18, [
      _cache[13] || (_cache[13] = _createElementVNode("div", { class: "card-title" }, [
        _createElementVNode("span", null, "SSH 配置"),
        _createElementVNode("span", { style: {"margin-left":"10px","color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }, "修改后自动校验并重启 SSH 服务")
      ], -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_19, [
        (!_ctx.status.supported)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              type: "warning",
              closable: false,
              title: "Windows 暂不支持 SSH 管理",
              style: {"margin-bottom":"12px"}
            }))
          : (_ctx.status.error)
            ? (_openBlock(), _createBlock(_component_el_alert, {
                key: 1,
                type: "warning",
                closable: false,
                title: _ctx.status.error,
                style: {"margin-bottom":"12px"}
              }, null, 8 /* PROPS */, ["title"]))
            : _createCommentVNode("v-if", true),
        _createVNode(_component_el_form, {
          "label-width": "130px",
          style: {"max-width":"540px"}
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "端口" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.form.port,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.port) = $event)),
                  min: 22,
                  max: 65535,
                  style: {"width":"100%"}
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "允许 Root 登录" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.form.permit_root,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.permit_root) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "允许（yes）",
                      value: "yes"
                    }),
                    _createVNode(_component_el_option, {
                      label: "禁止（no）",
                      value: "no"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "密码认证" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.form.password_auth,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.password_auth) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "允许（yes）",
                      value: "yes"
                    }),
                    _createVNode(_component_el_option, {
                      label: "禁止（no）",
                      value: "no"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "公钥认证" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.form.pubkey_auth,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.pubkey_auth) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "允许（yes）",
                      value: "yes"
                    }),
                    _createVNode(_component_el_option, {
                      label: "禁止（no）",
                      value: "no"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, null, {
              default: _withCtx(() => [
                (_ctx.hasPerm('ssh:manage'))
                  ? (_openBlock(), _createBlock(_component_el_button, {
                      key: 0,
                      type: "primary",
                      loading: _ctx.saving,
                      disabled: !_ctx.status.supported,
                      onClick: _ctx.save
                    }, {
                      default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                        _createTextVNode("保存配置", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["loading", "disabled", "onClick"]))
                  : _createCommentVNode("v-if", true)
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ])
    ]),
    _createElementVNode("div", _hoisted_20, [
      _cache[14] || (_cache[14] = _createElementVNode("div", { class: "card-title" }, [
        _createElementVNode("span", null, "安全加固建议"),
        _createElementVNode("span", { style: {"margin-left":"10px","color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }, "根据当前 sshd 配置实时检测")
      ], -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_21, [
        _createElementVNode("div", _hoisted_22, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.hardening, (h) => {
            return (_openBlock(), _createElementBlock("div", {
              key: h.key,
              style: {"border":"1px solid var(--border)","border-radius":"10px","padding":"12px 14px","background":"var(--bg-card)"}
            }, [
              _createElementVNode("div", _hoisted_23, [
                _createElementVNode("b", _hoisted_24, _toDisplayString(h.title), 1 /* TEXT */),
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: _ctx.statusTagType(h.status)
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.statusLabel(h.status)), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _createElementVNode("div", _hoisted_25, _toDisplayString(h.desc), 1 /* TEXT */),
              (h.suggest)
                ? (_openBlock(), _createElementBlock("div", _hoisted_26, "→ " + _toDisplayString(h.suggest), 1 /* TEXT */))
                : _createCommentVNode("v-if", true)
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ])
      ])
    ])
  ]))
} })(),
}
