'use strict';
// 법정(court) — 주석 제거기. "주석에 글자만 적어 넣어도 통과"를 막기 위해, 글자 확인(L1)은 주석을 걷어낸 코드에만 한다.
// 완전한 파서는 아니다. 문자열·템플릿·정규식 리터럴을 건너뛰며 // 와 /* */ 를 공백으로 바꾼다(줄 번호 보존).

function stripJsComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let lastSignificant = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && d === '*') {
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; }
      if (i < n) { out += '  '; i += 2; }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; out += c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; continue; }
        if (q !== '`' && src[i] === '\n') break;
        out += src[i]; i++;
      }
      if (i < n && src[i] === q) { out += q; i++; }
      lastSignificant = q;
      continue;
    }
    if (c === '/' && /[=(,;:!&|?{}\[\n+\-*%<>~^]|^$/.test(lastSignificant)) {
      // 정규식 리터럴로 본다
      out += c; i++;
      let inClass = false;
      while (i < n && src[i] !== '\n') {
        if (src[i] === '\\' && i + 1 < n) { out += src[i] + src[i + 1]; i += 2; continue; }
        if (src[i] === '[') inClass = true; else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
        out += src[i]; i++;
      }
      if (i < n && src[i] === '/') { out += '/'; i++; }
      lastSignificant = '/';
      continue;
    }
    out += c;
    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }
  return out;
}

function stripHtmlComments(src) { return src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' ')); }
function stripCssComments(src) { return src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')); }

// HTML 은 주석을 지운 뒤 <script> 블록 안의 JS 주석도 지운다.
function stripHtmlAll(src) {
  const noHtml = stripHtmlComments(src);
  return noHtml.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + stripJsComments(body) + close)
    .replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, open, body, close) => open + stripCssComments(body) + close);
}

function stripByExt(filePath, src) {
  const p = filePath.toLowerCase();
  if (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs')) return stripJsComments(src);
  if (p.endsWith('.html') || p.endsWith('.htm')) return stripHtmlAll(src);
  if (p.endsWith('.css')) return stripCssComments(src);
  return src;
}

module.exports = { stripJsComments, stripHtmlComments, stripCssComments, stripHtmlAll, stripByExt };
