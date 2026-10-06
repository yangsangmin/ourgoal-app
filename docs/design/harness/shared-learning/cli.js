#!/usr/bin/env node
'use strict';
const { fs, path, json, write, inside } = require('./common');
const { bootstrap } = require('./bootstrap');
const { validateEvent } = require('./validate');
const { collectEvent } = require('./collect');
const {feedbackView}=require('./feedback-view');
function main(argv) {
  const [command, ...args] = argv;
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith('--') || args[i + 1] === undefined) throw Error('FLAG_VALUE_REQUIRED');
    flags[args[i].slice(2)] = args[i + 1];
  }
  const repoRoot = path.resolve(flags['repo-root'] || path.join(__dirname, '../../../..'));
  const options = { repoRoot, registryRoot:path.resolve(flags['registry-root'] || path.join(repoRoot,'docs/agents/shared-learning')),
    sourceRoot:flags['source-root'], playbookRoot:flags['playbook-root'], tool:flags.tool,
    taskId:flags['task-id'], taskKind:flags['task-kind'], eventsRoot:flags['events-root'],
    storeRoot:flags['store-root'], expectedSourceHash:flags['expected-source-hash'],
    readRoots:flags['read-roots'] ? json(flags['read-roots']) : undefined };
  const registry=json(path.join(options.registryRoot,'registry.json'));
  const requested=options.sourceRoot||registry.sources.canonicalRoot;
  const fallback=!fs.existsSync(path.join(requested,registry.sources.reference));
  options.sourceRoot=fallback?path.join(repoRoot,registry.sources.fallbackRoot):requested;
  options.storeRoot=options.storeRoot||registry.sharedStoreRoot;
  options.readRoots=options.readRoots||[repoRoot,options.sourceRoot,options.registryRoot,registry.sources.playbookRoot,registry.sharedStoreRoot].filter(Boolean);
  const selection={requestedRoot:path.resolve(requested),selectedRoot:path.resolve(options.sourceRoot),fallback,reason:fallback?'canonical-unavailable-repository-fallback':'requested-or-canonical-readable'};
  function output(file,value){
    const resolved=path.resolve(file);
    const rel=path.relative(repoRoot,resolved);
    if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('OUTPUT_OUTSIDE_REPO');
    for(const root of [options.sourceRoot,options.registryRoot,registry.sources.canonicalRoot,registry.sources.playbookRoot,options.storeRoot,options.eventsRoot]){
      if(!root)continue;const r=path.relative(path.resolve(root),resolved);
      if(r!== '..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r))throw Error('OUTPUT_SOURCE_FORBIDDEN');
    }
    let parent=path.dirname(resolved);while(!fs.existsSync(parent))parent=path.dirname(parent);inside(repoRoot,parent);
    if(fs.existsSync(resolved))inside(repoRoot,resolved);
    write(file,value);
  }
  if(command==='report') {
    if(flags['review-ref'])options.reviewRef=json(flags['review-ref']);
    const result=feedbackView(options);
    if(flags.out)output(flags.out,result);
    return result;
  }
  if (command === 'bootstrap') {
    options.participants = json(flags.participants);
    const result = bootstrap(options);
    result.source.fallback=selection.fallback;
    result.sourceSelection=selection;
    if(selection.fallback)result.pendingReason='fallback-source-read-only; canonical freshness unconfirmed';
    output(flags.out, result);
    output(flags.brief, result.brief);
    return { command, taskId:result.taskId, basePr:result.source.basePr, actualLessons:result.source.actualCount,
      fallback:result.source.fallback, stale:result.source.compared ? !result.source.compared.sameLedger : null,
      commandsExecuted:0, out:path.resolve(flags.out), brief:path.resolve(flags.brief) };
  }
  if (command === 'validate' || command === 'collect') {
    const event = json(flags.event);
    const result = command === 'validate' ? validateEvent(event,options) : collectEvent(event,options);
    result.sourceSelection=selection;
    if(selection.fallback)result.pendingReason='fallback-source-read-only; canonical freshness unconfirmed';
    if (flags.out) output(flags.out,result);
    if (result.integrityValid === false) process.exitCode = 2;
    return result;
  }
  throw Error('사용: bootstrap|validate|collect|report --source-root ... --repo-root ...');
}
if (require.main === module) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)),null,2)); }
  catch (e) { console.error(JSON.stringify({error:e.message,measurementOnly:true,productVerdict:null})); process.exitCode=1; }
}
module.exports = { main };
