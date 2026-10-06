#!/usr/bin/env node
'use strict';
const { path, json, write } = require('./common');
const { bootstrap } = require('./bootstrap');
const { validateEvent } = require('./validate');
const { collectEvent } = require('./collect');
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
  if (command === 'bootstrap') {
    options.participants = json(flags.participants);
    const result = bootstrap(options);
    write(flags.out, result);
    write(flags.brief, result.brief);
    return { command, taskId:result.taskId, basePr:result.source.basePr, actualLessons:result.source.actualCount,
      fallback:result.source.fallback, stale:result.source.compared ? !result.source.compared.sameLedger : null,
      commandsExecuted:0, out:path.resolve(flags.out), brief:path.resolve(flags.brief) };
  }
  if (command === 'validate' || command === 'collect') {
    const event = json(flags.event);
    const result = command === 'validate' ? validateEvent(event,options) : collectEvent(event,options);
    if (flags.out) write(flags.out,result);
    if (result.integrityValid === false) process.exitCode = 2;
    return result;
  }
  throw Error('사용: bootstrap|validate|collect --source-root ... --repo-root ...');
}
if (require.main === module) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)),null,2)); }
  catch (e) { console.error(JSON.stringify({error:e.message,measurementOnly:true,productVerdict:null})); process.exitCode=1; }
}
module.exports = { main };
