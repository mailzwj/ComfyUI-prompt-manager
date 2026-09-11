// 提示词助手：action bar 按钮 + 全屏模态框，模板存 localStorage
const STORAGE_KEY = "comfyui-prompt-manager.templates.v1";
const VAR_RE = /\{\{\{([^{}]+)\}\}\}/g;

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveTemplates(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function extractVars(content) {
  const vars = [];
  for (const m of content.matchAll(VAR_RE)) {
    const name = m[1].trim();
    if (name && !vars.includes(name)) vars.push(name);
  }
  return vars;
}

function mergePrompt(content, values) {
  return content.replace(VAR_RE, (full, raw) => {
    const value = values[raw.trim()];
    return value ? value : full;
  });
}

function mergedHtml(content, values) {
  let html = "";
  let last = 0;
  for (const m of content.matchAll(VAR_RE)) {
    html += esc(content.slice(last, m.index));
    const value = values[m[1].trim()];
    html += value ? `<span class="cpm-filled">${esc(value)}</span>` : `<span class="cpm-unfilled">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  html += esc(content.slice(last));
  return html || '<span class="cpm-muted">（空内容）</span>';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatTime(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const CSS = `
.cpm-overlay{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;background:#0d0e12;color:#e8eaf0;font-family:inherit;font-size:14px}
.cpm-header{height:56px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid #23262e;background:#101116}
.cpm-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:#f2f4f8}
.cpm-title svg{color:#5b8cff}
.cpm-close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:transparent;color:#98a0ad;cursor:pointer}
.cpm-close:hover{background:#1c1f26;color:#e8eaf0}
.cpm-body{flex:1;overflow-y:auto}
.cpm-main{max-width:860px;margin:0 auto;padding:24px 20px 48px}
.cpm-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.cpm-toolbar-actions{display:flex;align-items:center;gap:8px}
.cpm-create-wrap{position:relative;display:inline-flex}
.cpm-create-trigger{display:inline-flex;align-items:center;gap:4px}
.cpm-create-menu{position:absolute;top:calc(100% + 4px);right:0;z-index:10;min-width:128px;padding:4px;background:#1a1d23;border:1px solid #2a2e37;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.cpm-create-item{display:block;width:100%;padding:6px 10px;font-size:13px;text-align:left;border:none;border-radius:6px;background:transparent;color:#c6cbd4;cursor:pointer}
.cpm-create-item:hover{background:#232733;color:#e8eaf0}
.cpm-count{font-size:13px;color:#98a0ad}
.cpm-btn{padding:4px 10px;font-size:12px;border-radius:6px;border:1px solid #2a2e37;background:transparent;color:#c6cbd4;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
.cpm-btn:hover{background:#1c1f26;color:#e8eaf0}
.cpm-btn:disabled{opacity:.6;cursor:default}
.cpm-btn-primary{background:#5b8cff;border-color:#5b8cff;color:#fff}
.cpm-btn-primary:hover{background:#6f9bff;color:#fff}
.cpm-btn-danger{color:#f0564f}
.cpm-btn-danger:hover{background:rgba(240,86,79,.1);border-color:rgba(240,86,79,.4);color:#ff6b63}
.cpm-card{background:#16181d;border:1px solid #23262e;border-radius:10px;padding:14px 16px;margin-bottom:12px}
.cpm-card:hover{border-color:#323845}
.cpm-card-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.cpm-card-name{font-size:14px;font-weight:600;color:#f2f4f8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cpm-card-time{flex-shrink:0;font-size:12px;color:#5f6672}
.cpm-card-scenario{margin-top:6px;font-size:13px;color:#98a0ad;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cpm-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cpm-chip{font-size:11px;line-height:1;padding:4px 8px;border-radius:999px;background:rgba(91,140,255,.12);border:1px solid rgba(91,140,255,.28);color:#8fb0ff}
.cpm-card-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.cpm-view-head{margin-bottom:20px}
.cpm-view-title{font-size:16px;font-weight:600;color:#f2f4f8}
.cpm-field{margin-bottom:16px}
.cpm-label{display:block;margin-bottom:6px;font-size:12px;color:#98a0ad}
.cpm-input{width:100%;box-sizing:border-box;padding:8px 10px;font-size:13px;background:#101216;border:1px solid #2a2e37;border-radius:8px;color:#e8eaf0;outline:none}
.cpm-input:focus{border-color:#5b8cff}
.cpm-textarea{min-height:180px;resize:vertical;line-height:1.6;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.cpm-textarea-sm{min-height:72px;resize:vertical;line-height:1.5}
.cpm-var-preview{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:12px}
.cpm-muted{color:#5f6672}
.cpm-error{min-height:18px;margin-bottom:4px;font-size:12px;color:#f0564f}
.cpm-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:20px}
.cpm-scenario-note{margin:-8px 0 16px;padding:10px 12px;font-size:13px;line-height:1.5;color:#98a0ad;background:#14161b;border:1px solid #23262e;border-radius:8px}
.cpm-section-label{margin:4px 0 12px;font-size:13px;font-weight:600;color:#c6cbd4}
.cpm-merged{min-height:96px;padding:12px;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word;background:#101216;border:1px solid #2a2e37;border-radius:8px;color:#c9ced8;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.cpm-filled{color:#6fd39a}
.cpm-unfilled{color:#f0b45c}
.cpm-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:72px 0;color:#5f6672}
.cpm-empty svg{color:#3a4150}
.cpm-empty-text{font-size:14px}
.cpm-foot-between{justify-content:space-between}
button:has(.cpm-ab-icon){width:30px;height:30px;min-width:30px;padding:0;gap:0;border-radius:4px;background-color:#212121;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
button:has(.cpm-ab-icon):hover{background-color:#373737;color:#fff}
`;

let overlayEl = null;
let mainEl = null;
let view = { name: "list" };
let pendingDeleteId = null;
let deleteTimer = null;
let cssInjected = false;
let createMenuOpen = false;

function injectCss() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
}

function varChipsHtml(vars) {
  if (!vars.length) return '<span class="cpm-muted">未检测到变量（格式：{{{变量名}}}）</span>';
  return '<span class="cpm-muted">提取到的变量：</span>' + vars.map(v => `<span class="cpm-chip">${esc(v)}</span>`).join("");
}

function createMenuHtml() {
  return `<div class="cpm-create-wrap">
    <button class="cpm-btn cpm-btn-primary cpm-create-trigger" data-act="toggle-create">＋ 新建模板<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
    <div class="cpm-create-menu"${createMenuOpen ? "" : " hidden"}>
      <button class="cpm-create-item" data-act="create-form">表单输入</button>
      <button class="cpm-create-item" data-act="import">导入</button>
    </div>
  </div>`;
}

function emptyHtml() {
  return `<div class="cpm-empty">
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>
    <div class="cpm-empty-text">还没有提示词模板</div>
    ${createMenuHtml()}
  </div>`;
}

function listHtml() {
  const templates = loadTemplates();
  if (!templates.length) return emptyHtml();
  const cards = templates.map(t => {
    const vars = extractVars(t.content);
    const confirming = pendingDeleteId === t.id;
    return `<div class="cpm-card">
      <div class="cpm-card-top">
        <span class="cpm-card-name">${esc(t.name)}</span>
        <span class="cpm-card-time">${formatTime(t.updatedAt)}</span>
      </div>
      ${t.scenario ? `<div class="cpm-card-scenario">${esc(t.scenario)}</div>` : ""}
      ${vars.length ? `<div class="cpm-chips">${vars.map(v => `<span class="cpm-chip">${esc(v)}</span>`).join("")}</div>` : ""}
      <div class="cpm-card-actions">
        <button class="cpm-btn cpm-btn-primary" data-act="apply" data-id="${t.id}">应用</button>
        <button class="cpm-btn" data-act="copy-template" data-id="${t.id}" title="复制模板原文">复制</button>
        <button class="cpm-btn" data-act="edit" data-id="${t.id}">编辑</button>
        <button class="cpm-btn cpm-btn-danger" data-act="delete" data-id="${t.id}">${confirming ? "确认删除" : "删除"}</button>
      </div>
    </div>`;
  }).join("");
  return `<div class="cpm-toolbar">
    <span class="cpm-count">共 ${templates.length} 个模板</span>
    <div class="cpm-toolbar-actions">
      ${createMenuHtml()}
      <button class="cpm-btn" data-act="export">导出</button>
    </div>
  </div>${cards}`;
}

function formHtml() {
  const editing = view.id ? loadTemplates().find(t => t.id === view.id) : null;
  return `<div class="cpm-view-head"><span class="cpm-view-title">${editing ? "编辑模板" : "新建模板"}</span></div>
  <div class="cpm-field">
    <label class="cpm-label">模板名称</label>
    <input class="cpm-input" id="cpm-name" type="text" placeholder="例如：写实人像通用提示词" value="${editing ? esc(editing.name) : ""}">
  </div>
  <div class="cpm-field">
    <label class="cpm-label">提示词内容（变量用 {{{变量名}}} 标记）</label>
    <textarea class="cpm-input cpm-textarea" id="cpm-content" placeholder="输入提示词，需要填写的部分写成 {{{变量名}}},例如：一只{{{动物}}}站在{{{场景}}}">${editing ? esc(editing.content) : ""}</textarea>
    <div class="cpm-var-preview" id="cpm-var-preview"></div>
  </div>
  <div class="cpm-field">
    <label class="cpm-label">使用场景说明</label>
    <textarea class="cpm-input cpm-textarea-sm" id="cpm-scenario" placeholder="这个模板适合什么场景？例如：写实人像摄影，85mm 镜头">${editing ? esc(editing.scenario) : ""}</textarea>
  </div>
  <div class="cpm-error" id="cpm-form-error"></div>
  <div class="cpm-foot">
    <button class="cpm-btn" data-act="back">取消</button>
    <button class="cpm-btn cpm-btn-primary" data-act="save">保存</button>
  </div>`;
}

function applyHtml(t) {
  const vars = extractVars(t.content);
  const inputs = vars.map(v => `<div class="cpm-field">
    <label class="cpm-label">${esc(v)}</label>
    <input class="cpm-input" type="text" data-var="${esc(v)}" placeholder="填写 ${esc(v)} 的值">
  </div>`).join("");
  return `<div class="cpm-view-head"><span class="cpm-view-title">${esc(t.name)}</span></div>
  ${t.scenario ? `<div class="cpm-scenario-note">${esc(t.scenario)}</div>` : ""}
  ${vars.length ? `<div class="cpm-section-label">变量填写</div>${inputs}` : '<div class="cpm-muted" style="margin-bottom:16px">该模板没有变量，可直接复制。</div>'}
  <div class="cpm-field">
    <label class="cpm-label">合并后的提示词（绿色为已填值，黄色为未填变量）</label>
    <div class="cpm-merged" id="cpm-merged"></div>
  </div>
  <div class="cpm-foot cpm-foot-between">
    <button class="cpm-btn" data-act="back">← 返回列表</button>
    <button class="cpm-btn cpm-btn-primary" data-act="copy">复制提示词</button>
  </div>`;
}

function render() {
  if (!mainEl) return;
  mainEl.innerHTML = view.name === "list" ? listHtml() : view.name === "form" ? formHtml() : applyHtml(loadTemplates().find(x => x.id === view.id));
  bindLiveEvents();
}

function bindLiveEvents() {
  const content = mainEl.querySelector("#cpm-content");
  if (content) {
    const preview = mainEl.querySelector("#cpm-var-preview");
    const update = () => { preview.innerHTML = varChipsHtml(extractVars(content.value)); };
    content.addEventListener("input", update);
    update();
    return;
  }
  const merged = mainEl.querySelector("#cpm-merged");
  if (!merged) return;
  const t = loadTemplates().find(x => x.id === view.id);
  const inputs = [...mainEl.querySelectorAll("input[data-var]")];
  const update = () => {
    const values = {};
    for (const input of inputs) values[input.dataset.var] = input.value.trim();
    merged.innerHTML = mergedHtml(t.content, values);
  };
  for (const input of inputs) input.addEventListener("input", update);
  update();
}

function handleDelete(id) {
  if (pendingDeleteId === id) {
    saveTemplates(loadTemplates().filter(t => t.id !== id));
    pendingDeleteId = null;
    clearTimeout(deleteTimer);
  } else {
    pendingDeleteId = id;
    clearTimeout(deleteTimer);
    deleteTimer = setTimeout(() => { pendingDeleteId = null; render(); }, 3000);
  }
}

function saveForm() {
  const nameEl = mainEl.querySelector("#cpm-name");
  const contentEl = mainEl.querySelector("#cpm-content");
  const scenarioEl = mainEl.querySelector("#cpm-scenario");
  const errEl = mainEl.querySelector("#cpm-form-error");
  const name = nameEl.value.trim();
  const content = contentEl.value;
  if (!name) { errEl.textContent = "请填写模板名称"; return; }
  if (!content.trim()) { errEl.textContent = "请填写提示词内容"; return; }
  const list = loadTemplates();
  if (view.id) {
    const t = list.find(x => x.id === view.id);
    Object.assign(t, { name, content, scenario: scenarioEl.value.trim(), updatedAt: Date.now() });
  } else {
    list.unshift({ id: newId(), name, content, scenario: scenarioEl.value.trim(), updatedAt: Date.now() });
  }
  saveTemplates(list);
  view = { name: "list" };
  render();
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  return ok;
}

function copyText(btn, text) {
  const label = btn.textContent;
  const finish = ok => {
    btn.textContent = ok ? "已复制" : "复制失败";
    btn.disabled = true;
    setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => finish(true), () => finish(fallbackCopy(text)));
  } else {
    finish(fallbackCopy(text));
  }
}

function closeCreateMenu() {
  if (!createMenuOpen) return;
  createMenuOpen = false;
  const menu = mainEl && mainEl.querySelector(".cpm-create-menu");
  if (menu) menu.hidden = true;
}

function importTemplates() {
  closeCreateMenu();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); } catch { alert("导入失败：文件不是有效的 JSON"); return; }
      if (!Array.isArray(data)) { alert("导入失败：JSON 根节点必须是模板数组"); return; }
      const byId = new Map(loadTemplates().map(t => [t.id, t]));
      let count = 0;
      for (const item of data) {
        if (!item || typeof item.name !== "string" || !item.name.trim() || typeof item.content !== "string") continue;
        const id = typeof item.id === "string" && item.id ? item.id : newId();
        byId.set(id, {
          id,
          name: item.name.trim(),
          content: item.content,
          scenario: typeof item.scenario === "string" ? item.scenario.trim() : "",
          updatedAt: Number(item.updatedAt) || Date.now(),
        });
        count++;
      }
      if (!count) { alert("导入失败：文件中没有可用的模板"); return; }
      saveTemplates([...byId.values()]);
      render();
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportTemplates() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  const blob = new Blob([JSON.stringify(loadTemplates(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-manager-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildOverlay() {
  overlayEl = document.createElement("div");
  overlayEl.className = "cpm-overlay";
  overlayEl.innerHTML = `<div class="cpm-header">
    <div class="cpm-title"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>提示词助手</div>
    <button class="cpm-close" title="关闭" aria-label="关闭"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
  </div>
  <div class="cpm-body"><div class="cpm-main"></div></div>`;
  mainEl = overlayEl.querySelector(".cpm-main");
  overlayEl.querySelector(".cpm-close").onclick = closeModal;
  mainEl.onclick = e => {
    if (!e.target.closest(".cpm-create-wrap")) closeCreateMenu();
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const { act, id } = btn.dataset;
    switch (act) {
      case "toggle-create": createMenuOpen = !createMenuOpen; render(); break;
      case "create-form": createMenuOpen = false; view = { name: "form" }; render(); break;
      case "import": importTemplates(); break;
      case "export": exportTemplates(); break;
      case "back": view = { name: "list" }; render(); break;
      case "edit": view = { name: "form", id }; render(); break;
      case "apply": view = { name: "apply", id }; render(); break;
      case "delete": handleDelete(id); render(); break;
      case "save": saveForm(); break;
      case "copy": {
        const t = loadTemplates().find(x => x.id === view.id);
        const values = {};
        for (const input of mainEl.querySelectorAll("input[data-var]")) values[input.dataset.var] = input.value.trim();
        copyText(btn, mergePrompt(t.content, values));
        break;
      }
      case "copy-template": {
        const t = loadTemplates().find(x => x.id === id);
        if (t) copyText(btn, t.content);
        break;
      }
    }
  };
  document.body.appendChild(overlayEl);
}

function openModal() {
  if (overlayEl) return;
  view = { name: "list" };
  buildOverlay();
  render();
}

function closeModal() {
  clearTimeout(deleteTimer);
  pendingDeleteId = null;
  overlayEl.remove();
  overlayEl = null;
  mainEl = null;
}

const extension = {
  name: "ComfyUI.PromptManager",
  get actionBarButtons() {
    return [{
      icon: "icon-[lucide--message-square-text] cpm-ab-icon",
      label: "",
      tooltip: "提示词助手",
      onClick: () => openModal(),
    }];
  },
};

function registerExtension() {
  const app = window.comfyAPI?.app?.app ?? window.app;
  if (!app) return false;
  for (const target of [app, app.extensionManager]) {
    if (target && typeof target.registerExtension === "function") {
      target.registerExtension(extension);
      injectCss();
      return true;
    }
  }
  return false;
}

if (!registerExtension()) {
  // 扩展文件可能先于 app 实例就绪被导入，短暂轮询等待
  const timer = setInterval(() => {
    if (registerExtension()) clearInterval(timer);
  }, 150);
  setTimeout(() => {
    clearInterval(timer);
    console.error("[ComfyUI-prompt-manager] 注册失败：未找到 registerExtension");
  }, 10000);
}
