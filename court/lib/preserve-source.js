const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const crypto = require('crypto');

function getHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

function prepareCleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function getBlobBytes(repoDir, sha, file) {
  try {
    return execSync(`git show ${sha}:${file}`, { cwd: repoDir, encoding: 'buffer' });
  } catch (e) {
    return null;
  }
}

function recomputeSplit({ repoDir, baseSha, headSha, config, changedFiles, mockOverrides }) {
  if (!changedFiles) return { ok: false, reason: "changedFiles missing" };
  try {
    const CFG = config;
    if (!CFG || !CFG.cells || !CFG.task || CFG.slot == null) {
      return { ok: false, reason: 'Invalid config' };
    }
    
    const requiredFiles = ['index.html', ...CFG.cells.map(c => c.file)];
    const allowedSource = new Set(requiredFiles);
    for (const f of changedFiles) {
      if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) {
        if (!allowedSource.has(f.replace(/\\/g, '/')) && (f.startsWith('js/') || f === 'index.html')) {
           return { ok: false, reason: 'Disallowed source file changed: ' + f };
        }
      }
    }

    const tmpName = 'gen-tmp-' + crypto.randomBytes(4).toString('hex');
    const tmpDir = path.join(require('os').tmpdir(), tmpName);
    prepareCleanDir(tmpDir);

    execSync(`git clone -c core.autocrlf=false ${repoDir} ${tmpDir}`, { stdio: 'ignore' });
    execSync(`git checkout ${baseSha}`, { cwd: tmpDir, stdio: 'ignore' });

    if (mockOverrides && mockOverrides.baseDir) {
      fs.cpSync(mockOverrides.baseDir, tmpDir, { recursive: true, force: true });
    }

    const configPath = tmpDir + '-config.json';
    fs.writeFileSync(configPath, JSON.stringify(config));

    const genScript = path.join(tmpDir, 'docs/design/harness/module-split/gen-inline-hard.js');
    
    if (fs.existsSync(path.join(repoDir, 'node_modules'))) {
      fs.cpSync(path.join(repoDir, 'node_modules'), path.join(tmpDir, 'node_modules'), { recursive: true });
    }

    try {
      execFileSync(process.execPath, [genScript, tmpDir, configPath], { stdio: 'pipe', encoding: 'utf8' });
    } catch(err) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      return { ok: false, reason: 'Generator failed: ' + err.message };
    }

    let matchFailed = false;
    let failReason = '';
    const details = { checkedFiles: [] };

    for (const file of requiredFiles) {
      const genFile = path.join(tmpDir, file);
      if (!fs.existsSync(genFile)) {
        matchFailed = true;
        failReason = `Generator did not produce ${file}`;
        break;
      }
      
      const genBuf = fs.readFileSync(genFile);
      let headBuf;

      if (mockOverrides && mockOverrides.headDir) {
        const headFile = path.join(mockOverrides.headDir, file);
        if (!fs.existsSync(headFile)) {
          matchFailed = true;
          failReason = `Target head file missing in mock: ${file}`;
          break;
        }
        headBuf = fs.readFileSync(headFile);
      } else {
        headBuf = getBlobBytes(repoDir, headSha, file);
        if (!headBuf) {
          matchFailed = true;
          failReason = `Target head file missing in git tree: ${file}`;
          break;
        }
      }

      details.checkedFiles.push({ file, genLength: genBuf.length, headLength: headBuf.length });

      if (Buffer.compare(genBuf, headBuf) !== 0) {
        matchFailed = true;
        failReason = `Mismatch in ${file}`;
        break;
      }
    }

    if (!matchFailed) {
      const status = execSync('git status --short', { cwd: tmpDir, encoding: 'utf8' });
      const statusLines = status.trim().split('\n').filter(Boolean);
      for (const line of statusLines) {
        const p = line.trim().split(/\s+/);
        const f = p[p.length - 1];
        if (!allowedSource.has(f.replace(/\\/g, '/'))) {
          matchFailed = true;
          failReason = `Unexpected file modified by generator: ${f}`;
          break;
        }
      }
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);

    if (matchFailed) {
      return { ok: false, reason: failReason, details };
    }

    return { ok: true, details };

  } catch (err) {
    return { ok: false, reason: 'Exception: ' + err.message };
  }
}

module.exports = { recomputeSplit };
