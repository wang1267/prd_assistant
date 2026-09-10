// One transaction checks revision and writes the project: competing tabs cannot silently overwrite.
export async function openRepository(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) throw new Error('当前环境不支持本地项目存储');
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('pmWorkbench.v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('请关闭其他工作台窗口后重试'));
  });
  db.onversionchange = () => db.close();
  function transact(mode, operation) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', mode);
      let value, failure;
      tx.oncomplete = () => resolve(value);
      tx.onabort = tx.onerror = () => reject(failure || tx.error || new Error('项目保存失败'));
      operation(tx.objectStore('projects'), result => { value = result; }, message => {
        failure = new Error(message); tx.abort();
      });
    });
  }
  return {
    get: id => transact('readonly', (store, done) => {
      store.get(id).onsuccess = event => done(event.target.result || null);
    }),
    save: (project, expectedRevision = null) => transact('readwrite', (store, done, fail) => {
      store.get(project.id).onsuccess = event => {
        const current = event.target.result;
        if ((current ? current.storageRevision : null) !== expectedRevision) {
          fail('项目已在其他窗口更新，请重新加载或保留副本'); return;
        }
        const saved = structuredClone(project);
        saved.storageRevision = (expectedRevision || 0) + 1;
        store.put(saved); done(saved);
      };
    }),
    close: () => db.close()
  };
}
