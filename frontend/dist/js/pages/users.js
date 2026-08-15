// Created by 小杜 on 2026/08

// 用户管理
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return { users: [], roles: [],
             form: { show: false, id: null, username: '', password: '', role: 'operator', email: '', remark: '', status: 1 },
             pwdForm: { show: false, id: null, username: '', password: '' } }
  },
  mounted() { this.load() },
  methods: {
    fmtTime, hasPerm,
    async load() {
      try {
        this.users = (await api.get('/users/list')).list
        this.roles = (await api.get('/users/roles')).roles
      } catch (e) {}
    },
    openAdd() {
      this.form = { show: true, id: null, username: '', password: '', role: 'operator', email: '', remark: '', status: 1 }
    },
    openEdit(row) {
      this.form = { show: true, id: row.id, username: row.username, password: '',
                    role: row.role, email: row.email, remark: row.remark, status: row.status }
    },
    async submit() {
      try {
        if (this.form.id) {
          await api.put(`/users/${this.form.id}`, this.form)
        } else {
          await api.post('/users/add', this.form)
        }
        this.$message.success('已保存')
        this.form.show = false
        this.load()
      } catch (e) {}
    },
    async remove(row) {
      try {
        await this.$confirm(`删除用户 ${row.username}？`, '确认', { type: 'warning' })
        await api.delete(`/users/${row.id}`)
        this.$message.success('已删除')
        this.load()
      } catch (e) {}
    },
    openPwd(row) { this.pwdForm = { show: true, id: row.id, username: row.username, password: '' } },
    async submitPwd() {
      try {
        await api.post(`/users/${this.pwdForm.id}/password`, { password: this.pwdForm.password })
        this.$message.success('密码已重置')
        this.pwdForm.show = false
      } catch (e) {}
    },
    roleName(r) { return this.roles.find(x => x.id === r)?.name || r },
  },
  render: (function(){ const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementVNode: _createElementVNode, createVNode: _createVNode, toDisplayString: _toDisplayString, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid-2" }
const _hoisted_3 = { class: "op-card" }
const _hoisted_4 = { class: "card-title" }
const _hoisted_5 = { class: "card-body" }
const _hoisted_6 = { class: "op-card" }
const _hoisted_7 = { class: "card-body" }
const _hoisted_8 = { class: "gold-text" }
const _hoisted_9 = { style: {"color":"var(--text-secondary)","font-size":"12px","margin-left":"8px"} }
const _hoisted_10 = { style: {"color":"var(--text-regular)","font-size":"12px","margin-top":"6px"} }
const _hoisted_11 = { style: {"color":"var(--text-secondary)","font-size":"11px","margin-top":"6px"} }
const _hoisted_12 = { class: "dialog-footer" }
const _hoisted_13 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _cache[12] || (_cache[12] = _createTextVNode("用户列表 ", -1 /* CACHED */)),
          (_ctx.hasPerm('users:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                size: "small",
                type: "primary",
                style: {"margin-left":"auto"},
                onClick: _ctx.openAdd
              }, {
                default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                  _createTextVNode("+ 添加用户", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]))
            : _createCommentVNode("v-if", true)
        ]),
        _createElementVNode("div", _hoisted_5, [
          _createVNode(_component_el_table, {
            data: _ctx.users,
            size: "small",
            height: "420"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "username",
                label: "用户名",
                "min-width": "130"
              }),
              _createVNode(_component_el_table_column, {
                label: "角色",
                width: "120"
              }, {
                default: _withCtx((s) => [
                  _createVNode(_component_el_tag, { size: "small" }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(_ctx.roleName(s.row.role)), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1024 /* DYNAMIC_SLOTS */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "两步验证",
                width: "90"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(s.row.two_fa ? '✔ 已开' : '-'), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "状态",
                width: "80"
              }, {
                default: _withCtx((s) => [
                  _createVNode(_component_el_tag, {
                    size: "small",
                    type: s.row.status ? 'success' : 'danger'
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(s.row.status ? '启用' : '禁用'), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "最后登录",
                width: "160"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.last_login)), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              (_ctx.hasPerm('users:manage'))
                ? (_openBlock(), _createBlock(_component_el_table_column, {
                    key: 0,
                    label: "操作",
                    width: "200",
                    fixed: "right"
                  }, {
                    default: _withCtx((s) => [
                      _createVNode(_component_el_button, {
                        size: "small",
                        onClick: $event => (_ctx.openEdit(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
                          _createTextVNode("编辑", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"]),
                      _createVNode(_component_el_button, {
                        size: "small",
                        onClick: $event => (_ctx.openPwd(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
                          _createTextVNode("重置密码", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"]),
                      _createVNode(_component_el_button, {
                        size: "small",
                        type: "danger",
                        plain: "",
                        onClick: $event => (_ctx.remove(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                          _createTextVNode("删除", -1 /* CACHED */)
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
      _createElementVNode("div", _hoisted_6, [
        _cache[16] || (_cache[16] = _createElementVNode("div", { class: "card-title" }, "角色权限说明", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_7, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.roles, (r) => {
            return (_openBlock(), _createElementBlock("div", {
              key: r.id,
              class: "op-card",
              style: {"padding":"16px","margin-bottom":"12px"}
            }, [
              _createElementVNode("b", _hoisted_8, _toDisplayString(r.name), 1 /* TEXT */),
              _createElementVNode("span", _hoisted_9, _toDisplayString(r.id), 1 /* TEXT */),
              _createElementVNode("div", _hoisted_10, _toDisplayString(r.desc), 1 /* TEXT */),
              _createElementVNode("div", _hoisted_11, " 权限数 " + _toDisplayString(r.perms.length) + "：" + _toDisplayString(r.perms.slice(0, 8).join(' · ')) + _toDisplayString(r.perms.length > 8 ? ' …' : ''), 1 /* TEXT */)
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ])
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.form.show,
      "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.form.show) = $event)),
      title: _ctx.form.id ? '编辑用户' : '添加用户',
      width: "480px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_12, [
          _createVNode(_component_el_button, {
            onClick: _cache[6] || (_cache[6] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[17] || (_cache[17] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submit
          }, {
            default: _withCtx(() => [...(_cache[18] || (_cache[18] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "用户名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.username,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.username) = $event)),
                  disabled: !!_ctx.form.id
                }, null, 8 /* PROPS */, ["modelValue", "disabled"])
              ]),
              _: 1 /* STABLE */
            }),
            (!_ctx.form.id)
              ? (_openBlock(), _createBlock(_component_el_form_item, {
                  key: 0,
                  label: "初始密码"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.form.password,
                      "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.password) = $event)),
                      type: "password",
                      "show-password": ""
                    }, null, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true),
            _createVNode(_component_el_form_item, { label: "角色" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.form.role,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.role) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.roles, (r) => {
                      return (_openBlock(), _createBlock(_component_el_option, {
                        key: r.id,
                        label: r.name + ' - ' + r.desc,
                        value: r.id
                      }, null, 8 /* PROPS */, ["label", "value"]))
                    }), 128 /* KEYED_FRAGMENT */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "邮箱" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.email,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.email) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "备注" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.remark,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.remark) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.form.id)
              ? (_openBlock(), _createBlock(_component_el_form_item, {
                  key: 1,
                  label: "状态"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_switch, {
                      modelValue: _ctx.form.status,
                      "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.form.status) = $event)),
                      "active-value": 1,
                      "inactive-value": 0
                    }, null, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true)
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.pwdForm.show,
      "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.pwdForm.show) = $event)),
      title: '重置密码 · ' + _ctx.pwdForm.username,
      width: "400px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_13, [
          _createVNode(_component_el_button, {
            onClick: _cache[9] || (_cache[9] = $event => (_ctx.pwdForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submitPwd
          }, {
            default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
              _createTextVNode("重置", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_input, {
          modelValue: _ctx.pwdForm.password,
          "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.pwdForm.password) = $event)),
          type: "password",
          "show-password": "",
          placeholder: "至少 8 位"
        }, null, 8 /* PROPS */, ["modelValue"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
