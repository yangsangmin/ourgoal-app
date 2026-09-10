#!/usr/bin/env node
'use strict';
/**
 * 아워골 구글 플레이 2주 비공개 테스트 및 스토어 심사 준비 자동 검증기
 * 실행: node scripts/prepare-google-play.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;

function check(title, fn) {
  try {
    fn();
    console.log('  [O] ' + title);
    passed++;
  } catch (err) {
    console.error('  [X] ' + title + ' -> ' + (err && err.message ? err.message : err));
    failed++;
  }
}

console.log('=== 아워골 Google Play 출시 및 14일 비공개 테스트 규격 검증 ===');

check('manifest.json 무결성 (PWA / TWA 규격)', () => {
  const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8').replace(/^\\uFEFF/, ''));
  if (!mf.name || !mf.short_name) throw new Error('이름 누락');
  if (mf.display !== 'standalone') throw new Error('display가 standalone이 아님');
  if (!Array.isArray(mf.icons) || mf.icons.length < 2) throw new Error('아이콘 규격 2종 미달');
  for (const ic of mf.icons) {
    const p = path.join(ROOT, ic.src.replace(/^\//, ''));
    if (!fs.existsSync(p)) throw new Error('아이콘 파일 없음: ' + ic.src);
  }
});

check('capacitor.config.json 패키지 식별자 검증', () => {
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8').replace(/^\\uFEFF/, ''));
  if (c.appId !== 'com.yangbis.ourgoal') throw new Error('appId 불일치: ' + c.appId);
  if (!c.server || !c.server.url.startsWith('https://')) throw new Error('HTTPS 서버 URL 누락');
});

check('.well-known/assetlinks.json 디지털 에셋 링크 검증', () => {
  const al = JSON.parse(fs.readFileSync(path.join(ROOT, '.well-known', 'assetlinks.json'), 'utf8'));
  if (!Array.isArray(al) || !al[0].target || al[0].target.package_name !== 'com.yangbis.ourgoal') {
    throw new Error('assetlinks 패키지명 불일치');
  }
});

check('Google Play 정책 필수: 개인정보처리방침 및 이용약관 파일 실재', () => {
  if (!fs.existsSync(path.join(ROOT, 'docs', 'legal', 'privacy.md'))) throw new Error('privacy.md 없음');
  if (!fs.existsSync(path.join(ROOT, 'docs', 'legal', 'terms.md'))) throw new Error('terms.md 없음');
});

check('Google Play 정책 필수: 계정 삭제(회원 탈퇴) API/기능 구비', () => {
  if (!fs.existsSync(path.join(ROOT, 'api', 'withdraw.js'))) throw new Error('api/withdraw.js 없음');
});

check('Google Play 14일 비공개 테스트 안내 가이드 문서 실재', () => {
  if (!fs.existsSync(path.join(ROOT, 'docs', 'google-play-closed-test-guide.md'))) throw new Error('가이드 문서 누락');
});

console.log('\n검증 결과: ' + passed + '건 통과, ' + failed + '건 실패');
process.exit(failed > 0 ? 1 : 0);
