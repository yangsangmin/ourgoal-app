const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

function prepareCleanDir(dir) {
  if (!dir.startsWith(require('os').tmpdir())) throw new Error('Safety check failed: temp dir not in os.tmpdir');
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function checkPathSafe(file) {
  if (typeof file !== 'string' || file.includes('..') || path.isAbsolute(file) || /[^a-zA-Z0-9_./-]/.test(file)) return false;
  return true;
}

function getBlobBytes(repoDir, sha, file) {
  if (!checkPathSafe(file)) return null;
  if (!/^[a-zA-Z0-9]+$/.test(sha)) return null;
  try {
    return execFileSync('git', ['show', `${sha}:${file}`], { cwd: repoDir, encoding: 'buffer' });
  } catch (e) {
    return null;
  }
}

// 생성기가 쓸 의존성(@babel/parser 등)을 찾을 곳(TASK-ES-598).
// GitHub 법정은 심사 대상 저장소(pr)에 아무것도 설치하지 않는다(잣대 쪽 trusted 에만 npm ci). 그래서 기준 커밋의 생성기가
// "Cannot find module '@babel/parser'" 로 죽었다. 심사 대상 쪽에 node_modules 가 없으면 법정 자신(잣대 쪽 main)의 node_modules 를 NODE_PATH 로 준다.
// 이 경로는 main 의 package-lock 으로 설치한 것이라 PR 이 바꿀 수 없다.
const COURT_NODE_MODULES = path.resolve(__dirname, '..', '..', 'node_modules');
function genEnv(repoDir, courtNodeModules = COURT_NODE_MODULES) {
  const env = { ...process.env };
  if (repoDir && fs.existsSync(path.join(repoDir, 'node_modules'))) return env;
  if (fs.existsSync(courtNodeModules)) {
    env.NODE_PATH = env.NODE_PATH ? courtNodeModules + path.delimiter + env.NODE_PATH : courtNodeModules;
  }
  return env;
}

function recomputeSplit({ repoDir, baseSha, headSha, config, changedFiles, mockOverrides, courtNodeModules }) {
  if (!repoDir || !baseSha || !headSha) return { ok: false, reason: "Missing repoDir, baseSha, or headSha" };
  if (!changedFiles) return { ok: false, reason: "changedFiles missing" };
  if (!/^[a-zA-Z0-9]+$/.test(baseSha) || !/^[a-zA-Z0-9]+$/.test(headSha)) return { ok: false, reason: "Invalid SHA" };

  try {
    const CFG = config;
    if (!CFG || !CFG.cells || !CFG.task || CFG.slot == null) {
      return { ok: false, reason: 'Invalid config' };
    }
    
    const requiredFiles = ['index.html', ...CFG.cells.map(c => c.file)];
    const allowedSource = new Set(requiredFiles);
    for (const f of changedFiles) {
      if (!checkPathSafe(f)) return { ok: false, reason: 'Invalid path in changedFiles: ' + f };
      if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) {
        if (!allowedSource.has(f.replace(/\\/g, '/')) && (f.startsWith('js/') || f === 'index.html')) {
           return { ok: false, reason: 'Disallowed source file changed: ' + f };
        }
      }
    }

    const tmpName = 'gen-tmp-' + crypto.randomBytes(4).toString('hex');
    const tmpDir = path.join(require('os').tmpdir(), tmpName);
    prepareCleanDir(tmpDir);

    execFileSync('git', ['clone', '-c', 'core.autocrlf=false', repoDir, tmpDir], { stdio: 'ignore' });
    execFileSync('git', ['checkout', baseSha], { cwd: tmpDir, stdio: 'ignore' });

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
      execFileSync(process.execPath, [genScript, tmpDir, configPath], { stdio: 'pipe', encoding: 'utf8', env: genEnv(repoDir, courtNodeModules || COURT_NODE_MODULES) });
    } catch(err) {
      if (!tmpDir.startsWith(require('os').tmpdir())) throw new Error('Safety check failed');
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      return { ok: false, reason: 'Generator failed: ' + err.message };
    }

    let matchFailed = false;
    let failReason = '';
    const details = { checkedFiles: [] };

    for (const file of requiredFiles) {
      if (!checkPathSafe(file)) {
        matchFailed = true;
        failReason = `Invalid required file: ${file}`;
        break;
      }
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
      const status = execFileSync('git', ['status', '--short'], { cwd: tmpDir, encoding: 'utf8' });
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

module.exports = { recomputeSplit, genEnv, COURT_NODE_MODULES };
