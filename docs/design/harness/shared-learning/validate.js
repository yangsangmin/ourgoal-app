'use strict';
const { fs, path, json, sha, stable, hashFile, inside, sourceSnapshot } = require('./common');
const HEX = /^[a-f0-9]{64}$/;
const {validateFeedback}=require('./feedback-validate');
function validateEvent(event, options) {
  const errors = [];
  const add = (condition, message) => { if (!condition) errors.push(message); };
  const list = (value, name, nonempty = false) => {
    add(Array.isArray(value) && (!nonempty || value.length > 0), name + '_ARRAY_REQUIRED');
    return Array.isArray(value) ? value : [];
  };
  const fields = (value, keys, name) => {
    for (const k of keys) add(value && Object.hasOwn(value, k), name + '_MISSING_' + k);
  };
  fields(event, ['eventId','taskId','taskKind','participants','readReceipt','appliedLessons','evidence','outcome','lessonCandidates','effectFollowup','requiredChecks','inputProductSha','briefPath'], 'EVENT');
  add(typeof event.eventId === 'string' && /^[A-Za-z0-9._-]+$/.test(event.eventId), 'EVENT_ID');
  add(typeof event.taskId === 'string' && /^[A-Za-z0-9._-]+$/.test(event.taskId), 'TASK_ID');
  add(HEX.test(event.inputProductSha || ''), 'PRODUCT_SHA');
  for (const p of list(event.participants, 'PARTICIPANTS', true)) {
    fields(p, ['tool','role','worktree','owns','allowedActions'], 'PARTICIPANT');
    for (const k of ['tool','role','worktree']) add(typeof p[k] === 'string' && p[k].length > 0, 'PARTICIPANT_' + k);
    list(p.owns, 'OWNS'); list(p.allowedActions, 'ALLOWED_ACTIONS');
  }
  const source = sourceSnapshot(options.sourceRoot);
  const receipts = list(event.readReceipt, 'READ_RECEIPT', true);
  for (const r of receipts) {
    fields(r, ['sourcePath','sha256','basePr'], 'RECEIPT');
    try {
      const root = (options.readRoots || [options.sourceRoot, options.repoRoot]).find(root => {
        try { inside(root, r.sourcePath); return true; } catch { return false; }
      });
      add(Boolean(root), 'RECEIPT_OUTSIDE_ROOT');
      add(root && hashFile(inside(root, r.sourcePath)) === r.sha256, 'RECEIPT_HASH: ' + r.sourcePath);
    } catch { errors.push('RECEIPT_MISSING: ' + r.sourcePath); }
  }
  const reference = source.readReceipt[0];
  add(receipts.some(r => path.resolve(r.sourcePath || '') === reference.sourcePath && r.sha256 === reference.sha256 && r.basePr === reference.basePr), 'FULL_REFERENCE_RECEIPT_REQUIRED');
  const ledgerReceipt = source.readReceipt[1];
  add(receipts.some(r => path.resolve(r.sourcePath || '') === ledgerReceipt.sourcePath && r.sha256 === ledgerReceipt.sha256), 'LEDGER_RECEIPT_REQUIRED');
  let brief = '';
  try { brief = fs.readFileSync(inside(options.repoRoot, event.briefPath), 'utf8'); }
  catch { errors.push('BRIEF_MISSING'); }
  const registry = json(path.join(options.registryRoot, 'registry.json'));
  const lessons = new Map(source.lessons.map(l => [l.id, l]));
  const applied = list(event.appliedLessons, 'APPLIED_LESSONS', true);
  add(new Set(applied.map(l => l.id)).size === applied.length, 'DUPLICATE_LESSON');
  for (const l of applied) {
    fields(l, ['id','versionHash','scope','briefSection','checkerId','disposition'], 'APPLIED');
    add(lessons.has(l.id) && sha(stable(lessons.get(l.id))) === l.versionHash, 'LESSON_VERSION: ' + l.id);
    add(typeof l.scope === 'string' && l.scope === event.taskKind, 'LESSON_SCOPE: ' + l.id);
    add(typeof l.briefSection === 'string' && brief.includes('## ' + l.briefSection + '\n'), 'LESSON_BRIEF_LINK: ' + l.id);
    add(registry.checkers.includes(l.checkerId), 'CHECKER_UNKNOWN: ' + l.id);
    add(['planned','applied','not-applicable','pending'].includes(l.disposition), 'DISPOSITION: ' + l.id);
    if (l.disposition === 'applied') add(Array.isArray(l.evidenceRefs) && l.evidenceRefs.length > 0, 'APPLIED_EVIDENCE: ' + l.id);
  }
  add(source.lessons.every(l => applied.some(a => a.id === l.id)), 'LESSON_CONNECTION_MISSING');
  const evidences = list(event.evidence, 'EVIDENCE', true);
  const identities = new Set();
  const checks = new Set();
  const confirmedFailedChecks=new Set();
  for (const e of evidences) {
    fields(e, ['checkerId','command','args','inputProductSha','inputFiles','rawPath','rawSha256','publishedPath','publishedSha256','redaction','exitCode','measuredAt','scope','sourceTask','status'], 'EVIDENCE');
    add(typeof e.command === 'string' && e.command.length > 0, 'COMMAND_REQUIRED');
    list(e.args, 'ARGS');
    add(['measured','unmeasured','blocked'].includes(e.status), 'STATUS');
    add(['work-after','shared-baseline','tool-unit'].includes(e.scope), 'EVIDENCE_SCOPE');
    add(e.inputProductSha === event.inputProductSha, 'INPUT_PRODUCT_MISMATCH');
    if (e.sourceTask !== event.taskId) {
      add(e.scope === 'shared-baseline' && e.sharedBaseline === true && e.originalScope === 'shared-baseline', 'CROSS_TASK_AFTER');
    }
    const id = stable([e.command,e.args,e.inputProductSha,e.rawSha256,e.scope,e.sourceTask]);
    add(!identities.has(id), 'DUPLICATE_EVIDENCE'); identities.add(id);
    if (e.status === 'measured') {
      add(Number.isInteger(e.exitCode), 'EXIT_CODE_REQUIRED');
      add(typeof e.measuredAt === 'string' && Number.isFinite(Date.parse(e.measuredAt)), 'MEASURED_AT');
      const inputs = list(e.inputFiles, 'INPUT_FILES', true);
      add(sha(stable(inputs.map(i => ({path:i.path,sha256:i.sha256})).sort((a,b) => a.path.localeCompare(b.path)))) === e.inputProductSha, 'PRODUCT_INPUT_DIGEST');
      for (const input of inputs) {
        fields(input, ['path','sha256'], 'INPUT');
        try { add(hashFile(inside(options.repoRoot, input.path)) === input.sha256, 'INPUT_HASH: ' + input.path); }
        catch { errors.push('INPUT_MISSING_OR_OUTSIDE: ' + input.path); }
      }
      for (const [key, hashKey] of [['rawPath','rawSha256'],['publishedPath','publishedSha256']]) {
        try { add(hashFile(inside(options.repoRoot, e[key])) === e[hashKey], 'EVIDENCE_HASH: ' + key); }
        catch { errors.push('EVIDENCE_MISSING_OR_OUTSIDE: ' + key); }
        add(HEX.test(e[hashKey] || ''), 'EVIDENCE_SHA: ' + hashKey);
      }
      try {
        const envelope = json(inside(options.repoRoot, e.rawPath));
        add(envelope.command === e.command && stable(envelope.args) === stable(e.args) && envelope.inputProductSha === e.inputProductSha && envelope.exitCode === e.exitCode && envelope.scope === e.scope && envelope.sourceTask === e.sourceTask && envelope.measuredAt === e.measuredAt, 'RAW_EXECUTION_INPUT_MISMATCH');
        add(Object.hasOwn(envelope, 'result') && envelope.result !== null, 'RAW_RESULT_REQUIRED');
      } catch { errors.push('RAW_ENVELOPE_REQUIRED'); }
      fields(e.redaction, ['mode','transforms'], 'REDACTION');
      if (e.redaction?.mode === 'none') add(e.rawSha256 === e.publishedSha256 && e.redaction.transforms?.length === 0, 'UNDECLARED_TRANSFORM');
      else add(e.redaction?.mode === 'masked' && Array.isArray(e.redaction.transforms) && e.redaction.transforms.length > 0, 'MASK_TRANSFORM_REQUIRED');
      if (e.exitCode === 0) checks.add(e.checkerId);
      else if(event.feedback?.failures?.some(f=>f.confirmation==='confirmed'&&f.evidenceSha256===e.rawSha256&&f.checkerId===e.checkerId))confirmedFailedChecks.add(e.checkerId);
    } else {
      add(e.exitCode === null && e.measuredAt === null && typeof e.reason === 'string' && e.reason.length > 0, 'UNMEASURED_REASON');
    }
  }
  for (const a of applied.filter(l => l.disposition === 'applied')) {
    for (const ref of a.evidenceRefs || []) add(evidences.some(e => e.checkerId === ref && e.status === 'measured' && e.exitCode === 0), 'APPLIED_EVIDENCE_MISSING: ' + ref);
  }
  for (const check of list(event.requiredChecks, 'REQUIRED_CHECKS', true)) {
    add(checks.has(check) || confirmedFailedChecks.has(check) || (Array.isArray(event.outcome?.unmeasured) && event.outcome.unmeasured.some(u => u.checkerId === check && typeof u.reason === 'string' && u.reason)), 'REQUIRED_CHECK_UNACCOUNTED: ' + check);
  }
  fields(event.outcome, ['courtUrl','measurementOnly','unmeasured','regressions'], 'OUTCOME');
  add(event.outcome?.measurementOnly === true, 'MEASUREMENT_ONLY_REQUIRED');
  add(event.outcome?.courtUrl === null || /^https:\/\/github\.com\//.test(event.outcome?.courtUrl || ''), 'COURT_URL');
  list(event.outcome?.unmeasured, 'UNMEASURED'); list(event.outcome?.regressions, 'REGRESSIONS');
  list(event.lessonCandidates, 'LESSON_CANDIDATES');
  fields(event.effectFollowup, ['nextMatchingTasks','repeatDefectsTarget','evidenceMismatchTarget','interventionBefore','interventionAfter','qualityBefore','qualityAfter'], 'FOLLOWUP');
  add(event.effectFollowup?.nextMatchingTasks === 5 && event.effectFollowup?.repeatDefectsTarget === 0 && event.effectFollowup?.evidenceMismatchTarget === 0, 'FOLLOWUP_TARGETS');
  for (const k of ['interventionBefore','interventionAfter','qualityBefore','qualityAfter']) {
    add(event.effectFollowup?.[k] === null || (event.effectFollowup?.samples?.[k]?.length > 0), 'EFFECT_SAMPLE_REQUIRED: ' + k);
  }
  errors.push(...validateFeedback(event,options));
  return { integrityValid: errors.length === 0, measurementOnly: true, productVerdict: null, taskId: event.taskId, errors };
}
module.exports = { validateEvent };
