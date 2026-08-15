// Created by 小杜 on 2026/08

// 进程守护：关键进程挂了自动拉起
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return {
      list: [], timer: null,
      form: { show: false, id: null, name: '', process: '', cmd: '', max_restarts: 10, enabled: true },
      logs: { show: false, gid: null, name: '', list: [] },
    }
  },
  mounted() { this.load(); this.timer = setInterval(() => this.load(), 10000) },
  beforeUnmount() { clearInterval(this.timer) },
  methods: {
    fmtTime, hasPerm,
    async load() {
      try { this.list = (await api.get('/guardian/list')).list } catch (e) {}
    },
    openAdd() {
      this.form = { show: true, id: null, name: '', process: '', cmd: '', max_restarts: 10, enabled: true }
    },
    openEdit(row) {
      this.form = { show: true, id: row.id, name: row.name, process: row.process, cmd: row.cmd,
                    max_restarts: row.max_restarts, enabled: !!row.enabled }
    },
    async submit() {
      try {
        if (this.form.id) await api.put(`/guardian/${this.form.id}`, this.form)
        else await api.post('/guardian/add', this.form)
        this.$message.success('已保存')
        this.form.show = false
        this.load()
      } catch (e) {}
    },
    async remove(row) {
      try {
        await this.$confirm(`删除守护项「${row.name}」？`, '确认', { type: 'warning' })
        await api.delete(`/guardian/${row.id}`)
        this.load()
      } catch (e) {}
    },
    async toggle(row) {
      try {
        await api.put(`/guardian/${row.id}`, { enabled: row.enabled ? 1 : 0 })
        this.load()
      } catch (e) {}
    },
    async checkNow(row) {
      try {
        const r = await api.post(`/guardian/${row.id}/check`)
        this.$message.info(`「${r.name}」当前${r.running ? '运行中 ✔' : '未运行 ✘'}`)
      } catch (e) {}
    },
    async showLogs(row) {
      try {
        this.logs.list = (await api.get(`/guardian/${row.id}/logs`)).list
        this.logs = { show: true, gid: row.id, name: row.name, list: this.logs.list }
      } catch (e) {}
    },
  },
  render: (function(){ const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[10] || (_cache[10] = _createTextVNode("进程守护 ", -1 /* CACHED */)),
        _createVNode(_component_el_tag, {
          size: "small",
          style: {"margin-left":"10px"}
        }, {
          default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
            _createTextVNode("每 30 秒自动巡检，进程异常退出自动拉起", -1 /* CACHED */)
          ]))]),
          _: 1 /* STABLE */
        }),
        (_ctx.hasPerm('processes:kill'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 0,
              size: "small",
              type: "primary",
              style: {"margin-left":"auto"},
              onClick: _ctx.openAdd
            }, {
              default: _withCtx(() => [...(_cache[9] || (_cache[9] = [
                _createTextVNode(" + 添加守护 ", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["onClick"]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_4, [
        _createVNode(_component_el_alert, {
          type: "info",
          closable: false,
          style: {"margin-bottom":"12px"},
          title: "用于守护关键业务进程（如自建服务、脚本）：进程标识填写进程名或命令行关键字，面板检测不到该进程时自动执行启动命令（每日拉起次数受上限限制，防死循环）"
        }),
        _createVNode(_component_el_table, {
          data: _ctx.list,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "名称",
              "min-width": "130"
            }),
            _createVNode(_component_el_table_column, {
              prop: "process",
              label: "进程标识",
              "min-width": "150",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              prop: "cmd",
              label: "启动命令",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "运行状态",
              width: "100"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.row.running ? 'success' : 'danger'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.running ? '运行中' : '未运行'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "每日上限",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.max_restarts) + " 次", 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "启用",
              width: "80"
            }, {
              default: _withCtx((s) => [
                (_ctx.hasPerm('processes:kill'))
                  ? (_openBlock(), _createBlock(_component_el_switch, {
                      key: 0,
                      "model-value": !!s.row.enabled,
                      onChange: $event => (_ctx.toggle(s.row))
                    }, null, 8 /* PROPS */, ["model-value", "onChange"]))
                  : (_openBlock(), _createBlock(_component_el_tag, {
                      key: 1,
                      size: "small"
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(s.row.enabled ? '是' : '否'), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */))
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "最近拉起",
              width: "160"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.last_restart)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.hasPerm('processes:kill'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "230",
                  fixed: "right"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.checkNow(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                        _createTextVNode("检测", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.showLogs(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                        _createTextVNode("日志", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.openEdit(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
                        _createTextVNode("编辑", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.remove(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
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
      title: _ctx.form.id ? '编辑守护' : '添加守护',
      width: "560px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_5, [
          _createVNode(_component_el_button, {
            onClick: _cache[5] || (_cache[5] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submit
          }, {
            default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "100px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "名称" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.name,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.name) = $event)),
                  placeholder: "如：我的业务服务"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "进程标识" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.process,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.process) = $event)),
                  placeholder: "进程名或命令行关键字，如 myapp.exe / node app.js"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启动命令" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.cmd,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.cmd) = $event)),
                  class: "code-editor",
                  placeholder: "进程不在时执行的命令"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "每日拉起上限" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.form.max_restarts,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.max_restarts) = $event)),
                  min: 1,
                  max: 100
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启用" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.enabled,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.enabled) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.logs.show,
      "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.logs.show) = $event)),
      title: '拉起记录 · ' + _ctx.logs.name,
      width: "560px"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_el_table, {
          data: _ctx.logs.list,
          size: "small",
          "max-height": "400"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              label: "时间",
              width: "180"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.ts)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "action",
              label: "动作",
              width: "120"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: "warning"
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.action), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1024 /* DYNAMIC_SLOTS */)
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
