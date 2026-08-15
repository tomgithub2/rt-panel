// 文件管理器
import api from '../api.js'
import { fmtBytes, fmtTime, hasPerm } from '../util.js'

const { ElMessage, ElMessageBox } = window.ElementPlus

export default {
  data() {
    return {
      path: '',
      parent: '',
      items: [],
      drives: [],
      disk: null,
      sortBy: 'name', desc: false,
      uploadVisible: false,
      edit: { show: false, path: '', name: '', content: '', original: '', isNew: false, encoding: 'utf-8' },
      mkdirName: '',
      rename: { show: false, path: '', name: '' },
      chmod: { show: false, path: '', mode: '755' },
      extractTo: '',
      search: { show: false, q: '', results: [] },
      selected: [],
    }
  },
  computed: {
    crumbs() {
      if (!this.path) return []
      const parts = this.path.split(/[\\/]+/).filter(Boolean)
      const out = []
      let cur = ''
      for (const p of parts) {
        cur = cur ? cur + '/' + p : (this.path.startsWith('/') ? '/' + p : p)
        out.push({ name: p, path: this.path[0] + cur.slice(1) || cur })
      }
      return out
    },
    canWrite() { return hasPerm('files:write') },
  },
  mounted() { this.load('') },
  methods: {
    fmtBytes, fmtTime, hasPerm,
    async load(path, silent = false) {
      try {
        const r = await api.get('/files/list', { params: { path: path ?? this.path, sort: this.sortBy, desc: this.desc } })
        this.path = r.path; this.parent = r.parent; this.items = r.items; this.drives = r.drives
        if (!silent) this.loadDisk()
      } catch (e) { if (path !== this.path) this.load(this.path, true) }
    },
    async loadDisk() {
      try { this.disk = await api.get('/files/disk') } catch (e) {}
    },
    open(item) {
      if (item.is_dir) this.load(item.path)
      else this.viewFile(item)
    },
    async viewFile(item) {
      if (item.size > 2 * 1024 * 1024) {
        return ElMessage.warning('文件超过 2MB，请下载后编辑')
      }
      try {
        const r = await api.get('/files/read', { params: { path: item.path } })
        if (r.binary) return ElMessage.info('二进制文件不可在线编辑')
        if (r.too_large) return ElMessage.warning('文件过大，请下载后编辑')
        this.edit = { show: true, path: item.path, name: item.name, content: r.content,
                      original: r.content, isNew: false, encoding: r.encoding || 'utf-8' }
      } catch (e) {}
    },
    newFile() {
      this.edit = { show: true, path: '', name: '', content: '', original: '', isNew: true, encoding: 'utf-8' }
    },
    async saveFile() {
      const target = this.edit.isNew
        ? (this.path ? this.path + '/' + this.edit.name : this.edit.name)
        : this.edit.path
      if (!target) return ElMessage.warning('请输入文件名')
      try {
        await api.post('/files/write', { path: target, content: this.edit.content, encoding: this.edit.encoding })
        ElMessage.success('已保存 ' + target)
        this.edit.show = false
        this.load(this.path)
      } catch (e) {}
    },
    async mkdir() {
      if (!this.mkdirName) return
      try {
        await api.post('/files/mkdir', { path: this.path ? this.path + '/' + this.mkdirName : this.mkdirName })
        ElMessage.success('目录已创建')
        this.mkdirName = ''
        this.load(this.path)
      } catch (e) {}
    },
    async doRename(item) {
      this.rename = { show: true, path: item.path, name: item.name }
    },
    async submitRename() {
      try {
        await api.post('/files/rename', { path: this.rename.path, new_name: this.rename.name })
        ElMessage.success('重命名成功')
        this.rename.show = false
        this.load(this.path)
      } catch (e) {}
    },
    async remove(item) {
      try {
        await ElMessageBox.confirm(`确定删除 ${item.name} ？此操作不可恢复！`, '危险操作', { type: 'error', confirmButtonText: '删除' })
        await api.post('/files/delete', { paths: [item.path] })
        ElMessage.success('已删除')
        this.load(this.path)
      } catch (e) {}
    },
    async download(item) {
      // 安全下载：Authorization 头鉴权（token 不进 URL，防日志泄漏）
      try {
        const token = localStorage.getItem('ops_token')
        const resp = await fetch(`/api/files/download?path=${encodeURIComponent(item.path)}`, {
          headers: { Authorization: 'Bearer ' + token },
        })
        if (!resp.ok) throw new Error('下载失败')
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = item.name
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 3000)
      } catch (e) {
        ElMessage.error('下载失败: ' + (e.message || ''))
      }
    },
    async copyTo(item) {
      try {
        const { value } = await ElMessageBox.prompt(`将 ${item.name} 复制到：`, '复制', { inputValue: this.path })
        await api.post('/files/copy', { src: item.path, dest: value })
        ElMessage.success('复制完成')
        this.load(this.path)
      } catch (e) {}
    },
    async moveTo(item) {
      try {
        const { value } = await ElMessageBox.prompt(`将 ${item.name} 移动到：`, '移动', { inputValue: this.path })
        await api.post('/files/move', { src: item.path, dest: value })
        ElMessage.success('移动完成')
        this.load(this.path)
      } catch (e) {}
    },
    async compress(item) {
      const dest = item.path + '.zip'
      try {
        await api.post('/files/compress', { paths: [item.path], dest, format: 'zip' })
        ElMessage.success('压缩完成：' + dest)
        this.load(this.path)
      } catch (e) {}
    },
    async extract(item) {
      const dest = item.path.replace(/\.(zip|tar\.gz|tgz|tar)$/i, '') + '_解压'
      try {
        await api.post('/files/extract', { path: item.path, dest })
        ElMessage.success('解压完成')
        this.load(this.path)
      } catch (e) {}
    },
    async changeMode(item) {
      this.chmod = { show: true, path: item.path, mode: item.mode || '755' }
    },
    async submitChmod() {
      try {
        await api.post('/files/chmod', { path: this.chmod.path, mode: this.chmod.mode })
        ElMessage.success('权限已修改')
        this.chmod.show = false
        this.load(this.path)
      } catch (e) {}
    },
    async doSearch() {
      if (!this.search.q) return
      try {
        const r = await api.get('/files/search', { params: { path: this.path || '/', q: this.search.q } })
        this.search.results = r.list
      } catch (e) {}
    },
    // 上传
    uploadUrl() { return '/api/files/upload?path=' + encodeURIComponent(this.path) },
    uploadHeaders() {
      return { Authorization: 'Bearer ' + localStorage.getItem('ops_token') }
    },
    uploadData() { return {} },
    onUploadSuccess() {
      ElMessage.success('上传完成')
      this.uploadVisible = false
      this.load(this.path)
    },
    sortByKey(key) {
      if (this.sortBy === key) this.desc = !this.desc
      else { this.sortBy = key; this.desc = false }
      this.load(this.path)
    },
  },
  render: (function(){ const { renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString, createElementVNode: _createElementVNode, resolveComponent: _resolveComponent, createVNode: _createVNode, withCtx: _withCtx, createTextVNode: _createTextVNode, createCommentVNode: _createCommentVNode, withKeys: _withKeys, createBlock: _createBlock, resolveDynamicComponent: _resolveDynamicComponent, normalizeClass: _normalizeClass } = Vue

const _hoisted_1 = { class: "op-page" }
const _hoisted_2 = {
  key: 0,
  class: "chart-grid"
}
const _hoisted_3 = { class: "stat-head" }
const _hoisted_4 = { class: "stat-label" }
const _hoisted_5 = { class: "stat-icon" }
const _hoisted_6 = {
  class: "stat-num gold-text",
  style: {"font-size":"24px"}
}
const _hoisted_7 = { style: {"font-size":"13px"} }
const _hoisted_8 = { style: {"margin-top":"6px","color":"var(--text-secondary)","font-size":"12px"} }
const _hoisted_9 = { class: "op-card" }
const _hoisted_10 = { class: "card-body" }
const _hoisted_11 = {
  class: "op-toolbar",
  style: {"margin-bottom":"12px"}
}
const _hoisted_12 = { style: {"display":"flex","align-items":"center","gap":"4px","flex-wrap":"wrap","padding":"8px 12px","background":"var(--bg-input)","border":"1px solid var(--border)","border-radius":"8px","margin-bottom":"10px"} }
const _hoisted_13 = {
  key: 1,
  style: {"color":"var(--text-secondary)","font-size":"12px"}
}
const _hoisted_14 = ["onClick"]
const _hoisted_15 = {
  key: 0,
  style: {"margin-bottom":"10px"}
}
const _hoisted_16 = { class: "dialog-footer" }
const _hoisted_17 = { class: "dialog-footer" }
const _hoisted_18 = { class: "dialog-footer" }

return function render(_ctx, _cache) {
  const _component_Coin = _resolveComponent("Coin")
  const _component_el_icon = _resolveComponent("el-icon")
  const _component_el_progress = _resolveComponent("el-progress")
  const _component_Back = _resolveComponent("Back")
  const _component_el_button = _resolveComponent("el-button")
  const _component_Refresh = _resolveComponent("Refresh")
  const _component_DocumentAdd = _resolveComponent("DocumentAdd")
  const _component_FolderAdd = _resolveComponent("FolderAdd")
  const _component_el_input = _resolveComponent("el-input")
  const _component_Upload = _resolveComponent("Upload")
  const _component_el_option = _resolveComponent("el-option")
  const _component_el_select = _resolveComponent("el-select")
  const _component_Search = _resolveComponent("Search")
  const _component_el_tag = _resolveComponent("el-tag")
  const _component_el_table_column = _resolveComponent("el-table-column")
  const _component_ArrowDown = _resolveComponent("ArrowDown")
  const _component_el_dropdown_item = _resolveComponent("el-dropdown-item")
  const _component_el_dropdown_menu = _resolveComponent("el-dropdown-menu")
  const _component_el_dropdown = _resolveComponent("el-dropdown")
  const _component_el_table = _resolveComponent("el-table")
  const _component_el_dialog = _resolveComponent("el-dialog")
  const _component_UploadFilled = _resolveComponent("UploadFilled")
  const _component_el_upload = _resolveComponent("el-upload")

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    (_ctx.disk)
      ? (_openBlock(), _createElementBlock("div", _hoisted_2, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.disk.partitions, (p) => {
            return (_openBlock(), _createElementBlock("div", {
              class: "op-card stat-card",
              key: p.mount
            }, [
              _createElementVNode("div", _hoisted_3, [
                _createElementVNode("span", _hoisted_4, _toDisplayString(p.mount) + " (" + _toDisplayString(p.fstype) + ")", 1 /* TEXT */),
                _createElementVNode("span", _hoisted_5, [
                  _createVNode(_component_el_icon, null, {
                    default: _withCtx(() => [
                      _createVNode(_component_Coin)
                    ]),
                    _: 1 /* STABLE */
                  })
                ])
              ]),
              _createElementVNode("div", _hoisted_6, [
                _createTextVNode(_toDisplayString(p.used) + " ", 1 /* TEXT */),
                _createElementVNode("span", _hoisted_7, "/ " + _toDisplayString(p.total) + " GB", 1 /* TEXT */)
              ]),
              _createVNode(_component_el_progress, {
                percentage: p.percent,
                "stroke-width": 6,
                "show-text": false,
                style: {"margin-top":"10px"}
              }, null, 8 /* PROPS */, ["percentage"]),
              _createElementVNode("div", _hoisted_8, "剩余 " + _toDisplayString(p.free) + " GB", 1 /* TEXT */)
            ]))
          }), 128 /* KEYED_FRAGMENT */))
        ]))
      : _createCommentVNode("v-if", true),
    _createElementVNode("div", _hoisted_9, [
      _cache[37] || (_cache[37] = _createElementVNode("div", { class: "card-title" }, "文件管理", -1 /* CACHED */)),
      _createElementVNode("div", _hoisted_10, [
        _createElementVNode("div", _hoisted_11, [
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _cache[0] || (_cache[0] = $event => (_ctx.load(_ctx.parent))),
            disabled: !_ctx.parent
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Back)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[21] || (_cache[21] = _createTextVNode(" 上级 ", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["disabled"]),
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _cache[1] || (_cache[1] = $event => (_ctx.load(_ctx.path)))
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Refresh)
                ]),
                _: 1 /* STABLE */
              }),
              _cache[22] || (_cache[22] = _createTextVNode(" 刷新", -1 /* CACHED */))
            ]),
            _: 1 /* STABLE */
          }),
          (_ctx.canWrite)
            ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: _ctx.newFile
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_icon, null, {
                      default: _withCtx(() => [
                        _createVNode(_component_DocumentAdd)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _cache[23] || (_cache[23] = _createTextVNode(" 新建文件", -1 /* CACHED */))
                  ]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"]),
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: _cache[2] || (_cache[2] = $event => (_ctx.mkdirName ? _ctx.mkdir() : (_ctx.mkdirName = '')))
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_icon, null, {
                      default: _withCtx(() => [
                        _createVNode(_component_FolderAdd)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _cache[24] || (_cache[24] = _createTextVNode(" 新建目录 ", -1 /* CACHED */))
                  ]),
                  _: 1 /* STABLE */
                }),
                (_ctx.mkdirName !== null)
                  ? (_openBlock(), _createBlock(_component_el_input, {
                      key: 0,
                      modelValue: _ctx.mkdirName,
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((_ctx.mkdirName) = $event)),
                      size: "small",
                      placeholder: "目录名，回车创建",
                      style: {"width":"180px"},
                      onKeyup: _withKeys(_ctx.mkdir, ["enter"])
                    }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]))
                  : _createCommentVNode("v-if", true),
                _createVNode(_component_el_button, {
                  size: "small",
                  type: "primary",
                  onClick: _cache[4] || (_cache[4] = $event => (_ctx.uploadVisible = true))
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_el_icon, null, {
                      default: _withCtx(() => [
                        _createVNode(_component_Upload)
                      ]),
                      _: 1 /* STABLE */
                    }),
                    _cache[25] || (_cache[25] = _createTextVNode(" 上传 ", -1 /* CACHED */))
                  ]),
                  _: 1 /* STABLE */
                })
              ], 64 /* STABLE_FRAGMENT */))
            : _createCommentVNode("v-if", true),
          _cache[26] || (_cache[26] = _createElementVNode("div", { class: "spacer" }, null, -1 /* CACHED */)),
          _createVNode(_component_el_select, {
            modelValue: _ctx.path,
            "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((_ctx.path) = $event)),
            size: "small",
            style: {"width":"110px"},
            placeholder: "驱动器",
            onChange: _cache[6] || (_cache[6] = p => _ctx.load(p))
          }, {
            default: _withCtx(() => [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.drives, (d) => {
                return (_openBlock(), _createBlock(_component_el_option, {
                  key: d,
                  label: d,
                  value: d
                }, null, 8 /* PROPS */, ["label", "value"]))
              }), 128 /* KEYED_FRAGMENT */))
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["modelValue"]),
          _createVNode(_component_el_input, {
            modelValue: _ctx.search.q,
            "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((_ctx.search.q) = $event)),
            size: "small",
            placeholder: "搜索文件名",
            style: {"width":"180px"},
            onKeyup: _withKeys(_ctx.doSearch, ["enter"])
          }, null, 8 /* PROPS */, ["modelValue", "onKeyup"]),
          _createVNode(_component_el_button, {
            size: "small",
            onClick: _ctx.doSearch
          }, {
            default: _withCtx(() => [
              _createVNode(_component_el_icon, null, {
                default: _withCtx(() => [
                  _createVNode(_component_Search)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ]),
        _createElementVNode("div", _hoisted_12, [
          (_ctx.drives.includes(_ctx.path) && _ctx.path !== '/')
            ? (_openBlock(), _createBlock(_component_el_tag, {
                key: 0,
                size: "small",
                style: {"cursor":"pointer"},
                onClick: _cache[8] || (_cache[8] = $event => (_ctx.load(_ctx.path)))
              }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(_ctx.path), 1 /* TEXT */)
                ]),
                _: 1 /* STABLE */
              }))
            : _createCommentVNode("v-if", true),
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.crumbs, (c, i) => {
            return (_openBlock(), _createElementBlock(_Fragment, { key: i }, [
              _cache[27] || (_cache[27] = _createElementVNode("span", { style: {"color":"var(--text-secondary)"} }, "/", -1 /* CACHED */)),
              _createVNode(_component_el_tag, {
                size: "small",
                style: {"cursor":"pointer"},
                onClick: $event => (_ctx.load(c.path))
              }, {
                default: _withCtx(() => [
                  _createTextVNode(_toDisplayString(c.name), 1 /* TEXT */)
                ]),
                _: 2 /* DYNAMIC */
              }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"])
            ], 64 /* STABLE_FRAGMENT */))
          }), 128 /* KEYED_FRAGMENT */)),
          (!_ctx.crumbs.length)
            ? (_openBlock(), _createElementBlock("span", _hoisted_13, _toDisplayString(_ctx.path || '/'), 1 /* TEXT */))
            : _createCommentVNode("v-if", true)
        ]),
        _createVNode(_component_el_table, {
          data: _ctx.items,
          size: "small",
          height: "480",
          onRowDblclick: _ctx.open
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              label: "名称",
              "min-width": "280"
            }, {
              default: _withCtx((s) => [
                _createElementVNode("span", {
                  style: {"display":"flex","align-items":"center","gap":"8px","cursor":"pointer"},
                  onClick: $event => (_ctx.open(s.row))
                }, [
                  _createVNode(_component_el_icon, {
                    color: s.row.is_dir ? 'var(--accent)' : 'var(--text-secondary)'
                  }, {
                    default: _withCtx(() => [
                      (_openBlock(), _createBlock(_resolveDynamicComponent(s.row.is_dir ? 'FolderOpened' : 'Document')))
                    ]),
                    _: 2 /* DYNAMIC */
                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["color"]),
                  _createElementVNode("span", {
                    class: _normalizeClass({ 'gold-text': s.row.is_dir })
                  }, _toDisplayString(s.row.name), 3 /* TEXT, CLASS */)
                ], 8 /* PROPS */, _hoisted_14)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "大小",
              width: "110",
              sortable: ""
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.is_dir ? '-' : _ctx.fmtBytes(s.row.size)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "权限",
              width: "90"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.mode), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "修改时间",
              width: "170"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtTime(s.row.mtime)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "操作",
              width: _ctx.canWrite ? 340 : 110,
              fixed: "right"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: $event => (_ctx.download(s.row))
                }, {
                  default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
                    _createTextVNode("下载", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"]),
                (_ctx.canWrite)
                  ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                      _createVNode(_component_el_button, {
                        size: "small",
                        onClick: $event => (_ctx.doRename(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[29] || (_cache[29] = [
                          _createTextVNode("重命名", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"]),
                      _createVNode(_component_el_button, {
                        size: "small",
                        onClick: $event => (_ctx.changeMode(s.row))
                      }, {
                        default: _withCtx(() => [...(_cache[30] || (_cache[30] = [
                          _createTextVNode("权限", -1 /* CACHED */)
                        ]))]),
                        _: 1 /* STABLE */
                      }, 8 /* PROPS */, ["onClick"]),
                      _createVNode(_component_el_dropdown, {
                        trigger: "click",
                        style: {"margin-left":"8px"}
                      }, {
                        dropdown: _withCtx(() => [
                          _createVNode(_component_el_dropdown_menu, null, {
                            default: _withCtx(() => [
                              _createVNode(_component_el_dropdown_item, {
                                onClick: $event => (_ctx.copyTo(s.row))
                              }, {
                                default: _withCtx(() => [...(_cache[32] || (_cache[32] = [
                                  _createTextVNode("复制到…", -1 /* CACHED */)
                                ]))]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["onClick"]),
                              _createVNode(_component_el_dropdown_item, {
                                onClick: $event => (_ctx.moveTo(s.row))
                              }, {
                                default: _withCtx(() => [...(_cache[33] || (_cache[33] = [
                                  _createTextVNode("移动到…", -1 /* CACHED */)
                                ]))]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["onClick"]),
                              _createVNode(_component_el_dropdown_item, {
                                onClick: $event => (_ctx.compress(s.row))
                              }, {
                                default: _withCtx(() => [...(_cache[34] || (_cache[34] = [
                                  _createTextVNode("压缩为 zip", -1 /* CACHED */)
                                ]))]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["onClick"]),
                              (/\.(zip|tar\.gz|tgz|tar)$/i.test(s.row.name))
                                ? (_openBlock(), _createBlock(_component_el_dropdown_item, {
                                    key: 0,
                                    onClick: $event => (_ctx.extract(s.row))
                                  }, {
                                    default: _withCtx(() => [...(_cache[35] || (_cache[35] = [
                                      _createTextVNode("解压", -1 /* CACHED */)
                                    ]))]),
                                    _: 1 /* STABLE */
                                  }, 8 /* PROPS */, ["onClick"]))
                                : _createCommentVNode("v-if", true),
                              _createVNode(_component_el_dropdown_item, {
                                divided: "",
                                onClick: $event => (_ctx.remove(s.row))
                              }, {
                                default: _withCtx(() => [...(_cache[36] || (_cache[36] = [
                                  _createElementVNode("span", { style: {"color":"var(--danger)"} }, "删除", -1 /* CACHED */)
                                ]))]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["onClick"])
                            ]),
                            _: 2 /* DYNAMIC */
                          }, 1024 /* DYNAMIC_SLOTS */)
                        ]),
                        default: _withCtx(() => [
                          _createVNode(_component_el_button, { size: "small" }, {
                            default: _withCtx(() => [
                              _cache[31] || (_cache[31] = _createTextVNode("更多", -1 /* CACHED */)),
                              _createVNode(_component_el_icon, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_ArrowDown)
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 2 /* DYNAMIC */
                      }, 1024 /* DYNAMIC_SLOTS */)
                    ], 64 /* STABLE_FRAGMENT */))
                  : _createCommentVNode("v-if", true)
              ]),
              _: 1 /* STABLE */
            }, 8 /* PROPS */, ["width"])
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["data", "onRowDblclick"])
      ])
    ]),
    _createCommentVNode(" 编辑器 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.edit.show,
      "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((_ctx.edit.show) = $event)),
      title: _ctx.edit.isNew ? '新建文件' : '编辑 ' + _ctx.edit.name,
      width: "860px",
      top: "4vh"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_16, [
          _createVNode(_component_el_button, {
            onClick: _cache[11] || (_cache[11] = $event => (_ctx.edit.show = false))
          }, {
            default: _withCtx(() => [...(_cache[38] || (_cache[38] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.saveFile
          }, {
            default: _withCtx(() => [...(_cache[39] || (_cache[39] = [
              _createTextVNode("保存", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        (_ctx.edit.isNew)
          ? (_openBlock(), _createElementBlock("div", _hoisted_15, [
              _createVNode(_component_el_input, {
                modelValue: _ctx.edit.name,
                "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((_ctx.edit.name) = $event)),
                placeholder: "文件名（含扩展名），保存到当前目录"
              }, null, 8 /* PROPS */, ["modelValue"])
            ]))
          : _createCommentVNode("v-if", true),
        _createVNode(_component_el_input, {
          modelValue: _ctx.edit.content,
          "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((_ctx.edit.content) = $event)),
          type: "textarea",
          rows: 26,
          class: "code-editor",
          spellcheck: "false"
        }, null, 8 /* PROPS */, ["modelValue"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue", "title"]),
    _createCommentVNode(" 上传 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.uploadVisible,
      "onUpdate:modelValue": _cache[13] || (_cache[13] = $event => ((_ctx.uploadVisible) = $event)),
      title: "上传文件到 ",
      width: "480px"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_el_upload, {
          drag: "",
          multiple: "",
          action: _ctx.uploadUrl(),
          headers: _ctx.uploadHeaders(),
          data: _ctx.uploadData(),
          "on-success": _ctx.onUploadSuccess,
          "on-error": () => _ctx.$message.error('上传失败')
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_icon, {
              size: "42",
              color: "var(--accent)"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_UploadFilled)
              ]),
              _: 1 /* STABLE */
            }),
            _cache[40] || (_cache[40] = _createElementVNode("div", { style: {"margin-top":"8px","color":"var(--text-regular)"} }, [
              _createTextVNode("拖拽文件到此处，或"),
              _createElementVNode("em", null, "点击选择")
            ], -1 /* CACHED */))
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["action", "headers", "data", "on-success", "on-error"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createCommentVNode(" 重命名 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.rename.show,
      "onUpdate:modelValue": _cache[16] || (_cache[16] = $event => ((_ctx.rename.show) = $event)),
      title: "重命名",
      width: "400px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_17, [
          _createVNode(_component_el_button, {
            onClick: _cache[15] || (_cache[15] = $event => (_ctx.rename.show = false))
          }, {
            default: _withCtx(() => [...(_cache[41] || (_cache[41] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submitRename
          }, {
            default: _withCtx(() => [...(_cache[42] || (_cache[42] = [
              _createTextVNode("确定", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_input, {
          modelValue: _ctx.rename.name,
          "onUpdate:modelValue": _cache[14] || (_cache[14] = $event => ((_ctx.rename.name) = $event)),
          onKeyup: _withKeys(_ctx.submitRename, ["enter"])
        }, null, 8 /* PROPS */, ["modelValue", "onKeyup"])
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createCommentVNode(" 权限 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.chmod.show,
      "onUpdate:modelValue": _cache[19] || (_cache[19] = $event => ((_ctx.chmod.show) = $event)),
      title: "修改权限",
      width: "400px"
    }, {
      footer: _withCtx(() => [
        _createElementVNode("div", _hoisted_18, [
          _createVNode(_component_el_button, {
            onClick: _cache[18] || (_cache[18] = $event => (_ctx.chmod.show = false))
          }, {
            default: _withCtx(() => [...(_cache[43] || (_cache[43] = [
              _createTextVNode("取消", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_el_button, {
            type: "primary",
            onClick: _ctx.submitChmod
          }, {
            default: _withCtx(() => [...(_cache[44] || (_cache[44] = [
              _createTextVNode("确定", -1 /* CACHED */)
            ]))]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["onClick"])
        ])
      ]),
      default: _withCtx(() => [
        _createVNode(_component_el_input, {
          modelValue: _ctx.chmod.mode,
          "onUpdate:modelValue": _cache[17] || (_cache[17] = $event => ((_ctx.chmod.mode) = $event)),
          placeholder: "如 755 / 644"
        }, null, 8 /* PROPS */, ["modelValue"]),
        _cache[45] || (_cache[45] = _createElementVNode("div", { style: {"color":"var(--text-secondary)","font-size":"12px","margin-top":"8px"} }, "八进制权限，Windows 平台仅有限支持", -1 /* CACHED */))
      ]),
      _: 1 /* STABLE */
    }, 8 /* PROPS */, ["modelValue"]),
    _createCommentVNode(" 搜索结果 "),
    _createVNode(_component_el_dialog, {
      modelValue: _ctx.search.show,
      "onUpdate:modelValue": _cache[20] || (_cache[20] = $event => ((_ctx.search.show) = $event)),
      title: "搜索结果",
      width: "680px"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_el_table, {
          data: _ctx.search.results,
          size: "small",
          "max-height": "440"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_el_table_column, {
              label: "文件",
              "min-width": "300"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(s.row.path), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "大小",
              width: "100"
            }, {
              default: _withCtx((s) => [
                _createTextVNode(_toDisplayString(_ctx.fmtBytes(s.row.size)), 1 /* TEXT */)
              ]),
              _: 1 /* STABLE */
            }),
            _createVNode(_component_el_table_column, {
              label: "操作",
              width: "140"
            }, {
              default: _withCtx((s) => [
                _createVNode(_component_el_button, {
                  size: "small",
                  onClick: $event => {_ctx.search.show = false; _ctx.load(s.row.path)}
                }, {
                  default: _withCtx(() => [...(_cache[46] || (_cache[46] = [
                    _createTextVNode("前往", -1 /* CACHED */)
                  ]))]),
                  _: 1 /* STABLE */
                }, 8 /* PROPS */, ["onClick"])
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
