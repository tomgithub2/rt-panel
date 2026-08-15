// 网络工具
import api from '../api.js'
import { fmtBytes, fmtRate, hasPerm } from '../util.js'

export default {
  data() {
    return {
      nics: [], totalRx: 0, totalTx: 0,
      tools: { host: '', count: 4 }, toolOutput: '', toolRunning: false,
      routeRaw: '', arpRaw: '', connections: null,
      scan: { host: '127.0.0.1', start: 1, end: 1024, result: null, running: false },
    }
  },
  mounted() { this.load() },
  methods: {
    fmtBytes, fmtRate, hasPerm,
    async load() {
      try {
        const r = await api.get('/network/interfaces')
        this.nics = r.nics || []
        this.totalRx = r.bytes_recv; this.totalTx = r.bytes_sent
        this.connections = await api.get('/network/connections')
        const route = await api.get('/network/routes')
        this.routeRaw = route.raw || (route.list || []).map(x => `${x.dest}/${x.mask} via ${x.gateway}`).join('\n')
        this.arpRaw = (await api.get('/network/arp')).raw
      } catch (e) {}
    },
    async runTool(name) {
      if (!this.tools.host) return this.$message.warning('请输入目标主机')
      this.toolRunning = true
      this.toolOutput = '执行中…\n'
      try {
        const r = await api.post(`/network/${name}`, { host: this.tools.host, count: this.tools.count })
        this.toolOutput = r.output || '(无输出)'
      } catch (e) {} finally {
        this.toolRunning = false
      }
    },
    async dns() {
      if (!this.tools.host) return this.$message.warning('请输入域名')
      this.toolRunning = true
      try {
        const r = await api.post('/network/dns', { domain: this.tools.host })
        this.toolOutput = r.ok
          ? r.list.map(x => `${x.address}  (family ${x.family})`).join('\n')
          : '解析失败: ' + r.error
      } catch (e) {} finally { this.toolRunning = false }
    },
    async portCheck() {
      try {
        const { value } = await this.$prompt(`检测 ${this.tools.host} 的端口：`, '端口检测', { inputValue: '443' })
        const r = await api.post('/network/port-check', { host: this.tools.host, port: parseInt(value) })
        this.toolOutput = `端口 ${r.port}: ${r.open ? '开放 ✔' : '关闭/不可达 ✘'} (${r.elapsed_ms}ms)`
      } catch (e) {}
    },
    async runScan() {
      this.scan.running = true
      this.scan.result = null
      try {
        this.scan.result = await api.post('/network/scan', this.scan)
      } catch (e) {} finally { this.scan.running = false }
    },
  },
  render: (function(){ const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, withKeys: _withKeys, createBlock: _createBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid" }
const _hoisted_3 = { class: "op-card" }
const _hoisted_4 = { class: "card-title" }
const _hoisted_5 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_6 = { class: "card-body" }
const _hoisted_7 = { style: {"margin-top":"14px"} }
const _hoisted_8 = { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"6px"} }
const _hoisted_9 = { class: "gold-text" }
const _hoisted_10 = { class: "op-card" }
const _hoisted_11 = { class: "card-body" }
const _hoisted_12 = {
  class: "op-toolbar",
  style: {"margin-bottom":"12px"}
}
const _hoisted_13 = { style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"12px","height":"380px","overflow":"auto","font-size":"12px","margin":"0","white-space":"pre-wrap","word-break":"break-all","color":"var(--text-regular)"} }
const _hoisted_14 = { class: "chart-grid-2" }
const _hoisted_15 = { class: "op-card" }
const _hoisted_16 = { class: "card-body" }
const _hoisted_17 = { class: "op-toolbar" }
const _hoisted_18 = {
  key: 0,
  style: {"margin-top":"12px"}
}
const _hoisted_19 = { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"6px"} }
const _hoisted_20 = { class: "gold-text" }
const _hoisted_21 = { style: {"display":"flex","flex-wrap":"wrap","gap":"6px"} }
const _hoisted_22 = { class: "op-card" }
const _hoisted_23 = { class: "card-body" }
const _hoisted_24 = { style: {"max-height":"260px","overflow":"auto","font-size":"12px","margin":"0"} }
const _hoisted_25 = { style: {"max-height":"260px","overflow":"auto","font-size":"12px","margin":"0"} }

return function render(_ctx, _cache) {
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_tab_pane = _resolveComponent("el-tab-pane")
  const _component_el_tabs = _resolveComponent("el-tabs")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _cache[7] || (_cache[7] = _createTextVNode("网络接口 ", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_5, "累计 ↓ " + _toDisplayString(_ctx.fmtBytes(_ctx.totalRx)) + " ↑ " + _toDisplayString(_ctx.fmtBytes(_ctx.totalTx)), 1 /* TEXT */)
        ]),
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_table, {
            data: _ctx.nics,
            size: "small",
            height: "300"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "name",
                label: "接口",
                width: "140"
              }),
              _createVNode(_component_el_table_column, {
                label: "状态",
                width: "80"
              }, {
                default: _withCtx((s) => [
                  _createVNode(_component_el_tag, {
                    size: "small",
                    type: s.row.up ? 'success' : 'danger'
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(s.row.up ? 'UP' : 'DOWN'), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "地址",
                "min-width": "200"
              }, {
                default: _withCtx((s) => [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(s.row.addrs, (a) => {
                    return (_openBlock(), _createElementBlock("span", {
                      key: a.address,
                      style: {"margin-right":"8px"},
                      class: "mono"
                    }, [
                      (a.family.includes('AF_INET'))
                        ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                            _createTextVNode(_toDisplayString(a.address), 1 /* TEXT */)
                          ], 64 /* STABLE_FRAGMENT */))
                        : _createCommentVNode("v-if", true)
                    ]))
                  }), 128 /* KEYED_FRAGMENT */))
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "速率",
                width: "110"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(s.row.speed > 0 ? s.row.speed + ' Mbps' : '-'), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                prop: "mtu",
                label: "MTU",
                width: "80"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["data"]),
          _createElementVNode("div", _hoisted_7, [
            _createElementVNode("div", _hoisted_8, [
              _cache[8] || (_cache[8] = _createTextVNode("连接统计：总数 ", -1 /* CACHED */)),
              _createElementVNode("b", _hoisted_9, _toDisplayString(_ctx.connections?.total || 0), 1 /* TEXT */)
            ]),
            _createVNode(_component_el_table, {
              data: _ctx.connections?.list?.slice(0, 12) || [],
              size: "small",
              "max-height": "200"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  prop: "endpoint",
                  label: "远端",
                  "min-width": "170"
                }),
                _createVNode(_component_el_table_column, {
                  prop: "count",
                  label: "连接数",
                  width: "90"
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"])
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_10, [
        _cache[13] || (_cache[13] = _createElementVNode("div", { class: "card-title" }, "网络诊断工具", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_11, [
          _createElementVNode("div", _hoisted_12, [
            _createVNode(_component_el_input, {
              modelValue: _ctx.tools.host,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.tools.host) = $event)),
              placeholder: "IP / 域名",
              style: {"width":"200px"},
              onKeyup: _cache[1] || (_cache[1] = _withKeys($event => (_ctx.runTool('ping')), ["enter"]))
            }, null, 8 /* PROPS */, ["modelValue"]),
            _createVNode(_component_el_button, {
              type: "primary",
              loading: _ctx.toolRunning,
              onClick: _cache[2] || (_cache[2] = $event => (_ctx.runTool('ping')))
            }, {
              default: _withCtx(() => [...(_cache[9] || (_cache[9] = [
                _createTextVNode("Ping", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading"]),
            _createVNode(_component_el_button, {
              loading: _ctx.toolRunning,
              onClick: _cache[3] || (_cache[3] = $event => (_ctx.runTool('traceroute')))
            }, {
              default: _withCtx(() => [...(_cache[10] || (_cache[10] = [
                _createTextVNode("路由追踪", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading"]),
            _createVNode(_component_el_button, {
              loading: _ctx.toolRunning,
              onClick: _ctx.dns
            }, {
              default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                _createTextVNode("DNS 解析", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading", "onClick"]),
            _createVNode(_component_el_button, {
              loading: _ctx.toolRunning,
              onClick: _ctx.portCheck
            }, {
              default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                _createTextVNode("端口检测", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading", "onClick"])
          ]),
          _createElementVNode("pre", _hoisted_13, _toDisplayString(_ctx.toolOutput || '输入目标后点击工具按钮'), 1 /* TEXT */)
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_14, [
      _createElementVNode("div", _hoisted_15, [
        _cache[18] || (_cache[18] = _createElementVNode("div", { class: "card-title" }, "端口扫描", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_16, [
          _createElementVNode("div", _hoisted_17, [
            _createVNode(_component_el_input, {
              modelValue: _ctx.scan.host,
              "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.scan.host) = $event)),
              style: {"width":"160px"},
              placeholder: "目标主机"
            }, null, 8 /* PROPS */, ["modelValue"]),
            _createVNode(_component_el_input_number, {
              modelValue: _ctx.scan.start,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.scan.start) = $event)),
              min: 1,
              max: 65535,
              style: {"width":"110px"}
            }, null, 8 /* PROPS */, ["modelValue"]),
            _cache[15] || (_cache[15] = _createElementVNode("span", null, "~", -1 /* CACHED */)),
            _createVNode(_component_el_input_number, {
              modelValue: _ctx.scan.end,
              "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.scan.end) = $event)),
              min: 1,
              max: 65535,
              style: {"width":"110px"}
            }, null, 8 /* PROPS */, ["modelValue"]),
            _createVNode(_component_el_button, {
              type: "primary",
              loading: _ctx.scan.running,
              onClick: _ctx.runScan
            }, {
              default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
                _createTextVNode("开始扫描", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading", "onClick"])
          ]),
          (_ctx.scan.result)
            ? (_openBlock(), _createElementBlock("div", _hoisted_18, [
                _createElementVNode("div", _hoisted_19, [
                  _cache[16] || (_cache[16] = _createTextVNode(" 发现 ", -1 /* CACHED */)),
                  _createElementVNode("b", _hoisted_20, _toDisplayString(_ctx.scan.result.open_ports.length), 1 /* TEXT */),
                  _cache[17] || (_cache[17] = _createTextVNode(" 个开放端口 ", -1 /* CACHED */))
                ]),
                _createElementVNode("div", _hoisted_21, [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.scan.result.open_ports, (p) => {
                    return (_openBlock(), _createBlock(_component_el_tag, {
                      key: p,
                      type: "success"
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(p), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */))
                  }), 128 /* KEYED_FRAGMENT */))
                ])
              ]))
            : _createCommentVNode("v-if", true)
        ])
      ]),
      _createElementVNode("div", _hoisted_22, [
        _cache[19] || (_cache[19] = _createElementVNode("div", { class: "card-title" }, "路由表 / ARP", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_23, [
          _createVNode(_component_el_tabs, {
            type: "border-card",
            style: {"background":"transparent","border-color":"var(--border)"}
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_tab_pane, { label: "路由表" }, {
                default: _withCtx(() => [
                  _createElementVNode("pre", _hoisted_24, _toDisplayString(_ctx.routeRaw), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_tab_pane, { label: "ARP 缓存" }, {
                default: _withCtx(() => [
                  _createElementVNode("pre", _hoisted_25, _toDisplayString(_ctx.arpRaw), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          })
        ])
      ])
    ])
  ]))
} })()
}
