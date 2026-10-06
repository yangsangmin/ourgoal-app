'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const digest = value => sha(JSON.stringify(value));
const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requiredNegativeCases = ['full-dom','feature-dom','ls-value','ls-added','ls-deleted','ss-value','pageerror','console-content','toast','completion','required-step','base2-only','function-entry','postcondition','raw-sha'];
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!object(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
}
const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function safeFile(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw Error('RELATIVE_PATH_REQUIRED');
  const realRoot = fs.realpathSync(root), candidate = fs.realpathSync(path.resolve(realRoot, relative));
  const rel = path.relative(realRoot, candidate);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw Error('ROOT_ESCAPE');
  if (!fs.statSync(candidate).isFile()) throw Error('FILE_REQUIRED');
  return candidate;
}
function read(root, relative, expected) {
  const bytes = fs.readFileSync(safeFile(root, relative));
  if (!isHash(expected) || sha(bytes) !== expected) throw Error('RAW_SHA_MISMATCH');
  return {value:JSON.parse(bytes.toString('utf8')), sha256:sha(bytes), bytes:bytes.length};
}
function codeHash() {
  return digest(['common.js','preflight.js','dynamic-contract.js','compare.js','cli.js'].map(p => ({path:p,sha256:sha(fs.readFileSync(path.join(__dirname,p)))})));
}
module.exports = {fs,path,sha,digest,isHash,object,equal,canonical,safeFile,read,codeHash,requiredNegativeCases};
