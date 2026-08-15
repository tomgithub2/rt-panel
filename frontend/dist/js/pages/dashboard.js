// 仪表盘：实时系统概览大屏
import api from '../api.js'
import { fmtBytes, fmtRate, fmtTime, fmtUptime } from '../util.js'

export default {
  data() {
    return {
      loading: true,
      data: null,
      charts: {},
      series: { cpu: [], mem: [], net: [] },
      ws: null,
      refreshTimer: null,
    }
  },
  mounted() {
    this.load()
    this.refreshTimer = setInterval(() => this.load(false), 15000)
    this.connectWS()
    window.addEventListener('resize', this.resizeAll)
  },
  beforeUnmount() {
    clearInterval(this.refreshTimer)
    if (this.ws) this.ws.close()
    Object.values(this.charts).forEach(c => c && c.dispose())
    window.removeEventListener('resize', this.resizeAll)
  },
  methods: {
    fmtBytes, fmtRate, fmtTime, fmtUptime,
    async load(showLoading = true) {
      if (showLoading) this.loading = true
      try {
        const res = await api.get('/dashboard/overview')
        this.data = res
        await this.loadSpark()
        this.renderCharts()
      } catch (e) {} finally {
        this.loading = false
      }
    },
    async loadSpark() {
      const r = await api.get('/dashboard/sparkline?minutes=60')
      this.series.cpu = r.list.map(x => [x.ts * 1000, x.cpu])
      this.series.mem = r.list.map(x => [x.ts * 1000, x.mem])
      this.series.net = r.list.map(x => [x.ts * 1000, x.net_rx, x.net_tx])
    },
    connectWS() {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const token = localStorage.getItem('ops_token')
      this.ws = new WebSocket(`${proto}://${location.host}/api/dashboard/ws/realtime?token=${token}`)
      this.ws.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (!this.data) return
          this.data.cpu.percent = d.cpu
          this.data.mem.percent = d.mem
          // 追加实时点
          this.series.cpu.push([d.ts * 1000, d.cpu])
          this.series.mem.push([d.ts * 1000, d.mem])
          if (this.series.net.length) {
            const last = this.series.net[this.series.net.length - 1]
            this.series.net.push([d.ts * 1000, d.net_rx, d.net_tx])
          }
          const keep = 400
          if (this.series.cpu.length > keep) this.series.cpu.splice(0, this.series.cpu.length - keep)
          if (this.series.mem.length > keep) this.series.mem.splice(0, this.series.mem.length - keep)
          if (this.series.net.length > keep) this.series.net.splice(0, this.series.net.length - keep)
          this.renderCharts()
        } catch (e) {}
      }
      this.ws.onclose = () => { setTimeout(() => { if (!document.hidden) this.connectWS() }, 5000) }
    },
    chartOption(metric, title, color, unit = '%') {
      const data = this.series[metric] || []
      return {
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
        title: { text: title, left: 10, top: 0, textStyle: { color: 'var(--text-regular)', fontSize: 13, fontWeight: 500 } },
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,10,14,.9)', borderColor: 'var(--border-strong)',
                   textStyle: { color: 'var(--text-primary)' },
                   valueFormatter: v => v == null ? '-' : (metric === 'net' ? fmtBytes(v) : v + unit) },
        xAxis: { type: 'time', axisLine: { lineStyle: { color: 'var(--border)' } },
                 axisLabel: { color: 'var(--text-secondary)', formatter: '{HH}:{mm}' } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,.12)' } },
                 axisLabel: { color: 'var(--text-secondary)' } },
        series: [{
          type: 'line', smooth: true, showSymbol: false, data,
          lineStyle: { width: 2, color },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: color + '55' }, { offset: 1, color: color + '03' }] } },
        }],
      }
    },
    renderCharts() {
      this.$nextTick(() => {
        const defs = [
          { key: 'cpuChart', metric: 'cpu', title: 'CPU 使用率', color: this.accentHex },
          { key: 'memChart', metric: 'mem', title: '内存使用率', color: '#67c23a' },
          { key: 'netChart', metric: 'net', title: '网络流量 (RX/TX)', color: '#e6a23c' },
        ]
        defs.forEach(d => {
          const el = this.$refs[d.key]
          if (!el) return
          let chart = this.charts[d.key]
          if (!chart) {
            chart = window.echarts.init(el)
            this.charts[d.key] = chart
          }
          chart.setOption(this.chartOption(d.metric, d.title, d.color))
        })
      })
    },
    resizeAll() { Object.values(this.charts).forEach(c => c && c.resize()) },
  },
  computed: {
    accentHex() { return document.documentElement.dataset.theme === 'silverblack' ? '#b9c8dd' : '#d4af37' },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, renderList: _renderList, Fragment: _Fragment, resolveDirective: _resolveDirective, withDirectives: _withDirectives } = Vue

const _hoisted_1 = { class: "stat-grid" }
const _hoisted_2 = { class: "op-card stat-card" }
const _hoisted_3 = { class: "stat-head" }
const _hoisted_4 = { class: "stat-icon" }
const _hoisted_5 = { class: "stat-num gold-text" }
const _hoisted_6 = { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_7 = { key: 0 }
const _hoisted_8 = { class: "op-card stat-card" }
const _hoisted_9 = { class: "stat-head" }
const _hoisted_10 = { class: "stat-icon" }
const _hoisted_11 = { class: "stat-num gold-text" }
const _hoisted_12 = { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_13 = { class: "op-card stat-card" }
const _hoisted_14 = { class: "stat-head" }
const _hoisted_15 = { class: "stat-icon" }
const _hoisted_16 = { class: "stat-num gold-text" }
const _hoisted_17 = { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px","max-height":"34px","overflow":"hidden"} }
const _hoisted_18 = { class: "op-card stat-card" }
const _hoisted_19 = { class: "stat-head" }
const _hoisted_20 = { class: "stat-icon" }
const _hoisted_21 = {
  class: "stat-num gold-text",
  style: {"font-size":"26px"}
}
const _hoisted_22 = { style: {"font-size":"13px"} }
const _hoisted_23 = { style: {"margin-top":"8px","color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_24 = { class: "chart-grid" }
const _hoisted_25 = { class: "op-card" }
const _hoisted_26 = { class: "card-body" }
const _hoisted_27 = {
  ref: "cpuChart",
  class: "chart-box"
}
const _hoisted_28 = { class: "op-card" }
const _hoisted_29 = {
  class: "card-body",
  style: {"font-size":"13px"}
}
const _hoisted_30 = { class: "chart-grid-2" }
const _hoisted_31 = { class: "op-card" }
const _hoisted_32 = { class: "card-body" }
const _hoisted_33 = {
  ref: "memChart",
  style: {"height":"220px"}
}
const _hoisted_34 = { class: "op-card" }
const _hoisted_35 = { class: "card-body" }
const _hoisted_36 = {
  ref: "netChart",
  style: {"height":"220px"}
}
const _hoisted_37 = { class: "chart-grid" }
const _hoisted_38 = { class: "op-card" }
const _hoisted_39 = { class: "card-body" }
const _hoisted_40 = { class: "op-card" }
const _hoisted_41 = { class: "card-body" }
const _hoisted_42 = { style: {"display":"flex","flex-wrap":"wrap","gap":"12px"} }
const _hoisted_43 = {
  class: "op-card",
  style: {"flex":"1","min-width":"130px","padding":"14px","text-align":"center"}
}
const _hoisted_44 = { class: "stat-num gold-text" }
const _hoisted_45 = {
  class: "op-card",
  style: {"flex":"1","min-width":"130px","padding":"14px","text-align":"center"}
}
const _hoisted_46 = { class: "stat-num gold-text" }
const _hoisted_47 = {
  class: "op-card",
  style: {"flex":"1","min-width":"130px","padding":"14px","text-align":"center"}
}
const _hoisted_48 = { class: "stat-num gold-text" }
const _hoisted_49 = {
  class: "op-card",
  style: {"flex":"1","min-width":"130px","padding":"14px","text-align":"center"}
}
const _hoisted_50 = { class: "stat-num gold-text" }

return function render(_ctx, _cache) {
  const _component_Cpu = _resolveComponent("Cpu")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_progress = _resolveComponent("el-progress")
  const _component_Memo = _resolveComponent("Memo")
  const _component_Coin = _resolveComponent("Coin")
  const _component_Position = _resolveComponent("Position")
  const _component_el_descriptions_item = _resolveComponent("el-descriptions-item")
  const _component_el_descriptions = _resolveComponent("el-descriptions")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_alert = _resolveComponent("el-alert")
  const _directive_loading = _resolveDirective("loading")

  return _withDirectives((_openBlock(), _createElementBlock("div", null, [
    _createElementVNode("div", _hoisted_1, [
      _createElementVNode("div", _hoisted_2, [
        _createElementVNode("div", _hoisted_3, [
          _cache[0] || (_cache[0] = _createElementVNode("span", { class: "stat-label" }, "CPU 使用率", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_4, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Cpu)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_5, [
          _createTextVNode(_toDisplayString(_ctx.data?.cpu?.percent?.toFixed(1) ?? '-'), 1 /* TEXT */),
          _cache[1] || (_cache[1] = _createElementVNode("span", { style: {"font-size":"16px"} }, "%", -1 /* CACHED */))
        ]),
        _createElementVNode("div", _hoisted_6, [
          _createTextVNode(_toDisplayString(_ctx.data?.cpu?.cores) + " 核 " + _toDisplayString(_ctx.data?.cpu?.threads) + " 线程 ", 1 /* TEXT */),
          (_ctx.data?.cpu?.freq_current)
            ? (_openBlock(), _createElementBlock("span", _hoisted_7, "· " + _toDisplayString(_ctx.data.cpu.freq_current) + " MHz", 1 /* TEXT */))
            : _createCommentVNode("v-if", true)
        ]),
        _createVNode(_component_el_progress, {
          percentage: Math.min(100, _ctx.data?.cpu?.percent||0),
          "stroke-width": 5,
          "show-text": false,
          style: {"margin-top":"12px"}
        }, null, 8 /* PROPS */, ["percentage"])
      ]),
      _createElementVNode("div", _hoisted_8, [
        _createElementVNode("div", _hoisted_9, [
          _cache[2] || (_cache[2] = _createElementVNode("span", { class: "stat-label" }, "内存使用率", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_10, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Memo)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_11, [
          _createTextVNode(_toDisplayString(_ctx.data?.mem?.percent?.toFixed(1) ?? '-'), 1 /* TEXT */),
          _cache[3] || (_cache[3] = _createElementVNode("span", { style: {"font-size":"16px"} }, "%", -1 /* CACHED */))
        ]),
        _createElementVNode("div", _hoisted_12, _toDisplayString(_ctx.data?.mem?.used) + " / " + _toDisplayString(_ctx.data?.mem?.total) + " GB · 交换 " + _toDisplayString(_ctx.data?.mem?.swap_percent) + "% ", 1 /* TEXT */),
        _createVNode(_component_el_progress, {
          percentage: Math.min(100, _ctx.data?.mem?.percent||0),
          "stroke-width": 5,
          "show-text": false,
          style: {"margin-top":"12px"}
        }, null, 8 /* PROPS */, ["percentage"])
      ]),
      _createElementVNode("div", _hoisted_13, [
        _createElementVNode("div", _hoisted_14, [
          _cache[4] || (_cache[4] = _createElementVNode("span", { class: "stat-label" }, "磁盘使用", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_15, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Coin)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_16, [
          _createTextVNode(_toDisplayString(_ctx.data?.disk?.partitions?.length ?? '-'), 1 /* TEXT */),
          _cache[5] || (_cache[5] = _createElementVNode("span", { style: {"font-size":"16px"} }, " 个分区", -1 /* CACHED */))
        ]),
        _createElementVNode("div", _hoisted_17, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.data?.disk?.partitions?.slice(0,3), (p) => {
            return (_openBlock(), _createElementBlock("span", {
              key: p.mount,
              style: {"margin-right":"8px"}
            }, _toDisplayString(p.mount) + " " + _toDisplayString(p.percent) + "% ", 1 /* TEXT */))
          }), 128 /* KEYED_FRAGMENT */))
        ]),
        _createVNode(_component_el_progress, {
          percentage: Math.max(...(_ctx.data?.disk?.partitions||[{percent:0}]).map(p=>p.percent)),
          "stroke-width": 5,
          "show-text": false,
          style: {"margin-top":"12px"}
        }, null, 8 /* PROPS */, ["percentage"])
      ]),
      _createElementVNode("div", _hoisted_18, [
        _createElementVNode("div", _hoisted_19, [
          _cache[6] || (_cache[6] = _createElementVNode("span", { class: "stat-label" }, "网络流量", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_20, [
            _createVNode(_component_el_icon, null, {
              default: _withCtx(() => [
                _createVNode(_component_Position)
              ]),
              _: 1 /* STABLE */
            })
          ])
        ]),
        _createElementVNode("div", _hoisted_21, [
          _createTextVNode(" ↓ " + _toDisplayString(_ctx.fmtRate(_ctx.data?.net?.rx_rate)) + " ", 1 /* TEXT */),
          _createElementVNode("span", _hoisted_22, "↑ " + _toDisplayString(_ctx.fmtRate(_ctx.data?.net?.tx_rate)), 1 /* TEXT */)
        ]),
        _createElementVNode("div", _hoisted_23, " 连接数 " + _toDisplayString(_ctx.data?.net?.connections) + " · 网卡 " + _toDisplayString(_ctx.data?.net?.nics?.length), 1 /* TEXT */),
        _createVNode(_component_el_progress, {
          percentage: 50,
          "stroke-width": 5,
          "show-text": false,
          style: {"margin-top":"12px"}
        })
      ])
    ]),
    _createElementVNode("div", _hoisted_24, [
      _createElementVNode("div", _hoisted_25, [
        _cache[7] || (_cache[7] = _createElementVNode("div", { class: "card-title" }, "实时性能曲线", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_26, [
          _createElementVNode("div", _hoisted_27, null, 512 /* NEED_PATCH */)
        ])
      ]),
      _createElementVNode("div", _hoisted_28, [
        _cache[8] || (_cache[8] = _createElementVNode("div", { class: "card-title" }, "系统信息", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_29, [
          _createVNode(_component_el_descriptions, {
            column: 1,
            size: "small",
            border: ""
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_descriptions_item, { label: "主机名" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.data?.system?.hostname), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "操作系统" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.data?.system?.system) + " " + _toDisplayString(_ctx.data?.system?.release), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "内核/架构" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.data?.system?.machine), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "运行时间" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.fmtUptime(_ctx.data?.system?.uptime)), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "Python" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.data?.system?.python), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "面板版本" }, {
                default: _withCtx(() => [
                  _createTextVNode("v" + _toDisplayString(_ctx.data?.panel?.version), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_descriptions_item, { label: "启动时间" }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.fmtTime(_ctx.data?.system?.boot_time)), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          })
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_30, [
      _createElementVNode("div", _hoisted_31, [
        _createElementVNode("div", _hoisted_32, [
          _createElementVNode("div", _hoisted_33, null, 512 /* NEED_PATCH */)
        ])
      ]),
      _createElementVNode("div", _hoisted_34, [
        _createElementVNode("div", _hoisted_35, [
          _createElementVNode("div", _hoisted_36, null, 512 /* NEED_PATCH */)
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_37, [
      _createElementVNode("div", _hoisted_38, [
        _cache[9] || (_cache[9] = _createElementVNode("div", { class: "card-title" }, "磁盘分区", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_39, [
          _createVNode(_component_el_table, {
            data: _ctx.data?.disk?.partitions || [],
            size: "small"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "mount",
                label: "挂载点",
                "min-width": "140"
              }),
              _createVNode(_component_el_table_column, {
                prop: "device",
                label: "设备",
                "min-width": "120"
              }),
              _createVNode(_component_el_table_column, {
                prop: "fstype",
                label: "文件系统",
                width: "100"
              }),
              _createVNode(_component_el_table_column, {
                label: "总容量",
                width: "110"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(s.row.total) + " GB", 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "已用",
                width: "110"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(s.row.used) + " GB", 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "使用率",
                "min-width": "160"
              }, {
                default: _withCtx((s) => [
                  _createVNode(_component_el_progress, {
                    percentage: s.row.percent,
                    "stroke-width": 8
                  }, null, 8 /* PROPS */, ["percentage"])
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["data"])
        ])
      ]),
      _createElementVNode("div", _hoisted_40, [
        _cache[14] || (_cache[14] = _createElementVNode("div", { class: "card-title" }, "今日统计", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_41, [
          _createElementVNode("div", _hoisted_42, [
            _createElementVNode("div", _hoisted_43, [
              _createElementVNode("div", _hoisted_44, _toDisplayString(_ctx.data?.counts?.users), 1 /* TEXT */),
              _cache[10] || (_cache[10] = _createElementVNode("div", { class: "stat-label" }, "面板用户", -1 /* CACHED */))
            ]),
            _createElementVNode("div", _hoisted_45, [
              _createElementVNode("div", _hoisted_46, _toDisplayString(_ctx.data?.counts?.cron_jobs), 1 /* TEXT */),
              _cache[11] || (_cache[11] = _createElementVNode("div", { class: "stat-label" }, "计划任务", -1 /* CACHED */))
            ]),
            _createElementVNode("div", _hoisted_47, [
              _createElementVNode("div", _hoisted_48, _toDisplayString(_ctx.data?.counts?.websites), 1 /* TEXT */),
              _cache[12] || (_cache[12] = _createElementVNode("div", { class: "stat-label" }, "托管网站", -1 /* CACHED */))
            ]),
            _createElementVNode("div", _hoisted_49, [
              _createElementVNode("div", _hoisted_50, _toDisplayString(_ctx.data?.counts?.alerts_today), 1 /* TEXT */),
              _cache[13] || (_cache[13] = _createElementVNode("div", { class: "stat-label" }, "今日告警", -1 /* CACHED */))
            ])
          ]),
          _createVNode(_component_el_alert, {
            style: {"margin-top":"14px"},
            type: "info",
            closable: false,
            title: "监控采样每 5 秒一次，数据保留 24 小时原始 + 90 天聚合"
          })
        ])
      ])
    ])
  ])), [
    [_directive_loading, _ctx.loading]
  ])
} })()
}
