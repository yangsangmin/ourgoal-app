'use strict';
const fs = require('fs'), path = require('path');
// 이미 저장소에 있는 공개 라이브러리를 도구가 기대하는 임시 자리로 복사한다. 원시 측정에 해당 SHA가 있다.
const root = path.resolve(__dirname, '../../..'), dir = path.join(__dirname, 'browser/after');
fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
fs.copyFileSync(path.join(root, 'court/vendor/supabase-js-2.115.0.umd.js'), path.join(dir, 'lib/supabase-js-cdn-at2.js'));
console.log('prepared browser library from existing court/vendor; no download');
