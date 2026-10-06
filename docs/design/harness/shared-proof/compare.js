'use strict';
const {equal} = require('./common');
const {domains} = require('./preflight');
function compare(a,b) {
  const differences=[];
  if(a.steps.length!==b.steps.length) return [{code:'STEP_COUNT',field:'steps'}];
  a.steps.forEach((s,i)=>{
    for(const d of domains) if(!equal(s[d],b.steps[i][d])) differences.push({code:'DOMAIN_DIFFERENCE',field:`steps/${i}/${d}`});
  });
  return differences;
}
module.exports = {compare};
