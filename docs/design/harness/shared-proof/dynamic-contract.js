'use strict';
// No unproved normalization. Extension requires independent provenance and sensitivity.
function checkDynamic(adapter) {
  if (!Array.isArray(adapter.dynamicContracts)) return [{code:'DYNAMIC_CONTRACT_REQUIRED',field:'dynamicContracts'}];
  return adapter.dynamicContracts.map((c,i)=>({code:'DYNAMIC_PROVENANCE_UNMEASURED',field:`dynamicContracts/${i}`}));
}
module.exports = {checkDynamic};
