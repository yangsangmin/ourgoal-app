#!/usr/bin/env node
/*
 * Claude Code PostToolUse 훅: Edit/Write가 index.html을 건드렸을 때만 스모크 테스트를 실행한다.
 * 통과하면 종료 코드 0(한 줄 요약), 실패하면 종료 코드 2(실패 내용을 Claude에게 피드백).
 * 다른 파일 수정에는 아무 일도 하지 않는다.
 *
 * 등록 방법 — .claude/settings.json 에 아래 블록을 추가한다 (Claude Code 자동 모드는 설정 파일 수정을
 * 차단하므로 사용자가 직접 넣는다):
 *   "hooks": {
 *     "PostToolUse": [
 *       { "matcher": "Edit|Write|MultiEdit",
 *         "hooks": [ { "type": "command", "command": "node scripts/hook-smoke-on-index.js", "timeout": 60 } ] }
 *     ]
 *   }
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BS = String.fromCharCode(92); // 백슬래시 문자 (셸 이스케이프 문제 회피용)

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }
  const ti = input.tool_input || {};
  const fp = String(ti.file_path || ti.path || ti.notebook_path || '').split(BS).join('/');
  if (!/\/index\.html$/i.test(fp) && !/^index\.html$/i.test(fp)) process.exit(0);

  // index.html은 저장소 루트에 있으므로 그 폴더가 곧 루트(워크트리에서도 동작).
  const root = path.dirname(path.resolve(fp));
  const smoke = path.join(root, 'scripts', 'smoke-test.js');
  if (!fs.existsSync(smoke)) process.exit(0);

  try {
    const out = execFileSync(process.execPath, [smoke], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 50000
    });
    const lines = out.trim().split('\n');
    console.log('[smoke-test OK] ' + lines[lines.length - 1]);
    process.exit(0);
  } catch (err) {
    const out = ((err.stdout || '') + '\n' + (err.stderr || '')).trim().split('\n');
    const failing = out.filter(l => /✗|Error|error|failed|실패/.test(l)).slice(-25);
    console.error('[smoke-test FAILED] index.html 수정 후 스모크 테스트가 실패했습니다. 다음 수정으로 넘어가기 전에 먼저 고치세요.');
    console.error((failing.length ? failing : out.slice(-25)).join('\n'));
    process.exit(2);
  }
});
