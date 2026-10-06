const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function recomputeSplit({ baseDir, headDir, config, changedFiles }) {
    if (!changedFiles) return { ok: false, reason: "changedFiles missing" };
  try {
    const CFG = config;
    if (!CFG || !CFG.cells || !CFG.task || CFG.slot == null) {
      return { ok: false, reason: 'Invalid config' };
    }
    const TAG = '#' + CFG.task;
    const FILES = CFG.cells.map(c => c.file);
      const allowedSource = new Set(['index.html', 'ui.js', 'ui.css', ...FILES]);
      for (const f of changedFiles) {
        if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) {
          if (!allowedSource.has(f) && (f.startsWith('js/') || f === 'index.html')) {
             return { ok: false, reason: 'Disallowed source file changed: ' + f };
          }
        }
      }

    for (const f of FILES) {
      if (!fs.existsSync(path.join(headDir, f))) return { ok: false, reason: `Missing cell file: ${f}` };
    }
    if (!fs.existsSync(path.join(baseDir, 'index.html'))) return { ok: false, reason: `Missing base index.html` };
    if (!fs.existsSync(path.join(headDir, 'index.html'))) return { ok: false, reason: `Missing head index.html` };

    const readLines = f => {
      try { return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n'); } catch (e) { return null; }
    };
    const iifeOf = file => {
      const lines = readLines(file);
      if (!lines) throw new Error('Cannot read ' + file);
      let s = -1, e = -1;
      for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
      if (s < 0) throw new Error("Cannot find IIFE bounds in " + file); for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
      if (s < 0 || e < 0) throw new Error('Cannot find IIFE bounds in ' + file);
      return { lines, s, e, code: lines.slice(s, e).join('\n') };
    };

    const tokVal = t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label);
    const norm = toks => {
      const v = toks.map(tokVal), out = [];
      for (let i = 0; i < v.length; i++) { if ((v[i] === 'L' || v[i] === 'K') && v[i + 1] === '.' && /^[A-Za-z_$]/.test(v[i + 2] || '')) { i += 1; continue; } out.push(v[i]); }
      return out;
    };
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const strip = l => l.replace(/(^|[^A-Za-z0-9_$.])[LK]\.(?=[A-Za-z_$])/g, '$1');

    let O;
    try { O = iifeOf(path.join(baseDir, 'index.html')); } catch(e) { return { ok: false, reason: e.message }; }
    
    let oast;
    try { oast = parser.parse(O.code, { sourceType: 'script', tokens: true, ranges: true }); }
    catch(e) { return { ok: false, reason: 'Parse error in base index.html' }; }

    let originalIife; traverse(oast, { FunctionExpression(p) { if (!originalIife) originalIife = p; } });
    if (!originalIife) return { ok: false, reason: 'No original IIFE found' };
    const obody = oast.program.body[0].expression.callee.body.body;
    const oTop = {}; for (const x of obody) { if (x.type === 'FunctionDeclaration') oTop[x.id.name] = x; if (x.type === 'VariableDeclaration') for (const d of x.declarations) oTop[d.id.name] = x; }
    const oLine = n => n.loc.start.line + O.s, oLineE = n => n.loc.end.line + O.s;

    const equiv = [], lineCheck = [], movedRanges = [], files = {};
    const usedL = new Set(), assignedL = new Set(), cellNames = new Set(), wrapNames = new Set();
    let cellListeners = 0, thisArgs = [];

    for (const f of FILES) {
      const src = fs.readFileSync(path.join(headDir, f), 'utf8').replace(/\r\n/g, '\n');
      const fl = src.split('\n');
      let fast;
      try { fast = parser.parse(src, { sourceType: 'script', tokens: true, ranges: true }); }
      catch (e) { return { ok: false, reason: `Parse error in ${f}` }; }
      if (!fast.program.body[0] || !fast.program.body[0].expression || !fast.program.body[0].expression.callee || !fast.program.body[0].expression.callee.body) {
         return { ok: false, reason: `Invalid cell IIFE format in ${f}` };
      }
      const cbody = fast.program.body[0].expression.callee.body.body;

      for (let i = 0; i < fl.length; i++) {
        const m = fl[i].match(/^  \/\* ---- 이전 전 index\.html (\d+)~(\d+)줄\(#[\w-]+ 생성기 표지\) ---- \*\/$/);
        if (!m) continue;
        const a = +m[1], b = +m[2];
        let j = i + 1;
        const tailMark = (fl[j] || '').match(/^  \/\* 원문 AST 끝 (\d+):(\d+) · ([A-Za-z_$][\w$]*) · 같은 줄 window 노출 보존 \*\/$/);
        let endColumn = null, tailName = null, sourceEndOk = true;
        if (tailMark) {
          endColumn = +tailMark[2]; tailName = tailMark[3]; j++;
          const fn = oTop[tailName], nx = fn && obody[obody.indexOf(fn) + 1], e = nx && nx.type === 'ExpressionStatement' && nx.expression;
          sourceEndOk = !originalIife.scope.hasOwnBinding('window') && CFG.cells.some(c => c.file === f && c.take.some(t => t.preserveWindowSuffix === true && (t.all || (t.names || []).includes(tailName))))
            && !!fn && fn.type === 'FunctionDeclaration' && fn.loc.start.line !== fn.loc.end.line && +tailMark[1] === b && oLineE(fn) === b && fn.loc.end.column === endColumn && O.lines[b - 1].slice(0, endColumn).trim() === '}'
            && !!nx && oLine(nx) === b && oLineE(nx) === b && !!e && e.type === 'AssignmentExpression' && e.operator === '=' && e.left.type === 'MemberExpression' && !e.left.computed && e.left.object.type === 'Identifier' && e.left.object.name === 'window' && e.left.property.name === tailName && e.right.type === 'Identifier' && e.right.name === tailName
            && new RegExp('^[ \\t]+window\\.' + tailName.replace(/\$/g, '\\$') + '[ \\t]*=[ \\t]*' + tailName.replace(/\$/g, '\\$') + '[ \\t]*;[ \\t]*(?://.*)?$').test(O.lines[b - 1].slice(endColumn));
        }
        let wrap = null;
        const w = (fl[j] || '').match(/^  function (\w+)\(\) \{ \/\* \[#[\w-]+\] 로드 중 문/);
        if (w) { wrap = w[1]; j++; }
        const seg = fl.slice(j, j + (b - a + 1));
        const originalLine = k => endColumn != null && k === b - a ? O.lines[a - 1 + k].slice(0, endColumn) : O.lines[a - 1 + k];
        const diffs = []; seg.forEach((l, k) => { if (strip(l) !== originalLine(k)) diffs.push(k); });
        const closeOk = !wrap || fl[j + (b - a + 1)] === '  } /* ' + wrap + ' */';
        lineCheck.push({ file: f, origLines: [a, b], wrap, diffLines: diffs.length, closeOk, firstDiff: diffs.length ? { neu: seg[diffs[0]], orig: originalLine(diffs[0]) } : null, ...(tailMark ? { sourceEndColumn: endColumn, sourceEndOk: sourceEndOk && !wrap } : {}) });
        movedRanges.push({ a, b, wrap, file: f, ...(tailMark ? { endColumn, tailName } : {}) });
      }

      for (const st of cbody) {
        if (st.type === 'FunctionDeclaration') {
          const n = st.id.name;
          const fnToks = norm(fast.tokens.filter(t => t.start >= st.start && t.end <= st.end));
          if (wrapNames.has(n) || movedRanges.some(r => r.wrap === n && r.file === f)) {
            wrapNames.add(n); cellNames.add(n);
            const r = movedRanges.find(x => x.wrap === n && x.file === f);
            if (!r) continue;
            const inner = st.body.body;
            const os = obody.filter(x => oLine(x) >= r.a && oLineE(x) <= r.b);
            const a_toks = norm(oast.tokens.filter(t => os.length && t.start >= os[0].start && t.end <= os[os.length - 1].end));
            const b_toks = norm(fast.tokens.filter(t => inner.length && t.start >= inner[0].start && t.end <= inner[inner.length - 1].end));
            equiv.push({ name: n, file: f, kind: 'wrap', stmts: os.length + '/' + inner.length, tokensOrig: a_toks.length, tokensNew: b_toks.length, same: os.length === inner.length && same(a_toks, b_toks) });
            continue;
          }
          cellNames.add(n);
          const o = oTop[n];
          const a_toks = o ? norm(oast.tokens.filter(t => t.start >= o.start && t.end <= o.end)) : [];
          equiv.push({ name: n, file: f, kind: 'function', tokensOrig: a_toks.length, tokensNew: fnToks.length, same: !!o && same(a_toks, fnToks) });
        } else if (st.type === 'VariableDeclaration' && !st.declarations.some(d => d.id.name === 'L' || d.id.name === 'K')) {
          const n = st.declarations[0].id.name; cellNames.add(n);
          const o = oTop[n];
          const a_toks = o ? norm(oast.tokens.filter(t => t.start >= o.start && t.end <= o.end)) : [];
          const b_toks = norm(fast.tokens.filter(t => t.start >= st.start && t.end <= st.end));
          equiv.push({ name: n, file: f, kind: 'var', tokensOrig: a_toks.length, tokensNew: b_toks.length, same: !!o && same(a_toks, b_toks) });
        }
      }

      const leaks = new Set(), globals = new Set();
      traverse(fast, {
        Identifier(p) {
          const par = p.parent;
          if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
            if (par.object.type === 'Identifier' && par.object.name === 'L') {
              usedL.add(p.node.name);
              const gp = p.parentPath.parentPath;
              if ((gp.isAssignmentExpression() && gp.node.left === par) || gp.isUpdateExpression()) assignedL.add(p.node.name);
            }
            return;
          }
          if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
          if (p.parentPath.isObjectMethod() && par.key === p.node) return;
          if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
          if (p.scope.getBinding(p.node.name)) return;
          globals.add(p.node.name);
        },
        CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'addEventListener') cellListeners++; },
        AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) cellListeners++; },
      });
      traverse(fast, { FunctionDeclaration(fp) {
        if (!cbody.includes(fp.node) || wrapNames.has(fp.node.id.name)) return;
        let bad = 0;
        fp.get('body').traverse({ Function(q) { if (!q.isArrowFunctionExpression()) q.skip(); }, ThisExpression() { bad++; }, Identifier(q) { if (q.node.name === 'arguments' && q.isReferencedIdentifier()) bad++; } });
        if (bad) thisArgs.push(fp.node.id.name);
      } });
      files[f] = { lines: fl.length - 1, globals: [...globals].sort(), leaks };
    }

    let N;
    try { N = iifeOf(path.join(headDir, 'index.html')); } catch(e) { return { ok: false, reason: e.message }; }
    
    let nast;
    try { nast = parser.parse(N.code, { sourceType: 'script', tokens: true, ranges: true }); }
    catch(e) { return { ok: false, reason: 'Parse error in head index.html' }; }

    let iife; traverse(nast, { FunctionExpression(p) { if (!iife) iife = p; } });
    if (!iife) return { ok: false, reason: 'No new IIFE found in head index.html' };
    const iifeNames = new Set(Object.keys(iife.scope.bindings));
    for (const f of FILES) { files[f].leaksIIFEName = files[f].globals.filter(n => iifeNames.has(n)); delete files[f].leaks; }

    const slotLines = (ls, slot) => {
      const set = new Set();
      const ANCHOR = '  /* [어려움 이음매 자리 ';
      const i = ls.findIndex(l => l.startsWith(ANCHOR + slot + ' ') || l.startsWith(ANCHOR + slot + ']'));
      if (i < 0) return set;
      for (let j = i + 1; j < ls.length && !ls[j].startsWith(ANCHOR) && ls[j].trim() !== ''; j++) set.add(j + 1);
      return set;
    };
    const seamLine = slotLines(N.lines, CFG.slot);
    N.lines.forEach((l, i) => { if (l.includes('[' + TAG + ']')) seamLine.add(i + 1); });

    const preservedTails = movedRanges.filter(r => r.endColumn != null).map(r => {
      const prefix = '  /* [' + TAG + '] ' + r.tailName + ' → ' + r.file + ' 로 옮김(';
      const found = N.lines.map((line, i) => ({ line, i })).filter(x => x.line.startsWith(prefix));
      const expected = O.lines[r.b - 1].slice(r.endColumn);
      
      const actual = found.length === 1 ? found[0].line.slice(found[0].line.indexOf('*/') + 2) : null;
      const countExports = root => { let count = 0; traverse(root, { AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && l.object.type === 'Identifier' && l.object.name === 'window' && ((!l.computed && l.property.name === r.tailName) || (l.computed && l.property.type === 'StringLiteral' && l.property.value === r.tailName))) count++; } }); return count; };
      const occurrences = { original: countExports(oast), generated: countExports(nast) };
      return { file: r.file, function: r.tailName, originalEnd: [r.b, r.endColumn], generatedLine: found.length === 1 ? found[0].i + 1 : null, matches: found.length, suffixSame: actual === expected, occurrences, occurrencesSame: occurrences.original === 1 && occurrences.generated === 1 };
    });

    const origSlot = slotLines(O.lines, CFG.slot);
    const isCode = t => typeof t.type !== 'string';
    const origKeepTokens = oast.tokens.filter(isCode).filter(t => { const l = t.loc.start.line + O.s; return !origSlot.has(l) && !movedRanges.some(r => l >= r.a && l <= r.b && (r.endColumn == null || l < r.b || t.loc.end.column <= r.endColumn)); });
    const isExcluded = t => { for (const ex of excludedNodes) { if (t.start >= ex.start && t.end <= ex.end) return true; } return false; };
    const newKeepTokens = nast.tokens.filter(isCode).filter(t => !isExcluded(t));
    const origKeep = origKeepTokens.map(tokVal), newKeep = newKeepTokens.map(tokVal);

    const allConfigNames = new Set();
    for (const c of config.cells) for (const t of c.take) for (const n of t.names || []) allConfigNames.add(n);
    for (const n of cellNames) { if (!allConfigNames.has(n)) return { ok: false, reason: "Config missing function in cell: " + n }; }
    for (const n of allConfigNames) { if (!cellNames.has(n)) return { ok: false, reason: "Config specifies function not in cell: " + n }; }
    for (const tail of preservedTails) {
      const fn = oTop[tail.function], oldExport = obody[obody.indexOf(fn) + 1];
      const newExport = nast.program.body[0].expression.callee.body.body.find(n => n.type === 'ExpressionStatement' && n.loc.start.line + N.s === tail.generatedLine);
      tail.restPosition = { original: oldExport ? origKeepTokens.findIndex(t => t.start === oldExport.start) : -1, generated: newExport ? newKeepTokens.findIndex(t => t.start === newExport.start) : -1 };
      tail.sameRestPosition = tail.restPosition.original >= 0 && tail.restPosition.original === tail.restPosition.generated;
    }
    let restDiff = -1; for (let i = 0; i < Math.max(origKeep.length, newKeep.length); i++) if (origKeep[i] !== newKeep[i]) { restDiff = i; break; }
    const restSame = restDiff < 0;

    const getters = new Set(), setters = new Set(), imported = new Set();
    const kitVars = new Set(CFG.cells.map(c => c.kitVar));
    iife.traverse({
      CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) { if (pr.kind === 'get') getters.add(pr.key.name); if (pr.kind === 'set') setters.add(pr.key.name); } },
      VariableDeclarator(p) { const i = p.node.init; if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && kitVars.has(i.object.name)) imported.add(p.node.id.name); },
    });

    const kitDeclAt = {}, importAt = [];
    iife.traverse({ VariableDeclarator(p) { const i = p.node.init, id = p.node.id.name; if (kitVars.has(id) && i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && i.object.name === 'window') kitDeclAt[id] = Math.min(kitDeclAt[id] == null ? Infinity : kitDeclAt[id], p.node.start); if (i && i.type === 'MemberExpression' && i.object.type === 'Identifier' && kitVars.has(i.object.name)) importAt.push({ name: id, kit: i.object.name, start: p.node.start, line: p.node.loc.start.line + N.s }); } });
    const importBeforeKit = importAt.filter(x => !(kitDeclAt[x.kit] < x.start)).map(x => x.name + '@' + x.line + '(' + x.kit + ')');
    const leftDefs = [...cellNames].filter(n => { const b = iife.scope.bindings[n]; return b && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && !imported.has(n))); });
    const usedInIndexNotImported = [];
    iife.traverse({ Identifier(p) {
      const nm = p.node.name; if (!cellNames.has(nm) || !p.isReferencedIdentifier()) return;
      const par = p.parent; if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) return;
      const b = p.scope.getBinding(nm);
      if (!b || (b.scope === iife.scope && !imported.has(nm))) usedInIndexNotImported.push(nm + '@' + (p.node.loc.start.line + N.s));
    } });
    const notExposed = [...usedL].filter(n => !getters.has(n)).sort();
    const noSetter = [...assignedL].filter(n => !setters.has(n)).sort();

    const lastGetterNoSetter = [...assignedL].filter(n => { const g = 'get ' + n + '()'; let last = -1; N.lines.forEach((l, j) => { const at = l.indexOf(g); if (at >= 0 && !/[\w$]/.test(l[at - 1] || '')) last = j; }); return last >= 0 && !N.lines[last].includes('set ' + n + '(v)'); }).sort();
    const countL = (astRoot) => { let c = 0; traverse(astRoot, { CallExpression(p) { const x = p.node.callee; if (x.type === 'MemberExpression' && !x.computed && x.property.name === 'addEventListener') c++; }, AssignmentExpression(p) { const l = p.node.left; if (l.type === 'MemberExpression' && !l.computed && /^on[a-z]+$/.test(l.property.name)) c++; } }); return c; };
    const listeners = { origIIFE: countL(oast), newIIFE: countL(nast), cells: cellListeners };
    listeners.same = listeners.origIIFE === listeners.newIIFE + listeners.cells;

    const callLines = N.lines.map((l, i) => ({ l, i })).filter(x => /^  (\w+)\(\); \/\* \[#[\w-]+\] 로드 중 문/.test(x.l)).map(x => ({ line: x.i + 1, fn: x.l.trim().split('(')[0] }));
    const callsOk = [...wrapNames].every(n => callLines.filter(c => c.fn === n).length === 1);

    const report = {
      equivalent: equiv.length > 0 && equiv.every(r => r.same), equiv, lineCheck, restSame, restDiff: restSame ? null : { i: restDiff, orig: origKeep.slice(restDiff - 3, restDiff + 6), neu: newKeep.slice(restDiff - 3, restDiff + 6) },
      tokens: { origRest: origKeep.length, newRest: newKeep.length },
      imported: [...imported].sort(), leftDefsInIndex: leftDefs, usedInIndexNotImported, usedL: [...usedL].sort(), notExposed, assignedL: [...assignedL].sort(), noSetter,
      thisArgs, listeners, wrapCalls: callLines, callsOk, importBeforeKit, lastGetterNoSetter, files,
    };
    if (preservedTails.length) report.preservedTails = preservedTails;

    const ok = report.equivalent && lineCheck.length > 0 && lineCheck.every(x => x.diffLines === 0 && x.closeOk && x.sourceEndOk !== false) 
      && preservedTails.every(x => x.suffixSame && x.occurrencesSame && x.sameRestPosition) && restSame && leftDefs.length === 0 && usedInIndexNotImported.length === 0
      && notExposed.length === 0 && noSetter.length === 0 && thisArgs.length === 0 && listeners.same && callsOk && importBeforeKit.length === 0 && lastGetterNoSetter.length === 0
      && Object.values(files).every(x => x.leaksIIFEName.length === 0 && x.lines <= 800);

    if (!ok) {
      let failReason = 'Validation failed';
      if (!report.equivalent) failReason = 'equivalent tokens mismatch';
      else if (!lineCheck.length) failReason = 'lineCheck empty';
      else if (!lineCheck.every(x => x.diffLines === 0)) failReason = 'lineCheck diff';
      else if (!restSame) failReason = 'restSame failed (residual tokens mismatch)';
      else if (leftDefs.length > 0 || usedInIndexNotImported.length > 0 || notExposed.length > 0 || noSetter.length > 0 || thisArgs.length > 0) failReason = 'leak or unexposed vars';
      else if (!listeners.same) failReason = 'listeners.same mismatch';
      else if (Object.values(files).some(x => x.leaksIIFEName.length > 0)) failReason = 'leak IIFE name';
      
      return { ok: false, reason: failReason, details: report };
    }
    
    return { ok: true, details: report };
  } catch (err) {
    return { ok: false, reason: 'Exception: ' + err.message };
  }
}

module.exports = { recomputeSplit };
