'use strict';
// ES-199 사건 증거 수집기.
// 왜 있는가: 조사 산출물은 세션 임시 폴더(scratchpad)에 있었고 그 폴더는 사라진다. 사라지기 전에 핵심만 저장소로 옮긴다.
// 왜 스크립트인가: 손으로 복사하면 "무엇을 어디서 가져왔는지"가 남지 않는다. 출처·크기·sha256 을 MANIFEST.json 에 남겨
//                  나중에 사본이 바뀌었는지 누구나 대조할 수 있게 한다.
// 쓰는 법: node docs/audits/2026-09-21-ES-199/tools/collect-evidence.js <scratchpad 폴더>
// 하지 않는 것: PNG 복사(용량·화면 속 개인정보), 비밀값처럼 생긴 문자열이 든 파일 복사, 저장소 상태 변경.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const AUDIT_DIR = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(AUDIT_DIR, 'evidence');
const HEAD_COMMIT = '1c61f5f'; // ES-199 작업 커밋(법정 심사 대상). 이 PC 에만 있다.

// 옮길 파일 목록: [scratchpad 기준 경로, evidence 기준 경로, 무엇인가]
const LIST = [
  ['classify118.md', 'classify118.md', '118개 검사가 실제로 무엇을 보는지 분류한 표'],
  ['classify118.json', 'classify118.json', '위 분류의 원자료(성적표 생성기의 입력)'],
  ['fakerepo118.out.txt', 'fakerepo118.out.txt', '주석뿐인 가짜 저장소에 검증기를 돌린 출력'],
  ['commentonly118.out.txt', 'commentonly118.out.txt', '수정 전 코드에 주석 4개만 넣고 검증기를 돌린 출력'],
  ['es199/ab_runtime_result.json', 'es199/ab_runtime_result.json', '수정 전·후 앱을 실제로 띄워 비교한 결과 1'],
  ['es199/ab_runtime2_result.json', 'es199/ab_runtime2_result.json', '수정 전·후 앱을 실제로 띄워 비교한 결과 2(진짜 뒤로가기)'],
  ['es199/png_sha256.txt', 'es199/png_sha256.txt', '증거 캡처 31장의 지문(이름만 다른 같은 파일 찾기)'],
  ['es199/provenance_out.json', 'es199/provenance_out.json', '보고서 수치가 도구 출력에 있었는지 집계'],
  ['clicks_probe.json', 'clicks_probe.json', '버튼 검증기에 죽은 버튼을 넣어 본 시험'],
  ['classifygate.md', 'classifygate.md', '기존 게이트 37개 검사 분류'],
  ['merged-prs-100.json', 'merged-prs-100.json', '최근 병합 PR 100건 원자료'],
  ['critic_agy_vercel_scan.out.json', 'critic_agy_vercel_scan.out.json', '작업 로그에서 찾은 운영 서버 직접 배포 기록'],
  ['es199-verdict-final/REPORT.md', 'es199-verdict-final/REPORT.md', '법정이 ES-199 를 심사한 판정서'],
  ['es199-verdict-final/verdict.json', 'es199-verdict-final/verdict.json', '위 판정서의 원자료'],
];

// 비밀값처럼 생긴 문자열. 하나라도 걸리면 그 파일은 옮기지 않는다(이메일 주소는 여기서 막지 않고 목록만 보고한다).
const SECRET_SHAPES = [
  ['JWT', /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ['GitHub 토큰', /gh[pousr]_[A-Za-z0-9]{20,}/],
  ['API 키(sk-)', /sk-[A-Za-z0-9]{20,}/],
  ['AWS 키', /AKIA[0-9A-Z]{16}/],
  ['Bearer 토큰', /Bearer [A-Za-z0-9._-]{20,}/],
  ['Slack 토큰', /xox[bap]-[A-Za-z0-9-]{10,}/],
  ['개인키', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['전화번호', /01[016789]-?\d{3,4}-?\d{4}/],
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g;

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function median(sorted) {
  const n = sorted.length;
  if (!n) return null;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

// PR 100건 집계. 원자료가 있어도 요약을 따로 두는 이유: README 의 수치가 이 파일을 인용하게 하려는 것이다.
function summarizePrs(list) {
  const secs = list.map(p => Math.round((Date.parse(p.mergedAt) - Date.parse(p.createdAt)) / 1000)).sort((a, b) => a - b);
  const numbers = list.map(p => p.number).sort((a, b) => a - b);
  return {
    총건수: list.length,
    PR번호범위: [numbers[0], numbers[numbers.length - 1]],
    작성자와병합자가같음: list.filter(p => p.author && p.mergedBy && p.author.login === p.mergedBy.login).length,
    리뷰0건: list.filter(p => !p.reviews || p.reviews.length === 0).length,
    작성자로그인: [...new Set(list.map(p => p.author && p.author.login))],
    병합자로그인: [...new Set(list.map(p => p.mergedBy && p.mergedBy.login))],
    생성에서병합까지_초: { 중앙값: median(secs), 최소: secs[0], 최대: secs[secs.length - 1], '60초미만': secs.filter(s => s < 60).length, '60초이하': secs.filter(s => s <= 60).length },
    가장이른생성: list.map(p => p.createdAt).sort()[0],
    가장늦은병합: list.map(p => p.mergedAt).sort().slice(-1)[0],
  };
}

function main() {
  const scratch = process.argv[2];
  if (!scratch || !fs.existsSync(scratch)) {
    console.error('쓰는 법: node collect-evidence.js <scratchpad 폴더>  (폴더가 없으면 아무것도 하지 않는다)');
    process.exit(2);
  }
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const manifest = { 만든도구: 'tools/collect-evidence.js', 수집시각: new Date().toISOString(), 원본폴더: path.resolve(scratch).replace(/\\/g, '/'), 파일: [], 없음: [], 옮기지않음: [], 이메일주소가든파일: [] };

  for (const [from, to, what] of LIST) {
    const src = path.join(scratch, from);
    if (/\.png$/i.test(from)) { manifest.옮기지않음.push({ 파일: from, 이유: 'PNG 는 옮기지 않는다' }); continue; }
    if (!fs.existsSync(src)) { manifest.없음.push(from); console.log('없음      ' + from); continue; }
    const buf = fs.readFileSync(src);
    const text = buf.toString('utf8');
    const hit = SECRET_SHAPES.find(([, re]) => re.test(text));
    if (hit) { manifest.옮기지않음.push({ 파일: from, 이유: '비밀값처럼 생긴 문자열(' + hit[0] + ')' }); console.log('옮기지않음 ' + from + ' — ' + hit[0]); continue; }
    const emails = [...new Set(text.match(EMAIL) || [])];
    if (emails.length) manifest.이메일주소가든파일.push({ 파일: to, 개수: emails.length });
    const dest = path.join(EVIDENCE_DIR, to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf); // 바이트 그대로 옮긴다(줄바꿈·인코딩을 건드리면 지문이 달라진다)
    manifest.파일.push({ 경로: to, 무엇: what, 원본: from, 바이트: buf.length, sha256: sha256(buf) });
    console.log('옮김      ' + to + ' (' + buf.length + 'B)');
  }

  // 파생 1: PR 100건 집계
  const prs = path.join(EVIDENCE_DIR, 'merged-prs-100.json');
  if (fs.existsSync(prs)) {
    const out = Buffer.from(JSON.stringify(summarizePrs(JSON.parse(fs.readFileSync(prs, 'utf8'))), null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'merged-prs-100.summary.json'), out);
    manifest.파일.push({ 경로: 'merged-prs-100.summary.json', 무엇: 'PR 100건 집계(이 도구가 계산)', 원본: 'merged-prs-100.json', 바이트: out.length, sha256: sha256(out) });
    console.log('만듦      merged-prs-100.summary.json');
  }

  // 파생 2: 작업 커밋에 실제로 들어 있는 파일 목록.
  // 왜: 118 검증기는 커밋이 아니라 작업 폴더를 봤다. "검사가 읽은 파일이 커밋에 있기는 한가"를 성적표가 따질 수 있게 한다.
  try {
    const top = execFileSync('git', ['-C', AUDIT_DIR, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const sha = execFileSync('git', ['-C', top, 'rev-parse', '--verify', '--quiet', HEAD_COMMIT + '^{commit}'], { encoding: 'utf8' }).trim();
    const tree = execFileSync('git', ['-C', top, '-c', 'core.quotepath=false', 'ls-tree', '-r', '--name-only', sha], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const out = Buffer.from('# git ls-tree -r --name-only ' + sha + '\n' + tree, 'utf8');
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'tree-' + HEAD_COMMIT + '.txt'), out);
    manifest.파일.push({ 경로: 'tree-' + HEAD_COMMIT + '.txt', 무엇: '작업 커밋에 들어 있는 파일 목록(이 도구가 git 에서 읽음)', 원본: 'git ls-tree ' + sha, 바이트: out.length, sha256: sha256(out) });
    console.log('만듦      tree-' + HEAD_COMMIT + '.txt (' + tree.split('\n').filter(Boolean).length + '개 파일)');
  } catch (e) {
    manifest.없음.push('tree-' + HEAD_COMMIT + '.txt (이 PC 에 커밋 ' + HEAD_COMMIT + ' 이 없어 만들지 못함)');
    console.log('못 만듦   tree-' + HEAD_COMMIT + '.txt — 커밋이 없다');
  }

  fs.writeFileSync(path.join(EVIDENCE_DIR, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('\n옮김·만듦 ' + manifest.파일.length + '개 / 없음 ' + manifest.없음.length + '개 / 옮기지않음 ' + manifest.옮기지않음.length + '개 / 이메일 주소가 든 파일 ' + manifest.이메일주소가든파일.length + '개');
  process.exit(manifest.없음.length || manifest.옮기지않음.length ? 1 : 0);
}

main();
