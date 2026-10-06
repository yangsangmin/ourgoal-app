'use strict';
const { fs, path, stable, sha, hashFile, inside, safeId } = require('./common');
const { validateEvent } = require('./validate');
function collectEvent(event, options) {
  const checked = validateEvent(event, options);
  if (!checked.integrityValid) throw Error('INVALID_EVENT: ' + checked.errors.join(', '));
  const store = path.resolve(options.storeRoot);
  const rel = path.relative(path.resolve(options.repoRoot), store);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw Error('STORE_OUTSIDE_REPO');
  if (store === path.resolve(options.sourceRoot) || store.startsWith(path.resolve(options.sourceRoot) + path.sep)) throw Error('CANONICAL_STORE_FORBIDDEN');
  fs.mkdirSync(store, { recursive: true });
  inside(options.repoRoot, store);
  const physicalStore = fs.realpathSync(store);
  const physicalSource = fs.realpathSync(options.sourceRoot);
  if (physicalStore === physicalSource || physicalStore.startsWith(physicalSource + path.sep)) throw Error('CANONICAL_STORE_FORBIDDEN');
  const lock = path.join(store, '.collect.lock');
  let fd;
  try { fd = fs.openSync(lock, 'wx'); } catch { throw Error('COLLECT_LOCKED'); }
  try {
    const current = hashFile(path.join(options.sourceRoot, 'lessons.json'));
    if (!options.expectedSourceHash || current !== options.expectedSourceHash) throw Error('SOURCE_CAS_CONFLICT');
    const task = safeId(event.taskId); const id = safeId(event.eventId);
    const file = path.join(store, task, id + '.json');
    if (fs.existsSync(path.join(store, task)) && fs.realpathSync(path.join(store, task)) !== path.join(fs.realpathSync(store), task)) throw Error('STORE_SYMLINK');
    const text = stable(event) + '\n'; const digest = sha(text);
    for (const otherTask of fs.readdirSync(store,{withFileTypes:true}).filter(d=>d.isDirectory())) {
      const other = path.join(store,otherTask.name,id+'.json');
      if (fs.existsSync(other) && (fs.lstatSync(other).isSymbolicLink() || hashFile(other)!==digest)) throw Error('EVENT_CONTENT_CONFLICT');
    }
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isSymbolicLink()) throw Error('STORE_SYMLINK');
      if (hashFile(file) !== digest) throw Error('EVENT_CONTENT_CONFLICT');
      return { disposition:'idempotent', eventId:id, taskId:task, eventSha256:digest, promotion:false };
    }
    fs.mkdirSync(path.dirname(file), { recursive:true });
    const pendingFile=path.join(store,task,id+'.pending.json');
    if(fs.existsSync(pendingFile)) throw Error('PENDING_CONTENT_CONFLICT');
    // Exclusive create keeps events append-only; never overwrites a central array.
    fs.writeFileSync(file, text, { encoding:'utf8', flag:'wx' });
    const evidenceKeys = [...new Set(event.evidence.filter(e => e.status === 'measured').map(e => stable([e.sourceTask,e.inputProductSha,e.rawSha256,e.scope])))];
    fs.writeFileSync(pendingFile, JSON.stringify({ eventId:id, taskId:task,
      sourceHash:current, disposition:'proposal-only', promotion:false, confirmationKeys:evidenceKeys,
      lessonCandidates:event.lessonCandidates, effectFollowup:event.effectFollowup },null,2)+'\n',{encoding:'utf8',flag:'wx'});
    return { disposition:'pending', eventId:id, taskId:task, eventSha256:digest, promotion:false };
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
module.exports = { collectEvent };
