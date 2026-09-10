// Integration model: page requirements resolve to the same canonical content as PRD.
const copy = value => JSON.parse(JSON.stringify(value));
const id = (kind, ...parts) => kind + ':' + parts.map(x => encodeURIComponent(String(x))).join(':');
function requireValue(condition, message) { if (!condition) throw new Error(message); }

export function fromPrd(project) {
  requireValue(project && project.id && Array.isArray(project.framework) && project.data, '无效的 PRD 项目');
  const result = {
    schemaVersion: 1, id: id('prd', project.id), name: project.name || '未命名项目', revision: 0,
    prd: copy(project), requirements: [], pages: [], bindings: [],
    // Original content is preserved; only selected supported items receive references.
    sources: [{ kind: 'prd', id: project.id }]
  };
  project.framework.forEach(section => {
    if (section.type !== 'feat') return;
    const items = project.data[section.id]?.items;
    requireValue(items == null || Array.isArray(items), '功能条目格式错误：' + section.id);
    (items || []).forEach((item, index) => {
      requireValue(item && typeof item === 'object' && !Array.isArray(item), '功能条目必须为对象');
      result.requirements.push({
        id: id('req', project.id, section.id, index), sectionId: section.id,
        revision: 1, deleted: false, origin: { kind: 'prd-item', sectionId: section.id, index }
      });
    });
  });
  return result;
}

export function requirementContent(project, requirementId) {
  const req = project.requirements.find(x => x.id === requirementId);
  if (!req || req.deleted) return null;
  return req.origin.kind === 'prd-item'
    ? project.prd.data[req.origin.sectionId].items[req.origin.index]
    : req.content;
}

export function pageRequirements(project, pageId) {
  const page = project.pages.find(x => x.id === pageId);
  requireValue(page, '页面不存在');
  return page.requirementIds.map(requirementId => ({
    id: requirementId, content: copy(requirementContent(project, requirementId)),
    revision: project.requirements.find(x => x.id === requirementId)?.revision || 0
  }));
}

// Import exactly one ProtoReq project into a PRD workspace; source databases are untouched.
export function attachProtoProject(project, database, sourceId) {
  requireValue(database && Array.isArray(database.projects), '无效的 ProtoReq 数据库');
  requireValue(database.projects.some(x => x.id === sourceId), '原型项目不存在');
  if (project.sources.some(x => x.kind === 'proto' && x.id === sourceId)) return copy(project);
  const next = copy(project);
  const pages = (database.pages || []).filter(x => x.project_id === sourceId);
  const selectedPages = new Set(pages.map(x => x.id));
  const documents = (database.documents || []).filter(x => selectedPages.has(x.page_id));
  const selectedDocs = new Set(documents.map(x => x.id));
  const blocks = (database.blocks || []).filter(x => selectedDocs.has(x.document_id));
  blocks.forEach(block => next.requirements.push({
    id: id('block', sourceId, block.id), revision: 1, deleted: false,
    origin: { kind: 'proto-block', blockId: block.id },
    content: { type: block.block_type, value: copy(block.content) }
  }));
  pages.forEach(page => {
    const docIds = new Set(documents.filter(x => x.page_id === page.id).map(x => x.id));
    next.pages.push({
      id: id('page', sourceId, page.id), name: page.name, html: page.prototype_content || '',
      requirementIds: blocks.filter(x => docIds.has(x.document_id)).sort((a, b) => a.sort - b.sort)
        .map(x => id('block', sourceId, x.id)), reviewedRevisions: {}
    });
  });
  (database.links || []).filter(x => selectedPages.has(x.page_id)).forEach(link => {
    next.bindings.push({ id: id('binding', sourceId, link.id), pageId: id('page', sourceId, link.page_id),
      requirementId: id('block', sourceId, link.requirement_block_id), elementId: link.prototype_element_id || null });
  });
  // Preserve unmigrated comments/versions and source metadata for a later explicit migration.
  next.sources.push({ kind: 'proto', id: sourceId, snapshot: {
    project: copy(database.projects.find(x => x.id === sourceId)), pages: copy(pages),
    documents: copy(documents), blocks: copy(blocks),
    comments: copy((database.comments || []).filter(x => selectedPages.has(x.page_id))),
    versions: copy((database.versions || []).filter(x => selectedPages.has(x.page_id))),
    changes: copy((database.changes || []).filter(x => x.project_id === sourceId || selectedPages.has(x.page_id))),
    elements: copy((database.elements || []).filter(x => selectedPages.has(x.page_id))),
    links: copy((database.links || []).filter(x => selectedPages.has(x.page_id)))
  } });
  next.revision++;
  return next;
}

export function referenceRequirement(project, pageId, requirementId) {
  const page = project.pages.find(x => x.id === pageId);
  requireValue(page && requirementContent(project, requirementId) !== null, '页面或需求不存在');
  if (!page.requirementIds.includes(requirementId)) {
    page.requirementIds.push(requirementId); project.revision++;
  }
}

export function updateRequirement(project, requirementId, content) {
  const req = project.requirements.find(x => x.id === requirementId && !x.deleted);
  requireValue(req && content && typeof content === 'object' && !Array.isArray(content), '需求不存在或内容格式错误');
  if (req.origin.kind === 'prd-item') project.prd.data[req.origin.sectionId].items[req.origin.index] = copy(content);
  else req.content = copy(content);
  req.revision++; project.revision++;
}

export function deleteRequirement(project, requirementId) {
  const req = project.requirements.find(x => x.id === requirementId && !x.deleted);
  requireValue(req, '需求不存在');
  // Keep the slot and ID so references never silently shift to the next item.
  req.deleted = true; req.revision++; project.revision++;
  return project.bindings.filter(x => x.requirementId === requirementId).map(x => x.id);
}

export function bindingStatus(project, binding, actualElementIds) {
  if (requirementContent(project, binding.requirementId) === null) return 'missing-requirement';
  const page = project.pages.find(x => x.id === binding.pageId);
  if (!page || !binding.elementId || !actualElementIds.includes(binding.elementId)) return 'missing-element';
  const req = project.requirements.find(x => x.id === binding.requirementId);
  return binding.reviewedRevision === req.revision ? 'valid' : 'needs-review';
}

export function bindRequirement(project, pageId, requirementId, elementId, actualElementIds) {
  requireValue(typeof elementId === 'string' && actualElementIds.includes(elementId), '原型元素不存在');
  referenceRequirement(project, pageId, requirementId);
  let binding = project.bindings.find(x => x.pageId === pageId && x.requirementId === requirementId && x.elementId === elementId);
  if (!binding) {
    binding = { id: id('binding', pageId, requirementId, elementId), pageId, requirementId, elementId };
    project.bindings.push(binding);
  }
  binding.reviewedRevision = project.requirements.find(x => x.id === requirementId).revision;
  project.revision++;
  return binding;
}

// Export removes tombstoned items without shifting live references inside the workspace.
export function exportPrd(project) {
  const result = copy(project.prd);
  for (const section of result.framework) {
    if (section.type !== 'feat') continue;
    const deleted = new Set(project.requirements.filter(x => x.deleted && x.origin.kind === 'prd-item' && x.origin.sectionId === section.id).map(x => x.origin.index));
    if (result.data[section.id]?.items) result.data[section.id].items = result.data[section.id].items.filter((_, index) => !deleted.has(index));
  }
  return result;
}
