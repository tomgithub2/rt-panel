// Created by 小杜 on 2026/08

// 软件商店
import api from '../api.js'
import { hasPerm } from '../util.js'

export default {
  data() {
    return {
      list: [], platform: '', filter: '', installing: '', installs: [], timer: null,
      deployApps: [
        { key: 'wordpress', name: 'WordPress', desc: '全球最流行的博客 / CMS 建站程序' },
        { key: 'discuz', name: 'Discuz! X', desc: '经典中文论坛社区程序' },
        { key: 'typecho', name: 'Typecho', desc: '轻量级开源博客程序' },
        { key: 'zblog', name: 'Z-Blog PHP', desc: '国产开源博客系统' },
      ],
      deployForm: { show: false, app: 'wordpress', appName: 'WordPress', domain: '', port: 80, running: false },
      deployResult: { show: false, ok: false, app: '', url: '', site_id: 0, db: null, error: '' },
    }
  },
  mounted() { this.load(); this.timer = setInterval(() => this.loadInstallStatus(), 8000) },
  beforeUnmount() { clearInterval(this.timer) },
  computed: {
    filtered() { return this.list.filter(x => !this.filter || x.cat === this.filter) },
    cats() { return [...new Set(this.list.map(x => x.cat))] },
  },
  methods: {
    hasPerm,
    async load() {
      try {
        const r = await api.get('/software/catalog')
        this.list = r.list; this.platform = r.platform
      } catch (e) {}
    },
    async loadInstallStatus() {
      try { this.installs = (await api.get('/software/install-status')).list } catch (e) {}
    },
    async install(row) {
      try {
        await this.$confirm(`将在后台安装 ${row.name}，耗时可能较长，继续？`, '安装确认', { type: 'info' })
        this.installing = row.key
        await api.post('/software/install', { key: row.key })
        this.$message.success('安装任务已提交，请在下方安装记录中查看进度')
        setTimeout(() => { this.installing = ''; this.load(); this.loadInstallStatus() }, 3000)
      } catch (e) { this.installing = '' }
    },
    openDeploy(app) {
      this.deployForm = { show: true, app: app.key, appName: app.name, domain: '', port: 80, running: false }
      this.deployResult = { show: false, ok: false, app: '', url: '', site_id: 0, db: null, error: '' }
    },
    async doDeploy() {
      const f = this.deployForm
      if (!f.domain) return this.$message.warning('请输入域名')
      f.running = true
      try {
        const r = await api.post('/software/deploy', { app: f.app, domain: f.domain, port: f.port })
        this.deployResult = { show: true, ok: r.ok !== false, app: r.app || f.app,
                              url: r.url || '', site_id: r.site_id || 0,
                              db: r.db || null, error: r.error || '' }
        this.deployForm.show = false
        this.load()
      } catch (e) {
      } finally { f.running = false }
    },
  },
  render: (function(){ const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400","margin-left":"10px"} }
const _hoisted_5 = { class: "card-body" }
const _hoisted_6 = {
  class: "op-toolbar",
  style: {"margin-bottom":"12px"}
}
const _hoisted_7 = { style: {"display":"grid","grid-template-columns":"repeat(auto-fill,minmax(250px,1fr))","gap":"14px"} }
const _hoisted_8 = { style: {"display":"flex","align-items":"center","justify-content":"space-between"} }
const _hoisted_9 = { style: {"font-size":"15px"} }
const _hoisted_10 = { style: {"color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_11 = {
  class: "mono",
  style: {"color":"var(--text-regular)","font-size":"12px","height":"18px","overflow":"hidden"}
}
const _hoisted_12 = {
  key: 0,
  style: {"color":"var(--text-secondary)","font-size":"12px","line-height":"1.6"}
}
const _hoisted_13 = {
  class: "op-card",
  style: {"margin-top":"14px"}
}
const _hoisted_14 = { class: "card-body" }
const _hoisted_15 = { style: {"display":"grid","grid-template-columns":"repeat(auto-fill,minmax(240px,1fr))","gap":"14px"} }
const _hoisted_16 = { style: {"font-size":"15px"} }
const _hoisted_17 = { style: {"color":"var(--text-secondary)","font-size":"12px","line-height":"1.6"} }
const _hoisted_18 = {
  class: "op-card",
  style: {"margin-top":"14px"}
}
const _hoisted_19 = { class: "card-body" }
const _hoisted_20 = { class: "dialog-footer" }
const _hoisted_21 = {
  key: 2,
  style: {"margin-top":"8px"}
}
const _hoisted_22 = { style: {"margin-bottom":"4px"} }
const _hoisted_23 = { style: {"margin-bottom":"4px"} }
const _hoisted_24 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_radio_button = _resolveComponent("el-radio-button")
  const _component_el_radio_group = _resolveComponent("el-radio-group")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[7] || (_cache[7] = _createTextVNode(" 软件商店 ", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_4, "平台: " + _toDisplayString(_ctx.platform), 1 /* TEXT */)
      ]),
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_radio_group, {
            modelValue: _ctx.filter,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.filter) = $event))
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_radio_button, { value: "" }, {
                default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
                  _createTextVNode("全部", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.cats, (c) => {
                return (_openBlock(), _createBlock(_component_el_radio_button, {
                  key: c,
                  value: c
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(c), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["value"]))
              }), 128 /* KEYED_FRAGMENT */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue"]),
          _cache[9] || (_cache[9] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
          _createVNode(_component_el_button, {
            icon: "Refresh",
            circle: "",
            onClick: _ctx.load
          }, null, 8 /* PROPS */, ["onClick"])
        ]),
        _createElementVNode("div", _hoisted_7, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.filtered, (s) => {
            return (_openBlock(), _createElementBlock("div", {
              key: s.key,
              class: "op-card",
              style: {"padding":"18px","display":"flex","flex-direction":"column","gap":"10px"}
            }, [
              _createElementVNode("div", _hoisted_8, [
                _createElementVNode("b", _hoisted_9, _toDisplayString(s.name), 1 /* TEXT */),
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.installed ? 'success' : 'info'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.installed ? '已安装' : '未安装'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _createElementVNode("div", _hoisted_10, _toDisplayString(s.cat), 1 /* TEXT */),
              _createElementVNode("div", _hoisted_11, _toDisplayString(s.version || (s.installed ? '' : '未检测到')), 1 /* TEXT */),
              (s.note)
                ? (_openBlock(), _createElementBlock("div", _hoisted_12, _toDisplayString(s.note), 1 /* TEXT */))
                : _createCommentVNode("v-if", true),
              (!s.installed && _ctx.hasPerm('software:manage'))
                ? (_openBlock(), _createBlock(_component_el_button, {
                    key: 1,
                    size: "small",
                    type: "primary",
                    plain: "",
                    disabled: !s.installable || _ctx.installing === s.key,
                    loading: _ctx.installing === s.key,
                    onClick: $event => (_ctx.install(s))
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(s.installable ? '一键安装' : '需手动安装'), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["disabled", "loading", "onClick"]))
                : (s.installed)
                  ? (_openBlock(), _createBlock(_component_el_tag, {
                      key: 2,
                      size: "small",
                      style: {"align-self":"flex-start"}
                    }, {
                      default: _withCtx(() => [...(_cache[10] || (_cache[10] = [
                        _createTextVNode("✓ 运行正常", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }))
                  : _createCommentVNode("v-if", true)
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_13, [
      _cache[13] || (_cache[13] = _createElementVNode("div", { class: "card-title" }, [
        _createTextVNode(" 一键部署 "),
        _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400","margin-left":"10px"} }, "自动建库 + 建站 + 下载源码 + 解压到站点根")
      ], -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_14, [
        _createElementVNode("div", _hoisted_15, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.deployApps, (a) => {
            return (_openBlock(), _createElementBlock("div", {
              key: a.key,
              class: "op-card",
              style: {"padding":"18px","display":"flex","flex-direction":"column","gap":"10px"}
            }, [
              _createElementVNode("b", _hoisted_16, _toDisplayString(a.name), 1 /* TEXT */),
              _createElementVNode("div", _hoisted_17, _toDisplayString(a.desc), 1 /* TEXT */),
              (_ctx.hasPerm('software:manage'))
                ? (_openBlock(), _createBlock(_component_el_button, {
                    key: 0,
                    size: "small",
                    type: "primary",
                    plain: "",
                    style: {"align-self":"flex-start"},
                    onClick: $event => (_ctx.openDeploy(a))
                  }, {
                    default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                      _createTextVNode("部署", -1 /* CACHED */)
                    ]))]),
                    _: 1 /* STABLE */
                  }, 8 /* PROPS */, ["onClick"]))
                : (_openBlock(), _createBlock(_component_el_tag, {
                    key: 1,
                    size: "small",
                    style: {"align-self":"flex-start"}
                  }, {
                    default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                      _createTextVNode("无权限", -1 /* CACHED */)
                    ]))]),
                    _: 1 /* STABLE */
                  }))
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_18, [
      _cache[14] || (_cache[14] = _createElementVNode("div", { class: "card-title" }, "安装记录", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_19, [
        _createVNode(_component_el_table, {
          data: _ctx.installs,
          size: "small",
          "max-height": "260"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "软件",
              width: "120"
            }),
            _createVNode(_component_el_table_column, {
              prop: "action",
              label: "操作",
              width: "100"
            }),
            _createVNode(_component_el_table_column, {
              label: "时间",
              width: "170"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(new Date(s.row.ts * 1000).toLocaleString()), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "结果",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.row.exit_code === 0 ? 'success' : 'danger'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.exit_code === 0 ? '成功' : '失败'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "output",
              label: "输出",
              "min-width": "200",
              "show-overflow-tooltip": ""
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data"])
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.deployForm.show,
      "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.deployForm.show) = $event)),
      title: "一键部署",
      width: "480px",
      "close-on-click-modal": false
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_20, [
          _createVNode(_component_el_button, {
            onClick: _cache[3] || (_cache[3] = $event => (_ctx.deployForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            loading: _ctx.deployForm.running,
            onClick: _ctx.doDeploy
          }, {
            default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
              _createTextVNode("开始部署", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["loading", "onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "80px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "应用" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  "model-value": _ctx.deployForm.appName,
                  disabled: ""
                }, null, 8 /* PROPS */, ["model-value"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "域名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.deployForm.domain,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.deployForm.domain) = $event)),
                  placeholder: "example.com（自动建库 + 建站）"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "端口" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.deployForm.port,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.deployForm.port) = $event)),
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
        _createVNode(_component_el_alert, {
          type: "info",
          closable: "false",
          title: "将自动检测 MySQL 并创建同名数据库、创建网站、下载源码包解压到站点根目录，请确保域名已解析且端口可用。"
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.deployResult.show,
      "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.deployResult.show) = $event)),
      title: "部署结果",
      width: "560px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_24, [
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _cache[5] || (_cache[5] = $event => (_ctx.deployResult.show = false))
          }, {
            default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
              _createTextVNode("我知道了", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          })
        ])
      ]),
      default: _withCtx(() => [
        (_ctx.deployResult.ok)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              type: "success",
              closable: "false",
              title: '部署成功：' + _ctx.deployResult.url,
              style: {"margin-bottom":"12px"}
            }, null, 8 /* PROPS */, ["title"]))
          : (_openBlock(), _createBlock(_component_el_alert, {
              key: 1,
              type: "error",
              closable: "false",
              title: _ctx.deployResult.error || '部署失败',
              style: {"margin-bottom":"12px"}
            }, null, 8 /* PROPS */, ["title"])),
        (_ctx.deployResult.db && _ctx.deployResult.db.ok)
          ? (_openBlock(), _createElementBlock("div", _hoisted_21, [
              _cache[20] || (_cache[20] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"6px"} }, "数据库（MySQL）", -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_22, [
                _cache[17] || (_cache[17] = _createElementVNode("span", { style: {"color":"var(--text-secondary)"} }, "数据库名 ", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.deployResult.db.db), 1 /* TEXT */)
              ]),
              _createElementVNode("div", _hoisted_23, [
                _cache[18] || (_cache[18] = _createElementVNode("span", { style: {"color":"var(--text-secondary)"} }, "账号 ", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.deployResult.db.user), 1 /* TEXT */)
              ]),
              _createElementVNode("div", null, [
                _cache[19] || (_cache[19] = _createElementVNode("span", { style: {"color":"var(--text-secondary)"} }, "密码 ", -1 /* CACHED */)),
                _createElementVNode("code", null, _toDisplayString(_ctx.deployResult.db.password), 1 /* TEXT */)
              ])
            ]))
          : _createCommentVNode("v-if", true)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })(),
}
