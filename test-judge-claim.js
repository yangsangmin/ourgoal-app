const fs = require('fs');
const path = require('path');
const { judgeClaim } = require('./court/claims.js');

const repoDir = 'C:/dev/ourgoal-app';
const baseSha = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';
const headSha = '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0';

const claim = {
  id: 'C-SOURCE',
  req: 'R1',
  kind: 'static',
  statement: 'Source files are preserved',
  check: {
    type: 'sourcePreservation',
    config: 'docs/design/harness/module-split/inline-record-detail585.json'
  }
};

const ctx = {
  claimsDir: __dirname,
  base: { sha: baseSha },
  head: { sha: headSha, dir: repoDir },
  floors: { L0: [], L1: ['C-SOURCE'] },
  config: {},
  repoDir: repoDir,
  changedFiles: ['index.html', 'js/tabs/records/template-record-detail.js'],
  outDir: __dirname
};

judgeClaim(ctx, claim).then(out => {
  console.log(JSON.stringify(out, null, 2));
}).catch(err => {
  console.error(err);
});
