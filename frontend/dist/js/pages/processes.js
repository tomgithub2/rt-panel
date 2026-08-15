// 进程管理
import api from '../api.js'
import { fmtBytes, fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return { procs: [], search: '', sort: 'cpu', total: 0, timer: null,
             detail: { show: false, data: null } }
  },
  mounted() {
    this.load()
    this.timer = setInterval(() => this.load(), 8000)
  },
  beforeUnmount() { clearInterval(this.timer) },
  methods: {
    fmtBytes, fmtTime, hasPerm,
    async load() {
      try {
        const r = await api.get('/monitor/processes', { params: { search: this.search, sort: this.sort, limit: 300 } })
        this.procs = r.list; this.total = r.total
      } catch (e) {}
    },
    async kill(row, force) {
      try {
        await this.$confirm(`确定${force ? '强制' : ''}结束进程 ${row.name} (PID ${row.pid})？`, '危险操作', { type: 'error' })
        await api.post('/processes/kill', { pid: row.pid, force })
        this.$message.success('已结束')
        this.load()
      } catch (e) {}
    },
    async showDetail(row) {
      try {
        this.detail.data = await api.get(`/processes/${row.pid}`)
        this.detail.show = true
      } catch (e) {}
    },
    async setNice(row) {
      try {
        const { value } = await this.$prompt(`设置进程 ${row.name} 的优先级（Linux: -20~19，Windows: 0~5）`, '优先级', {
          inputValue: '0', inputPattern: /^-?\d+$/, inputErrorMessage: '请输入整数' })
        await api.post('/processes/priority', { pid: row.pid, nice: parseInt(value) })
        this.$message.success('已调整')
        this.load()
      } catch (e) {}
    },
  },
  render: (function(){ const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withKeys: _withKeys, createVNode: _createVNode, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_5 = { class: "card-body" }
const _hoisted_6 = {
  class: "op-toolbar",
  style: {"margin-bottom":"10px"}
}
const _hoisted_7 = { class: "gold-text" }
const _hoisted_8 = {
  key: 1,
  style: {"margin-top":"14px"}
}

return function render(_ctx, _cache) {
  const _component_el_input = _resolveComponent("el-input")
  const _component_Search = _resolveComponent("Search")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_descriptions_item = _resolveComponent("el-descriptions-item")
  const _component_el_descriptions = _resolveComponent("el-descriptions")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[3] || (_cache[3] = _createTextVNode("进程管理 ", -1 /* CACHED */)),
        _createElementVNode("span", _hoisted_4, "共 " + _toDisplayString(_ctx.total) + " 个进程 · 每 8 秒自动刷新", 1 /* TEXT */)
      ]),
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("div", _hoisted_6, [
          _createVNode(_component_el_input, {
            modelValue: _ctx.search,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.search) = $event)),
            placeholder: "搜索进程名 / 命令行",
            style: {"width":"260px"},
            clearable: "",
            onKeyup: _withKeys(_ctx.load, ["enter"])
          }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
          _createVNode(_component_el_button, { onClick: _ctx.load }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Search)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[4] || (_cache[4] = _createTextVNode(" 搜索", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"]),
          _createVNode(_component_el_select, {
            modelValue: _ctx.sort,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.sort) = $event)),
            style: {"width":"130px"},
            onChange: _ctx.load
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
              }),
              _createVNode(_component_el_option, {
                label: "按名称",
                value: "name"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue", "onChange"]),
          _cache[5] || (_cache[5] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
          _createVNode(_component_el_button, {
            icon: 'Refresh',
            circle: "",
            onClick: _ctx.load
          }, null, 8 /* PROPS */, ["onClick"])
        ]),
        _createVNode(_component_el_table, {
          data: _ctx.procs,
          size: "small",
          height: "560"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "pid",
              label: "PID",
              width: "80"
            }),
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "进程名",
              "min-width": "140",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "user",
              label: "用户",
              width: "110",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "CPU %",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createElementVNode("b", _hoisted_7, _toDisplayString(s.row.cpu), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "内存 %",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.mem), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "RSS",
              width: "110"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtBytes(s.row.rss)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "threads",
              label: "线程",
              width: "70"
            }),
            _createVNode(_component_el_table_column, {
              prop: "status",
              label: "状态",
              width: "90"
            }),
            _createVNode(_component_el_table_column, {
              label: "启动时间",
              width: "160"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.create_time)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "cmdline",
              label: "命令行",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            (_ctx.hasPerm('processes:kill'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "180",
                  fixed: "right"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.showDetail(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[6] || (_cache[6] = [
                        _createTextVNode("详情", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.setNice(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[7] || (_cache[7] = [
                        _createTextVNode("优先级", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.kill(s.row, true))
                    }, {
                      default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
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
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.detail.show,
      "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.detail.show) = $event)),
      title: "进程详情",
      width: "720px"
    }, {
      default: _withCtx(() => [
        (_ctx.detail.data)
          ? (_openBlock(), _createBlock(_component_el_descriptions, {
              key: 0,
              column: 2,
              border: "",
              size: "small"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_descriptions_item, { label: "名称" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.name), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, { label: "PID" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.pid), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, { label: "用户" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.username), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, { label: "状态" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.status), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, { label: "线程数" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.num_threads), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, { label: "RSS" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.fmtBytes(_ctx.detail.data.memory_info?.rss)), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, {
                  label: "工作目录",
                  span: 2
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.cwd), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, {
                  label: "可执行文件",
                  span: 2
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.exe), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                }),
                _createVNode(_component_el_descriptions_item, {
                  label: "命令行",
                  span: 2,
                  style: {"word-break":"break-all"}
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(_ctx.detail.data.cmdline?.join(' ')), 1 /* TEXT */)
                  ]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }))
          : _createCommentVNode("v-if", true),
        (_ctx.detail.data?.connections?.length)
          ? (_openBlock(), _createElementBlock("div", _hoisted_8, [
              _cache[9] || (_cache[9] = _createElementVNode("b", { style: {"font-size":"13px"} }, "网络连接（前 50）", -1 /* CACHED */)),
              _createVNode(_component_el_table, {
                data: _ctx.detail.data.connections.slice(0,50),
                size: "small",
                "max-height": "200",
                style: {"margin-top":"8px"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_table_column, {
                    prop: "laddr",
                    label: "本地"
                  }),
                  _createVNode(_component_el_table_column, {
                    prop: "raddr",
                    label: "远端"
                  }),
                  _createVNode(_component_el_table_column, {
                    prop: "status",
                    label: "状态",
                    width: "100"
                  })
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["data"])
            ]))
          : _createCommentVNode("v-if", true)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })()
}
