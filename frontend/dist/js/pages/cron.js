// 计划任务
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return { jobs: [], timer: null,
             form: { show: false, id: null, name: '', schedule: '*/5 * * * *', command: '',
                     type: 'shell',
                     enabled: true, notify: false, timeout: 3600 },
             runs: { show: false, jobId: null, list: [] },
             tplKey: '',
             templates: [
               { key: 'once', name: '执行一次（@once）', schedule: '@once',
                 command: '' },
               { key: 'linux-logclean', name: '清理系统日志', schedule: '@daily',
                 command: "find /var/log -type f -name '*.log' -mtime +7 -delete" },
               { key: 'nginx-reload', name: '平滑重载 Nginx', schedule: '@daily',
                 command: 'nginx -s reload' },
               { key: 'cert-renew', name: '续期 SSL 证书', schedule: '@weekly',
                 command: 'certbot renew --quiet' },
               { key: 'disk-check', name: '磁盘使用率巡检', schedule: '@hourly',
                 command: "df -h | awk '$5+0>90 {print $0}'" },
               { key: 'time-sync', name: '系统时间同步', schedule: '@daily',
                 command: 'ntpdate -u pool.ntp.org 2>/dev/null || chronyc makestep' },
               { key: 'win-tmp', name: '清理 Windows 临时文件', schedule: '@daily',
                 command: "powershell -Command \"Remove-Item $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue\"" },
               { key: 'backup-db', name: '备份网站数据库（示例）', schedule: '@daily',
                 command: 'mysqldump --all-databases | gzip > /backup/db_$(date +%F).sql.gz' },
             ] }
  },
  mounted() { this.load(); this.timer = setInterval(() => this.load(), 20000) },
  beforeUnmount() { clearInterval(this.timer) },
  methods: {
    fmtTime, hasPerm,
    applyTpl(tpl) {
      // 智能模板：选择后自动填好任务名/执行计划/命令
      if (!tpl) return
      this.form.name = tpl.name
      this.form.schedule = tpl.schedule
      this.form.command = tpl.command
    },
    async load() {
      try { this.jobs = (await api.get('/cron/list')).list } catch (e) {}
    },
    openAdd() {
      this.form = { show: true, id: null, name: '', schedule: '*/5 * * * *', command: '',
                    type: 'shell', enabled: true, notify: false, timeout: 3600 }
    },
    openEdit(row) {
      this.form = { show: true, id: row.id, name: row.name, schedule: row.schedule,
                    command: row.command, enabled: !!row.enabled, notify: !!row.notify,
                    timeout: row.timeout || 3600 }
    },
    async submit() {
      try {
        if (this.form.id) {
          await api.put(`/cron/${this.form.id}`, this.form)
        } else {
          await api.post('/cron/add', this.form)
        }
        this.$message.success('已保存')
        this.form.show = false
        this.load()
      } catch (e) {}
    },
    async runNow(row) {
      try {
        await this.$confirm(`立即执行任务「${row.name}」？`, '确认', { type: 'info' })
        const r = await api.post(`/cron/${row.id}/run`)
        this.$message.success(`执行完成，退出码 ${r.code}，耗时 ${r.duration}s`)
        this.load()
      } catch (e) {}
    },
    async toggle(row) {
      try {
        await api.post(`/cron/${row.id}/toggle`, { enabled: row.enabled ? 1 : 0 })
        this.load()
      } catch (e) {}
    },
    async remove(row) {
      try {
        await this.$confirm(`删除任务「${row.name}」及其执行记录？`, '危险操作', { type: 'error' })
        await api.delete(`/cron/${row.id}`)
        this.$message.success('已删除')
        this.load()
      } catch (e) {}
    },
    async showRuns(row) {
      try {
        this.runs.list = (await api.get(`/cron/${row.id}/runs`)).list
        this.runs = { show: true, jobId: row.id, list: this.runs.list }
      } catch (e) {}
    },
  },
  render: (function(){ const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createElementVNode: _createElementVNode, createVNode: _createVNode, toDisplayString: _toDisplayString, createElementBlock: _createElementBlock, renderList: _renderList, Fragment: _Fragment } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { class: "card-body" }
const _hoisted_5 = { class: "gold-text mono" }
const _hoisted_6 = {
  key: 0,
  class: "mono",
  style: {"font-size":"12px","color":"var(--text-secondary)"}
}
const _hoisted_7 = { class: "dialog-footer" }
const _hoisted_8 = { style: {"cursor":"pointer","color":"var(--accent)"} }
const _hoisted_9 = { style: {"max-height":"380px","overflow":"auto","font-size":"12px"} }

return function render(_ctx, _cache) {
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_switch = _resolveComponent("el-switch")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _component_el_popover = _resolveComponent("el-popover")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[10] || (_cache[10] = _createTextVNode("计划任务 ", -1 /* CACHED */)),
        (_ctx.hasPerm('cron:manage'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 0,
              size: "small",
              type: "primary",
              style: {"margin-left":"auto"},
              onClick: _ctx.openAdd
            }, {
              default: _withCtx(() => [...(_cache[9] || (_cache[9] = [
                _createTextVNode("+ 添加任务", -1 /* CACHED */)
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
          title: "支持标准 cron 表达式（分 时 日 月 周）与简化写法：@every 30s / @every 5m / @hourly / @daily / @once（执行一次后自动删除）"
        }),
        _createVNode(_component_el_table, {
          data: _ctx.jobs,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "任务名",
              "min-width": "140",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "计划",
              width: "150"
            }, {
              default: _withCtx((s) => [
                _createElementVNode("b", _hoisted_5, _toDisplayString(s.row.schedule), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "command",
              label: "命令",
              "min-width": "240",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "状态",
              width: "80"
            }, {
              default: _withCtx((s) => [
                (_ctx.hasPerm('cron:manage'))
                  ? (_openBlock(), _createBlock(_component_el_switch, {
                      key: 0,
                      "model-value": !!s.row.enabled,
                      onChange: $event => (_ctx.toggle(s.row))
                    }, null, 8 /* PROPS */, ["model-value", "onChange"]))
                  : (_openBlock(), _createBlock(_component_el_tag, {
                      key: 1,
                      size: "small",
                      type: s.row.enabled ? 'success' : 'info'
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(s.row.enabled ? '启用' : '停用'), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"]))
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "上次执行",
              width: "160"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.last_run)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "结果",
              width: "90"
            }, {
              default: _withCtx((s) => [
                (s.row.last_status)
                  ? (_openBlock(), _createBlock(_component_el_tag, {
                      key: 0,
                      size: "small",
                      type: s.row.last_status === 'success' ? 'success' : 'danger'
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(s.row.last_status), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"]))
                  : _createCommentVNode("v-if", true)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "下次执行",
              width: "250"
            }, {
              default: _withCtx((s) => [
                (s.row.next_runs?.length)
                  ? (_openBlock(), _createElementBlock("span", _hoisted_6, _toDisplayString(s.row.next_runs.slice(0,2).map(t => _ctx.fmtTime(t)).join(' · ')), 1 /* TEXT */))
                  : _createCommentVNode("v-if", true)
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.hasPerm('cron:manage'))
              ? (_openBlock(), _createBlock(_component_el_table_column, {
                  key: 0,
                  label: "操作",
                  width: "200",
                  fixed: "right"
                }, {
                  default: _withCtx((s) => [
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.runNow(s.row))
                    }, {
                      default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                        _createTextVNode("执行", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick"]),
                    _createVNode(_component_el_button, {
                      size: "small",
                      onClick: $event => (_ctx.openEdit(s.row))
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
                      onClick: $event => (_ctx.remove(s.row))
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
        }, 8 /* PROPS */, ["data"])
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.form.show,
      "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.form.show) = $event)),
      title: _ctx.form.id ? '编辑任务' : '添加任务',
      width: "560px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_7, [
          _createVNode(_component_el_button, {
            onClick: _cache[6] || (_cache[6] = $event => (_ctx.form.show = false))
          }, {
            default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submit
          }, {
            default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "任务名称" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.name,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.form.name) = $event)),
                  placeholder: "如：每日备份"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "任务类型" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.form.type,
                  "onUpdate:modelValue": _cache[29] || (_cache[29] = $event => ((_ctx.form.type) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "Shell 脚本",
                      value: "shell"
                    }),
                    _createVNode(_component_el_option, {
                      label: "URL 访问（宝塔式：定时访问网址）",
                      value: "url"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "快捷模板" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.tplKey,
                  "onUpdate:modelValue": _cache[22] || (_cache[22] = $event => ((_ctx.tplKey) = $event)),
                  placeholder: "选择模板自动填充（智能推荐）",
                  clearable: "",
                  onChange: _cache[23] || (_cache[23] = $event => (_ctx.applyTpl(_ctx.templates.find(t => t.key === $event)))),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.templates, (t) => {
                      return (_openBlock(), _createBlock(_component_el_option, {
                        key: t.key,
                        label: t.name,
                        value: t.key
                      }, null, 8 /* PROPS */, ["label", "value"]))
                    }), 256 /* UNKEYED_FRAGMENT */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue", "onChange"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "执行计划" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.schedule,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.form.schedule) = $event)),
                  placeholder: "*/5 * * * * 或 @every 5m / @daily / @once（执行一次）",
                  class: "mono"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "执行命令" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.form.command,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.form.command) = $event)),
                  type: "textarea",
                  rows: 3,
                  class: "code-editor",
                  placeholder: _ctx.form.type === 'url' ? 'http(s):// 网址（定时访问，如监控保活/触发钩子）' : 'shell 命令，如：/usr/bin/backup.sh'
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "超时(秒)" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.form.timeout,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.form.timeout) = $event)),
                  min: 5,
                  max: 86400
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "失败通知" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.notify,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.form.notify) = $event))
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启用" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_switch, {
                  modelValue: _ctx.form.enabled,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.form.enabled) = $event))
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
      modelValue: _ctx.runs.show,
      "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.runs.show) = $event)),
      title: "执行记录",
      width: "720px"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_el_table, {
          data: _ctx.runs.list,
          size: "small",
          "max-height": "440"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              label: "时间",
              width: "160"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.ts)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "退出码",
              width: "80"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.exit_code), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "耗时",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.duration) + "s", 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "输出",
              "min-width": "280"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_popover, {
                  width: "520",
                  trigger: "click"
                }, {
                  reference: _withCtx(() => [
                    _createElementVNode("span", _hoisted_8, _toDisplayString((s.row.output || '').slice(0, 60)) + "…", 1 /* TEXT */)
                  ]),
                  default: _withCtx(() => [
                    _createElementVNode("pre", _hoisted_9, _toDisplayString(s.row.output), 1 /* TEXT */)
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
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })()
}
