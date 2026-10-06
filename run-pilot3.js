const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const repoDir = 'C:\\dev\\ourgoal-app';
const baseSha = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';
const headSha = '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0';
const tmpDir = 'C:\\dev\\ourgoal-app\\scratch\\system-audit-20261007-root\\pilot-app-3';
const headDir = tmpDir + '-head';

function getHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

try {
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`git clone -c core.autocrlf=false ${repoDir} ${tmpDir}`, { stdio: 'ignore' });
  execSync(`git checkout ${baseSha}`, { cwd: tmpDir, stdio: 'ignore' });

  if (fs.existsSync(headDir)) fs.rmSync(headDir, { recursive: true, force: true });
  fs.mkdirSync(headDir, { recursive: true });
  execSync(`git clone -c core.autocrlf=false ${repoDir} ${headDir}`, { stdio: 'ignore' });
  execSync(`git checkout ${headSha}`, { cwd: headDir, stdio: 'ignore' });

  const configAbs = path.join(headDir, 'docs/design/harness/module-split/inline-record-detail585.json');
  const config = JSON.parse(fs.readFileSync(configAbs, 'utf8'));
  const genScript = 'docs/design/harness/module-split/gen-inline-hard.js';
  
  console.log('Running generator...');
  const out = execSync(`node ${genScript} . "${configAbs}"`, { cwd: tmpDir, encoding: 'utf8' });
  console.log(out);

  const requiredFiles = ['index.html', ...config.cells.map(c => c.file)];
  let hasDiff = false;

  for (const file of requiredFiles) {
    const baseFile = path.join(tmpDir, file);
    const headFile = path.join(headDir, file);
    
    if (!fs.existsSync(baseFile)) {
      console.error(`ERROR: Generated file ${file} is missing!`);
      hasDiff = true;
      continue;
    }
    if (!fs.existsSync(headFile)) {
      console.error(`ERROR: Target head file ${file} is missing!`);
      hasDiff = true;
      continue;
    }

    const baseBuf = fs.readFileSync(baseFile);
    const headBuf = fs.readFileSync(headFile);
    const baseHash = getHash(baseBuf);
    const headHash = getHash(headBuf);

    console.log(`Checking ${file}:`);
    console.log(`  Generated SHA: ${baseHash} (${baseBuf.length} bytes)`);
    console.log(`  Head SHA:      ${headHash} (${headBuf.length} bytes)`);

    if (Buffer.compare(baseBuf, headBuf) !== 0) {
      hasDiff = true;
      const baseText = baseBuf.toString('utf8');
      const headText = headBuf.toString('utf8');
      
      const bLines = baseText.split('\n');
      const hLines = headText.split('\n');
      let diffFound = false;
      for (let i = 0; i < Math.max(bLines.length, hLines.length); i++) {
        if (bLines[i] !== hLines[i]) {
          console.log(`  -> First diff at line ${i+1}:`);
          console.log(`     Gen:  ${JSON.stringify(bLines[i])}`);
          console.log(`     Head: ${JSON.stringify(hLines[i])}`);
          diffFound = true;
          break;
        }
      }
      if (!diffFound) {
        console.log(`  -> No text diff found. Difference might be pure newline sequence (e.g. trailing \\r).`);
      }
    } else {
      console.log(`  -> EXACT MATCH`);
    }
  }

  // Also check git status for unexpected files
  const status = execSync('git status --short', { cwd: tmpDir, encoding: 'utf8' });
  const statusLines = status.trim().split('\n').filter(Boolean);
  const allowed = new Set(requiredFiles);
  for (const line of statusLines) {
    const p = line.trim().split(/\s+/);
    const f = p[p.length - 1];
    if (!allowed.has(f.replace(/\\/g, '/'))) {
      console.error(`ERROR: Unexpected modified file in base APP: ${f}`);
      hasDiff = true;
    }
  }

  if (hasDiff) {
    console.error('\nValidation failed: Differences found.');
    process.exit(1);
  } else {
    console.log('\nSUCCESS: All files exactly match the product head byte-for-byte.');
  }
} catch (e) {
  console.error(e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
  process.exit(1);
}
