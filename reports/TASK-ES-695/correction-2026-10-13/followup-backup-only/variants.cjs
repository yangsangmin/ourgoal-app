'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const file = path.resolve(__dirname, '../../../../js/core/local-keep.js');
const uid = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const b = 'ourgoal_records_backup_' + uid, k = 'ourgoal_records_kept_' + uid;
const rich = { id: 'same', type: 'note', text: 'device-text', photo: 'unique-old-photo', feedback: 'unique-old-feedback', notionDb: { name: 'old-structure' }, energy: 60, focus: 40 };
const fresh = () => { delete require.cache[require.resolve(file)]; return require(file); };
const store = () => { const data = {}, reads = [], writes = []; return { data, reads, writes, getItem(key) { reads.push(key); return Object.hasOwn(data, key) ? data[key] : null; }, setItem(key, value) { writes.push(key); data[key] = String(value); }, removeItem(key) { delete data[key]; } }; };
const rows = [];
function test(name, fn) { try { rows.push({ name, assertionsHeld: true, result: fn() }); } catch(e) { rows.push({ name, assertionsHeld: false, error: e.stack }); } }
function baseline() { const K = fresh(), s = store(); s.data[b] = JSON.stringify([rich]); return { K, s }; }
function kept(s) { return s.data[k] ? JSON.parse(s.data[k]).items : []; }
test('same id and body: enrich only serialized device copy; input identity/content unchanged', () => {
  const {K,s} = baseline(), list = [{ id: 'same', type: 'note', text: 'device-text' }], beforeInput = JSON.stringify(list);
  assert.strictEqual(K.setBackupFromSave('records', uid, list, s), true);
  const r = JSON.parse(s.data[b])[0]; assert.strictEqual(r.photo, rich.photo); assert.strictEqual(r.feedback, rich.feedback); assert.strictEqual(r.energy,60); assert.strictEqual(r.focus,40); assert.strictEqual(JSON.stringify(list), beforeInput);
  return { backup: r, input: list, kept: kept(s) };
});
test('different body: never attach old feedback/structure; retain them with old body', () => {
  const {K,s} = baseline(), list = [{ id:'same',type:'note',text:'new-body' }];
  K.setBackupFromSave('records', uid, list, s); const r=JSON.parse(s.data[b])[0];
  assert.strictEqual(r.text,'new-body'); assert.strictEqual(r.feedback,undefined); assert.strictEqual(r.notionDb,undefined); assert.strictEqual(r.photo,rich.photo);
  const e=kept(s).find(x=>x.why==='text-differs'); assert.ok(e); assert.strictEqual(e.item.text,rich.text); assert.strictEqual(e.item.feedback,rich.feedback);
  return { backup:r, kept:kept(s) };
});
test('different photo and feedback: incoming meaning wins; old values are hidden preserved', () => {
  const {K,s}=baseline(), list=[{id:'same',text:'device-text',photo:'new-photo',feedback:'new-feedback'}];
  K.setBackupFromSave('records',uid,list,s); const r=JSON.parse(s.data[b])[0]; assert.strictEqual(r.photo,'new-photo'); assert.strictEqual(r.feedback,'new-feedback');
  assert.ok(s.data[k].includes(rich.photo) && s.data[k].includes(rich.feedback)); return { backup:r, kept:kept(s) };
});
for(const value of [null, undefined, '']) test('explicit clear '+String(value)+': do not resurrect old photo/feedback in backup',()=>{
  const {K,s}=baseline(), list=[{id:'same',text:'device-text',photo:value,feedback:value}];
  K.setBackupFromSave('records',uid,list,s);const r=JSON.parse(s.data[b])[0];assert.strictEqual(r.photo,value);assert.strictEqual(r.feedback,value);
  assert.ok(s.data[k].includes(rich.photo) && s.data[k].includes(rich.feedback));return {backup:r,kept:kept(s)};
});
test('foreign marked backup: do not attach into current account',()=>{
  const {K,s}=baseline();s.data[b]=JSON.stringify([{...rich,user_id:other}]);const input=[{id:'same',text:rich.text}];K.setBackupFromSave('records',uid,input,s);const r=JSON.parse(s.data[b])[0];
  assert.strictEqual(r.photo,undefined);assert.strictEqual(r.feedback,undefined);assert.strictEqual(input[0].photo,undefined);return {backup:r,kept:kept(s)};
});
test('other account key: never read or write it',()=>{
  const K=fresh(),s=store(),ob='ourgoal_records_backup_'+other;s.data[ob]=JSON.stringify([rich]);K.setBackupFromSave('records',uid,[{id:'same',text:rich.text}],s);const r=JSON.parse(s.data[b])[0];
  assert.strictEqual(r.photo,undefined);assert.ok(!s.reads.includes(ob)&&!s.writes.includes(ob));assert.strictEqual(s.data[ob],JSON.stringify([rich]));return {backup:r,readKeys:s.reads,writtenKeys:s.writes};
});
test('trash deletion: no record id or metadata reintroduced',()=>{
  const {K,s}=baseline();s.data['ourgoal_trash_backup_'+uid]=JSON.stringify([{entityType:'record',originalId:'same'}]);K.setBackupFromSave('records',uid,[],s);assert.deepStrictEqual(JSON.parse(s.data[b]),[]);assert.strictEqual(kept(s).length,0);
  K.setBackupFromSave('records',uid,[{id:'same',text:rich.text}],s);assert.strictEqual(JSON.parse(s.data[b])[0].photo,undefined);return {backup:JSON.parse(s.data[b]),kept:kept(s)};
});
test('trash read exception: do not treat deletion state as empty and reattach',()=>{
  const {K,s}=baseline(),before=s.data[b],get=s.getItem;
  s.getItem=key=>{if(key==='ourgoal_trash_backup_'+uid)throw Error('read denied');return get(key);};
  assert.throws(()=>K.setBackupFromSave('records',uid,[{id:'same',text:rich.text}],s));assert.strictEqual(s.data[b],before);return{backupUnchanged:true};
});
test('kept-only deleted copy: saving does not silently restore it',()=>{
  const K=fresh(),s=store();s.data[b]='[]';s.data[k]=JSON.stringify({v:1,items:[{why:'not-in-server-response',item:rich,fp:'source'}]});K.setBackupFromSave('records',uid,[{id:'same',text:rich.text}],s);const r=JSON.parse(s.data[b])[0];assert.strictEqual(r.photo,undefined);assert.strictEqual(r.feedback,undefined);return {backup:r,kept:kept(s)};
});
test('preservation failure on new-body save: keep original, including next save',()=>{
  const {K,s}=baseline(),before=s.data[b],set=s.setItem;s.setItem=(key,v)=>{if(key===k)throw Error('quota');set(key,v);};
  const input=[{id:'same',text:'new-body'}];assert.throws(()=>K.setBackupFromSave('records',uid,input,s));assert.strictEqual(s.data[b],before);assert.strictEqual(K.setBackupFromSave('records',uid,input,s),false);assert.strictEqual(s.data[b],before);return {originalUnchanged:true,input,writes:s.writes};
});
test('unreadable backup: preserve raw before normal save replaces it',()=>{
  const K=fresh(),s=store();s.data[b]='UNREADABLE-UNIQUE-PHOTO';K.setBackupFromSave('records',uid,[{id:'same',text:'new'}],s);assert.ok(s.data[k].includes('UNREADABLE-UNIQUE-PHOTO'));return{backup:s.data[b],kept:kept(s)};
});
test('missing record id: archive; do not insert it into page or outgoing backup',()=>{
  const {K,s}=baseline();const input=[{id:'new-id',text:'new'}];K.setBackupFromSave('records',uid,input,s);assert.deepStrictEqual(JSON.parse(s.data[b]).map(r=>r.id),['new-id']);assert.deepStrictEqual(input.map(r=>r.id),['new-id']);assert.ok(s.data[k].includes(rich.photo));return{backup:JSON.parse(s.data[b]),kept:kept(s)};
});
test('goal extra field: preserve raw hidden; do not reattach into visible object',()=>{
  const K=fresh(),s=store(),gb='ourgoal_goals_backup_'+uid,gk='ourgoal_goals_kept_'+uid; s.data[gb]=JSON.stringify([{id:'g',title:'goal',startDate:'unique-start'}]);const input=[{id:'g',title:'goal'}];K.setBackupFromSave('goals',uid,input,s);assert.strictEqual(JSON.parse(s.data[gb])[0].startDate,undefined);assert.ok(s.data[gk].includes('unique-start'));assert.strictEqual(input[0].startDate,undefined);return{backup:JSON.parse(s.data[gb]),kept:JSON.parse(s.data[gk])};
});
const output={total:rows.length,assertionsNotHeld:rows.filter(x=>!x.assertionsHeld).length,rows,scope:'product module; simulated store; not actual deletion UX, operating requests 0',notFullConditionFour:true};
fs.writeFileSync(path.join(__dirname,'variants.json'),JSON.stringify(output,null,2)+'\n','utf8');console.log(JSON.stringify({total:output.total,assertionsNotHeld:output.assertionsNotHeld,errors:rows.filter(x=>!x.assertionsHeld)}));process.exitCode=output.assertionsNotHeld?1:0;
