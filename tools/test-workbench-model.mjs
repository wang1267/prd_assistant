import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromPrd, attachProtoProject, requirementContent, pageRequirements, updateRequirement,
  bindRequirement, bindingStatus, deleteRequirement, exportPrd } from '../src/workbench/model.mjs';
import { openRepository } from '../src/workbench/repository.mjs';

// Small fixtures follow the two legacy stores; never read or mutate a user's database.
const prd = { id: 'old:1', name: '喝水记录', framework: [{ id: 'feat', type: 'feat' }],
  data: { feat: { items: [{ name: '记录喝水', priority: 'P0' }, { name: '每日汇总' }] } }, context: { note: '保留' } };
const proto = { projects: [{ id: 'p1' }, { id: 'other' }],
  pages: [{ id: 'page1', project_id: 'p1', name: '记录页', prototype_content: '<button data-proto-id="save">记录</button>' }, { id: 'private', project_id: 'other' }],
  documents: [{ id: 'doc1', page_id: 'page1' }],
  blocks: [{ id: 'b1', document_id: 'doc1', block_type: 'table', content: { header: ['字段'], rows: [['水量']] }, sort: 0 }],
  elements: [{ id: 'internal-id', page_id: 'page1', proto_element_id: 'save' }],
  links: [{ id: 'l1', page_id: 'page1', prototype_element_id: 'save', requirement_block_id: 'b1' }],
  comments: [{ id: 'c1', page_id: 'page1', content: '建议' }], changes: [{ project_id: 'p1', page_id: 'page1' }] };
function fixture() { return attachProtoProject(fromPrd(prd), proto, 'p1'); }

test('导入隔离来源、保留结构及历史，重复导入幂等', () => {
  const originals = JSON.stringify({ prd, proto });
  const project = fixture();
  assert.equal(project.pages.length, 1);
  assert.deepEqual(requirementContent(project, project.requirements[2].id).value, proto.blocks[0].content);
  assert.equal(project.sources[1].snapshot.comments.length, 1);
  assert.equal(project.sources[1].snapshot.changes.length, 1);
  assert.deepEqual(attachProtoProject(project, proto, 'p1'), project);
  assert.equal(JSON.stringify({ prd, proto }), originals);
});
test('旧关联使用 DOM 元素标识而不是内部记录 ID', () => {
  const project = fixture();
  assert.equal(project.bindings[0].elementId, 'save');
  assert.equal(bindingStatus(project, project.bindings[0], ['save']), 'needs-review');
});
test('同一正文跨视图一致，改名不失联，变更逐条待核对', () => {
  const project = fixture(), page = project.pages[0], req = project.requirements[0];
  const first = bindRequirement(project, page.id, req.id, 'save', ['save', 'other']);
  const second = bindRequirement(project, page.id, req.id, 'other', ['save', 'other']);
  assert.equal(bindingStatus(project, first, ['save']), 'valid');
  updateRequirement(project, req.id, { name: '保存饮水', priority: 'P0' });
  assert.equal(pageRequirements(project, page.id).find(x => x.id === req.id).content.name, '保存饮水');
  assert.equal(exportPrd(project).data.feat.items[0].name, '保存饮水');
  assert.equal(bindingStatus(project, first, ['save']), 'needs-review');
  bindRequirement(project, page.id, req.id, 'save', ['save']);
  assert.equal(bindingStatus(project, first, ['save']), 'valid');
  assert.equal(bindingStatus(project, second, ['other']), 'needs-review');
  assert.equal(project.bindings.length, 3);
});
test('删需求不串位，缺元素不假装有效，导出排除已删条目', () => {
  const project = fixture(), page = project.pages[0], req = project.requirements[0];
  const binding = bindRequirement(project, page.id, req.id, 'save', ['save']);
  assert.equal(bindingStatus(project, binding, []), 'missing-element');
  assert.deepEqual(deleteRequirement(project, req.id), [binding.id]);
  assert.equal(bindingStatus(project, binding, ['save']), 'missing-requirement');
  assert.equal(requirementContent(project, req.id), null);
  assert.equal(requirementContent(project, project.requirements[1].id).name, '每日汇总');
  assert.deepEqual(exportPrd(project).data.feat.items, [{ name: '每日汇总' }]);
});
test('非法输入明确失败', async () => {
  assert.throws(() => fromPrd({}), /无效/);
  assert.throws(() => attachProtoProject(fromPrd(prd), proto, 'missing'), /不存在/);
  const project = fixture();
  assert.throws(() => bindRequirement(project, project.pages[0].id, project.requirements[0].id, 'missing', []), /不存在/);
  await assert.rejects(openRepository(null), /不支持/);
});
