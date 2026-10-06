const { judgeStatic } = require('./court/claims.js');
const claim = {
  check: {
    type: 'sourcePreservation',
    config: 'docs/design/harness/module-split/inline-record-detail585.json'
  }
};
const ctx = {
  repoDir: 'C:/dev/ourgoal-app',
  base: { sha: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9' },
  head: { sha: '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0' },
  changedFiles: ['index.html', 'js/tabs/records/template-record-detail.js']
};
console.log(judgeStatic(claim, 'C:/dev/ourgoal-app/scratch/system-audit-20261007-root/pilot-app-3-head', ctx));
