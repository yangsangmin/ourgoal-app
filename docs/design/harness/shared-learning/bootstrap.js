'use strict';
const { fs, path, json, sha, stable, receipt, sourceSnapshot } = require('./common');
function bootstrap(options) {
  const registryRoot = path.resolve(options.registryRoot);
  const registry = json(path.join(registryRoot, 'registry.json'));
  let sourceRoot = options.sourceRoot || registry.sources.canonicalRoot;
  const fallback = !fs.existsSync(path.join(sourceRoot, registry.sources.reference));
  if (fallback) sourceRoot = path.resolve(options.repoRoot, registry.sources.fallbackRoot);
  const source = sourceSnapshot(sourceRoot);
  const referenceText = fs.readFileSync(path.join(sourceRoot, registry.sources.reference), 'utf8');
  const fallbackRoot = path.resolve(options.repoRoot, registry.sources.fallbackRoot);
  const other = fs.existsSync(path.join(fallbackRoot, registry.sources.lessons)) ? sourceSnapshot(fallbackRoot) : null;
  const participants = options.participants;
  if (!Array.isArray(participants) || !participants.length) throw Error('PARTICIPANTS_REQUIRED');
  for (const p of participants) for (const k of ['tool', 'role', 'worktree', 'owns', 'allowedActions']) {
    if (p[k] === undefined || (['owns', 'allowedActions'].includes(k) && !Array.isArray(p[k]))) throw Error('EXPLICIT_CONTRACT: ' + k);
  }
  const tool = options.tool || participants[0].tool;
  const adapters = [...new Set([tool, ...participants.map(p => p.tool)].map(t => registry.adapters[t] ? t : 'generic'))];
  const receiptList = [...source.readReceipt, receipt(path.join(registryRoot, 'registry.json'), null)];
  let brief = '# ' + options.taskId + ' 학습 연결 브리프\n\n';
  brief += '전체 정본 읽기: ' + path.join(sourceRoot, registry.sources.reference) + '\n';
  brief += '이 브리프는 전체 읽기를 대체하지 않는다. 명령 실행 없음. 작업자 측정·판정 분리.\n\n';
  brief += '## core\n' + fs.readFileSync(path.join(registryRoot, registry.core), 'utf8') + '\n';
  receiptList.push(receipt(path.join(registryRoot, registry.core), null));
  for (const adapter of adapters) {
    const file = path.join(registryRoot, registry.adapters[adapter]);
    brief += '## adapter-' + adapter + '\n' + fs.readFileSync(file, 'utf8') + '\n';
    receiptList.push(receipt(file, null));
  }
  const playbookRoot = options.playbookRoot || registry.sources.playbookRoot;
  const missingSources = [];
  for (const name of registry.sources.playbookFiles) {
    const file = path.join(playbookRoot, name);
    if (fs.existsSync(file)) {
      receiptList.push(receipt(file, null));
      brief += '## playbook-' + name + '\n' + fs.readFileSync(file, 'utf8') + '\n';
    } else missingSources.push(file);
  }
  brief += '## participants\n```json\n' + JSON.stringify(participants, null, 2) + '\n```\n';
  const appliedLessons = source.lessons.map(l => {
    const scope = options.taskKind || 'unspecified';
    const section = 'lesson-' + l.id;
    brief += '## ' + section + '\n' + l['규칙'] + '\n' + l['어떻게'] + '\n출처: ' + JSON.stringify(l['출처PR']) + '\n';
    return { id: l.id, versionHash: sha(stable(l)), scope, briefSection: section,
      checkerId: 'manual-with-evidence', disposition: 'planned' };
  });
  const eventsRoot = options.eventsRoot;
  const recent = [];
  if (eventsRoot && fs.existsSync(eventsRoot)) {
    for (const task of fs.readdirSync(eventsRoot)) {
      const file = path.join(eventsRoot, task, 'learning-event.json');
      if (fs.existsSync(file)) { const e = json(file); recent.push({ file, event: e }); }
    }
    recent.sort((a, b) => String(b.event.createdAt || '').localeCompare(String(a.event.createdAt || '')));
    for (const r of recent.slice(0, 5)) {
      brief += '## recent-' + r.event.taskId + '\n' + JSON.stringify(r.event.lessonCandidates) + '\n';
      receiptList.push(receipt(r.file, null));
    }
  }
  const otherLessons = other ? new Map(other.lessons.map(l => [l.id, sha(stable(l))])) : null;
  return { brief, taskId: options.taskId, taskKind: options.taskKind, participants,
    source: { root: source.root, basePr: source.basePr, ledgerSha256: source.ledgerSha256,
      referenceSha256: source.referenceSha256, actualCount: source.actualCount,
      advertisedCount: source.advertisedCount, headerCountMatches: source.headerCountMatches,
      referenceMissingIds: source.lessons.filter(l => !referenceText.includes('**' + l.id + '.')).map(l => l.id),
      fallback, compared: other && { root: other.root, basePr: other.basePr, actualCount: other.actualCount,
        advertisedCount: other.advertisedCount, ledgerSha256: other.ledgerSha256,
        referenceSha256: other.referenceSha256, headerCountMatches: other.headerCountMatches,
        sameLedger: other.ledgerSha256 === source.ledgerSha256,
        missingOrChangedIds: source.lessons.filter(l => otherLessons.get(l.id) !== sha(stable(l))).map(l => l.id) } },
    missingSources, readReceipt: receiptList, appliedLessons,
    effectFollowup: registry.effectFollowup, generatedAt: new Date().toISOString() };
}
module.exports = { bootstrap };
