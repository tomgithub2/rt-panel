// FTP 管理（自研）
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

const { ElMessage } = window.ElementPlus

export default {
  data() {
    return {
      status: { installed: false, supported: true, version: '', users_count: 0, message: '' },
      users: [],
      form: { show: false, username: '', dir: '', password: '', note: '' },
    }
  },
  mounted() { this.load() },
  methods: {
    fmtTime, hasPerm,
    async load() {
      try {
        this.status = await api.get('/ftp/status')
        this.users = (await api.get('/ftp/users')).list
      } catch (e) {}
    },
    async addUser() {
      const username = (this.form.username || '').trim()
      if (!username) return ElMessage.warning('请填写用户名')
      if (!/^[a-z0-9_]{3,20}$/.test(username)) return ElMessage.warning('用户名需为 3-20 位小写字母/数字/下划线')
      if (!this.form.dir) return ElMessage.warning('请填写目录')
      if (!this.form.password) return ElMessage.warning('请填写密码')
      try {
        await api.post('/ftp/users', { username, dir: this.form.dir.trim(), password: this.form.password, note: this.form.note })
        ElMessage.success('FTP 用户已创建')
        this.form = { show: false, username: '', dir: '', password: '', note: '' }
        this.load()
      } catch (e) {}
    },
    async delUser(row) {
      try {
        await this.$confirm('删除 FTP 用户「' + row.username + '」？仅删除系统用户，不删除其目录文件。', '确认删除', { type: 'warning' })
        await api.delete('/ftp/users/' + row.id)
        ElMessage.success('已删除')
        this.load()
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, withCtx: _withCtx, createVNode: _createVNode, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, createElementBlock: _createElementBlock } = Vue

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
const _hoisted_8 = { class: "op-card stat-card" }
const _hoisted_9 = { class: "stat-head" }
const _hoisted_10 = { class: "stat-icon" }
const _hoisted_11 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_12 = { class: "op-card" }
const _hoisted_13 = { class: "card-title" }
const _hoisted_14 = { style: {"margin-left":"10px","color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_15 = { style: {"margin-left":"auto","display":"flex","gap":"8px"} }
const _hoisted_16 = { class: "card-body" }
const _hoisted_17 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_CircleCheckFilled = _resolveComponent("CircleCheckFilled")
  const _component_WarningFilled = _resolveComponent("WarningFilled")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_User = _resolveComponent("User")
  const _component_Plus = _resolveComponent("Plus")
  const _component_el_button = _resolveComponent("el-button")
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _cache[7] || (_cache[7] = _createElementVNode("span", { class: "stat-label" }, "vsftpd 服务", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_5, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                (_ctx.status.installed)
                  ? (_openBlock(), _createBlock(_component_CircleCheckFilled, { key: 0 }))
                  : (_openBlock(), _createBlock(_component_WarningFilled, { key: 1 }))
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_6, _toDisplayString(_ctx.status.installed ? '已安装' : '未安装'), 1 /* TEXT */),
        _createElementVNode("div", _hoisted_7, _toDisplayString(_ctx.status.version || _ctx.status.message || '检测中'), 1 /* TEXT */)
      ]),
      _createElementVNode("div", _hoisted_8, [
        _createElementVNode("div", _hoisted_9, [
          _cache[8] || (_cache[8] = _createElementVNode("span", { class: "stat-label" }, "FTP 用户", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_10, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_User)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_11, _toDisplayString(_ctx.status.users_count), 1 /* TEXT */),
        _cache[9] || (_cache[9] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }, "当前面板管理的 FTP 用户数", -1 /* CACHED */))
      ])
    ]),
    _createElementVNode("div", _hoisted_12, [
      _createElementVNode("div", _hoisted_13, [
        _cache[12] || (_cache[12] = _createElementVNode("span", null, "FTP 用户列表", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_14, _toDisplayString(_ctx.users.length) + " 个用户", 1 /* TEXT */),
        _createElementVNode("div", _hoisted_15, [
          (_ctx.hasPerm('ftp:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                type: "primary",
                size: "small",
                onClick: _cache[0] || (_cache[0] = $event => (_ctx.form.show = true))
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Plus)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[10] || (_cache[10] = _createTextVNode(" 添加 FTP 用户", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true),
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _ctx.load
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Refresh)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[11] || (_cache[11] = _createTextVNode(" 刷新", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      _createElementVNode("div", _hoisted_16, [
        (_ctx.status.supported && !_ctx.status.installed)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              type: "warning",
              closable: false,
              title: "vsftpd 未安装，请在软件商店安装 FTP 后使用",
              style: {"margin-bottom":"10px"}
            }))
          : _createCommentVNode("v-if", true),
        _createVNode(_component_el_table, {
          data: _ctx.users,
          size: "small",
          "max-height": "460"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "username",
              label: "用户名",
              width: "160"
            }),
            _createVNode(_component_el_table_column, {
              prop: "dir",
              label: "目录",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "note",
              label: "备注",
              "min-width": "140",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "创建时间",
              width: "170"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.created_at)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.hasPerm('ftp:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "100"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.delUser(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
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
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.form.show,
      "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.form.show) = $event)),
      title: "添加 FTP 用户",
      width: "460px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_17, [
          _createVNode(_component_el_button, {
            onClick: _cache[5] || (_cache[5] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.addUser
          }, {
            default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
              _createTextVNode("创建", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "80px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "用户名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.username,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.username) = $event)),
                  placeholder: "3-20 位小写字母/数字/下划线"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "目录" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.dir,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.dir) = $event)),
                  placeholder: "如 /home/ftpuser 或 /www/wwwroot/site"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "密码" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.password,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.password) = $event)),
                  type: "password",
                  "show-password": "",
                  placeholder: "设置 FTP 登录密码"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "备注" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.note,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.note) = $event)),
                  placeholder: "可选"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })(),
}
