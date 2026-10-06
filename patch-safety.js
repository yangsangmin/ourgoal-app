const fs = require('fs');
let code = fs.readFileSync('court/lib/preserve-source.js', 'utf8');

code = code.replace(
  "function prepareCleanDir(dir) {\n  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });",
  "function prepareCleanDir(dir) {\n  if (!dir.startsWith(require('os').tmpdir())) throw new Error('Safety check failed: temp dir not in os.tmpdir');\n  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });"
);

code = code.replace(
  "fs.rmSync(tmpDir, { recursive: true, force: true });",
  "if (!tmpDir.startsWith(require('os').tmpdir())) throw new Error('Safety check failed');\n    fs.rmSync(tmpDir, { recursive: true, force: true });"
);
code = code.replace(
  "fs.rmSync(tmpDir, { recursive: true, force: true });",
  "if (!tmpDir.startsWith(require('os').tmpdir())) throw new Error('Safety check failed');\n    fs.rmSync(tmpDir, { recursive: true, force: true });"
);

fs.writeFileSync('court/lib/preserve-source.js', code);
