// Created by 小杜 on 2026/08

// 网站二级管理页（宝塔式：基本/高级/SSL/日志/配置 五个页签）
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

const { ElMessage } = window.ElementPlus

export default {
  data() {
    return {
      id: null,
      site: null,
      tab: 'basic',
      basic: { domain: '', type: 'static', port: 80, root: '', target: '', status: 1 },
      adv: { pseudo: '', custom_pseudo: '', redirect: '', auth_user: '',
             auth_pass: '', hotlink: '', presets: [], domains: '',
             force_https: false, index_doc: '' },
      ssl: { certs: [], selfForm: { show: false, domain: '', days: 365 },
             leForm: { show: false, domain: '', email: '' }, issuing: false },
      logs: { type: 'access', text: '', lines: 200, error: '', loading: false },
      conf: '',
      confLoading: false,
    }
  },
  mounted() {
    this.id = parseInt(this.$route.params.id)
    this.load()
  },
  methods: {
    fmtTime, hasPerm,
    async load() {
      try {
        const r = await api.get(`/websites/${this.id}`)
        this.site = r.site
        this.basic = { domain: r.site.domain, type: r.site.type, port: r.site.port,
                       root: r.site.root, target: r.site.config || '', status: r.site.status }
        const s = r.site.settings || {}
        const pseudo = s.pseudo || ''
        this.adv = { pseudo: pseudo.startsWith('custom::') ? 'custom' : pseudo,
                     custom_pseudo: pseudo.startsWith('custom::') ? pseudo.split('::')[1] : '',
                     redirect: s.redirect || '', auth_user: s.auth_user || '',
                     auth_pass: '', hotlink: s.hotlink || '', presets: [],
                     domains: s.domains || '', force_https: !!s.force_https,
                     index_doc: s.index_doc || '' }
        this.loadPresets()
        this.loadCerts()
        this.loadLogs()
      } catch (e) {}
    },
    async loadPresets() {
      try {
        const r = await api.get(`/websites/${this.id}/settings`)
        this.adv.presets = r.pseudo_presets || []
      } catch (e) {}
    },
    async loadCerts() {
      try {
        const r = await api.get('/ssl/certs')
        this.ssl.certs = (r.list || []).filter(c =>
          !c.domain || c.domain === this.basic.domain || (c.domains || []).includes(this.basic.domain))
      } catch (e) {}
    },
    async loadLogs() {
      this.logs.loading = true
      try {
        const r = await api.get(`/websites/${this.id}/logs?type=${this.logs.type}&lines=${this.logs.lines}`)
        this.logs.text = r.text || ''
        this.logs.error = r.error || ''
      } catch (e) {} finally {
        this.logs.loading = false
      }
    },
    async loadConf() {
      this.confLoading = true
      try {
        const r = await api.get(`/websites/${this.id}/config`)
        this.conf = r.config || ''
      } catch (e) {} finally {
        this.confLoading = false
      }
    },
    async saveBasic() {
      try {
        await api.put(`/websites/${this.id}`, {
          root: this.basic.root, config: this.basic.target, port: this.basic.port })
        ElMessage.success('基本设置已保存并重载配置')
        this.load()
      } catch (e) {}
    },
    async saveAdv() {
      const f = this.adv
      if (f.auth_user && !f.auth_pass) return ElMessage.warning('设置了用户名则必须填写目录密码')
      try {
        await api.put(`/websites/${this.id}/settings`, f)
        ElMessage.success('高级设置已保存并重载配置')
        this.load()
      } catch (e) {}
    },
    async toggleSite() {
      try {
        await api.post(`/websites/${this.id}/action`, { action: 'toggle' })
        ElMessage.success(this.basic.status ? '网站已停用' : '网站已启用')
        this.load()
      } catch (e) {}
    },
    async issueLE() {
      if (!this.ssl.leForm.email) return ElMessage.warning('请填写邮箱（用于到期提醒）')
      this.ssl.issuing = true
      try {
        await api.post('/ssl/issue', { domain: this.basic.domain,
                                       email: this.ssl.leForm.email })
        ElMessage.success('Let\'s Encrypt 证书签发成功！')
        this.ssl.leForm.show = false
        this.loadCerts()
      } catch (e) {} finally {
        this.ssl.issuing = false
      }
    },
    async selfSign() {
      try {
        await api.post('/ssl/selfsigned', { domain: this.basic.domain,
                                            days: this.ssl.selfForm.days })
        ElMessage.success('自签名证书已生成')
        this.ssl.selfForm.show = false
        this.loadCerts()
      } catch (e) {}
    },
    async removeCert(row) {
      try {
        await this.$confirm(`删除证书 ${row.domain || ''}？`, '确认', { type: 'warning' })
        await api.delete(`/ssl/${row.id}`)
        this.loadCerts()
      } catch (e) {}
    },
    async renewCert(row) {
      try {
        await api.post(`/ssl/${row.id}/renew`)
        ElMessage.success('续期完成')
        this.loadCerts()
      } catch (e) {}
    },
    async removeSite() {
      try {
        await this.$confirm(`删除网站 ${this.basic.domain}？（站点目录不会被删除）`, '危险操作', { type: 'error' })
        await api.post(`/websites/${this.id}/action`, { action: 'delete' })
        ElMessage.success('已删除')
        this.$router.push('/websites')
      } catch (e) {}
    },
  },
  render: (function(){ const { resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, createTextVNode: _createTextVNode, toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock, resolveDirective: _resolveDirective, withDirectives: _withDirectives } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = {
  class: "site-detail-head",
  style: {"display":"flex","align-items":"center","gap":"10px","margin-bottom":"4px"}
}
const _hoisted_3 = {
  class: "gold-text",
  style: {"margin":"0"}
}
const _hoisted_4 = {
  class: "op-card",
  style: {"margin-top":"14px"}
}
const _hoisted_5 = { style: {"display":"flex","gap":"8px","width":"100%"} }
const _hoisted_6 = { style: {"margin-bottom":"12px","display":"flex","gap":"8px"} }
const _hoisted_7 = { class: "gold-text" }
const _hoisted_8 = { style: {"display":"flex","gap":"10px","align-items":"center","margin-bottom":"12px"} }
const _hoisted_9 = {
  class: "mono",
  style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"10px","padding":"14px","max-height":"460px","overflow":"auto","font-size":"12px","margin":"0","white-space":"pre-wrap"}
}
const _hoisted_10 = {
  class: "mono",
  style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"10px","padding":"14px","max-height":"500px","overflow":"auto","font-size":"12px","margin":"0"}
}
const _hoisted_11 = { class: "dialog-footer" }
const _hoisted_12 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_ArrowLeft = _resolveComponent("ArrowLeft")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_tab_pane = _resolveComponent("el-tab-pane")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_Key = _resolveComponent("Key")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_radio_button = _resolveComponent("el-radio-button")
  const _component_el_radio_group = _resolveComponent("el-radio-group")
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_tabs = _resolveComponent("el-tabs")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _directive_loading = _resolveDirective("loading")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createVNode(_component_el_button, {
        size: "small",
        onClick: _cache[0] || (_cache[0] = $event => (_ctx.$router.push('/websites')))
      }, {
        default: _withCtx(() => [
          _createVNode(_component_el_icon, null, {
            default: _withCtx(() => [
              _createVNode(_component_ArrowLeft)
            ]),
            _: 1 /* STABLE */
          }),
          _cache[23] || (_cache[23] = _createTextVNode(" 返回列表", -1 /* CACHED */))
        ]),
        _: 1 /* STABLE */
      }),
      _createElementVNode("h2", _hoisted_3, _toDisplayString(_ctx.site?.domain), 1 /* TEXT */),
      _createVNode(_component_el_tag, {
        size: "small",
        type: _ctx.basic.status ? 'success' : 'info'
      }, {
        default: _withCtx(() => [
          _createTextVNode(_toDisplayString(_ctx.basic.status ? '运行中' : '已停用'), 1 /* TEXT */)
        ]),
        _: 1 /* STABLE */
      }, 8 /* PROPS */, ["type"]),
      _createVNode(_component_el_tag, {
        size: "small",
        type: "warning"
      }, {
        default: _withCtx(() => [
          _createTextVNode(_toDisplayString(_ctx.basic.type === 'proxy' ? '反向代理' : '静态站点'), 1 /* TEXT */)
        ]),
        _: 1 /* STABLE */
      }),
      _cache[25] || (_cache[25] = _createElementVNode("div", { style: {"flex":"1"} }, null, -1 /* CACHED */)),
      _createVNode(_component_el_button, {
        size: "small",
        onClick: _ctx.toggleSite
      }, {
        default: _withCtx(() => [
          _createTextVNode(_toDisplayString(_ctx.basic.status ? '停用' : '启用'), 1 /* TEXT */)
        ]),
        _: 1 /* STABLE */
      }, 8 /* PROPS */, ["onClick"]),
      _createVNode(_component_el_button, {
        size: "small",
        type: "danger",
        plain: "",
        onClick: _ctx.removeSite
      }, {
        default: _withCtx(() => [...(_cache[24] || (_cache[24] = [
          _createTextVNode("删除网站", -1 /* CACHED */)
        ]))]),
        _: 1 /* STABLE */
      }, 8 /* PROPS */, ["onClick"])
    ]),
    _createElementVNode("div", _hoisted_4, [
      _createVNode(_component_el_tabs, {
        modelValue: _ctx.tab,
        "onUpdate:modelValue": _cache[16] || (_cache[16] = $event => ((_ctx.tab) = $event))
      }, {
        default: _withCtx(() => [
          _createVNode(_component_el_tab_pane, {
            label: "基本设置",
            name: "basic"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_form, {
                "label-width": "100px",
                style: {"max-width":"560px"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_form_item, { label: "域名" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_input, {
                        "model-value": _ctx.basic.domain,
                        disabled: ""
                      }, null, 8 /* PROPS */, ["model-value"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, { label: "端口" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_input_number, {
                        modelValue: _ctx.basic.port,
                        "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.basic.port) = $event)),
                        min: 1,
                        max: 65535,
                        style: {"width":"100%"}
                      }, null, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  (_ctx.basic.type === 'static')
                    ? (_openBlock(), _createBlock(_component_el_form_item, {
                        key: 0,
                        label: "站点目录"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_el_input, {
                            modelValue: _ctx.basic.root,
                            "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.basic.root) = $event)),
                            placeholder: "站点文件目录"
                          }, null, 8 /* PROPS */, ["modelValue"])
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : (_openBlock(), _createBlock(_component_el_form_item, {
                        key: 1,
                        label: "代理目标"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_el_input, {
                            modelValue: _ctx.basic.target,
                            "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.basic.target) = $event)),
                            placeholder: "http://127.0.0.1:8080"
                          }, null, 8 /* PROPS */, ["modelValue"])
                        ]),
                        _: 1 /* STABLE */
                      })),
                  _createVNode(_component_el_form_item, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_button, {
                        type: "primary",
                        onClick: _ctx.saveBasic
                      }, {
                        default: _withCtx(() => [...(_cache[26] || (_cache[26] = [
                          _createTextVNode("保存", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"])
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_tab_pane, {
            label: "高级设置",
            name: "adv"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_form, {
                "label-width": "100px",
                style: {"max-width":"560px"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_form_item, { label: "伪静态" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_select, {
                        modelValue: _ctx.adv.pseudo,
                        "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.adv.pseudo) = $event)),
                        style: {"width":"100%"}
                      }, {
                        default: _withCtx(() => [
                          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.adv.presets, (p) => {
                            return (_openBlock(), _createBlock(_component_el_option, {
                              key: p.key,
                              label: p.name,
                              value: p.key
                            }, null, 8 /* PROPS */, ["label", "value"]))
                          }), 128 /* KEYED_FRAGMENT */))
                        ]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  (_ctx.adv.pseudo === 'custom')
                    ? (_openBlock(), _createBlock(_component_el_form_item, {
                        key: 0,
                        label: "自定义规则"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_el_input, {
                            modelValue: _ctx.adv.custom_pseudo,
                            "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.adv.custom_pseudo) = $event)),
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
                        modelValue: _ctx.adv.redirect,
                        "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.adv.redirect) = $event)),
                        placeholder: "留空不重定向；如 https://www.rt888.icu"
                      }, null, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, { label: "目录密码" }, {
                    default: _withCtx(() => [
                      _createElementVNode("div", _hoisted_5, [
                        _createVNode(_component_el_input, {
                          modelValue: _ctx.adv.auth_user,
                          "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.adv.auth_user) = $event)),
                          placeholder: "用户名（留空关闭）",
                          style: {"flex":"1"}
                        }, null, 8 /* PROPS */, ["modelValue"]),
                        _createVNode(_component_el_input, {
                          modelValue: _ctx.adv.auth_pass,
                          "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.adv.auth_pass) = $event)),
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
                        modelValue: _ctx.adv.hotlink,
                        "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((_ctx.adv.hotlink) = $event)),
                        placeholder: "允许来源域名（空格分隔），留空关闭"
                      }, null, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, { label: "绑定域名" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_input, {
                        modelValue: _ctx.adv.domains,
                        "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.adv.domains) = $event)),
                        type: "textarea",
                        rows: 2,
                        placeholder: "每行一个，除主域名外可绑定多个域名（如 www.example.com）"
                      }, null, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, { label: "强制 HTTPS" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_switch, {
                        modelValue: _ctx.adv.force_https,
                        "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((_ctx.adv.force_https) = $event))
                      }, null, 8 /* PROPS */, ["modelValue"]),
                      _cache[27] || (_cache[27] = _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-left":"8px"} }, "HTTP 访问自动 301 跳转 HTTPS（需已部署证书）", -1 /* CACHED */))
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, { label: "默认文档" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_input, {
                        modelValue: _ctx.adv.index_doc,
                        "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((_ctx.adv.index_doc) = $event)),
                        placeholder: "留空默认 index.html index.htm index.php"
                      }, null, 8 /* PROPS */, ["modelValue"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_form_item, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_button, {
                        type: "primary",
                        onClick: _ctx.saveAdv
                      }, {
                        default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
                          _createTextVNode("保存并生效", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"])
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_tab_pane, {
            label: "SSL 证书",
            name: "ssl"
          }, {
            default: _withCtx(() => [
              _createElementVNode("div", _hoisted_6, [
                (_ctx.hasPerm('ssl:manage'))
                  ? (_openBlock(), _createBlock(_component_el_button, {
                      key: 0,
                      size: "small",
                      type: "primary",
                      onClick: _cache[13] || (_cache[13] = $event => (_ctx.ssl.leForm = { show: true, domain: _ctx.basic.domain, email: '' }))
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_el_icon, null, {
                          default: _withCtx(() => [
                            _createVNode(_component_Key)
                          ]),
                          _: 1 /* STABLE */
                        }),
                        _cache[29] || (_cache[29] = _createTextVNode(" 申请 Let's Encrypt ", -1 /* CACHED */))
                      ]),
                      _: 1 /* STABLE */
                    }))
                  : _createCommentVNode("v-if", true),
                (_ctx.hasPerm('ssl:manage'))
                  ? (_openBlock(), _createBlock(_component_el_button, {
                      key: 1,
                      size: "small",
                      onClick: _cache[14] || (_cache[14] = $event => (_ctx.ssl.selfForm = { show: true, domain: _ctx.basic.domain, days: 365 }))
                    }, {
                      default: _withCtx(() => [...(_cache[30] || (_cache[30] = [
                        _createTextVNode(" 生成自签名证书 ", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }))
                  : _createCommentVNode("v-if", true)
              ]),
              _createVNode(_component_el_alert, {
                type: "info",
                closable: false,
                style: {"margin-bottom":"12px"},
                title: "证书域名为本网站域名（自动锁定，无需输入）；Let's Encrypt 需域名已解析到本机且 80 端口可达。"
              }),
              _createVNode(_component_el_table, {
                data: _ctx.ssl.certs,
                size: "small"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_table_column, {
                    label: "域名",
                    "min-width": "160"
                  }, {
                    default: _withCtx((s) => [
                      _createElementVNode("b", _hoisted_7, _toDisplayString(s.row.domain), 1 /* TEXT */)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_table_column, {
                    label: "签发机构",
                    width: "140"
                  }, {
                    default: _withCtx((s) => [
                      _createTextVNode(_toDisplayString(s.row.issuer || '-'), 1 /* TEXT */)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_table_column, {
                    label: "到期时间",
                    width: "130"
                  }, {
                    default: _withCtx((s) => [
                      _createTextVNode(_toDisplayString(s.row.expires ? _ctx.fmtTime(s.row.expires) : '-'), 1 /* TEXT */)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_table_column, {
                    label: "剩余",
                    width: "90"
                  }, {
                    default: _withCtx((s) => [
                      _createVNode(_component_el_tag, {
                        size: "small",
                        type: s.row.expires && (s.row.expires * 1000 - Date.now()) / 86400000 < 20 ? 'danger' : 'success'
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(s.row.expires ? Math.ceil((s.row.expires * 1000 - Date.now()) / 86400000) + '天' : '-'), 1 /* TEXT */)
                        ]),
                        _: 2 /* DYNAMIC */
                      }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                    ]),
                    _: 1 /* STABLE */
                  }),
                  (_ctx.hasPerm('ssl:manage'))
                    ? (_openBlock(), _createBlock(_component_el_table_column, {
                        key: 0,
                        label: "操作",
                        width: "140"
                      }, {
                        default: _withCtx((s) => [
                          _createVNode(_component_el_button, {
                            size: "small",
                            onClick: $event => (_ctx.renewCert(s.row))
                          }, {
                            default: _withCtx(() => [...(_cache[31] || (_cache[31] = [
                              _createTextVNode("续期", -1 /* CACHED */)
                            ]))]),
                            _: 1 /* STABLE */
                          }, 8 /* PROPS */, ["onClick"]),
                          _createVNode(_component_el_button, {
                            size: "small",
                            type: "danger",
                            plain: "",
                            onClick: $event => (_ctx.removeCert(s.row))
                          }, {
                            default: _withCtx(() => [...(_cache[32] || (_cache[32] = [
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
            ]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_tab_pane, {
            label: "网站日志",
            name: "logs"
          }, {
            default: _withCtx(() => [
              _createElementVNode("div", _hoisted_8, [
                _createVNode(_component_el_radio_group, {
                  modelValue: _ctx.logs.type,
                  "onUpdate:modelValue": _cache[15] || (_cache[15] = $event => ((_ctx.logs.type) = $event)),
                  size: "small",
                  onChange: _ctx.loadLogs
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_radio_button, { value: "access" }, {
                      default: _withCtx(() => [...(_cache[33] || (_cache[33] = [
                        _createTextVNode("访问日志", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_radio_button, { value: "error" }, {
                      default: _withCtx(() => [...(_cache[34] || (_cache[34] = [
                        _createTextVNode("错误日志", -1 /* CACHED */)
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
                  default: _withCtx(() => [
                    _createVNode(_component_el_icon, null, {
                      default: _withCtx(() => [
                        _createVNode(_component_Refresh)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _cache[35] || (_cache[35] = _createTextVNode(" 刷新", -1 /* CACHED */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"])
              ]),
              (_ctx.logs.error)
                ? (_openBlock(), _createBlock(_component_el_alert, {
                    key: 0,
                    type: "warning",
                    closable: false,
                    title: _ctx.logs.error,
                    style: {"margin-bottom":"10px"}
                  }, null, 8 /* PROPS */, ["title"]))
                : _createCommentVNode("v-if", true),
              _withDirectives((_openBlock(), _createElementBlock("pre", _hoisted_9, [
                _createTextVNode(_toDisplayString(_ctx.logs.text || '暂无日志'), 1 /* TEXT */)
              ])), [
                [_directive_loading, _ctx.logs.loading]
              ])
            ]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_tab_pane, {
            label: "配置文件",
            name: "conf"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_button, {
                size: "small",
                style: {"margin-bottom":"12px"},
                onClick: _ctx.loadConf
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Refresh)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[36] || (_cache[36] = _createTextVNode(" 重新渲染 ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]),
              _withDirectives((_openBlock(), _createElementBlock("pre", _hoisted_10, [
                _createTextVNode(_toDisplayString(_ctx.conf || '点击「重新渲染」查看 Nginx 配置'), 1 /* TEXT */)
              ])), [
                [_directive_loading, _ctx.confLoading]
              ])
            ]),
            _: 1 /* STABLE */
          })
        ]),
        _: 1 /* STABLE */
      }, 8 /* PROPS */, ["modelValue"])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.ssl.leForm.show,
      "onUpdate:modelValue": _cache[19] || (_cache[19] = $event => ((_ctx.ssl.leForm.show) = $event)),
      title: "申请 Let's Encrypt 证书",
      width: "440px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_11, [
          _createVNode(_component_el_button, {
            onClick: _cache[18] || (_cache[18] = $event => (_ctx.ssl.leForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[37] || (_cache[37] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            loading: _ctx.ssl.issuing,
            onClick: _ctx.issueLE
          }, {
            default: _withCtx(() => [...(_cache[38] || (_cache[38] = [
              _createTextVNode("申请", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["loading", "onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "域名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  "model-value": _ctx.ssl.leForm.domain,
                  disabled: ""
                }, null, 8 /* PROPS */, ["model-value"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "邮箱" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.ssl.leForm.email,
                  "onUpdate:modelValue": _cache[17] || (_cache[17] = $event => ((_ctx.ssl.leForm.email) = $event)),
                  placeholder: "用于到期提醒"
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
      modelValue: _ctx.ssl.selfForm.show,
      "onUpdate:modelValue": _cache[22] || (_cache[22] = $event => ((_ctx.ssl.selfForm.show) = $event)),
      title: "生成自签名证书",
      width: "440px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_12, [
          _createVNode(_component_el_button, {
            onClick: _cache[21] || (_cache[21] = $event => (_ctx.ssl.selfForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[39] || (_cache[39] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.selfSign
          }, {
            default: _withCtx(() => [...(_cache[40] || (_cache[40] = [
              _createTextVNode("生成", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "域名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  "model-value": _ctx.ssl.selfForm.domain,
                  disabled: ""
                }, null, 8 /* PROPS */, ["model-value"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "有效期" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.ssl.selfForm.days,
                  "onUpdate:modelValue": _cache[20] || (_cache[20] = $event => ((_ctx.ssl.selfForm.days) = $event)),
                  min: 1,
                  max: 3650,
                  style: {"width":"100%"}
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
