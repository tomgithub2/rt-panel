// 备份中心
import api from '../api.js'
import { fmtBytes, fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return {
      tasks: [], files: [],
      form: { show: false, id: null, name: '', type: 'dir', source: '', schedule: '@daily',
              keep: 7, enabled: true, notify: false, exclude: '' },
    }
  },
  mounted() { this.load() },
  methods: {
    fmtBytes, fmtTime, hasPerm,
    async load() {
      try {
        this.tasks = (await api.get('/backups/tasks')).list
        this.files = (await api.get('/backups/files')).list
      } catch (e) {}
    },
    openAdd() {
      this.form = { show: true, id: null, name: '', type: 'dir', source: '', schedule: '@daily',
                    keep: 7, enabled: true, notify: false, exclude: '' }
    },
    openEdit(row) {
      this.form = { show: true, id: row.id, name: row.name, type: row.type, source: row.source,
                    schedule: row.schedule, keep: row.keep, enabled: !!row.enabled,
                    notify: !!row.notify, exclude: row.exclude || '' }
    },
    async submit() {
      try {
        if (this.form.id) await api.put(`/backups/tasks/${this.form.id}`, this.form)
        else await api.post('/backups/tasks', this.form)
        this.$message.success('已保存')
        this.form.show = false
        this.load()
      } catch (e) {}
    },
    async run(row) {
      try {
        await this.$confirm(`立即执行备份「${row.name}」？`, '确认', { type: 'info' })
        const r = await api.post(`/backups/tasks/${row.id}/run`)
        if (r.ok) this.$message.success('备份完成: ' + r.file)
      } catch (e) {}
    },
    async removeTask(row) {
      try {
        await this.$confirm(`删除备份任务「${row.name}」？`, '确认', { type: 'warning' })
        await api.delete(`/backups/tasks/${row.id}`)
        this.load()
      } catch (e) {}
    },
    async delFile(row) {
      try {
        await this.$confirm(`删除备份文件 ${row.name}？`, '确认', { type: 'warning' })
        await api.delete('/backups/files', { data: { path: row.path } })
        this.load()
      } catch (e) {}
    },
    async restore(row) {
      try {
        const { value } = await this.$prompt(`恢复 ${row.name} 到目录（zip）或数据库名（sql.gz）：`, '恢复备份')
        const r = await api.post('/backups/restore', { path: row.path, target: value,
          database: row.name.endsWith('.sql.gz') ? value : '' })
        this.$message.success('恢复完成 → ' + r.target)
      } catch (e) {}
    },
    async downloadFile(row) {
      // 安全下载：Authorization 头鉴权
      try {
        const token = localStorage.getItem('ops_token')
        const resp = await fetch(`/api/files/download?path=${encodeURIComponent(row.path)}`, {
          headers: { Authorization: 'Bearer ' + token },
        })
        if (!resp.ok) throw new Error('下载失败')
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = row.name
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 3000)
      } catch (e) {
        this.$message.error('下载失败: ' + (e.message || ''))
      }
    },
  },
  render: (function(){ const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementVNode: _createElementVNode, createVNode: _createVNode, toDisplayString: _toDisplayString, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = { class: "gold-text mono" }
const _hoisted_6 = { class: "op-card" }
const _hoisted_7 = { class: "card-body" }
const _hoisted_8 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_radio_button = _resolveComponent("el-radio-button")
  const _component_el_radio_group = _resolveComponent("el-radio-group")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[11] || (_cache[11] = _createTextVNode("备份任务 ", -1 /* CACHED */)),
        (_ctx.hasPerm('backups:manage'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 0,
              size: "small",
              type: "primary",
              style: {"margin-left":"auto"},
              onClick: _ctx.openAdd
            }, {
              default: _withCtx(() => [...(_cache[10] || (_cache[10] = [
                _createTextVNode("+ 新建备份任务", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["onClick"]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_4, [
        _createVNode(_component_el_table, {
          data: _ctx.tasks,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "任务名",
              "min-width": "140"
            }),
            _createVNode(_component_el_table_column, {
              label: "类型",
              width: "100"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, { size: "small" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.type === 'dir' ? '目录备份' : '数据库备份'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1024 /* DYNAMIC_SLOTS */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "source",
              label: "源",
              "min-width": "200",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "计划",
              width: "130"
            }, {
              default: _withCtx((s) => [
                _createElementVNode("b", _hoisted_5, _toDisplayString(s.row.schedule), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "保留",
              width: "70"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.keep) + " 份", 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "启用",
              width: "80"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.row.enabled ? 'success' : 'info'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.row.enabled ? '是' : '否'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "上次备份",
              width: "160"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.last_run)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.hasPerm('backups:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "230",
                  fixed: "right"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.run(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                        _createTextVNode("立即备份", -1 /* CACHED */)
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
                      onClick: $event => (_ctx.removeTask(s.row))
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
    _createElementVNode("div", _hoisted_6, [
      _cache[18] || (_cache[18] = _createElementVNode("div", { class: "card-title" }, "备份文件", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_7, [
        _createVNode(_component_el_table, {
          data: _ctx.files,
          size: "small",
          height: "380"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "rel",
              label: "文件",
              "min-width": "260",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "大小",
              width: "110"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtBytes(s.row.size)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "时间",
              width: "170"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.mtime)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.hasPerm('backups:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "230"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.downloadFile(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                        _createTextVNode("下载", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "warning",
                      plain: "",
                      onClick: $event => (_ctx.restore(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
                        _createTextVNode("恢复", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      type: "danger",
                      plain: "",
                      onClick: $event => (_ctx.delFile(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[17] || (_cache[17] = [
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
      "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((_ctx.form.show) = $event)),
      title: _ctx.form.id ? '编辑备份任务' : '新建备份任务',
      width: "520px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_8, [
          _createVNode(_component_el_button, {
            onClick: _cache[8] || (_cache[8] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submit
          }, {
            default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "100px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "任务名称" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.name,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.name) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "备份类型" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_radio_group, {
                  modelValue: _ctx.form.type,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.type) = $event))
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_radio_button, { value: "dir" }, {
                      default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
                        _createTextVNode("目录", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_radio_button, { value: "db" }, {
                      default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
                        _createTextVNode("数据库", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, {
              label: _ctx.form.type === 'dir' ? '源目录' : '数据库'
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.source,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.source) = $event)),
                  placeholder: _ctx.form.type === 'dir' ? '如 /var/www' : '格式: 类型:库名，如 sqlite:mydb / mysql:blog'
                }, null, 8 /* PROPS */, ["modelValue", "placeholder"])
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["label"]),
            _createVNode(_component_el_form_item, { label: "执行计划" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.schedule,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.schedule) = $event)),
                  placeholder: "@daily / @every 6h / 30 3 * * *",
                  class: "mono"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "保留份数" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.form.keep,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.keep) = $event)),
                  min: 1,
                  max: 100
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.form.type === 'dir')
              ? (_openBlock(), _createBlock(_component_el_form_item, {
                  key: 0,
                  label: "排除路径"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.form.exclude,
                      "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.form.exclude) = $event)),
                      placeholder: "逗号分隔，如 /cache,/tmp"
                    }, null, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true),
            _createVNode(_component_el_form_item, { label: "完成通知" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.notify,
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.form.notify) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启用" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.enabled,
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.form.enabled) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
