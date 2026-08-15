// Created by 小杜 on 2026/08

// 运维工具箱：常用命令一键执行 + 大文件扫描
import api from '../api.js'
import { fmtBytes, hasPerm } from '../util.js'

export default {
  data() {
    return {
      presets: [], running: '', output: '', runningCmd: false,
      custom: { cmd: '', timeout: 60 },
      scan: { path: '/', top: 30, result: null, running: false },
      swap: { supported: false, swapon: '', free: '', files: [], win: false, message: '', size_mb: 1024 },
    }
  },
  mounted() { this.load(); this.loadSwap() },
  methods: {
    fmtBytes, hasPerm,
    async loadSwap() {
      try { this.swap = await api.get('/toolbox/swap') } catch (e) {}
    },
    async createSwap() {
      try {
        await this.$confirm(`创建 Swap 文件 ${this.swap.size_mb}MB？`, '创建 Swap', { type: 'warning' })
        const r = await api.post('/toolbox/swap', { size_mb: this.swap.size_mb })
        this.$message.success(r.message || '已创建')
        this.loadSwap()
      } catch (e) {}
    },
    async delSwap() {
      try {
        await this.$confirm('关闭并删除 /swapfile？', '删除 Swap', { type: 'error' })
        await api.delete('/toolbox/swap')
        this.$message.success('已删除')
        this.loadSwap()
      } catch (e) {}
    },
    async load() {
      try { this.presets = (await api.get('/toolbox/presets')).list } catch (e) {}
    },
    async runCmd(cmd, name) {
      if (!hasPerm('system:manage')) return this.$message.warning('权限不足')
      this.runningCmd = true
      this.running = name
      this.output = '执行中…\n'
      try {
        const r = await api.post('/toolbox/run', { cmd, timeout: 60 })
        this.output = (r.code === 0 ? '' : '⚠ 退出码 ' + r.code + '\n') + r.output
      } catch (e) {} finally {
        this.runningCmd = false
        this.running = ''
      }
    },
    async runCustom() {
      if (!this.custom.cmd) return this.$message.warning('请输入命令')
      await this.runCmd(this.custom.cmd, '自定义命令')
    },
    async runScan() {
      if (!this.scan.path) return this.$message.warning('请输入目录')
      this.scan.running = true
      this.scan.result = null
      try {
        this.scan.result = await api.post('/toolbox/scan-big', { path: this.scan.path, top: this.scan.top })
      } catch (e) {} finally { this.scan.running = false }
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, resolveDynamicComponent: _resolveDynamicComponent, createBlock: _createBlock, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, createCommentVNode: _createCommentVNode, resolveDirective: _resolveDirective, withDirectives: _withDirectives, withKeys: _withKeys } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "chart-grid" }
const _hoisted_3 = { class: "op-card" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = { style: {"display":"grid","grid-template-columns":"repeat(2,1fr)","gap":"10px"} }
const _hoisted_6 = ["onClick"]
const _hoisted_7 = { style: {"display":"flex","align-items":"center","gap":"8px"} }
const _hoisted_8 = { style: {"font-size":"13px"} }
const _hoisted_9 = {
  class: "mono",
  style: {"color":"var(--text-secondary)","font-size":"11px","margin-top":"6px","overflow":"hidden","text-overflow":"ellipsis","white-space":"nowrap"}
}
const _hoisted_10 = { class: "op-card" }
const _hoisted_11 = { class: "card-title" }
const _hoisted_12 = { class: "card-body" }
const _hoisted_13 = { style: {"background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","padding":"12px","height":"360px","overflow":"auto","font-size":"12px","margin":"0","white-space":"pre-wrap","word-break":"break-all"} }
const _hoisted_14 = { style: {"margin-top":"12px"} }
const _hoisted_15 = { style: {"display":"flex","gap":"8px"} }
const _hoisted_16 = { class: "op-card" }
const _hoisted_17 = { class: "card-body" }
const _hoisted_18 = { class: "op-toolbar" }
const _hoisted_19 = {
  key: 0,
  style: {"color":"var(--text-secondary)","font-size":"12px"}
}
const _hoisted_20 = { class: "gold-text" }

return function render(_ctx, _cache) {
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_VideoPlay = _resolveComponent("VideoPlay")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _directive_loading = _resolveDirective("loading")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[3] || (_cache[3] = _createElementVNode("div", { class: "card-title" }, "常用命令", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_4, [
          _createElementVNode("div", _hoisted_5, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.presets, (p) => {
              return (_openBlock(), _createElementBlock("div", {
                key: p.name,
                class: "op-card",
                style: {"padding":"12px 16px","cursor":"pointer"},
                onClick: $event => (_ctx.runCmd(p.cmd, p.name))
              }, [
                _createElementVNode("div", _hoisted_7, [
                  _createVNode(_component_el_icon, { color: "var(--accent-light)" }, {
                    default: _withCtx(() => [
                      (_openBlock(), _createBlock(_resolveDynamicComponent(p.safe ? 'CircleCheck' : 'Warning')))
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1024 /* DYNAMIC_SLOTS */),
                  _createElementVNode("b", _hoisted_8, _toDisplayString(p.name), 1 /* TEXT */),
                  _createVNode(_component_el_icon, { style: {"margin-left":"auto","color":"var(--text-secondary)"} }, {
                    default: _withCtx(() => [
                      _createVNode(_component_VideoPlay)
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _createElementVNode("div", _hoisted_9, _toDisplayString(p.cmd), 1 /* TEXT */)
              ], 8 /* PROPS */, _hoisted_6))
            }), 128 /* KEYED_FRAGMENT */))
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_10, [
        _createElementVNode("div", _hoisted_11, [
          _cache[4] || (_cache[4] = _createTextVNode("执行输出 ", -1 /* CACHED */)),
          (_ctx.running)
            ? (_openBlock(), _createBlock(_component_el_tag, {
                key: 0,
                size: "small",
                type: "warning",
                style: {"margin-left":"8px"}
              }, {
                default: _withCtx(() => [
                  _createTextVNode("执行中: " + _toDisplayString(_ctx.running), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true)
        ]),
        _createElementVNode("div", _hoisted_12, [
          _withDirectives((_openBlock(), _createElementBlock("pre", _hoisted_13, [
            _createTextVNode(_toDisplayString(_ctx.output || '点击左侧命令卡片执行，结果将显示在这里（全部操作已审计）'), 1 /* TEXT */)
          ])), [
            [_directive_loading, _ctx.runningCmd]
          ]),
          _createElementVNode("div", _hoisted_14, [
            _cache[6] || (_cache[6] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"6px"} }, "自定义命令（谨慎执行，将全量审计）", -1 /* CACHED */)),
            _createElementVNode("div", _hoisted_15, [
              _createVNode(_component_el_input, {
                modelValue: _ctx.custom.cmd,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.custom.cmd) = $event)),
                placeholder: "输入 shell 命令…",
                class: "code-editor",
                onKeyup: _withKeys(_ctx.runCustom, ["enter"])
              }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
              _createVNode(_component_el_button, {
                type: "primary",
                loading: _ctx.runningCmd,
                onClick: _ctx.runCustom
              }, {
                default: _withCtx(() => [...(_cache[5] || (_cache[5] = [
                  _createTextVNode("执行", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["loading", "onClick"])
            ])
          ])
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_16, [
      _cache[9] || (_cache[9] = _createElementVNode("div", { class: "card-title" }, "大文件扫描（磁盘清理助手）", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_17, [
        _createElementVNode("div", _hoisted_18, [
          _createVNode(_component_el_input, {
            modelValue: _ctx.scan.path,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.scan.path) = $event)),
            style: {"width":"320px"},
            placeholder: "扫描目录，如 C:\\ 或 /var"
          }, null, 8 /* PROPS */, ["modelValue"]),
          _cache[8] || (_cache[8] = _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px"} }, "TOP", -1 /* CACHED */)),
          _createVNode(_component_el_input_number, {
            modelValue: _ctx.scan.top,
            "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.scan.top) = $event)),
            min: 5,
            max: 100,
            style: {"width":"110px"}
          }, null, 8 /* PROPS */, ["modelValue"]),
          _createVNode(_component_el_button, {
            type: "primary",
            loading: _ctx.scan.running,
            onClick: _ctx.runScan
          }, {
            default: _withCtx(() => [...(_cache[7] || (_cache[7] = [
              _createTextVNode("开始扫描", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["loading", "onClick"]),
          (_ctx.scan.result)
            ? (_openBlock(), _createElementBlock("span", _hoisted_19, " 发现 " + _toDisplayString(_ctx.scan.result.total_found) + " 个大于 5MB 的文件，展示前 " + _toDisplayString(_ctx.scan.result.list.length) + " 个 ", 1 /* TEXT */))
            : _createCommentVNode("v-if", true)
        ]),
        (_ctx.scan.result)
          ? (_openBlock(), _createBlock(_component_el_table, {
              key: 0,
              data: _ctx.scan.result.list,
              size: "small",
              "max-height": "360",
              style: {"margin-top":"10px"}
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  label: "大小",
                  width: "120"
                }, {
                  default: _withCtx((s) => [
                    _createElementVNode("b", _hoisted_20, _toDisplayString(_ctx.fmtBytes(s.row.size)), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_table_column, {
                  prop: "path",
                  label: "文件路径",
                  "min-width": "420",
                  "show-overflow-tooltip": ""
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"]))
          : _createCommentVNode("v-if", true)
      ])
    ]),
    _createElementVNode("div", _hoisted_1, [
      _createElementVNode("div", { class: "card-title" }, [
        _createTextVNode("Swap 内存交换（宝塔式）"),
        (_ctx.swap.supported)
          ? (_openBlock(), _createElementBlock("div", {
              key: 0,
              style: {"margin-left":"auto","display":"flex","gap":"8px","align-items":"center"}
            }, [
              _createVNode(_component_el_input_number, {
                modelValue: _ctx.swap.size_mb,
                "onUpdate:modelValue": _cache[29] || (_cache[29] = $event => ((_ctx.swap.size_mb) = $event)),
                min: 128,
                max: 65536,
                size: "small",
                style: {"width":"120px"}
              }, null, 8 /* PROPS */, ["modelValue"]),
              _createElementVNode("span", { style: {"font-size":"12px","color":"var(--text-secondary)"} }, "MB", -1 /* CACHED */),
              _createVNode(_component_el_button, {
                size: "small",
                type: "primary",
                onClick: _ctx.createSwap
              }, {
                default: _withCtx(() => [
                  _createTextVNode("创建 Swap", -1 /* CACHED */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_button, {
                size: "small",
                type: "danger",
                plain: "",
                onClick: _ctx.delSwap
              }, {
                default: _withCtx(() => [
                  _createTextVNode("删除 Swap", -1 /* CACHED */)
                ]),
                _: 1 /* STABLE */
              })
            ]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_6, [
        (_ctx.swap.supported)
          ? (_openBlock(), _createElementBlock("pre", {
              key: 0,
              style: {"margin":"0","font-size":"12px","white-space":"pre-wrap","max-height":"280px","overflow":"auto"}
            }, [
              _createTextVNode(_toDisplayString(_ctx.swap.swapon || '（当前无 Swap）'), 1 /* TEXT */),
              _createElementVNode("br", null, null, -1 /* CACHED */),
              _createTextVNode(_toDisplayString(_ctx.swap.free || ''), 1 /* TEXT */)
            ]))
          : (_openBlock(), _createElementBlock("div", {
              key: 1,
              style: {"color":"var(--text-secondary)","font-size":"13px"}
            }, _toDisplayString(_ctx.swap.message || '当前系统不支持 Swap 管理'), 1 /* TEXT */))
      ])
    ])
  ]))
} })()
}
