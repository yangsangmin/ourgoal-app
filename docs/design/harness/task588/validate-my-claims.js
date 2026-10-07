const { validateClaims } = require('../../../../court/claims.js');
const fs = require('fs');

const doc = JSON.parse(fs.readFileSync('reports/TASK-ES-588/claims.json', 'utf8'));
const errors = validateClaims(doc);
if (errors.length) {
  console.error("Errors:", errors);
  process.exit(1);
} else {
  console.log("Claims OK");
}
