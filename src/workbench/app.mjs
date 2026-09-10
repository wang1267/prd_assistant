import { fromPrd, requirementContent, updateRequirement, bindRequirement, bindingStatus } from './model.mjs';
import { openRepository } from './repository.mjs';
import { mountPreview } from './preview.mjs';
const $ = id => document.getElementById(id);
let repository, project, preview, selectedElement = null, busy = false;
const projectId = 'prd:workbench-demo';
function status(message, error = false) { $('status').textContent = message; $('status').dataset.error = String(error); }
function tab(prototype) {
  $('document').hidden = prototype; $('prototype').hidden = !prototype;
  $('documentTab').setAttribute('aria-pressed', String(!prototype));
  $('prototypeTab').setAttribute('aria-pressed', String(prototype));
}
function selectedRequirement() { return $('requirement').value; }
function hasDraft() {
  if (!project) return false;
  const content = requirementContent(project, selectedRequirement());
  return $('name').value !== (content.name || '') || $('description').value !== (content.desc || '');
}
function renderContent() {
  const content = requirementContent(project, selectedRequirement());
  $('name').value = content.name || ''; $('description').value = content.desc || '';
  $('currentRequirement').textContent = `当前需求：${content.name}。${content.desc || ''}`;
  for (const option of $('requirement').options) option.textContent = requirementContent(project, option.value).name;
  $('bindings').replaceChildren();
  const labels = { valid: '已核对', 'needs-review': '需求已变更，请核对', 'missing-element': '页面元素已缺失', 'missing-requirement': '需求已删除' };
  for (const binding of project.bindings) {
    const row = document.createElement('div'); row.className = 'binding';
    const name = requirementContent(project, binding.requirementId)?.name || '已删除需求';
    const state = bindingStatus(project, binding, preview.ids);
    row.textContent = `${name} → ${preview.labels.get(binding.elementId) || '缺失元素'} · ${labels[state]}`;
    if (state === 'needs-review') {
      const button = document.createElement('button'); button.textContent = '查看这条需求';
      button.onclick = () => { $('requirement').value = binding.requirementId; renderContent(); tab(false); $('name').focus(); };
      row.append(button);
    }
    $('bindings').append(row);
  }
  if (!project.bindings.length) $('bindings').textContent = '尚未关联。先选择一个页面元素。';
}
function render() {
  $('start').hidden = !!project; $('workspace').hidden = !project; $('export').disabled = !project;
  if (!project) return;
  $('requirement').replaceChildren();
  for (const req of project.requirements.filter(x => !x.deleted)) {
    const option = document.createElement('option'); option.value = req.id;
    option.textContent = requirementContent(project, req.id).name; $('requirement').append(option);
  }
  preview?.dispose();
  preview = mountPreview($('preview'), project.pages[0].html, elementId => {
    selectedElement = elementId; $('selection').textContent = `已选择：“${preview.labels.get(elementId)}”。确认后关联到“${requirementContent(project, selectedRequirement()).name}”。`;
    $('bind').disabled = busy;
  });
  renderContent();
}
async function persist(change, message) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('#workspace button, #workspace input, #workspace textarea, #workspace select').forEach(x => x.disabled = true);
  try {
    const next = structuredClone(project); change(next);
    const saved = await repository.save(next, project?.storageRevision ?? null);
    project = saved; renderContent(); status(message);
  } catch (error) { status(`${error.message}。输入仍保留；请先导出当前项目，勿直接关闭页面。`, true); }
  finally {
    busy = false; document.querySelectorAll('#workspace button, #workspace input, #workspace textarea, #workspace select').forEach(x => x.disabled = false);
    $('bind').disabled = !selectedElement;
  }
}
$('demo').onclick = async () => {
  $('demo').disabled = true;
  try {
    const demo = fromPrd({ id: 'workbench-demo', name: '喝水记录体验项目', framework: [{ id: 'feat', type: 'feat' }], data: { feat: { items: [{ name: '记录一次喝水', desc: '用户输入水量后点击记录，保存本次饮水。' }, { name: '查看今日饮水', desc: '用户能看到今天累计喝了多少水。' }] } } });
    demo.pages.push({ id: 'record-page', name: '记录页', requirementIds: [], html: '<main data-proto-id="page"><h1 data-proto-id="title">今天喝水了吗？</h1><p data-proto-id="total">今日累计：600 ml</p><label data-proto-id="label">这次喝了多少？</label><p><input data-proto-id="amount" placeholder="250 ml"></p><button data-proto-id="record">记录这次喝水</button></main>' });
    project = await repository.save(demo); render(); status('体验项目已保存。先确认需求，再去对应页面。');
  } catch (error) { status(error.message, true); }
  finally { $('demo').disabled = false; }
};
$('edit').onsubmit = event => {
  event.preventDefault();
  const name = $('name').value.trim(); if (!name) { status('请填写功能名称。', true); return; }
  persist(next => updateRequirement(next, selectedRequirement(), { ...requirementContent(next, selectedRequirement()), name, desc: $('description').value }), '需求已保存。已有对应关系需重新核对；原型不会被自动修改。');
};
$('bind').onclick = () => persist(next => bindRequirement(next, next.pages[0].id, selectedRequirement(), selectedElement, preview.ids), '对应关系已保存。');
let priorRequirement;
$('requirement').onfocus = () => { priorRequirement = selectedRequirement(); };
$('requirement').onchange = () => {
  const chosen = selectedRequirement();
  if (priorRequirement) {
    $('requirement').value = priorRequirement;
    if (hasDraft() && !confirm('这条需求尚未保存。放弃修改并切换需求？')) return;
    $('requirement').value = chosen;
  }
  priorRequirement = chosen;
  selectedElement = null; $('bind').disabled = true; $('selection').textContent = '已切换需求，请重新点选页面元素。'; renderContent();
};
for (const id of ['prototypeTab', 'toPage']) $(id).onclick = () => {
  if (hasDraft()) { status('请先保存需求，再去页面确认对应关系。', true); return; }
  tab(true);
};
for (const id of ['documentTab', 'back']) $(id).onclick = () => tab(false);
$('export').onclick = () => {
  const draft = structuredClone(project);
  const req = selectedRequirement();
  if (req && hasDraft()) updateRequirement(draft, req, { ...requirementContent(draft, req), name: $('name').value, desc: $('description').value });
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = '工作台体验项目.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
try {
  repository = await openRepository(); project = await repository.get(projectId); render();
  status(project ? '已恢复本地体验项目。' : '从一个小例子开始，不需要配置 AI 或登录。');
} catch (error) { status(`无法读取本地项目：${error.message}。请刷新重试；不会重置已有数据。`, true); }
window.addEventListener('beforeunload', event => { if (hasDraft() || busy) { event.preventDefault(); event.returnValue = ''; } });
