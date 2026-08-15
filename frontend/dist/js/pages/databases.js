// 数据库管理
import api from '../api.js'
import { fmtTime, hasPerm } from '../util.js'

export default {
  data() {
    return {
      servers: [], activeKind: 'sqlite', dbs: [], activeDb: '',
      tables: [], query: { sql: '', result: null, running: false },
      createForm: { show: false, name: '', charset: 'utf8mb4' },
      tableDialog: { show: false, name: '', tab: 'data', schema: [], data: { cols: [], rows: [], total: 0 }, limit: 100 },
      sqlTemplates: [
        { label: 'SELECT 查询', sql: 'SELECT * FROM 表名 LIMIT 20;' },
        { label: 'INSERT 插入', sql: "INSERT INTO 表名 (列1, 列2) VALUES ('值1', '值2');" },
        { label: 'UPDATE 更新', sql: "UPDATE 表名 SET 列1='新值' WHERE 条件;" },
        { label: 'DELETE 删除', sql: 'DELETE FROM 表名 WHERE 条件;' },
        { label: 'CREATE TABLE', sql: 'CREATE TABLE 表名 (id INTEGER PRIMARY KEY, name TEXT, created_at TEXT);' },
        { label: 'DROP TABLE', sql: 'DROP TABLE 表名;' },
        { label: 'ALTER 加列', sql: 'ALTER TABLE 表名 ADD COLUMN 列名 类型;' },
        { label: 'COUNT 统计', sql: 'SELECT COUNT(*) FROM 表名;' },
      ],
    }
  },
  mounted() { this.loadServers() },
  methods: {
    fmtTime, hasPerm,
    async loadServers() {
      try {
        this.servers = (await api.get('/databases/servers')).list
        const connected = this.servers.find(s => s.connected)
        if (connected) await this.switchKind(connected.type)
      } catch (e) {}
    },
    async switchKind(kind) {
      this.activeKind = kind
      try {
        this.dbs = (await api.get(`/databases/${kind}/databases`)).list
        this.activeDb = this.dbs[0]?.name || ''
        if (this.activeDb) this.loadTables()
        else this.tables = []
      } catch (e) {}
    },
    async switchDb(db) {
      this.activeDb = db
      this.loadTables()
    },
    async loadTables() {
      try {
        this.tables = (await api.get(`/databases/${this.activeKind}/${this.activeDb}/tables`)).list
      } catch (e) { this.tables = [] }
    },
    async openTable(row) {
      this.tableDialog = { show: true, name: row.name, tab: 'data', schema: [], data: { cols: [], rows: [], total: 0 }, limit: 100 }
      this.loadSchema(row.name)
      this.loadRows(row.name)
    },
    async loadSchema(table) {
      try {
        this.tableDialog.schema = (await api.get(
          `/databases/${this.activeKind}/${this.activeDb}/schema?table=${encodeURIComponent(table)}`)).list
      } catch (e) { this.tableDialog.schema = [] }
    },
    async loadRows(table) {
      try {
        this.tableDialog.data = await api.get(
          `/databases/${this.activeKind}/${this.activeDb}/rows?table=${encodeURIComponent(table)}&limit=${this.tableDialog.limit}`)
      } catch (e) {}
    },
    useTemplate(t) {
      this.query.sql = t.sql
    },
    async createDb() {
      try {
        await api.post(`/databases/${this.activeKind}/database`, this.createForm)
        this.$message.success('数据库已创建')
        this.createForm.show = false
        this.switchKind(this.activeKind)
      } catch (e) {}
    },
    async dropDb(db) {
      try {
        await this.$confirm(`确定删除数据库 ${db.name} ？所有数据将丢失！`, '危险操作', { type: 'error' })
        await api.delete(`/databases/${this.activeKind}/database`, { data: { name: db.name } })
        this.$message.success('已删除')
        this.switchKind(this.activeKind)
      } catch (e) {}
    },
    async runQuery() {
      if (!this.query.sql) return this.$message.warning('请输入 SQL')
      this.query.running = true
      try {
        this.query.result = await api.post('/databases/query', {
          kind: this.activeKind, db: this.activeDb, sql: this.query.sql })
      } catch (e) {} finally { this.query.running = false }
    },
    async backup(db) {
      try {
        const r = await api.get(`/databases/${this.activeKind}/${db.name}/backup`)
        this.$message.success('备份完成: ' + r.path)
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = { class: "op-card" }
const _hoisted_3 = { class: "card-body" }
const _hoisted_4 = { class: "chart-grid" }
const _hoisted_5 = { class: "op-card" }
const _hoisted_6 = { class: "card-title" }
const _hoisted_7 = { class: "card-body" }
const _hoisted_8 = { class: "op-card" }
const _hoisted_9 = { class: "card-title" }
const _hoisted_10 = { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }
const _hoisted_11 = { class: "card-body" }
const _hoisted_12 = {
  class: "gold-text",
  style: {"cursor":"pointer"}
}
const _hoisted_13 = { class: "op-card" }
const _hoisted_14 = { class: "card-body" }
const _hoisted_15 = {
  class: "op-toolbar",
  style: {"margin-bottom":"10px"}
}
const _hoisted_16 = {
  class: "op-toolbar",
  style: {"margin-bottom":"10px"}
}
const _hoisted_17 = {
  key: 1,
  style: {"margin-top":"12px"}
}
const _hoisted_18 = { style: {"color":"var(--text-secondary)","font-size":"12px","margin-bottom":"8px"} }
const _hoisted_19 = { class: "dialog-footer" }
const _hoisted_20 = {
  class: "op-toolbar",
  style: {"margin-bottom":"8px"}
}
const _hoisted_21 = { style: {"color":"var(--text-secondary)","font-size":"12px"} }

return function render(_ctx, _cache) {
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_input = _resolveComponent("el-input")
  const _component_VideoPlay = _resolveComponent("VideoPlay")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_el_tab_pane = _resolveComponent("el-tab-pane")
  const _component_el_tabs = _resolveComponent("el-tabs")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _cache[13] || (_cache[13] = _createElementVNode("div", { class: "card-title" }, "数据库服务器", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_3, [
        _createVNode(_component_el_table, {
          data: _ctx.servers,
          size: "small"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              prop: "name",
              label: "类型",
              width: "200"
            }),
            _createVNode(_component_el_table_column, {
              prop: "version",
              label: "版本",
              "min-width": "220",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "状态",
              width: "120"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_tag, {
                  size: "small",
                  type: s.connected ? 'success' : 'danger'
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(s.connected ? '已连接' : '未连接'), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              prop: "error",
              label: "说明",
              "min-width": "200",
              "show-overflow-tooltip": ""
            }),
            _createVNode(_component_el_table_column, {
              label: "操作",
              width: "120"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_button, {
                  size: "small",
                  type: "primary",
                  plain: "",
                  disabled: !s.connected,
                  onClick: $event => (_ctx.switchKind(s.type))
                }, {
                  default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                    _createTextVNode("管理", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["disabled", "onClick"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data"])
      ])
    ]),
    _createElementVNode("div", _hoisted_4, [
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("div", _hoisted_6, [
          _cache[15] || (_cache[15] = _createTextVNode("数据库列表 ", -1 /* CACHED */)),
          (_ctx.hasPerm('databases:manage'))
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                size: "small",
                type: "primary",
                style: {"margin-left":"auto"},
                onClick: _cache[0] || (_cache[0] = $event => (_ctx.createForm.show = true))
              }, {
                default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
                  _createTextVNode("+ 创建数据库", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true)
        ]),
        _createElementVNode("div", _hoisted_7, [
          _createVNode(_component_el_table, {
            data: _ctx.dbs,
            size: "small",
            height: "380",
            "highlight-current-row": "",
            onCurrentChange: _cache[1] || (_cache[1] = r => r && _ctx.switchDb(r.name))
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "name",
                label: "名称",
                "min-width": "150"
              }),
              _createVNode(_component_el_table_column, {
                prop: "size_mb",
                label: "大小(MB)",
                width: "100"
              }),
              (_ctx.hasPerm('databases:manage'))
                ? (_openBlock(), _createBlock(_component_el_table_column, {
                    key: 0,
                    label: "操作",
                    width: "160"
                  }, {
                    default: _withCtx((s) => [
                      _createVNode(_component_el_button, {
                        size: "small",
                        onClick: $event => (_ctx.backup(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
                          _createTextVNode("备份", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"]),
                      _createVNode(_component_el_button, {
                        size: "small",
                        type: "danger",
                        plain: "",
                        onClick: $event => (_ctx.dropDb(s.row))
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
      _createElementVNode("div", _hoisted_8, [
        _createElementVNode("div", _hoisted_9, [
          _cache[18] || (_cache[18] = _createTextVNode("数据表 ", -1 /* CACHED */)),
          _createElementVNode("span", _hoisted_10, _toDisplayString(_ctx.activeDb) + " · 点击表名查看结构与数据", 1 /* TEXT */)
        ]),
        _createElementVNode("div", _hoisted_11, [
          _createVNode(_component_el_table, {
            data: _ctx.tables,
            size: "small",
            height: "380",
            onRowClick: _ctx.openTable
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_table_column, {
                prop: "name",
                label: "表名",
                "min-width": "180",
                "show-overflow-tooltip": ""
              }, {
                default: _withCtx((s) => [
                  _createElementVNode("span", _hoisted_12, _toDisplayString(s.row.name), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_el_table_column, {
                prop: "engine",
                label: "引擎",
                width: "100"
              }),
              _createVNode(_component_el_table_column, {
                prop: "rows",
                label: "行数",
                width: "100"
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["data", "onRowClick"])
        ])
      ])
    ]),
    _createElementVNode("div", _hoisted_13, [
      _cache[20] || (_cache[20] = _createElementVNode("div", { class: "card-title" }, [
        _createTextVNode("SQL 查询控制台 "),
        _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px","font-weight":"400"} }, "执行语句将被审计记录")
      ], -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_14, [
        _createElementVNode("div", _hoisted_15, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.sqlTemplates, (t) => {
            return (_openBlock(), _createBlock(_component_el_button, {
              key: t.label,
              size: "small",
              onClick: $event => (_ctx.useTemplate(t))
            }, {
              default: _withCtx(() => [
                _createTextVNode(_toDisplayString(t.label), 1 /* TEXT */)
              ]),
              _: 2 /* DYNAMIC */
            }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"]))
          }), 128 /* KEYED_FRAGMENT */))
        ]),
        _createElementVNode("div", _hoisted_16, [
          _createVNode(_component_el_input, {
            modelValue: _ctx.query.sql,
            "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.query.sql) = $event)),
            type: "textarea",
            rows: 3,
            class: "code-editor",
            style: {"flex":"1"},
            placeholder: "输入 SQL 语句…"
          }, null, 8 /* PROPS */, ["modelValue"])
        ]),
        (_ctx.hasPerm('databases:manage'))
          ? (_openBlock(), _createBlock(_component_el_button, {
              key: 0,
              type: "primary",
              loading: _ctx.query.running,
              onClick: _ctx.runQuery
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_VideoPlay)
                  ]),
                  _: 1 /* STABLE */
                }),
                _cache[19] || (_cache[19] = _createTextVNode(" 执行 ", -1 /* CACHED */))
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["loading", "onClick"]))
          : _createCommentVNode("v-if", true),
        (_ctx.query.result)
          ? (_openBlock(), _createElementBlock("div", _hoisted_17, [
              (_ctx.query.result.error)
                ? (_openBlock(), _createBlock(_component_el_alert, {
                    key: 0,
                    title: _ctx.query.result.error,
                    type: "error",
                    closable: false
                  }, null, 8 /* PROPS */, ["title"]))
                : (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                    _createElementVNode("div", _hoisted_18, _toDisplayString(_ctx.query.result.count !== undefined ? _ctx.query.result.count + ' 行' : '') + " " + _toDisplayString(_ctx.query.result.affected !== undefined ? '影响 ' + _ctx.query.result.affected + ' 行' : ''), 1 /* TEXT */),
                    _createVNode(_component_el_table, {
                      data: _ctx.query.result.rows || [],
                      size: "small",
                      "max-height": "320",
                      border: ""
                    }, {
                      default: _withCtx(() => [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.query.result.cols || [], (c) => {
                          return (_openBlock(), _createBlock(_component_el_table_column, {
                            key: c,
                            prop: c,
                            label: c,
                            "min-width": "120",
                            "show-overflow-tooltip": ""
                          }, null, 8 /* PROPS */, ["prop", "label"]))
                        }), 128 /* KEYED_FRAGMENT */))
                      ]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["data"])
                  ], 64 /* STABLE_FRAGMENT */))
            ]))
          : _createCommentVNode("v-if", true)
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.createForm.show,
      "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((_ctx.createForm.show) = $event)),
      title: "创建数据库",
      width: "420px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_19, [
          _createVNode(_component_el_button, {
            onClick: _cache[5] || (_cache[5] = $event => (_ctx.createForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.createDb
          }, {
            default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
              _createTextVNode("创建", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "名称" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.createForm.name,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.createForm.name) = $event)),
                  placeholder: "字母数字下划线"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            (_ctx.activeKind === 'mysql')
              ? (_openBlock(), _createBlock(_component_el_form_item, {
                  key: 0,
                  label: "字符集"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_select, {
                      modelValue: _ctx.createForm.charset,
                      "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.createForm.charset) = $event)),
                      style: {"width":"100%"}
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_el_option, {
                          label: "utf8mb4 (推荐)",
                          value: "utf8mb4"
                        }),
                        _createVNode(_component_el_option, {
                          label: "utf8",
                          value: "utf8"
                        }),
                        _createVNode(_component_el_option, {
                          label: "gbk",
                          value: "gbk"
                        })
                      ]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["modelValue"])
                  ]),
                  _: 1 /* STABLE */
                }))
              : _createCommentVNode("v-if", true)
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.tableDialog.show,
      "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((_ctx.tableDialog.show) = $event)),
      title: '表 ' + _ctx.tableDialog.name,
      width: "860px"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_el_tabs, {
          modelValue: _ctx.tableDialog.tab,
          "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.tableDialog.tab) = $event))
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_tab_pane, {
              label: "数据浏览",
              name: "data"
            }, {
              default: _withCtx(() => [
                _createElementVNode("div", _hoisted_20, [
                  _createElementVNode("span", _hoisted_21, "共 " + _toDisplayString(_ctx.tableDialog.data.total) + " 行（最多显示 " + _toDisplayString(_ctx.tableDialog.limit) + " 行）", 1 /* TEXT */),
                  _createVNode(_component_el_input_number, {
                    modelValue: _ctx.tableDialog.limit,
                    "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.tableDialog.limit) = $event)),
                    min: 10,
                    max: 500,
                    step: 50,
                    size: "small",
                    style: {"width":"110px"},
                    onChange: _cache[8] || (_cache[8] = $event => (_ctx.loadRows(_ctx.tableDialog.name)))
                  }, null, 8 /* PROPS */, ["modelValue"]),
                  _cache[24] || (_cache[24] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
                  _createVNode(_component_el_button, {
                    size: "small",
                    onClick: _cache[9] || (_cache[9] = $event => (_ctx.loadRows(_ctx.tableDialog.name)))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_el_icon, null, {
                        default: _withCtx(() => [
                          _createVNode(_component_Refresh)
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _cache[23] || (_cache[23] = _createTextVNode(" 刷新", -1 /* CACHED */))
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _createVNode(_component_el_table, {
                  data: _ctx.tableDialog.data.rows || [],
                  size: "small",
                  "max-height": "400",
                  border: ""
                }, {
                  default: _withCtx(() => [
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.tableDialog.data.cols || [], (c) => {
                      return (_openBlock(), _createBlock(_component_el_table_column, {
                        key: c,
                        prop: c,
                        label: c,
                        "min-width": "120",
                        "show-overflow-tooltip": ""
                      }, null, 8 /* PROPS */, ["prop", "label"]))
                    }), 128 /* KEYED_FRAGMENT */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["data"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_tab_pane, {
              label: "表结构",
              name: "schema"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table, {
                  data: _ctx.tableDialog.schema,
                  size: "small",
                  "max-height": "400"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_table_column, {
                      prop: "name",
                      label: "列名",
                      "min-width": "160"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "type",
                      label: "类型",
                      "min-width": "140"
                    }),
                    _createVNode(_component_el_table_column, {
                      label: "主键",
                      width: "80"
                    }, {
                      default: _withCtx((s) => [
                        (s.row.pk)
                          ? (_openBlock(), _createBlock(_component_el_tag, {
                              key: 0,
                              size: "small",
                              type: "warning"
                            }, {
                              default: _withCtx(() => [...(_cache[25] || (_cache[25] = [
                                _createTextVNode("PK", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }))
                          : _createCommentVNode("v-if", true)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_table_column, {
                      label: "非空",
                      width: "80"
                    }, {
                      default: _withCtx((s) => [
                        _createTextVNode(_toDisplayString(s.row.notnull ? '✔' : '-'), 1 /* TEXT */)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "default",
                      label: "默认值",
                      "min-width": "120",
                      "show-overflow-tooltip": ""
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["data"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["modelValue"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
