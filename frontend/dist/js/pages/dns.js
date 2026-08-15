// DNS 工具
import api from '../api.js'
import { hasPerm } from '../util.js'

export default {
  data() {
    return {
      hosts: [], rawHosts: '', hostsError: '',
      resolv: { raw: '', nameservers: [], error: '' },
      editForm: { show: false, index: -1, ip: '', domain: '', comment: '' },
      saving: false,
    }
  },
  mounted() { this.load() },
  methods: {
    hasPerm,
    async load() {
      await Promise.all([this.loadHosts(), this.loadResolv()])
    },
    async loadHosts() {
      try {
        const r = await api.get('/dns/hosts')
        this.hosts = r.list || []
        this.rawHosts = r.raw || ''
        this.hostsError = r.error || ''
      } catch (e) { this.hosts = [] }
    },
    async loadResolv() {
      try {
        const r = await api.get('/dns/resolv')
        this.resolv = { raw: r.raw || '', nameservers: r.nameservers || [], error: r.error || '' }
      } catch (e) {}
    },
    addEntry() {
      this.editForm = { show: true, index: -1, ip: '', domain: '', comment: '' }
    },
    editEntry(row) {
      const idx = this.hosts.indexOf(row)
      this.editForm = { show: true, index: idx, ip: row.ip, domain: row.domain, comment: row.comment || '' }
    },
    removeEntry(row) {
      const idx = this.hosts.indexOf(row)
      if (idx >= 0) this.hosts.splice(idx, 1)
    },
    saveEntry() {
      const f = this.editForm
      if (!f.ip || !f.domain) return this.$message.warning('IP 与域名不能为空')
      if (f.index >= 0) this.hosts[f.index] = { ip: f.ip, domain: f.domain, comment: f.comment }
      else this.hosts.push({ ip: f.ip, domain: f.domain, comment: f.comment })
      this.editForm.show = false
      this.saveHosts()
    },
    async saveHosts() {
      this.saving = true
      try {
        await api.put('/dns/hosts', { entries: this.hosts })
        this.$message.success('hosts 已保存（原文件已备份 .rtbak）')
        await this.loadHosts()
      } catch (e) {} finally { this.saving = false }
    },
    async flushDns() {
      try {
        await this.$confirm('确定刷新本机 DNS 缓存？', '确认', { type: 'info' })
        await api.post('/dns/flush')
        this.$message.success('DNS 缓存已刷新')
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid-2" }
const _hoisted_3 = { class: "op-card" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = { class: "op-card" }
const _hoisted_6 = { class: "card-body" }
const _hoisted_7 = {
  key: 1,
  style: {"margin-bottom":"10px"}
}
const _hoisted_8 = {
  class: "mono",
  style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"12px","max-height":"220px","overflow":"auto","font-size":"12px","margin":"0"}
}
const _hoisted_9 = {
  class: "op-card",
  style: {"margin-top":"14px"}
}
const _hoisted_10 = { class: "card-title" }
const _hoisted_11 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400","margin-left":"10px"} }
const _hoisted_12 = { class: "card-body" }
const _hoisted_13 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_Plus = _resolveComponent("Plus")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[8] || (_cache[8] = _createElementVNode("div", { class: "card-title" }, [
          _createTextVNode(" DNS 缓存 "),
          _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400","margin-left":"10px"} }, "刷新本机解析缓存")
        ], -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_4, [
          (_ctx.hasPerm('dns:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                type: "primary",
                onClick: _ctx.flushDns
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Refresh)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[5] || (_cache[5] = _createTextVNode(" 刷新 DNS 缓存 ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]))
            : (_openBlock(), _createBlock(_component_el_tag, {
                key: 1,
                size: "small"
              }, {
                default: _withCtx(() => [...(_cache[6] || (_cache[6] = [
                  _createTextVNode("只读（无 dns:manage 权限）", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              })),
          _cache[7] || (_cache[7] = _createElementVNode("div", { style: {"margin-top":"12px","color":"var(--text-secondary)","font-size":"12px"} }, "修改 hosts 或 resolv.conf 后刷新可立即生效；操作将被审计记录。", -1 /* CACHED */))
        ])
      ]),
      _createElementVNode("div", _hoisted_5, [
        _cache[9] || (_cache[9] = _createElementVNode("div", { class: "card-title" }, "上游 DNS（resolv.conf / 系统）", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_6, [
          (_ctx.resolv.error)
            ? (_openBlock(), _createBlock(_component_el_alert, {
                key: 0,
                title: _ctx.resolv.error,
                type: "warning",
                closable: false,
                style: {"margin-bottom":"10px"}
              }, null, 8 /* PROPS */, ["title"]))
            : _createCommentVNode("v-if", true),
          (_ctx.resolv.nameservers && _ctx.resolv.nameservers.length)
            ? (_openBlock(), _createElementBlock("div", _hoisted_7, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.resolv.nameservers, (n, i) => {
                  return (_openBlock(), _createBlock(_component_el_tag, {
                    key: i,
                    size: "small",
                    effect: "plain",
                    style: {"margin":"2px 6px 2px 0"}
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(n), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1024 /* DYNAMIC_SLOTS */))
                }), 128 /* KEYED_FRAGMENT */))
              ]))
            : _createCommentVNode("v-if", true),
          _createElementVNode("pre", _hoisted_8, _toDisplayString(_ctx.resolv.raw || '未读取到 DNS 配置'), 1 /* TEXT */)
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_9, [
      _createElementVNode("div", _hoisted_10, [
        _cache[11] || (_cache[11] = _createTextVNode(" hosts 解析条目 ", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_11, _toDisplayString(_ctx.hosts.length) + " 条", 1 /* TEXT */),
        (_ctx.hasPerm('dns:manage'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 0,
              size: "small",
              type: "primary",
              style: {"margin-left":"auto"},
              onClick: _ctx.addEntry
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Plus)
                  ]),
                  _: 1 /* STABLE */
                }),
                _cache[10] || (_cache[10] = _createTextVNode(" 添加条目 ", -1 /* CACHED */))
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["onClick"]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_12, [
        (_ctx.hostsError)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              title: _ctx.hostsError,
              type: "warning",
              closable: false,
              style: {"margin-bottom":"10px"}
            }, null, 8 /* PROPS */, ["title"]))
          : _createCommentVNode("v-if", true),
        _createVNode(_component_el_table, {
          data: _ctx.hosts,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "ip",
              label: "IP",
              width: "180"
            }),
            _createVNode(_component_el_table_column, {
              prop: "domain",
              label: "域名",
              "min-width": "200",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "comment",
              label: "注释",
              "min-width": "160",
              "show-overflow-tooltip": ""
            }),
            (_ctx.hasPerm('dns:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "150"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.editEntry(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                        _createTextVNode("编辑", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.removeEntry(s.row))
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
        }, 8 /* PROPS */, ["data"]),
        (_ctx.hasPerm('dns:manage'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 1,
              size: "small",
              type: "primary",
              plain: "",
              style: {"margin-top":"10px"},
              loading: _ctx.saving,
              onClick: _ctx.saveHosts
            }, {
              default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
                _createTextVNode("保存到 hosts", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading", "onClick"]))
          : _createCommentVNode("v-if", true)
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.editForm.show,
      "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.editForm.show) = $event)),
      title: "编辑 hosts 条目",
      width: "480px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_13, [
          _createVNode(_component_el_button, {
            onClick: _cache[3] || (_cache[3] = $event => (_ctx.editForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.saveEntry
          }, {
            default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "80px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "IP 地址" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.editForm.ip,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.editForm.ip) = $event)),
                  placeholder: "如 127.0.0.1 或 ::1"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "域名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.editForm.domain,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.editForm.domain) = $event)),
                  placeholder: "如 dev.local"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "注释" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.editForm.comment,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.editForm.comment) = $event)),
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
