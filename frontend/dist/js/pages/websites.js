// Created by 小杜 on 2026/08

// 网站管理 · 一键建站（超越宝塔：同建数据库 + FTP + 凭据一次性展示）
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

const { ElMessage } = window.ElementPlus

// 建站表单里自动生成的名字前缀：db_ 给数据库、ftp_ 给 FTP 账号
const DB_PREFIX = 'db_'
const FTP_PREFIX = 'ftp_'
// 数据库名/账号最大长度（MySQL 用户名上限约 32，留点余量）
const NAME_MAX = 30

export default {
  data() {
    return {
      sites: [], engine: '',
      form: { show: false, domain: '', type: 'static', port: 80, root: '',
              target: '', with_db: true, db_name: '', with_ftp: false, ftp_user: '' },
      env: { mysql: true, ftp: true, nginx: true, mysql_msg: '', ftp_msg: '' },
      result: { show: false, site: '', db: null, ftp: null },
      confDialog: { show: false, config: '', title: '' },
      logDialog: { show: false, type: 'access', text: '', sid: null, domain: '', lines: 200, error: '' },
      setForm: { show: false, sid: null, domain: '', pseudo: '', custom_pseudo: '',
                 redirect: '', auth_user: '', auth_pass: '', hotlink: '', presets: [] },
    }
  },
  watch: {
    'form.domain'(v) {
      // 输入域名时自动建议数据库名与 FTP 账号（可改）
      const slug = v.replace(/[^a-z0-9_]/g, '_').slice(0, NAME_MAX)
      this.form.db_name = DB_PREFIX + slug
      this.form.ftp_user = FTP_PREFIX + slug.slice(0, 20)
      if (!this.form.root) this.form.root = ''
    },
  },
  mounted() { this.load() },
  methods: {
    fmtTime, hasPerm,
    async load() {
      try {
        const r = await api.get('/websites/list')
        if (r && r.list) {  // 双保险：接口正常时 r 肯定在，习惯性再判一下
          this.sites = r.list
          this.engine = r.engine
        }
      } catch (e) {}
    },
    async openCreate() {
      // 打开前检测环境：MySQL/FTP 未安装则对应选项置灰（宝塔式智能选项）
      try { this.env = await api.get('/websites/env') } catch (e) {}
      this.form = { show: true, domain: '', type: 'static', port: 80, root: '',
                    target: '', with_db: this.env.mysql !== false, db_name: '',
                    with_ftp: false, ftp_user: '' }
    },
    async create() {
      if (!this.form.domain) return ElMessage.warning('请输入域名')
      if (this.form.type === 'proxy' && !this.form.target) return ElMessage.warning('反向代理需要填写目标地址')
      try {
        const createRst = await api.post('/websites/create', this.form)
        this.form.show = false
        this.result = { show: true, site: this.form.domain, db: createRst.db, ftp: createRst.ftp }
        this.load()
      } catch (e) {}
    },
    async toggle(row) {
      try {
        await api.post(`/websites/${row.id}/action`, { action: 'toggle' })
        this.load()
      } catch (e) {}
    },
    async remove(row) {
      try {
        await this.$confirm(`删除网站 ${row.domain}？（站点目录不会被删除）`, '危险操作', { type: 'error' })
        await api.post(`/websites/${row.id}/action`, { action: 'delete' })
        ElMessage.success('已删除并重载配置')
        this.load()
      } catch (e) {}
    },
    async showConfig(row) {
      try {
        const r = await api.get(`/websites/${row.id}/config`)
        this.confDialog = { show: true, config: r.config, title: row.domain }
      } catch (e) {}
    },
    openDetail(row) {
      // 进入网站二级管理页（基本/高级/SSL/日志/配置）
      this.$router.push(`/site-detail/${row.id}`)
    },
    openLogs(row) {
      this.logDialog = { show: true, type: 'access', text: '', sid: row.id, domain: row.domain, lines: 200, error: '' }
      this.loadLogs()
    },
    async loadLogs() {
      if (!this.logDialog.sid) return
      try {
        const r = await api.get(`/websites/${this.logDialog.sid}/logs?type=${this.logDialog.type}&lines=${this.logDialog.lines}`)
        this.logDialog.text = r.text || ''
        this.logDialog.error = r.error || ''
      } catch (e) {}
    },
    async openSettings(row) {
      try {
        const r = await api.get(`/websites/${row.id}/settings`)
        const s = r.settings || {}
        const pseudo = s.pseudo || ''
        this.setForm = {
          show: true, sid: row.id, domain: row.domain,
          pseudo: pseudo.startsWith('custom::') ? 'custom' : pseudo,
          custom_pseudo: pseudo.startsWith('custom::') ? pseudo.split('::')[1] : '',
          redirect: s.redirect || '', auth_user: s.auth_user || '',
          auth_pass: '', hotlink: s.hotlink || '',
          presets: r.pseudo_presets || [],
        }
      } catch (e) {}
    },
    async saveSettings() {
      const f = this.setForm
      if (f.auth_user && !f.auth_pass) return ElMessage.warning('设置了用户名则必须填写目录密码')
      try {
        await api.put(`/websites/${f.sid}/settings`, f)
        ElMessage.success('高级设置已保存并重载配置')
        f.show = false
      } catch (e) {}
    },
    typeLabel(t) { return t === 'proxy' ? '反向代理' : '静态站点' },
  },
  render: (function(){ const { toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementBlock: _createElementBlock, createVNode: _createVNode, createElementVNode: _createElementVNode, normalizeClass: _normalizeClass } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = {
  key: 1,
  style: {"margin-left":"10px","color":"var(--text-secondary)","font-size":"12px","font-weight":"400"}
}
const _hoisted_5 = { style: {"margin-left":"auto","display":"flex","gap":"8px"} }
const _hoisted_6 = { class: "card-body" }
const _hoisted_7 = { class: "gold-text" }
const _hoisted_8 = { class: "site-create" }
const _hoisted_9 = { class: "site-sec" }
const _hoisted_10 = { class: "site-sec-title" }
const _hoisted_11 = { class: "site-sec" }
const _hoisted_12 = { class: "site-sec-title" }
const _hoisted_13 = { class: "site-addon-head" }
const _hoisted_14 = { class: "site-addon-body" }
const _hoisted_15 = { class: "site-addon-head" }
const _hoisted_16 = { class: "site-addon-body" }
const _hoisted_17 = { class: "dialog-footer" }
const _hoisted_18 = {
  key: 0,
  class: "cred-box"
}
const _hoisted_19 = { class: "cred-row" }
const _hoisted_20 = { class: "cred-row" }
const _hoisted_21 = { class: "cred-row" }
const _hoisted_22 = {
  key: 2,
  class: "cred-box"
}
const _hoisted_23 = { class: "cred-row" }
const _hoisted_24 = { class: "cred-row" }
const _hoisted_25 = { class: "cred-row" }
const _hoisted_26 = { class: "dialog-footer" }
const _hoisted_27 = {
  class: "mono",
  style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"14px","max-height":"480px","overflow":"auto","font-size":"12px","margin":"0"}
}

return function render(_ctx, _cache) {
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_Plus = _resolveComponent("Plus")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_Document = _resolveComponent("Document")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_radio_button = _resolveComponent("el-radio-button")
  const _component_el_radio_group = _resolveComponent("el-radio-group")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_col = _resolveComponent("el-col")
  const _component_el_row = _resolveComponent("el-row")
  const _component_el_form = _resolveComponent("el-form")
  const _component_MagicStick = _resolveComponent("MagicStick")
  const _component_Coin = _resolveComponent("Coin")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_Upload = _resolveComponent("Upload")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _component_el_alert = _resolveComponent("el-alert")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[15] || (_cache[15] = _createTextVNode(" 网站列表 ", -1 /* CACHED */)),
        (_ctx.engine)
          ? (_openBlock(), _createBlock(_component_el_tag, {
              key: 0,
              size: "small",
              style: {"margin-left":"10px"}
            }, {
              default: _withCtx(() => [
                _createTextVNode(_toDisplayString(_ctx.engine.toUpperCase()), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }))
          : _createCommentVNode("v-if", true),
        (!_ctx.engine)
          ? (_openBlock(), _createElementBlock("span", _hoisted_4, " 未检测到 Nginx/Caddy（可在「软件商店」安装） "))
          : _createCommentVNode("v-if", true),
        _createElementVNode("div", _hoisted_5, [
          (_ctx.hasPerm('websites:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                size: "small",
                type: "primary",
                onClick: _ctx.openCreate
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Plus)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[14] || (_cache[14] = _createTextVNode(" 添加网站（一键建站） ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]))
            : _createCommentVNode("v-if", true)
        ])
      ]),
      _createElementVNode("div", _hoisted_6, [
        _createVNode(_component_el_table, {
          data: _ctx.sites,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              label: "域名",
              "min-width": "180"
            }, {
              default: _withCtx((s) => [
                _createElementVNode("b", {
                  class: "gold-text",
                  style: {"cursor":"pointer","text-decoration":"underline","text-decoration-style":"dotted","text-underline-offset":"3px"},
                  title: "进入网站管理（二级页面）",
                  onClick: $event => (_ctx.openDetail(s.row))
                }, _toDisplayString(s.row.domain), 9 /* TEXT, STYLE */, _hoisted_7)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "类型",
              width: "100"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.row.type === 'proxy' ? 'warning' : 'info'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.typeLabel(s.row.type)), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "port",
              label: "端口",
              width: "80"
            }),
            _createVNode(_component_el_table_column, {
              prop: "root",
              label: "站点目录",
              "min-width": "200",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "状态",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.row.status ? 'success' : 'info'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.status ? '运行中' : '已停用'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "操作",
              width: "280",
              fixed: "right"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: $event => (_ctx.showConfig(s.row))
                }, {
                  default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
                    _createTextVNode("配置", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"]),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: $event => (_ctx.openLogs(s.row))
                }, {
                  default: _withCtx(() => [...(_cache[62] || (_cache[62] = [
                    _createTextVNode("日志", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"]),
                _createVNode(_component_el_button, {
                  size: "small",
                  type: "primary",
                  plain: "",
                  onClick: $event => (_ctx.openSettings(s.row))
                }, {
                  default: _withCtx(() => [...(_cache[55] || (_cache[55] = [
                    _createTextVNode("设置", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"]),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: $event => (_ctx.toggle(s.row))
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.status ? '停用' : '启用'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"]),
                _createVNode(_component_el_button, {
                  size: "small",
                  type: "danger",
                  plain: "",
                  onClick: $event => (_ctx.remove(s.row))
                }, {
                  default: _withCtx(() => [...(_cache[17] || (_cache[17] = [
                    _createTextVNode("删除", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data"])
      ])
    ]),
    _createCommentVNode(" 一键建站对话框 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.form.show,
      "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.form.show) = $event)),
      title: "添加网站 · 一键建站",
      width: "600px",
      "close-on-click-modal": false
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_17, [
          _createVNode(_component_el_button, {
            onClick: _cache[9] || (_cache[9] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.create
          }, {
            default: _withCtx(() => [...(_cache[29] || (_cache[29] = [
              _createTextVNode("立即创建", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createElementVNode("div", _hoisted_8, [
          _createElementVNode("div", _hoisted_9, [
            _createElementVNode("div", _hoisted_10, [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Document)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[18] || (_cache[18] = _createTextVNode(" 基本信息", -1 /* CACHED */))
            ]),
            _createVNode(_component_el_form, { "label-width": "90px" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_form_item, {
                  label: "域名",
                  required: ""
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.form.domain,
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.domain) = $event)),
                      placeholder: "example.com（如已解析，SSL 证书页可直接选择签发）"
                    }, null, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_form_item, { label: "类型" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_radio_group, {
                      modelValue: _ctx.form.type,
                      "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.type) = $event))
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_el_radio_button, { value: "static" }, {
                          default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
                            _createTextVNode("静态站点", -1 /* CACHED */)
                          ]))]),
                          _: 1 /* STABLE */
                        }),
                        _createVNode(_component_el_radio_button, { value: "proxy" }, {
                          default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
                            _createTextVNode("反向代理", -1 /* CACHED */)
                          ]))]),
                          _: 1 /* STABLE */
                        })
                      ]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_row, { gutter: 12 }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_col, { span: 8 }, {
                      default: _withCtx(() => [
                        _createVNode(_component_el_form_item, {
                          label: "端口",
                          "label-width": "60px"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_el_input_number, {
                              modelValue: _ctx.form.port,
                              "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.port) = $event)),
                              min: 1,
                              max: 65535,
                              style: {"width":"100%"}
                            }, null, 8 /* PROPS */, ["modelValue"])
                          ]),
                          _: 1 /* STABLE */
                        })
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_col, { span: 16 }, {
                      default: _withCtx(() => [
                        _createVNode(_component_el_form_item, {
                          label: "目录",
                          "label-width": "60px"
                        }, {
                          default: _withCtx(() => [
                            (_ctx.form.type === 'static')
                              ? (_openBlock(), _createBlock(_component_el_input, {
                                  key: 0,
                                  modelValue: _ctx.form.root,
                                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.root) = $event)),
                                  placeholder: "留空自动 wwwroot/域名"
                                }, null, 8 /* PROPS */, ["modelValue"]))
                              : (_openBlock(), _createBlock(_component_el_input, {
                                  key: 1,
                                  modelValue: _ctx.form.target,
                                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.target) = $event)),
                                  placeholder: "代理目标 http://127.0.0.1:8080"
                                }, null, 8 /* PROPS */, ["modelValue"]))
                          ]),
                          _: 1 /* STABLE */
                        })
                      ]),
                      _: 1 /* STABLE */
                    })
                  ]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _createElementVNode("div", _hoisted_11, [
            _createElementVNode("div", _hoisted_12, [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_MagicStick)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[21] || (_cache[21] = _createTextVNode(" 一键附加服务（可选，超越宝塔的一站式创建）", -1 /* CACHED */))
            ]),
            _createElementVNode("div", {
              class: _normalizeClass(["site-addon", { on: _ctx.form.with_db }])
            }, [
              _createElementVNode("div", _hoisted_13, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Coin)
                  ]),
                  _: 1 /* STABLE */
                }),
                _cache[22] || (_cache[22] = _createElementVNode("b", null, "同时创建数据库", -1 /* CACHED */)),
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.with_db,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.form.with_db) = $event)),
                  disabled: !_ctx.env.mysql,
                  style: {"margin-left":"auto"}
                }, null, 8 /* PROPS */, ["modelValue", "disabled"]),
                (_ctx.env.mysql_msg)
                  ? (_openBlock(), _createElementBlock("span", {
                      key: 0,
                      style: {"color":"var(--warning)","font-size":"11px","margin-left":"6px"}
                    }, _toDisplayString(_ctx.env.mysql_msg), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true)
              ]),
              _createElementVNode("div", _hoisted_14, [
                _cache[23] || (_cache[23] = _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px"} }, "数据库名", -1 /* CACHED */)),
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.db_name,
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.form.db_name) = $event)),
                  size: "small",
                  style: {"width":"220px"},
                  disabled: !_ctx.env.mysql,
                  placeholder: "自动生成"
                }, null, 8 /* PROPS */, ["modelValue", "disabled"]),
                (_ctx.env.mysql)
                  ? (_openBlock(), _createElementBlock("span", {
                      key: 0,
                      style: {"color":"var(--text-secondary)","font-size":"12px"}
                    }, "自动创建独立账号与随机密码，创建后一次性展示", -1 /* CACHED */))
                  : (_openBlock(), _createElementBlock("span", {
                      key: 1,
                      style: {"color":"var(--text-secondary)","font-size":"12px"}
                    }, "安装 MySQL 后即可勾选（软件商店一键安装）", -1 /* CACHED */))
              ])
            ], 2 /* CLASS */),
            _createElementVNode("div", {
              class: _normalizeClass(["site-addon", { on: _ctx.form.with_ftp }])
            }, [
              _createElementVNode("div", _hoisted_15, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Upload)
                  ]),
                  _: 1 /* STABLE */
                }),
                _cache[25] || (_cache[25] = _createElementVNode("b", null, "同时创建 FTP 账号", -1 /* CACHED */)),
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.with_ftp,
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.form.with_ftp) = $event)),
                  disabled: !_ctx.env.ftp,
                  style: {"margin-left":"auto"}
                }, null, 8 /* PROPS */, ["modelValue", "disabled"]),
                (_ctx.env.ftp_msg)
                  ? (_openBlock(), _createElementBlock("span", {
                      key: 0,
                      style: {"color":"var(--warning)","font-size":"11px","margin-left":"6px"}
                    }, _toDisplayString(_ctx.env.ftp_msg), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true)
              ]),
              _createElementVNode("div", _hoisted_16, [
                _cache[26] || (_cache[26] = _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px"} }, "FTP 用户", -1 /* CACHED */)),
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.ftp_user,
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.form.ftp_user) = $event)),
                  size: "small",
                  style: {"width":"220px"},
                  disabled: !_ctx.env.ftp,
                  placeholder: "自动生成"
                }, null, 8 /* PROPS */, ["modelValue", "disabled"]),
                (_ctx.env.ftp)
                  ? (_openBlock(), _createElementBlock("span", {
                      key: 0,
                      style: {"color":"var(--text-secondary)","font-size":"12px"}
                    }, "目录指向站点根目录", -1 /* CACHED */))
                  : (_openBlock(), _createElementBlock("span", {
                      key: 1,
                      style: {"color":"var(--text-secondary)","font-size":"12px"}
                    }, "安装 FTP 服务后即可勾选（软件商店一键安装）", -1 /* CACHED */))
              ])
            ], 2 /* CLASS */)
          ])
        ])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createCommentVNode(" 创建结果（凭据一次性展示） "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.result.show,
      "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((_ctx.result.show) = $event)),
      title: "网站创建完成",
      width: "500px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_26, [
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _cache[11] || (_cache[11] = $event => (_ctx.result.show = false))
          }, {
            default: _withCtx(() => [...(_cache[38] || (_cache[38] = [
              _createTextVNode("我知道了", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          })
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_alert, {
          type: "success",
          closable: false,
          style: {"margin-bottom":"14px"},
          title: '网站 ' + _ctx.result.site + ' 已创建'
        }, null, 8 /* PROPS */, ["title"]),
        (_ctx.result.db && _ctx.result.db.ok)
          ? (_openBlock(), _createElementBlock("div", _hoisted_18, [
              _cache[33] || (_cache[33] = _createElementVNode("div", { class: "cred-title" }, "数据库（MySQL）", -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_19, [
                _cache[30] || (_cache[30] = _createElementVNode("span", null, "数据库名", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.db.db), 1 /* TEXT */)
              ]),
              _createElementVNode("div", _hoisted_20, [
                _cache[31] || (_cache[31] = _createElementVNode("span", null, "账号", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.db.user), 1 /* TEXT */)
              ]),
              _createElementVNode("div", _hoisted_21, [
                _cache[32] || (_cache[32] = _createElementVNode("span", null, "密码", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.db.password), 1 /* TEXT */)
              ])
            ]))
          : (_ctx.result.db)
            ? (_openBlock(), _createBlock(_component_el_alert, {
                key: 1,
                type: "warning",
                closable: false,
                style: {"margin-bottom":"10px"},
                title: '数据库未创建：' + _ctx.result.db.error
              }, null, 8 /* PROPS */, ["title"]))
            : _createCommentVNode("v-if", true),
        (_ctx.result.ftp && _ctx.result.ftp.ok)
          ? (_openBlock(), _createElementBlock("div", _hoisted_22, [
              _cache[37] || (_cache[37] = _createElementVNode("div", { class: "cred-title" }, "FTP 账号", -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_23, [
                _cache[34] || (_cache[34] = _createElementVNode("span", null, "账号", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.ftp.user), 1 /* TEXT */)
              ]),
              _createElementVNode("div", _hoisted_24, [
                _cache[35] || (_cache[35] = _createElementVNode("span", null, "密码", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.ftp.password), 1 /* TEXT */)
              ]),
              _createElementVNode("div", _hoisted_25, [
                _cache[36] || (_cache[36] = _createElementVNode("span", null, "目录", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.result.ftp.dir), 1 /* TEXT */)
              ])
            ]))
          : (_ctx.result.ftp)
            ? (_openBlock(), _createBlock(_component_el_alert, {
                key: 3,
                type: "warning",
                closable: false,
                style: {"margin-bottom":"10px"},
                title: 'FTP 未创建：' + _ctx.result.ftp.error
              }, null, 8 /* PROPS */, ["title"]))
            : _createCommentVNode("v-if", true),
        _cache[39] || (_cache[39] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"10px"} }, " 凭据仅本次展示，请立即复制保存；数据库可在「数据库管理」中维护，网站可随时申请 SSL 证书。 ", -1 /* CACHED */))
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.confDialog.show,
      "onUpdate:modelValue": _cache[13] || (_cache[13] = $event => ((_ctx.confDialog.show) = $event)),
      title: 'Nginx 配置 · ' + _ctx.confDialog.title,
      width: "720px"
    }, {
      default: _withCtx(() => [
        _createElementVNode("pre", _hoisted_27, _toDisplayString(_ctx.confDialog.config), 1 /* TEXT */)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.setForm.show,
      "onUpdate:modelValue": _cache[51] || (_cache[51] = $event => ((_ctx.setForm.show) = $event)),
      title: '网站设置 · ' + _ctx.setForm.domain,
      width: "560px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_button, {
            onClick: _cache[50] || (_cache[50] = $event => (_ctx.setForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[60] || (_cache[60] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.saveSettings
          }, {
            default: _withCtx(() => [...(_cache[61] || (_cache[61] = [
              _createTextVNode("保存并生效", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "100px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "伪静态" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.setForm.pseudo,
                  "onUpdate:modelValue": _cache[52] || (_cache[52] = $event => ((_ctx.setForm.pseudo) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.setForm.presets, (p) => {
                      return (_openBlock(), _createBlock(_component_el_option, {
                        key: p.key,
                        label: p.name,
                        value: p.key
                      }, null, 8 /* PROPS */, ["label", "value"]))
                    }), 256 /* UNKEYED_FRAGMENT */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.setForm.pseudo === 'custom')
              ? (_openBlock(), _createBlock(_component_el_form_item, {
                  key: 0,
                  label: "自定义规则"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.setForm.custom_pseudo,
                      "onUpdate:modelValue": _cache[53] || (_cache[53] = $event => ((_ctx.setForm.custom_pseudo) = $event)),
                      type: "textarea",
                      rows: 3,
                      class: "code-editor",
                      placeholder: "如：try_files $uri $uri/ /index.php?$args;"
                    }, null, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true),
            _createVNode(_component_el_form_item, { label: "301 重定向" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.setForm.redirect,
                  "onUpdate:modelValue": _cache[54] || (_cache[54] = $event => ((_ctx.setForm.redirect) = $event)),
                  placeholder: "留空不重定向；如 https://www.rt888.icu 或 /new-path"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "目录密码" }, {
              default: _withCtx(() => [
                _createElementVNode("div", { style: {"display":"flex","gap":"8px","width":"100%"} }, [
                  _createVNode(_component_el_input, {
                    modelValue: _ctx.setForm.auth_user,
                    "onUpdate:modelValue": _cache[56] || (_cache[56] = $event => ((_ctx.setForm.auth_user) = $event)),
                    placeholder: "用户名（留空关闭密码保护）",
                    style: {"flex":"1"}
                  }, null, 8 /* PROPS */, ["modelValue"]),
                  _createVNode(_component_el_input, {
                    modelValue: _ctx.setForm.auth_pass,
                    "onUpdate:modelValue": _cache[57] || (_cache[57] = $event => ((_ctx.setForm.auth_pass) = $event)),
                    placeholder: "密码",
                    "show-password": "",
                    style: {"flex":"1"}
                  }, null, 8 /* PROPS */, ["modelValue"])
                ])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "防盗链" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.setForm.hotlink,
                  "onUpdate:modelValue": _cache[58] || (_cache[58] = $event => ((_ctx.setForm.hotlink) = $event)),
                  placeholder: "允许来源域名（空格分隔），留空关闭；如 rt888.icu www.rt888.icu"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }),
        _createVNode(_component_el_alert, {
          type: "info",
          closable: false,
          style: {"margin-bottom":"6px"},
          title: "保存后自动重载 Nginx 生效；伪静态预设覆盖主流程序（WordPress/Typecho/ThinkPHP/Laravel/Discuz/Z-Blog/帝国CMS），支持自定义规则。"
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
    _createCommentVNode(" 网站日志对话框 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.logDialog.show,
      "onUpdate:modelValue": $event => ((_ctx.logDialog.show) = $event),
      title: '网站日志 · ' + _ctx.logDialog.domain,
      width: "780px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_17, [
          _createVNode(_component_el_button, {
            onClick: $event => (_ctx.logDialog.show = false)
          }, {
            default: _withCtx(() => [...(_cache[66] || (_cache[66] = [
              _createTextVNode("关闭", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          })
        ])
      ]),
      default: _withCtx(() => [
        _createElementVNode("div", { style: {"display":"flex","gap":"8px","align-items":"center","margin-bottom":"10px"} }, [
          _createVNode(_component_el_radio_group, {
            modelValue: _ctx.logDialog.type,
            "onUpdate:modelValue": $event => ((_ctx.logDialog.type) = $event),
            size: "small",
            onChange: _ctx.loadLogs
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_radio_button, { value: "access" }, {
                default: _withCtx(() => [...(_cache[63] || (_cache[63] = [
                  _createTextVNode("访问日志 access", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_radio_button, { value: "error" }, {
                default: _withCtx(() => [...(_cache[64] || (_cache[64] = [
                  _createTextVNode("错误日志 error", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"]),
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _ctx.loadLogs
          }, {
            default: _withCtx(() => [...(_cache[65] || (_cache[65] = [
              _createTextVNode("刷新", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ]),
        (_ctx.logDialog.error)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              type: "warning",
              closable: false,
              style: {"margin-bottom":"10px"},
              title: _ctx.logDialog.error
            }, null, 8 /* PROPS */, ["title"]))
          : _createCommentVNode("v-if", true),
        _createElementVNode("pre", _hoisted_27, _toDisplayString(_ctx.logDialog.text || '（暂无日志内容）'), 1 /* TEXT */)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
  ]))
} })(),
}
