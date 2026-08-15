// Created by 小杜 on 2026/08

// AI 助手（面板内置 Agent，自研界面；接入任意 OpenAI 兼容大模型）
import api from '../api.js'
import { hasPerm } from '../util.js'

const { ElMessage } = window.ElementPlus

export default {
  data() {
    return {
      messages: [],           // {role: 'user'|'assistant'|'system', text, actions?, error?}
      input: '',
      busy: false,
      configured: null,
      showConfig: false,
      configForm: { base_url: '', api_key: '', model: '', temperature: 0.7, timeout: 120, upload_enabled: true, enabled: true },
      testing: false,
      knowledge: { entries: [], count: 0, upload_enabled: true, last_upload: 0 },
      quickPrompts: [
        { label: '帮我建一个网站', text: '请帮我创建一个网站，域名为 example.com，标题「我的第一个网站」，介绍内容由你设计' },
        { label: '搭建完整环境', text: '请帮我完成以下全部操作：安装 nginx 和 git，创建一个测试网站 test.com，并为其签发 SSL 证书' },
        { label: '诊断服务器健康', text: '帮我全面检查服务器健康状态并给出优化建议' },
        { label: '清理磁盘', text: '帮我分析磁盘空间占用并给出清理建议' },
      ],
      scrollTimer: null,
      queue: [],
      stopping: false,
    }
  },
  mounted() { this.loadConfig(); this.loadKnowledge() },
  beforeUnmount() { clearTimeout(this.scrollTimer) },
  methods: {
    hasPerm,
    async loadConfig() {
      try { this.configured = await api.get('/ai/config') } catch (e) {}
    },
    async loadKnowledge() {
      try { this.knowledge = await api.get('/ai/knowledge') } catch (e) {}
    },
    async uploadKnowledge() {
      try {
        const r = await api.post('/ai/knowledge/upload')
        if (r.ok) ElMessage.success('知识库已上传到官网，可在官网账号中心下载')
        else ElMessage.warning(r.error || '上传失败（需先绑定官网账户）')
        this.loadKnowledge()
      } catch (e) {}
    },
    async toggleUpload(v) {
      // 「上传到官网」开关：默认开启，关闭后知识库仅保留在本机
      try {
        await api.put('/ai/config', { upload_enabled: v })
        this.knowledge.upload_enabled = v
        this.configForm.upload_enabled = v
        ElMessage.success(v ? '已开启：AI 学到的知识自动同步到官网' : '已关闭：知识库仅保留在本机')
      } catch (e) {}
    },
    async clearKnowledge() {
      try {
        await this.$confirm('清空本地 AI 知识库（AI 已学习到的记忆）？', '确认', { type: 'warning' })
        await api.post('/ai/knowledge/clear')
        ElMessage.success('已清空')
        this.loadKnowledge()
      } catch (e) {}
    },
    async send() {
      const text = this.input.trim()
      if (!text) return
      if (this.busy) {
        // 插话功能：AI 忙碌时将消息排队，当前操作完成后自动发送
        this.queue.push(text)
        this.input = ''
        ElMessage.info(`已插话排队（第 ${this.queue.length} 条）：当前操作完成后自动发送`)
        return
      }
      if (!this.configured?.enabled) {
        ElMessage.warning('请先配置 AI 接口')
        this.showConfig = true
        return
      }
      this.messages.push({ role: 'user', text })
      this.input = ''
      this.busy = true
      this.scrollBottom()
      try {
        const r = await api.post('/ai/chat', { message: text })
        this.messages.push({ role: 'assistant', text: r.reply, actions: r.actions || [] })
      } catch (e) {
        if (!this.stopping) {
          this.messages.push({ role: 'assistant', text: '⚠ ' + (e.response?.data?.detail || '请求失败，请检查 AI 配置'), error: true })
        }
      } finally {
        this.busy = false
        this.scrollBottom()
        this.flushQueue()
      }
    },
    async flushQueue() {
      // 依次发送排队中的插话消息
      if (this.stopping) { this.stopping = false; this.queue = []; return }
      if (!this.queue.length) return
      const next = this.queue.shift()
      this.messages.push({ role: 'user', text: next })
      this.busy = true
      this.scrollBottom()
      try {
        const r = await api.post('/ai/chat', { message: next })
        this.messages.push({ role: 'assistant', text: r.reply, actions: r.actions || [] })
      } catch (e) {
        if (!this.stopping) {
          this.messages.push({ role: 'assistant', text: '⚠ ' + (e.response?.data?.detail || '请求失败'), error: true })
        }
      } finally {
        this.busy = false
        this.scrollBottom()
        if (this.queue.length && !this.stopping) this.flushQueue()
        else this.stopping = false
      }
    },
    stop() {
      // 停止执行：中断计划执行循环与排队消息
      this.stopping = true
      const pending = this.queue.length
      this.queue = []
      if (pending) ElMessage.warning(`已停止执行（丢弃 ${pending} 条排队消息）`)
      else ElMessage.warning('已停止执行')
      this.messages.push({ role: 'system', text: '⏹ 已手动停止执行' })
      this.busy = false
      this.scrollBottom()
    },
    useQuick(p) {
      this.input = p.text
      this.send()
    },
    async execAction(action) {
      try {
        const r = await api.post('/ai/execute', { tool: action.tool, params: action.params })
        return `✅ ${action.label}：${r.result}`
      } catch (e) {
        return `❌ ${action.label}：${e.response?.data?.detail || '执行失败'}`
      }
    },
    async executeAll(msg) {
      const actions = msg.actions || []
      if (!actions.length) return
      const hasDanger = actions.some(a => a.confirm_required)
      if (hasDanger) {
        const plan = actions.map((a, i) => `${i + 1}. ${a.label}  ${JSON.stringify(a.params)}`).join('\n')
        try {
          await this.$confirm(
            `AI 计划执行以下 ${actions.length} 个操作：\n\n${plan}\n\n确认全部执行？`,
            '一键执行计划', { type: 'warning', confirmButtonText: '全部执行' })
        } catch (e) { return }
      }
      this.busy = true
      const results = []
      for (let i = 0; i < actions.length; i++) {
        if (this.stopping) { this.stopping = false; break }
        this.messages.push({ role: 'system', text: `⏳ 正在执行 ${i + 1}/${actions.length}：${actions[i].label}…` })
        results.push(await this.execAction(actions[i]))
      }
      msg.actions = []
      this.messages.push({ role: 'system', text: results.length ? results.join('\n') : '⏹ 已停止' })
      this.busy = false
      this.scrollBottom()
      // 跨时代闭环：自动总结执行结果
      if (results.some(r => r.startsWith('✅'))) {
        try {
          this.busy = true
          const summary = await api.post('/ai/chat', {
            message: `以上 ${actions.length} 个操作已执行完成，结果如下：\n${results.join('\n')}\n请用一句话总结完成情况，并提醒需要注意的事项。` })
          this.messages.push({ role: 'assistant', text: summary.reply, actions: summary.actions || [] })
        } catch (e) {} finally {
          this.busy = false
          this.scrollBottom()
        }
      }
    },
    async saveConfig() {
      try {
        await api.put('/ai/config', this.configForm)
        ElMessage.success('AI 配置已保存')
        this.showConfig = false
        this.loadConfig()
      } catch (e) {}
    },
    async testConnection() {
      this.testing = true
      try {
        const r = await api.post('/ai/test', this.configForm)
        ElMessage.success('连接成功！' + (r.reply ? ' 模型回复：' + r.reply : ''))
      } catch (e) {} finally { this.testing = false }
    },
    openConfig() {
      if (this.configured) {
        this.configForm = {
          base_url: this.configured.base_url,
          api_key: '', model: this.configured.model,
          temperature: this.configured.temperature, timeout: this.configured.timeout,
          upload_enabled: this.configured.upload_enabled,
          enabled: this.configured.enabled !== false,
        }
      } else {
        this.configForm.enabled = true
      }
      this.showConfig = true
    },
    clearChat() {
      this.messages = []
      api.post('/ai/clear').catch(() => {})
    },
    scrollBottom() {
      this.scrollTimer = setTimeout(() => {
        const el = this.$refs.chat
        if (el) el.scrollTop = el.scrollHeight
      }, 60)
    },
  },
  render: (function(){ const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, openBlock: _openBlock, createBlock: _createBlock, createCommentVNode: _createCommentVNode, createVNode: _createVNode, renderList: _renderList, Fragment: _Fragment, createElementBlock: _createElementBlock, normalizeStyle: _normalizeStyle, withKeys: _withKeys } = Vue

const _component_el_switch = _resolveComponent("el-switch")
const _component_el_divider = _resolveComponent("el-divider")

const _hoisted_1 = {
  class: "op-page",
  style: {"height":"calc(100vh - 110px)"}
}
const _hoisted_2 = {
  class: "op-card",
  style: {"display":"flex","flex-direction":"column","flex":"1","min-height":"0"}
}
const _hoisted_3 = { class: "card-title" }
const _hoisted_4 = { style: {"margin-left":"auto","display":"flex","gap":"8px"} }
const _hoisted_5 = {
  ref: "chat",
  class: "card-body",
  style: {"flex":"1","overflow-y":"auto","padding":"18px 22px"}
}
const _hoisted_6 = {
  key: 0,
  style: {"text-align":"center","padding":"60px 0"}
}
const _hoisted_7 = { style: {"margin-top":"22px","display":"flex","gap":"10px","justify-content":"center","flex-wrap":"wrap"} }
const _hoisted_8 = {
  key: 0,
  style: {"display":"flex","justify-content":"flex-end"}
}
const _hoisted_9 = { style: {"max-width":"70%","background":"var(--accent-grad)","color":"var(--text-inverse)","border-radius":"14px 14px 4px 14px","padding":"10px 16px","line-height":"1.8","white-space":"pre-wrap"} }
const _hoisted_10 = {
  key: 1,
  style: {"display":"flex","gap":"10px"}
}
const _hoisted_11 = { style: {"width":"34px","height":"34px","flex-shrink":"0","border-radius":"10px","background":"var(--accent-soft)","border":"1px solid var(--border)","display":"flex","align-items":"center","justify-content":"center","font-weight":"800","color":"var(--accent-light)","font-size":"13px"} }
const _hoisted_12 = { style: {"max-width":"78%","min-width":"0","flex":"1","background":"var(--bg-elevated)","border":"1px solid var(--border)","border-radius":"4px 14px 14px 14px","padding":"10px 16px"} }
const _hoisted_13 = {
  key: 0,
  style: {"margin-top":"12px","background":"var(--bg-input)","border":"1px solid var(--border-strong)","border-radius":"12px","padding":"14px"}
}
const _hoisted_14 = { style: {"display":"flex","align-items":"center","margin-bottom":"10px"} }
const _hoisted_15 = { style: {"margin-left":"6px","font-size":"13px"} }
const _hoisted_16 = { style: {"width":"22px","height":"22px","border-radius":"50%","background":"var(--accent-soft)","border":"1px solid var(--border)","display":"inline-flex","align-items":"center","justify-content":"center","font-size":"12px","color":"var(--accent-light)"} }
const _hoisted_17 = { style: {"font-size":"13px"} }
const _hoisted_18 = {
  class: "mono",
  style: {"color":"var(--text-secondary)","font-size":"12px","flex":"1","overflow":"hidden","text-overflow":"ellipsis","white-space":"nowrap"}
}
const _hoisted_19 = {
  key: 1,
  style: {"display":"flex","gap":"10px","align-items":"center","color":"var(--text-secondary)"}
}
const _hoisted_20 = {
  class: "card-body",
  style: {"border-top":"1px solid var(--border)"}
}
const _hoisted_21 = { style: {"display":"flex","gap":"10px"} }
const _hoisted_22 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_button = _resolveComponent("el-button")
  const _component_Setting = _resolveComponent("Setting")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_MagicStick = _resolveComponent("MagicStick")
  const _component_el_input = _resolveComponent("el-input")
  const _component_Promotion = _resolveComponent("Promotion")
  const _component_VideoPause = _resolveComponent("VideoPause")
  const _component_el_form_item = _resolveComponent("el-form-item")
  const _component_el_slider = _resolveComponent("el-slider")
  const _component_el_input_number = _resolveComponent("el-input-number")
  const _component_el_form = _resolveComponent("el-form")
  const _component_el_alert = _resolveComponent("el-alert")
  const _component_el_dialog = _resolveComponent("el-dialog")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[11] || (_cache[11] = _createElementVNode("span", null, "AI 助手 · 跨时代运维智能体", -1 /* CACHED */)),
        (_ctx.configured?.enabled)
          ? (_openBlock(), _createBlock(_component_el_tag, {
              key: 0,
              size: "small",
              type: "success",
              style: {"margin-left":"8px"}
            }, {
              default: _withCtx(() => [
                _createTextVNode(_toDisplayString(_ctx.configured.model || '已连接'), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }))
          : (_openBlock(), _createBlock(_component_el_tag, {
              key: 1,
              size: "small",
              type: "info",
              style: {"margin-left":"8px"}
            }, {
              default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
                _createTextVNode("未配置", -1 /* CACHED */)
              ]))]),
              _: 1 /* STABLE */
            })),
        _createElementVNode("div", _hoisted_4, [
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _ctx.clearChat
          }, {
            default: _withCtx(() => [...(_cache[9] || (_cache[9] = [
              _createTextVNode("清空对话", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"]),
          _createVNode(_component_el_button, {
            size: "small",
            type: "primary",
            onClick: _ctx.openConfig
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Setting)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[10] || (_cache[10] = _createTextVNode(" AI 设置 ", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      _createElementVNode("div", _hoisted_5, [
        (!_ctx.messages.length)
          ? (_openBlock(), _createElementBlock("div", _hoisted_6, [
              _cache[12] || (_cache[12] = _createElementVNode("div", { style: {"width":"64px","height":"64px","margin":"0 auto 16px","border-radius":"18px","background":"var(--accent-grad)","display":"flex","align-items":"center","justify-content":"center","font-size":"30px","font-weight":"800","color":"var(--text-inverse)","box-shadow":"0 0 30px var(--accent-glow)"} }, "AI", -1 /* CACHED */)),
              _cache[13] || (_cache[13] = _createElementVNode("div", {
                style: {"font-size":"18px","font-weight":"700"},
                class: "gold-text"
              }, "你好，我是 RT 面板 AI 运维智能体", -1 /* CACHED */)),
              _cache[14] || (_cache[14] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"13px","margin-top":"10px","line-height":"1.9"} }, [
                _createTextVNode(" 只需一句话描述目标，我就能自动规划并完成全部操作："),
                _createElementVNode("br"),
                _createTextVNode(" 建站 · 装环境 · 签发 SSL · 开端口 · 数据库 · 备份 · 计划任务 · Docker · 服务管理 · 故障诊断…"),
                _createElementVNode("br"),
                _createTextVNode(" 接入任意 OpenAI 兼容大模型（DeepSeek / 通义 / Kimi / GLM / GPT / Ollama），API 由你配置 ")
              ], -1 /* CACHED */)),
              _createElementVNode("div", _hoisted_7, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.quickPrompts, (p) => {
                  return (_openBlock(), _createBlock(_component_el_button, {
                    key: p.label,
                    size: "small",
                    onClick: $event => (_ctx.useQuick(p))
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(p.label), 1 /* TEXT */)
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"]))
                }), 128 /* KEYED_FRAGMENT */))
              ])
            ]))
          : _createCommentVNode("v-if", true),
        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.messages, (m, i) => {
          return (_openBlock(), _createElementBlock("div", {
            key: i,
            style: {"margin-bottom":"16px"}
          }, [
            (m.role === 'user')
              ? (_openBlock(), _createElementBlock("div", _hoisted_8, [
                  _createElementVNode("div", _hoisted_9, _toDisplayString(m.text), 1 /* TEXT */)
                ]))
              : (_openBlock(), _createElementBlock("div", _hoisted_10, [
                  _createElementVNode("div", _hoisted_11, _toDisplayString(m.role === 'system' ? '✓' : 'AI'), 1 /* TEXT */),
                  _createElementVNode("div", _hoisted_12, [
                    _createElementVNode("div", {
                      style: _normalizeStyle({color: m.error ? 'var(--danger)' : 'var(--text-regular)', lineHeight:'1.8', whiteSpace:'pre-wrap'})
                    }, _toDisplayString(m.text), 5 /* TEXT, STYLE */),
                    (m.actions && m.actions.length)
                      ? (_openBlock(), _createElementBlock("div", _hoisted_13, [
                          _createElementVNode("div", _hoisted_14, [
                            _createVNode(_component_el_icon, { color: "var(--accent-light)" }, {
                              default: _withCtx(() => [
                                _createVNode(_component_MagicStick)
                              ]),
                              _: 1 /* STABLE */
                            }),
                            _createElementVNode("b", _hoisted_15, "执行计划（" + _toDisplayString(m.actions.length) + " 步）", 1 /* TEXT */),
                            (m.actions.some(a => a.confirm_required))
                              ? (_openBlock(), _createBlock(_component_el_tag, {
                                  key: 0,
                                  size: "small",
                                  type: "warning",
                                  style: {"margin-left":"8px"}
                                }, {
                                  default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                                    _createTextVNode("含危险操作", -1 /* CACHED */)
                                  ]))]),
                                  _: 1 /* STABLE */
                                }))
                              : _createCommentVNode("v-if", true)
                          ]),
                          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(m.actions, (a, j) => {
                            return (_openBlock(), _createElementBlock("div", {
                              key: j,
                              style: {"display":"flex","align-items":"center","gap":"10px","padding":"7px 0"}
                            }, [
                              _createElementVNode("span", _hoisted_16, _toDisplayString(j + 1), 1 /* TEXT */),
                              _createElementVNode("b", _hoisted_17, _toDisplayString(a.label), 1 /* TEXT */),
                              _createElementVNode("span", _hoisted_18, _toDisplayString(JSON.stringify(a.params)), 1 /* TEXT */),
                              (a.confirm_required)
                                ? (_openBlock(), _createBlock(_component_el_tag, {
                                    key: 0,
                                    size: "small",
                                    type: "warning"
                                  }, {
                                    default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
                                      _createTextVNode("需确认", -1 /* CACHED */)
                                    ]))]),
                                    _: 1 /* STABLE */
                                  }))
                                : (_openBlock(), _createBlock(_component_el_tag, {
                                    key: 1,
                                    size: "small",
                                    type: "info"
                                  }, {
                                    default: _withCtx(() => [...(_cache[17] || (_cache[17] = [
                                      _createTextVNode("自动", -1 /* CACHED */)
                                    ]))]),
                                    _: 1 /* STABLE */
                                  }))
                            ]))
                          }), 128 /* KEYED_FRAGMENT */)),
                          _createVNode(_component_el_button, {
                            type: "primary",
                            style: {"width":"100%","margin-top":"10px"},
                            onClick: $event => (_ctx.executeAll(m))
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_el_icon, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_MagicStick)
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _cache[18] || (_cache[18] = _createTextVNode(" 一键全部执行（含自动总结） ", -1 /* CACHED */))
                            ]),
                            _: 1 /* STABLE */
                          }, 8 /* PROPS */, ["onClick"])
                        ]))
                      : _createCommentVNode("v-if", true)
                  ])
                ]))
          ]))
        }), 128 /* KEYED_FRAGMENT */)),
        (_ctx.busy)
          ? (_openBlock(), _createElementBlock("div", _hoisted_19, [...(_cache[19] || (_cache[19] = [
              _createElementVNode("div", { style: {"width":"34px","height":"34px","border-radius":"10px","background":"var(--accent-soft)","border":"1px solid var(--border)","display":"flex","align-items":"center","justify-content":"center","font-weight":"800","color":"var(--accent-light)"} }, "AI", -1 /* CACHED */),
              _createElementVNode("span", { class: "mono" }, "智能体工作中…", -1 /* CACHED */)
            ]))]))
          : _createCommentVNode("v-if", true)
      ], 512 /* NEED_PATCH */),
      _createElementVNode("div", _hoisted_20, [
        _createElementVNode("div", _hoisted_21, [
          _createVNode(_component_el_input, {
            modelValue: _ctx.input,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((_ctx.input) = $event)),
            placeholder: "一句话描述目标，如：帮我装好 nginx 并建一个博客网站再配上 SSL（忙碌时可插话排队）",
            onKeyup: _withKeys(_ctx.send, ["enter"])
          }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
          (_ctx.busy)
            ? (_openBlock(), _createBlock(_component_el_button, {
                key: 0,
                type: "danger",
                plain: "",
                onClick: _ctx.stop,
                style: {"width":"120px"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_VideoPause)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[38] || (_cache[38] = _createTextVNode(" 停止 ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]))
            : (_openBlock(), _createBlock(_component_el_button, {
                key: 1,
                type: "primary",
                onClick: _ctx.send,
                style: {"width":"120px"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Promotion)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _cache[20] || (_cache[20] = _createTextVNode(" 发送 ", -1 /* CACHED */))
                ]),
                _: 1 /* STABLE */
              }, 8 /* PROPS */, ["onClick"]))
        ]),
        _cache[21] || (_cache[21] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"8px"} }, " 一句话目标 → AI 生成执行计划 → 一键全部执行 → 自动总结。支持任意命令执行（授权后）。忙碌时可继续输入插话排队，随时可停止。 ", -1 /* CACHED */))
      ])
    ]),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.showConfig,
      "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.showConfig) = $event)),
      title: "AI 接口配置",
      width: "520px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_22, [
          _createVNode(_component_el_button, {
            loading: _ctx.testing,
            onClick: _ctx.testConnection
          }, {
            default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
              _createTextVNode("测试连接", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["loading", "onClick"]),
          _createVNode(_component_el_button, {
            onClick: _cache[6] || (_cache[6] = $event => (_ctx.showConfig = false))
          }, {
            default: _withCtx(() => [...(_cache[23] || (_cache[23] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.saveConfig
          }, {
            default: _withCtx(() => [...(_cache[24] || (_cache[24] = [
              _createTextVNode("保存配置", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_form, { "label-width": "110px" }, {
          default: _withCtx(() => [
            _createVNode(_component_el_form_item, { label: "接口地址" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.configForm.base_url,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((_ctx.configForm.base_url) = $event)),
                  placeholder: "https://api.deepseek.com（OpenAI 兼容）"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "API Key" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.configForm.api_key,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((_ctx.configForm.api_key) = $event)),
                  type: "password",
                  "show-password": "",
                  placeholder: _ctx.configured?.has_key ? '已配置（' + (_ctx.configured.api_key_masked || '****') + '），留空保持不变' : 'sk-...'
                }, null, 8 /* PROPS */, ["modelValue", "placeholder"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "模型名称" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input, {
                  modelValue: _ctx.configForm.model,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.configForm.model) = $event)),
                  placeholder: "deepseek-chat / gpt-4o-mini / glm-4 等"
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "温度" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_slider, {
                  modelValue: _ctx.configForm.temperature,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((_ctx.configForm.temperature) = $event)),
                  min: 0,
                  max: 2,
                  step: 0.1,
                  style: {"width":"100%"}
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "超时(秒)" }, {
              default: _withCtx(() => [
                _createVNode(_component_el_input_number, {
                  modelValue: _ctx.configForm.timeout,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.configForm.timeout) = $event)),
                  min: 10,
                  max: 600
                }, null, 8 /* PROPS */, ["modelValue"])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "启用 AI 助手" }, {
              default: _withCtx(() => [
                _createElementVNode("div", null, [
                  _createVNode(_component_el_switch, {
                    modelValue: _ctx.configForm.enabled,
                    "onUpdate:modelValue": _cache[33] || (_cache[33] = $event => ((_ctx.configForm.enabled) = $event))
                  }, null, 8 /* PROPS */, ["modelValue"]),
                  _createElementVNode("span", {
                    style: {"color":"var(--text-secondary)","font-size":"12px","margin-left":"8px"}
                  }, "关闭后对话入口将提示先配置 API；保存地址与密钥后自动开启", -1 /* CACHED */)
                ])
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_form_item, { label: "上传到官网" }, {
              default: _withCtx(() => [
                _createElementVNode("div", null, [
                  _createVNode(_component_el_switch, {
                    modelValue: _ctx.configForm.upload_enabled,
                    "onUpdate:modelValue": _cache[26] || (_cache[26] = $event => ((_ctx.configForm.upload_enabled) = $event))
                  }, null, 8 /* PROPS */, ["modelValue"]),
                  _createElementVNode("span", {
                    style: {"color":"var(--text-secondary)","font-size":"12px","margin-left":"8px"}
                  }, "默认开启：AI 学到的知识自动同步到官网，可在官网账号中心下载", -1 /* CACHED */)
                ])
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }),
        _createVNode(_component_el_alert, {
          type: "info",
          closable: false,
          style: {"margin-bottom":"10px"},
          title: "支持任意 OpenAI 兼容接口：DeepSeek、通义千问、Kimi、智谱 GLM、OpenAI、Ollama 本地模型等。API Key 使用机器码派生密钥加密存储。"
        }),
        _createVNode(_component_el_divider, null, {
          default: _withCtx(() => [
            _createTextVNode("我的知识库（AI 自动沉淀的学习记忆）", -1 /* CACHED */)
          ])
        }),
        _createElementVNode("div", { style: {"display":"flex","align-items":"center","gap":"10px","margin-bottom":"10px"} }, [
          _createElementVNode("b", null, "已学习 " + _toDisplayString(_ctx.knowledge.count) + " 条知识", 1 /* TEXT */),
          _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px"} },
            "最近上传: " + _toDisplayString(_ctx.knowledge.last_upload ? new Date(_ctx.knowledge.last_upload * 1000).toLocaleString() : '从未'), 1 /* TEXT */),
          _createVNode(_component_el_switch, {
            modelValue: _ctx.knowledge.upload_enabled,
            "onUpdate:modelValue": _cache[25] || (_cache[25] = $event => (_ctx.toggleUpload($event))),
            size: "small",
            title: "知识库是否上传到官网（默认开启，可随时关闭）"
          }, null, 8 /* PROPS */, ["modelValue"]),
          _createElementVNode("span", { style: {"color":"var(--text-secondary)","font-size":"12px"} }, "上传到官网", -1 /* CACHED */),
          _createElementVNode("span", { style: {"flex":"1"} }),
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _ctx.uploadKnowledge
          }, {
            default: _withCtx(() => [...(_cache[27] || (_cache[27] = [
              _createTextVNode(" 立即上传官网 ", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            size: "small",
            type: "danger",
            plain: "",
            onClick: _ctx.clearKnowledge
          }, {
            default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
              _createTextVNode(" 清空 ", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          })
        ]),
        _ctx.knowledge.entries.length ? (_openBlock(), _createElementBlock("div", {
          key: 0,
          style: {"max-height":"200px","overflow-y":"auto","border":"1px solid var(--border)","border-radius":"8px","padding":"10px"}
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.knowledge.entries, (e, i) => {
            return (_openBlock(), _createElementBlock("div", {
              key: i,
              style: {"padding":"4px 0","font-size":"12px","color":"var(--text-regular)","border-bottom":"1px dashed var(--border)"}
            }, [
              _createElementVNode("span", { style: {"color":"var(--accent-light)"} }, "• ", -1 /* CACHED */),
              _createTextVNode(_toDisplayString(e.entry), 1 /* TEXT */)
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ], 512 /* NEED_PATCH */)) : _createCommentVNode("v-if", true),
        _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"8px"} }, [
          _createTextVNode(" AI 会在对话与操作中自动学习并沉淀知识（长期记忆）；知识库随机器码绑定账户，打开「上传到官网」开关后自动同步（默认开启），也可随时在官网 → 账号中心 → 我的知识库 下载。", -1 /* CACHED */)
        ])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"])
  ]))
} })()
}
