// 监控：历史曲线 / 进程 / 端口 / 连接 / 告警规则
import api from '../api.js'
import { fmtBytes, fmtRate, fmtTime } from '../util.js'
import { hasPerm } from '../util.js'

export default {
  data() {
    return {
      metric: 'cpu', range: '1h', chart: null, loading: false,
      procs: [], procSearch: '', procSort: 'cpu', procTotal: 0,
      ports: [], connections: null,
      alerts: [], alertHistory: [],
      alertForm: { show: false, metric: 'cpu', operator: '>', threshold: 90, channels: [] },
      procTimer: null,
    }
  },
  mounted() {
    this.loadHistory()
    this.loadProcs()
    this.loadPorts()
    this.loadAlerts()
    this.loadConnections()
    this.procTimer = setInterval(() => this.loadProcs(), 10000)
    window.addEventListener('resize', this.resize)
  },
  beforeUnmount() {
    clearInterval(this.procTimer)
    if (this.chart) this.chart.dispose()
    window.removeEventListener('resize', this.resize)
  },
  methods: {
    fmtBytes, fmtRate, fmtTime, hasPerm,
    async loadHistory() {
      this.loading = true
      try {
        const r = await api.get('/monitor/history', { params: { metric: this.metric, range: this.range } })
        this.$nextTick(() => {
          if (!this.chart) this.chart = window.echarts.init(this.$refs.chart)
          const names = { cpu: 'CPU %', mem: '内存 %', net_rx: '下行 B/s', net_tx: '上行 B/s', disk_read: '读 B/s', disk_write: '写 B/s', load1: '负载 1min' }
          this.chart.setOption({
            grid: { left: 70, right: 24, top: 30, bottom: 36 },
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,10,14,.92)', borderColor: 'var(--border-strong)',
                       textStyle: { color: 'var(--text-primary)' } },
            xAxis: { type: 'time', axisLine: { lineStyle: { color: 'var(--border)' } },
                     axisLabel: { color: 'var(--text-secondary)' } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,.12)' } },
                     axisLabel: { color: 'var(--text-secondary)', formatter: v => ['net_rx','net_tx','disk_read','disk_write'].includes(this.metric) ? fmtBytes(v) : v } },
            series: [{
              type: 'line', smooth: true, showSymbol: false, name: names[this.metric],
              data: r.list.map(x => [x.ts * 1000, x.v]),
              lineStyle: { width: 2, color: 'var(--accent)' },
              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: 'rgba(212,175,55,.28)' }, { offset: 1, color: 'rgba(212,175,55,.02)' }] } },
            }],
          }, true)
        })
      } catch (e) {} finally { this.loading = false }
    },
    resize() { this.chart && this.chart.resize() },
    async loadProcs() {
      try {
        const r = await api.get('/monitor/processes', { params: { search: this.procSearch, sort: this.procSort, limit: 200 } })
        this.procs = r.list; this.procTotal = r.total
      } catch (e) {}
    },
    async loadPorts() {
      try { this.ports = (await api.get('/monitor/ports')).list } catch (e) {}
    },
    async loadConnections() {
      try { this.connections = await api.get('/monitor/connections') } catch (e) {}
    },
    async loadAlerts() {
      try {
        this.alerts = (await api.get('/monitor/alerts')).list
        this.alertHistory = (await api.get('/monitor/alerts/history?limit=50')).list
      } catch (e) {}
    },
    async killProc(row, force) {
      try {
        await this.$confirm(`确定${force ? '强制' : ''}结束进程 ${row.name} (PID ${row.pid})？`, '危险操作', { type: 'warning' })
        await api.post('/processes/kill', { pid: row.pid, force })
        this.$message.success('已发送结束指令')
        this.loadProcs()
      } catch (e) {}
    },
    async addAlert() {
      try {
        await api.post('/monitor/alerts', this.alertForm)
        this.$message.success('告警规则已添加')
        this.alertForm.show = false
        this.loadAlerts()
      } catch (e) {}
    },
    async toggleAlert(row) {
      try {
        await api.put(`/monitor/alerts/${row.id}`, { enabled: row.enabled ? 1 : 0 })
        this.loadAlerts()
      } catch (e) {}
    },
    async delAlert(row) {
      try {
        await this.$confirm(`删除告警规则「${row.metric} ${row.operator} ${row.threshold}」？`, '确认', { type: 'warning' })
        await api.delete(`/monitor/alerts/${row.id}`)
        this.loadAlerts()
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, createTextVNode: _createTextVNode, resolveDirective: _resolveDirective, withDirectives: _withDirectives, toDisplayString: _toDisplayString, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-body" }
const _hoisted_4 = {
  class: "op-toolbar",
  style: {"margin-bottom":"12px"}
}
const _hoisted_5 = {
  ref: "chart",
  style: {"height":"320px"}
}
const _hoisted_6 = { class: "chart-grid" }
const _hoisted_7 = { class: "op-card" }
const _hoisted_8 = { class: "card-title" }
const _hoisted_9 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_10 = { class: "card-body" }
const _hoisted_11 = {
  class: "op-toolbar",
  style: {"margin-bottom":"10px"}
}
const _hoisted_12 = { class: "gold-text" }
const _hoisted_13 = { class: "op-card" }
const _hoisted_14 = { class: "card-body" }
const _hoisted_15 = { class: "gold-text" }
const _hoisted_16 = { style: {"margin-top":"12px"} }
const _hoisted_17 = { class: "gold-text" }
const _hoisted_18 = {
  key: 0,
  class: "op-card"
}
const _hoisted_19 = { class: "card-title" }
const _hoisted_20 = { class: "card-body" }
const _hoisted_21 = { style: {"margin-top":"14px"} }
const _hoisted_22 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_radio_button = _resolveComponent("el-radio-button")
  const _component_el_radio_group = _resolveComponent("el-radio-group")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _directive_loading = _resolveDirective("loading")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _cache[16] || (_cache[16] = _createElementVNode("div", { class: "card-title" }, "历史趋势", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_3, [
        _createElementVNode("div", _hoisted_4, [
          _createVNode(_component_el_select, {
            modelValue: _ctx.metric,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.metric) = $event)),
            style: {"width":"170px"},
            onChange: _ctx.loadHistory
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_option, {
                label: "CPU 使用率",
                value: "cpu"
              }),
              _createVNode(_component_el_option, {
                label: "内存使用率",
                value: "mem"
              }),
              _createVNode(_component_el_option, {
                label: "负载 1min",
                value: "load1"
              }),
              _createVNode(_component_el_option, {
                label: "网络下行",
                value: "net_rx"
              }),
              _createVNode(_component_el_option, {
                label: "网络上行",
                value: "net_tx"
              }),
              _createVNode(_component_el_option, {
                label: "磁盘读取",
                value: "disk_read"
              }),
              _createVNode(_component_el_option, {
                label: "磁盘写入",
                value: "disk_write"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"]),
          _createVNode(_component_el_radio_group, {
            modelValue: _ctx.range,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.range) = $event)),
            onChange: _ctx.loadHistory
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_radio_button, { value: "1h" }, {
                default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                  _createTextVNode("1小时", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_radio_button, { value: "6h" }, {
                default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                  _createTextVNode("6小时", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_radio_button, { value: "24h" }, {
                default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
                  _createTextVNode("24小时", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_radio_button, { value: "7d" }, {
                default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
                  _createTextVNode("7天", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_radio_button, { value: "30d" }, {
                default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                  _createTextVNode("30天", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"])
        ]),
        _withDirectives(_createElementVNode("div", _hoisted_5, null, 512 /* NEED_PATCH */), [
          [_directive_loading, _ctx.loading]
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_6, [
      _createElementVNode("div", _hoisted_7, [
        _createElementVNode("div", _hoisted_8, [
          _cache[17] || (_cache[17] = _createTextVNode("进程列表 ", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_9, "共 " + _toDisplayString(_ctx.procTotal) + " 个", 1 /* TEXT */)
        ]),
        _createElementVNode("div", _hoisted_10, [
          _createElementVNode("div", _hoisted_11, [
            _createVNode(_component_el_input, {
              modelValue: _ctx.procSearch,
              "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.procSearch) = $event)),
              placeholder: "搜索进程名/命令行",
              style: {"width":"220px"},
              clearable: "",
              onChange: _ctx.loadProcs
            }, null, 8 /* PROPS */, ["modelValue", "onChange"]),
            _createVNode(_component_el_select, {
              modelValue: _ctx.procSort,
              "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.procSort) = $event)),
              style: {"width":"130px"},
              onChange: _ctx.loadProcs
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_option, {
                  label: "按 CPU",
                  value: "cpu"
                }),
                _createVNode(_component_el_option, {
                  label: "按内存",
                  value: "mem"
                }),
                _createVNode(_component_el_option, {
                  label: "按 PID",
                  value: "pid"
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["modelValue", "onChange"]),
            _createVNode(_component_el_button, {
              icon: 'Refresh',
              onClick: _ctx.loadProcs,
              circle: ""
            }, null, 8 /* PROPS */, ["onClick"])
          ]),
          _createVNode(_component_el_table, {
            data: _ctx.procs,
            size: "small",
            height: "380"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "pid",
                label: "PID",
                width: "70"
              }),
              _createVNode(_component_el_table_column, {
                prop: "name",
                label: "进程名",
                "min-width": "130",
                "show-overflow-tooltip": ""
              }),
              _createVNode(_component_el_table_column, {
                prop: "user",
                label: "用户",
                width: "110",
                "show-overflow-tooltip": ""
              }),
              _createVNode(_component_el_table_column, {
                label: "CPU",
                width: "80"
              }, {
                default: _withCtx((s) => [
                  _createElementVNode("b", _hoisted_12, _toDisplayString(s.row.cpu) + "%", 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "内存",
                width: "80"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(s.row.mem) + "%", 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                label: "RSS",
                width: "100"
              }, {
                default: _withCtx((s) => [
                  _createTextVNode(_toDisplayString(_ctx.fmtBytes(s.row.rss)), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                prop: "status",
                label: "状态",
                width: "90"
              }),
              _createVNode(_component_el_table_column, {
                prop: "threads",
                label: "线程",
                width: "70"
              }),
              (_ctx.hasPerm('processes:kill'))
                ? (_openBlock(), _createBlock(_component_el_table_column, {
                    key: 0,
                    label: "操作",
                    width: "110"
                  }, {
                    default: _withCtx((s) => [
                      _createVNode(_component_el_button, {
                        size: "small",
                        type: "danger",
                        plain: "",
                        onClick: $event => (_ctx.killProc(s.row, false))
                      }, {
                        default: _withCtx(() => [...(_cache[18] || (_cache[18] = [
                          _createTextVNode("结束", -1 /* CACHED */)
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
      _createElementVNode("div", _hoisted_13, [
        _cache[20] || (_cache[20] = _createElementVNode("div", { class: "card-title" }, "监听端口", -1 /* CACHED */)),
        _createElementVNode("div", _hoisted_14, [
          _createVNode(_component_el_table, {
            data: _ctx.ports,
            size: "small",
            height: "380"
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "port",
                label: "端口",
                width: "80"
              }, {
                default: _withCtx((s) => [
                  _createElementVNode("b", _hoisted_15, _toDisplayString(s.row.port), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                prop: "ip",
                label: "绑定地址",
                width: "120"
              }),
              _createVNode(_component_el_table_column, {
                prop: "process",
                label: "进程",
                "min-width": "120",
                "show-overflow-tooltip": ""
              }),
              _createVNode(_component_el_table_column, {
                prop: "pid",
                label: "PID",
                width: "70"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["data"]),
          _createElementVNode("div", _hoisted_16, [
            _cache[19] || (_cache[19] = _createElementVNode("div", {
              class: "card-title",
              style: {"padding":"0 0 8px","font-size":"13px"}
            }, "TCP 连接 TOP", -1 /* CACHED */)),
            _createVNode(_component_el_table, {
              data: _ctx.connections?.top || [],
              size: "small",
              height: "240"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  prop: "endpoint",
                  label: "远端地址",
                  "min-width": "160"
                }),
                _createVNode(_component_el_table_column, {
                  prop: "count",
                  label: "连接数",
                  width: "90"
                }, {
                  default: _withCtx((s) => [
                    _createElementVNode("b", _hoisted_17, _toDisplayString(s.row.count), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"])
          ])
        ])
      ])
    ]),
    (_ctx.hasPerm('monitor:alert'))
      ? (_openBlock(), _createElementBlock("div", _hoisted_18, [
          _createElementVNode("div", _hoisted_19, [
            _cache[22] || (_cache[22] = _createTextVNode("告警规则 ", -1 /* CACHED */)),
            _createVNode(_component_el_button, {
              size: "small",
              type: "primary",
              style: {"margin-left":"auto"},
              onClick: _cache[4] || (_cache[4] = $event => (_ctx.alertForm.show = true))
            }, {
              default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
                _createTextVNode("+ 添加规则", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            })
          ]),
          _createElementVNode("div", _hoisted_20, [
            _createVNode(_component_el_table, {
              data: _ctx.alerts,
              size: "small"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table_column, {
                  prop: "metric",
                  label: "指标",
                  width: "120"
                }),
                _createVNode(_component_el_table_column, {
                  label: "条件",
                  width: "140"
                }, {
                  default: _withCtx((s) => [
                    _createTextVNode(_toDisplayString(s.row.operator) + " " + _toDisplayString(s.row.threshold), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_table_column, {
                  prop: "channels",
                  label: "通知渠道",
                  "min-width": "140"
                }),
                _createVNode(_component_el_table_column, {
                  label: "状态",
                  width: "90"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_switch, {
                      "model-value": !!s.row.enabled,
                      onChange: $event => (_ctx.toggleAlert(s.row))
                    }, null, 8 /* PROPS */, ["model-value", "onChange"])
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_table_column, {
                  label: "操作",
                  width: "90"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.delAlert(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[23] || (_cache[23] = [
                        _createTextVNode("删除", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"])
                  ]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["data"]),
            _createElementVNode("div", _hoisted_21, [
              _cache[24] || (_cache[24] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"8px"} }, "最近告警记录", -1 /* CACHED */)),
              _createVNode(_component_el_table, {
                data: _ctx.alertHistory,
                size: "small",
                "max-height": "220"
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_table_column, {
                    label: "时间",
                    width: "170"
                  }, {
                    default: _withCtx((s) => [
                      _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.ts)), 1 /* TEXT */)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_el_table_column, {
                    prop: "message",
                    label: "内容",
                    "min-width": "220"
                  }),
                  _createVNode(_component_el_table_column, {
                    prop: "level",
                    label: "级别",
                    width: "90"
                  }, {
                    default: _withCtx((s) => [
                      _createVNode(_component_el_tag, {
                        type: s.row.level === 'critical' ? 'danger' : 'warning',
                        size: "small"
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(s.row.level), 1 /* TEXT */)
                        ]),
                        _: 2 /* DYNAMIC */
                      }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["data"])
            ])
          ])
        ]))
      : _createCommentVNode("v-if", true),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.alertForm.show,
      "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.alertForm.show) = $event)),
      title: "添加告警规则",
      width: "440px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_22, [
          _createVNode(_component_el_button, {
            onClick: _cache[9] || (_cache[9] = $event => (_ctx.alertForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[25] || (_cache[25] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.addAlert
          }, {
            default: _withCtx(() => [...(_cache[26] || (_cache[26] = [
              _createTextVNode("添加", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "监控指标" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.alertForm.metric,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.alertForm.metric) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "CPU 使用率",
                      value: "cpu"
                    }),
                    _createVNode(_component_el_option, {
                      label: "内存使用率",
                      value: "mem"
                    }),
                    _createVNode(_component_el_option, {
                      label: "磁盘使用率",
                      value: "disk"
                    }),
                    _createVNode(_component_el_option, {
                      label: "负载 (1min)",
                      value: "load1"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "条件" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.alertForm.operator,
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.alertForm.operator) = $event)),
                  style: {"width":"80px"}
                }, null, 8 /* PROPS */, ["modelValue"]),
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.alertForm.threshold,
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.alertForm.threshold) = $event)),
                  style: {"margin-left":"8px","width":"160px"}
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "通知渠道" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.alertForm.channels,
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.alertForm.channels) = $event)),
                  multiple: "",
                  style: {"width":"100%"},
                  placeholder: "留空=全部启用渠道"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "邮件",
                      value: "email"
                    }),
                    _createVNode(_component_el_option, {
                      label: "Webhook",
                      value: "webhook"
                    }),
                    _createVNode(_component_el_option, {
                      label: "钉钉",
                      value: "dingtalk"
                    }),
                    _createVNode(_component_el_option, {
                      label: "企业微信",
                      value: "wecom"
                    }),
                    _createVNode(_component_el_option, {
                      label: "飞书",
                      value: "feishu"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
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
} })()
}
