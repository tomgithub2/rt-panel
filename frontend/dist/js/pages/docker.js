// Docker 管理
import api from '../api.js'
import { fmtBytes, hasPerm } from '../util.js'

export default {
  data() {
    return {
      status: null, containers: [], images: [], networks: [], volumes: [],
      tab: 'containers', error: '',
      createForm: { show: false, image: '', name: '', ports: [''], env: [''], volumes: [''], network: '', restart: 'unless-stopped', command: '' },
      logsDialog: { show: false, cid: '', logs: '' },
      installing: false, installMsg: '', installPollTimer: null,
    }
  },
  mounted() { this.load() },
  beforeUnmount() { clearInterval(this.installPollTimer) },
  computed: {
    dockerMissing() { return !this.status && this.error },
  },
  methods: {
    fmtBytes, hasPerm,
    async load() {
      this.error = ''
      try {
        this.status = await api.get('/docker/status')
        this.containers = (await api.get('/docker/containers')).list
        this.images = (await api.get('/docker/images')).list
        this.networks = (await api.get('/docker/networks')).list
        this.volumes = (await api.get('/docker/volumes')).list
      } catch (e) { this.error = e.response?.data?.detail || 'Docker 不可用' }
    },
    async installDocker() {
      try {
        await this.$confirm(
          '将在后台安装 Docker 引擎：\n· Windows：通过 winget 安装 Docker Desktop（需 WSL2）\n· Linux：官方 get.docker.com 一键脚本\n\n安装耗时数分钟，期间请勿关闭面板。继续？',
          '安装 Docker', { type: 'info', confirmButtonText: '开始安装' })
        this.installing = true
        this.installMsg = '安装任务已提交，正在安装…'
        await api.post('/software/install', { key: 'docker' })
        // 轮询安装状态
        this.installPollTimer = setInterval(async () => {
          try {
            const r = await api.get('/software/install-status')
            const rec = (r.list || []).find(x => x.name === 'docker' && x.action === 'install')
            if (rec) {
              this.installMsg = rec.exit_code === 0
                ? '安装完成！正在启动 Docker 服务…'
                : '安装结束（退出码 ' + rec.exit_code + '），请查看输出'
              clearInterval(this.installPollTimer)
              setTimeout(() => {
                this.installing = false
                this.load()
              }, 3000)
            }
          } catch (e) {}
        }, 8000)
      } catch (e) {}
    },
    async action(row, act) {
      try {
        await this.$confirm(`对容器 ${row.Names} 执行 ${act}？`, '容器操作', { type: 'warning' })
        await api.post(`/docker/containers/${row.ID}/action`, { action: act })
        this.$message.success('操作完成')
        setTimeout(() => this.load(), 1200)
      } catch (e) {}
    },
    async showLogs(row) {
      try {
        const r = await api.get(`/docker/containers/${row.ID}/logs?lines=300`)
        this.logsDialog = { show: true, cid: row.Names, logs: r.logs }
      } catch (e) {}
    },
    async createContainer() {
      try {
        const payload = { ...this.createForm }
        payload.ports = payload.ports.filter(x => x)
        payload.env = payload.env.filter(x => x)
        payload.volumes = payload.volumes.filter(x => x)
        await api.post('/docker/containers/create', payload)
        this.$message.success('容器已创建')
        this.createForm.show = false
        setTimeout(() => this.load(), 1500)
      } catch (e) {}
    },
    async pullImage() {
      try {
        const { value } = await this.$prompt('拉取镜像（如 nginx:latest）：', '拉取镜像')
        await api.post('/docker/images/pull', { image: value })
        this.$message.success('拉取任务已启动')
      } catch (e) {}
    },
    async rmi(row) {
      try {
        await this.$confirm(`删除镜像 ${row.Repository}:${row.Tag}？`, '确认', { type: 'warning' })
        await api.delete(`/docker/images/${row.ID}`)
        this.load()
      } catch (e) {}
    },
    async stats(row) {
      try {
        const r = await api.get(`/docker/containers/${row.ID}/stats`)
        this.$alert(
          `CPU: ${r.CPUPerc || '-'} | 内存: ${r.MemUsage || '-'} | 网络: ${r.NetIO || '-'} | 磁盘: ${r.BlockIO || '-'}`,
          `容器统计 ${row.Names}`, { confirmButtonText: '关闭' })
      } catch (e) {}
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, openBlock: _openBlock, createElementBlock: _createElementBlock, createCommentVNode: _createCommentVNode, createBlock: _createBlock, renderList: _renderList, Fragment: _Fragment } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = {
  key: 0,
  class: "stat-grid"
}
const _hoisted_3 = { class: "op-card stat-card" }
const _hoisted_4 = { class: "stat-head" }
const _hoisted_5 = { class: "stat-icon" }
const _hoisted_6 = { class: "stat-num gold-text" }
const _hoisted_7 = { style: {"font-size":"14px"} }
const _hoisted_8 = { class: "op-card stat-card" }
const _hoisted_9 = { class: "stat-head" }
const _hoisted_10 = { class: "stat-icon" }
const _hoisted_11 = { class: "stat-num gold-text" }
const _hoisted_12 = { class: "op-card stat-card" }
const _hoisted_13 = { class: "stat-head" }
const _hoisted_14 = { class: "stat-icon" }
const _hoisted_15 = {
  class: "stat-num gold-text",
  style: {"font-size":"22px"}
}
const _hoisted_16 = { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"6px"} }
const _hoisted_17 = { class: "op-card stat-card" }
const _hoisted_18 = { class: "stat-head" }
const _hoisted_19 = { class: "stat-icon" }
const _hoisted_20 = {
  class: "stat-num gold-text",
  style: {"font-size":"20px"}
}
const _hoisted_21 = { class: "op-card" }
const _hoisted_22 = { class: "card-title" }
const _hoisted_23 = {
  key: 0,
  style: {"margin-left":"auto","display":"flex","gap":"8px"}
}
const _hoisted_24 = { class: "card-body" }
const _hoisted_25 = { class: "dialog-footer" }
const _hoisted_26 = { style: {"background":"#0b0d10","border":"1px solid var(--border)","border-radius":"8px","padding":"14px","height":"480px","overflow":"auto","font-size":"12px","margin":"0","color":"#c8d3e0","white-space":"pre-wrap","word-break":"break-all"} }

return function render(_ctx, _cache) {
  const _component_Box = _resolveComponent("Box")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_Files = _resolveComponent("Files")
  const _component_Cpu = _resolveComponent("Cpu")
  const _component_Odometer = _resolveComponent("Odometer")
  const _component_el_button = _resolveComponent("el-button")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_tab_pane = _resolveComponent("el-tab-pane")
  const _component_el_tabs = _resolveComponent("el-tabs")
  const _component_el_input = _resolveComponent("el-input")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    (_ctx.status)
      ? (_openBlock(), _createElementBlock("div", _hoisted_2, [
          _createElementVNode("div", _hoisted_3, [
            _createElementVNode("div", _hoisted_4, [
              _cache[12] || (_cache[12] = _createElementVNode("span", { class: "stat-label" }, "容器", -1 /* CACHED */)),
              _createElementVNode("span", _hoisted_5, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Box)
                  ]),
                  _: 1 /* STABLE */
                })
              ])
            ]),
            _createElementVNode("div", _hoisted_6, [
              _createTextVNode(_toDisplayString(_ctx.status.running), 1 /* TEXT */),
              _createElementVNode("span", _hoisted_7, " / " + _toDisplayString(_ctx.status.containers), 1 /* TEXT */)
            ]),
            _cache[13] || (_cache[13] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"6px"} }, "运行中 / 总数", -1 /* CACHED */))
          ]),
          _createElementVNode("div", _hoisted_8, [
            _createElementVNode("div", _hoisted_9, [
              _cache[14] || (_cache[14] = _createElementVNode("span", { class: "stat-label" }, "镜像", -1 /* CACHED */)),
              _createElementVNode("span", _hoisted_10, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Files)
                  ]),
                  _: 1 /* STABLE */
                })
              ])
            ]),
            _createElementVNode("div", _hoisted_11, _toDisplayString(_ctx.status.images), 1 /* TEXT */),
            _cache[15] || (_cache[15] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"6px"} }, "本地镜像数", -1 /* CACHED */))
          ]),
          _createElementVNode("div", _hoisted_12, [
            _createElementVNode("div", _hoisted_13, [
              _cache[16] || (_cache[16] = _createElementVNode("span", { class: "stat-label" }, "Docker 版本", -1 /* CACHED */)),
              _createElementVNode("span", _hoisted_14, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Cpu)
                  ]),
                  _: 1 /* STABLE */
                })
              ])
            ]),
            _createElementVNode("div", _hoisted_15, _toDisplayString(_ctx.status.version), 1 /* TEXT */),
            _createElementVNode("div", _hoisted_16, _toDisplayString(_ctx.status.os), 1 /* TEXT */)
          ]),
          _createElementVNode("div", _hoisted_17, [
            _createElementVNode("div", _hoisted_18, [
              _cache[17] || (_cache[17] = _createElementVNode("span", { class: "stat-label" }, "资源", -1 /* CACHED */)),
              _createElementVNode("span", _hoisted_19, [
                _createVNode(_component_el_icon, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_Odometer)
                  ]),
                  _: 1 /* STABLE */
                })
              ])
            ]),
            _createElementVNode("div", _hoisted_20, _toDisplayString(_ctx.status.cpus) + " CPU · " + _toDisplayString(_ctx.fmtBytes(_ctx.status.memory)), 1 /* TEXT */),
            _cache[18] || (_cache[18] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"6px"} }, "宿主可用资源", -1 /* CACHED */))
          ])
        ]))
      : _createCommentVNode("v-if", true),
    _createElementVNode("div", _hoisted_21, [
      _createElementVNode("div", _hoisted_22, [
        _cache[21] || (_cache[21] = _createTextVNode("Docker 管理 ", -1 /* CACHED */)),
        (_ctx.hasPerm('docker:manage'))
          ? (_openBlock(), _createElementBlock("div", _hoisted_23, [
              _createVNode(_component_el_button, {
                size: "small",
                onClick: _ctx.pullImage
              }, {
                default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
                  _createTextVNode("拉取镜像", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]),
              _createVNode(_component_el_button, {
                size: "small",
                type: "primary",
                onClick: _cache[0] || (_cache[0] = $event => (_ctx.createForm.show = true))
              }, {
                default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
                  _createTextVNode("+ 创建容器", -1 /* CACHED */)
                ]))]),
                _: 1 /* STABLE */
              })
            ]))
          : _createCommentVNode("v-if", true)
      ]),
      _createElementVNode("div", _hoisted_24, [
        (_ctx.error)
          ? (_openBlock(), _createBlock(_component_el_alert, {
              key: 0,
              title: _ctx.error,
              type: "warning",
              closable: false,
              style: {"margin-bottom":"10px"}
            }, null, 8 /* PROPS */, ["title"]))
          : _createCommentVNode("v-if", true),
        _createVNode(_component_el_tabs, {
          modelValue: _ctx.tab,
          "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.tab) = $event))
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_tab_pane, {
              label: "容器",
              name: "containers"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table, {
                  data: _ctx.containers,
                  size: "small",
                  height: "420"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_table_column, {
                      prop: "Names",
                      label: "名称",
                      "min-width": "160",
                      "show-overflow-tooltip": ""
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Image",
                      label: "镜像",
                      "min-width": "160",
                      "show-overflow-tooltip": ""
                    }),
                    _createVNode(_component_el_table_column, {
                      label: "状态",
                      width: "130"
                    }, {
                      default: _withCtx((s) => [
                        _createVNode(_component_el_tag, {
                          size: "small",
                          type: s.row.State === 'running' ? 'success' : 'danger'
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(s.row.Status), 1 /* TEXT */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["type"])
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Ports",
                      label: "端口",
                      "min-width": "160",
                      "show-overflow-tooltip": ""
                    }),
                    (_ctx.hasPerm('docker:manage'))
                      ? (_openBlock(), _createBlock(_component_el_table_column, {
                          key: 0,
                          label: "操作",
                          width: "300",
                          fixed: "right"
                        }, {
                          default: _withCtx((s) => [
                            _createVNode(_component_el_button, {
                              size: "small",
                              type: "success",
                              plain: "",
                              disabled: s.row.State === 'running',
                              onClick: $event => (_ctx.action(s.row, 'start'))
                            }, {
                              default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
                                _createTextVNode("启动", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }, 8 /* PROPS */, ["disabled", "onClick"]),
                            _createVNode(_component_el_button, {
                              size: "small",
                              type: "warning",
                              plain: "",
                              disabled: s.row.State !== 'running',
                              onClick: $event => (_ctx.action(s.row, 'stop'))
                            }, {
                              default: _withCtx(() => [...(_cache[23] || (_cache[23] = [
                                _createTextVNode("停止", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }, 8 /* PROPS */, ["disabled", "onClick"]),
                            _createVNode(_component_el_button, {
                              size: "small",
                              onClick: $event => (_ctx.action(s.row, 'restart'))
                            }, {
                              default: _withCtx(() => [...(_cache[24] || (_cache[24] = [
                                _createTextVNode("重启", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }, 8 /* PROPS */, ["onClick"]),
                            _createVNode(_component_el_button, {
                              size: "small",
                              onClick: $event => (_ctx.showLogs(s.row))
                            }, {
                              default: _withCtx(() => [...(_cache[25] || (_cache[25] = [
                                _createTextVNode("日志", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }, 8 /* PROPS */, ["onClick"]),
                            _createVNode(_component_el_button, {
                              size: "small",
                              onClick: $event => (_ctx.stats(s.row))
                            }, {
                              default: _withCtx(() => [...(_cache[26] || (_cache[26] = [
                                _createTextVNode("统计", -1 /* CACHED */)
                              ]))]),
                              _: 1 /* STABLE */
                            }, 8 /* PROPS */, ["onClick"]),
                            _createVNode(_component_el_button, {
                              size: "small",
                              type: "danger",
                              plain: "",
                              onClick: $event => (_ctx.action(s.row, 'remove'))
                            }, {
                              default: _withCtx(() => [...(_cache[27] || (_cache[27] = [
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
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_tab_pane, {
              label: "镜像",
              name: "images"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table, {
                  data: _ctx.images,
                  size: "small",
                  height: "420"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_table_column, {
                      prop: "Repository",
                      label: "仓库",
                      "min-width": "200"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Tag",
                      label: "标签",
                      width: "120"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "ID",
                      label: "ID",
                      width: "130"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Size",
                      label: "大小",
                      width: "110"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "CreatedSince",
                      label: "创建于",
                      width: "140"
                    }),
                    (_ctx.hasPerm('docker:manage'))
                      ? (_openBlock(), _createBlock(_component_el_table_column, {
                          key: 0,
                          label: "操作",
                          width: "100"
                        }, {
                          default: _withCtx((s) => [
                            _createVNode(_component_el_button, {
                              size: "small",
                              type: "danger",
                              plain: "",
                              onClick: $event => (_ctx.rmi(s.row))
                            }, {
                              default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
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
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_tab_pane, {
              label: "网络",
              name: "networks"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table, {
                  data: _ctx.networks,
                  size: "small",
                  height: "420"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_table_column, {
                      prop: "Name",
                      label: "名称"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Driver",
                      label: "驱动"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Scope",
                      label: "范围"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["data"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_tab_pane, {
              label: "数据卷",
              name: "volumes"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_el_table, {
                  data: _ctx.volumes,
                  size: "small",
                  height: "420"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_table_column, {
                      prop: "Name",
                      label: "名称",
                      "min-width": "240"
                    }),
                    _createVNode(_component_el_table_column, {
                      prop: "Driver",
                      label: "驱动"
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
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.createForm.show,
      "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.createForm.show) = $event)),
      title: "创建容器",
      width: "560px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_25, [
          _createVNode(_component_el_button, {
            onClick: _cache[9] || (_cache[9] = $event => (_ctx.createForm.show = false))
          }, {
            default: _withCtx(() => [...(_cache[35] || (_cache[35] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.createContainer
          }, {
            default: _withCtx(() => [...(_cache[36] || (_cache[36] = [
              _createTextVNode("创建并启动", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "90px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "镜像" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.createForm.image,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.createForm.image) = $event)),
                  placeholder: "nginx:latest"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "容器名" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.createForm.name,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.createForm.name) = $event)),
                  placeholder: "可选"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "端口映射" }, {
              default: _withCtx(() => [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.createForm.ports, (p, i) => {
                  return (_openBlock(), _createElementBlock("div", {
                    key: i,
                    style: {"display":"flex","gap":"6px","width":"100%","margin-bottom":"6px"}
                  }, [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.createForm.ports[i],
                      "onUpdate:modelValue": $event => ((_ctx.createForm.ports[i]) = $event),
                      placeholder: "宿主机:容器，如 8080:80"
                    }, null, 8 /* PROPS */, ["modelValue", "onUpdate:modelValue"]),
                    _createVNode(_component_el_button, {
                      onClick: $event => (_ctx.createForm.ports.splice(i, 1)),
                      disabled: _ctx.createForm.ports.length === 1
                    }, {
                      default: _withCtx(() => [...(_cache[29] || (_cache[29] = [
                        _createTextVNode("-", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick", "disabled"])
                  ]))
                }), 128 /* KEYED_FRAGMENT */)),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: _cache[4] || (_cache[4] = $event => (_ctx.createForm.ports.push('')))
                }, {
                  default: _withCtx(() => [...(_cache[30] || (_cache[30] = [
                    _createTextVNode("+ 添加", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "环境变量" }, {
              default: _withCtx(() => [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.createForm.env, (p, i) => {
                  return (_openBlock(), _createElementBlock("div", {
                    key: i,
                    style: {"display":"flex","gap":"6px","width":"100%","margin-bottom":"6px"}
                  }, [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.createForm.env[i],
                      "onUpdate:modelValue": $event => ((_ctx.createForm.env[i]) = $event),
                      placeholder: "KEY=VALUE"
                    }, null, 8 /* PROPS */, ["modelValue", "onUpdate:modelValue"]),
                    _createVNode(_component_el_button, {
                      onClick: $event => (_ctx.createForm.env.splice(i, 1)),
                      disabled: _ctx.createForm.env.length === 1
                    }, {
                      default: _withCtx(() => [...(_cache[31] || (_cache[31] = [
                        _createTextVNode("-", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick", "disabled"])
                  ]))
                }), 128 /* KEYED_FRAGMENT */)),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: _cache[5] || (_cache[5] = $event => (_ctx.createForm.env.push('')))
                }, {
                  default: _withCtx(() => [...(_cache[32] || (_cache[32] = [
                    _createTextVNode("+ 添加", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "数据卷" }, {
              default: _withCtx(() => [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.createForm.volumes, (p, i) => {
                  return (_openBlock(), _createElementBlock("div", {
                    key: i,
                    style: {"display":"flex","gap":"6px","width":"100%","margin-bottom":"6px"}
                  }, [
                    _createVNode(_component_el_input, {
                      modelValue: _ctx.createForm.volumes[i],
                      "onUpdate:modelValue": $event => ((_ctx.createForm.volumes[i]) = $event),
                      placeholder: "宿主机:容器，如 /data:/data"
                    }, null, 8 /* PROPS */, ["modelValue", "onUpdate:modelValue"]),
                    _createVNode(_component_el_button, {
                      onClick: $event => (_ctx.createForm.volumes.splice(i, 1)),
                      disabled: _ctx.createForm.volumes.length === 1
                    }, {
                      default: _withCtx(() => [...(_cache[33] || (_cache[33] = [
                        _createTextVNode("-", -1 /* CACHED */)
                      ]))]),
                      _: 1 /* STABLE */
                    }, 8 /* PROPS */, ["onClick", "disabled"])
                  ]))
                }), 128 /* KEYED_FRAGMENT */)),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: _cache[6] || (_cache[6] = $event => (_ctx.createForm.volumes.push('')))
                }, {
                  default: _withCtx(() => [...(_cache[34] || (_cache[34] = [
                    _createTextVNode("+ 添加", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "重启策略" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_select, {
                  modelValue: _ctx.createForm.restart,
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.createForm.restart) = $event)),
                  style: {"width":"100%"}
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_option, {
                      label: "unless-stopped",
                      value: "unless-stopped"
                    }),
                    _createVNode(_component_el_option, {
                      label: "always",
                      value: "always"
                    }),
                    _createVNode(_component_el_option, {
                      label: "no",
                      value: "no"
                    }),
                    _createVNode(_component_el_option, {
                      label: "on-failure",
                      value: "on-failure"
                    })
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启动命令" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.createForm.command,
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((_ctx.createForm.command) = $event)),
                  placeholder: "可选"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        })
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.logsDialog.show,
      "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((_ctx.logsDialog.show) = $event)),
      title: '容器日志 · ' + _ctx.logsDialog.cid,
      width: "820px"
    }, {
      default: _withCtx(() => [
        _createElementVNode("pre", _hoisted_26, _toDisplayString(_ctx.logsDialog.logs), 1 /* TEXT */)
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"])
  ]))
} })()
}
