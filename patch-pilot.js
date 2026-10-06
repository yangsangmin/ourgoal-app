const fs = require('fs');
let code = fs.readFileSync('run-pilot.js', 'utf8');
code = code.replace(/node \$\{genScript\} \$\{config\}/, 'node ${genScript} . ${config}');
fs.writeFileSync('run-pilot.js', code);
