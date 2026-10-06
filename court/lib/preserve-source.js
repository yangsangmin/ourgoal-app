const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

function getHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

function recomputeSplit({ baseDir, headDir, config, changedFiles }) {
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
        if (!allowedSource.has(f) && (f.startsWith('js/') || f === 'index.html')) {
           return { ok: false, reason: 'Disallowed source file changed: ' + f };
        }
      }
    }

    for (const f of requiredFiles) {
      if (!fs.existsSync(path.join(headDir, f))) return { ok: false, reason: `Missing head cell file: ${f}` };
      if (f === 'index.html') {
         if (!fs.existsSync(path.join(baseDir, 'index.html'))) return { ok: false, reason: `Missing base index.html` };
      }
    }

    // Prepare temp dir for generation
    const tmpName = 'gen-tmp-' + crypto.randomBytes(4).toString('hex');
    const tmpDir = path.join(require('os').tmpdir(), tmpName);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Copy base index.html and dependencies to tmpDir so generator can run
    // Wait, generator expects the entire APP directory, but mainly index.html and js/core/app-scope.js etc.
    // Actually, gen-inline-hard.js reads files from APP. 
    // We can just use baseDir directly!
    // But gen-inline-hard.js WRITES to baseDir! That would mutate the base checkout!
    // Let's copy baseDir to tmpDir.
    // Copying the whole dir in JS is slow. We can just use OS copy or fs.cpSync
    fs.cpSync(baseDir, tmpDir, { recursive: true });

    // Save config into tmpDir
    const configPath = path.join(tmpDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config));

    // Run generator
    // Path to generator in headDir or baseDir? Let's use headDir
    const genScript = path.join(headDir, 'docs/design/harness/module-split/gen-inline-hard.js');
    try {
      execFileSync(process.execPath, [genScript, tmpDir, configPath], { stdio: 'pipe', encoding: 'utf8' });
    } catch(err) {
      return { ok: false, reason: 'Generator failed: ' + err.message };
    }

    // Compare generated files with headDir
    let matchFailed = false;
    let failReason = '';
    const details = { checkedFiles: [] };

    for (const file of requiredFiles) {
      const genFile = path.join(tmpDir, file);
      const headFile = path.join(headDir, file);

      if (!fs.existsSync(genFile)) {
        return { ok: false, reason: `Generator did not produce ${file}` };
      }

      const genBuf = fs.readFileSync(genFile);
      const headBuf = fs.readFileSync(headFile);
      
      // Git checkout might have \r\n vs \n issues.
      // For exact byte match, we need to compare them, but since headDir might be checked out by Git on Windows,
      // we can normalize line endings ONLY for the comparison, OR since we use exact match,
      // we can do a strict compare if we assure both are checked out identically.
      // But let's strip \r for safety so Windows checkouts don't fail a valid generation.
      const genText = genBuf.toString('utf8').replace(/\r\n/g, '\n');
      const headText = headBuf.toString('utf8').replace(/\r\n/g, '\n');

      details.checkedFiles.push({ file, genLength: genText.length, headLength: headText.length });

      if (genText !== headText) {
        matchFailed = true;
        failReason = `Mismatch in ${file}`;
        break;
      }
    }

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    if (matchFailed) {
      return { ok: false, reason: failReason, details };
    }

    return { ok: true, details };

  } catch (err) {
    return { ok: false, reason: 'Exception: ' + err.message };
  }
}

module.exports = { recomputeSplit };
