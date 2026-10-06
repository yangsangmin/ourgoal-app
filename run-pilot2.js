const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = 'C:\\dev\\ourgoal-app';
const baseSha = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';
const headSha = '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0';
const tmpDir = 'C:\\dev\\ourgoal-app\\scratch\\system-audit-20261007-root\\pilot-app';

try {
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`git clone ${repoDir} ${tmpDir}`);
  execSync(`git checkout ${baseSha}`, { cwd: tmpDir });

  const headDir = tmpDir + '-head';
  if (fs.existsSync(headDir)) fs.rmSync(headDir, { recursive: true, force: true });
  fs.mkdirSync(headDir, { recursive: true });
  execSync(`git clone ${repoDir} ${headDir}`);
  execSync(`git checkout ${headSha}`, { cwd: headDir });

  // Use config from head
  const configRel = 'docs/design/harness/module-split/inline-record-detail585.json';
  const configAbs = path.join(headDir, configRel);
  
  // Use gen-inline-hard.js from head or base? The prompt says "기존 정본 gen-inline-hard.js를 기준 Git 입력의 별도 임시 APP에서 실제 재실행"
  // So generator from base, but config from head! Wait, generator might also be new in head? Let's use base's generator, or if it doesn't exist, head's.
  const genScript = 'docs/design/harness/module-split/gen-inline-hard.js';
  
  // Actually, I'll just run it
  const out = execSync(`node ${genScript} . "${configAbs}"`, { cwd: tmpDir, encoding: 'utf8' });
  console.log('Generator output:', out);

  // 3. Compare with head
  console.log('\\n--- Comparing generated files with head ---');
  
  const status = execSync('git status --short', { cwd: tmpDir, encoding: 'utf8' });
  console.log('Modified/Generated files in base APP:\\n', status);

  const lines = status.trim().split('\\n');
  let hasDiff = false;
  for (const line of lines) {
    if (!line) continue;
    const parts = line.trim().split(/\\s+/);
    const file = parts[parts.length - 1]; // last part is file path
    
    if (!fs.existsSync(path.join(tmpDir, file))) {
      console.log('Generated file does not exist?', file);
      continue;
    }
    const baseContent = fs.readFileSync(path.join(tmpDir, file), 'utf8');
    
    if (!fs.existsSync(path.join(headDir, file))) {
      console.log('File does not exist in head!', file);
      hasDiff = true;
      continue;
    }
    const headContent = fs.readFileSync(path.join(headDir, file), 'utf8');

    if (baseContent !== headContent) {
      console.log(`\\nDIFF FOUND IN: ${file}`);
      hasDiff = true;
      const bl = baseContent.split('\\n');
      const hl = headContent.split('\\n');
      for (let i = 0; i < Math.max(bl.length, hl.length); i++) {
        if (bl[i] !== hl[i]) {
          console.log(`Line ${i+1}:`);
          console.log(`Generated (base): ${bl[i]}`);
          console.log(`Actual (head):    ${hl[i]}`);
          break;
        }
      }
    } else {
      console.log(`MATCH: ${file}`);
    }
  }

  if (!hasDiff) console.log('\\nAll generated files exactly match the product head!');

} catch (e) {
  console.error(e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
}
