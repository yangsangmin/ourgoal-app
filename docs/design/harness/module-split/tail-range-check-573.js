'use strict';
// #TASK-ES-573 비제품 생성 도구 측정. 임시 사본의 AST/원문/출력만 비교한다. 법정 판정·제품 E2E가 아니다.
// node tail-range-check-573.js <APP_DIR> <REPORT.json> [기존 생성기 기준 ref]
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const [appArg,outArg,oldRefArg]=process.argv.slice(2),app=path.resolve(appArg),out=path.resolve(outArg);
const rel='docs/design/harness/module-split/',gen=path.join(app,rel+'gen-inline-hard.js'),verify=path.join(app,rel+'verify-inline-hard.js');
const oldRef=oldRefArg||cp.execFileSync('git',['rev-parse','HEAD'],{cwd:app,encoding:'utf8'}).trim();
const gitText=(ref,file)=>cp.execFileSync('git',['show',ref+':'+file],{cwd:app,encoding:'utf8',maxBuffer:20*1024*1024});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ourgoal-tail573-'));const cases=[],representatives=[];
const original=fs.readFileSync(path.join(app,'index.html'),'utf8').replace(/\r\n/g,'\n'),config=JSON.parse(fs.readFileSync(path.join(app,rel+'tail-profile-573.json'),'utf8'));
const oldGen=path.join(temp,'old-gen.js'),oldVerify=path.join(temp,'old-verify.js');fs.writeFileSync(oldGen,gitText(oldRef,rel+'gen-inline-hard.js'),'utf8');fs.writeFileSync(oldVerify,gitText(oldRef,rel+'verify-inline-hard.js'),'utf8');
let serial=0;
function fixture(src,cfg){const dir=path.join(temp,String(++serial));fs.mkdirSync(dir,{recursive:true});fs.cpSync(path.join(app,'js'),path.join(dir,'js'),{recursive:true});for(const f of ['scripts/smoke-test.js','tests/helpers/inline-bundle.js']){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.copyFileSync(path.join(app,f),path.join(dir,f));}fs.writeFileSync(path.join(dir,'index.html'),src,'utf8');fs.writeFileSync(path.join(dir,'original.html'),src,'utf8');fs.writeFileSync(path.join(dir,'config.json'),JSON.stringify(cfg),'utf8');return dir;}
function run(tool,args,dir){return cp.spawnSync(process.execPath,[tool,...args],{cwd:app,encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,MODULE_SPLIT_OUT:dir}});}
function generate(dir,tool=gen){return run(tool,[dir,path.join(dir,'config.json'),path.join(dir,'original.html')],dir);}
function inspect(dir,tool=verify){const r=run(tool,[path.join(dir,'original.html'),dir,path.join(dir,'config.json')],dir);const f=path.join(dir,'verify-inline-hard.json');return {exit:r.status,report:fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null,stderr:r.stderr};}
function cloneCfg(){return JSON.parse(JSON.stringify(config));}
function blocked(name,change,changeCfg){const cfg=cloneCfg();if(changeCfg)changeCfg(cfg);const src=change?change(original):original,dir=fixture(src,cfg),r=generate(dir);const unchanged=fs.readFileSync(path.join(dir,'index.html'),'utf8')===src&&!fs.existsSync(path.join(dir,cfg.cells[0].file));const ok=r.status!==0&&unchanged;cases.push({name,kind:'blocked',exit:r.status,sourceUnchanged:unchanged,reason:r.stderr.split(/\r?\n/).find(l=>l.includes('Error:'))||null,matchedExpected:ok});assert.ok(ok,name);}
const suffix=' window.defaultProfile = defaultProfile;';
const replaceSuffix=(src,x)=>{assert.ok(src.includes('  }'+suffix));return src.replace('  }'+suffix,'  }'+x);};
function allowed(name,src=original,cfg=cloneCfg()){
  const dir=fixture(src,cfg),r=generate(dir);assert.strictEqual(r.status,0,name+' generator '+r.stderr);const check=inspect(dir),p=check.report;assert.ok(p&&p.ok,name+' verifier '+JSON.stringify(p&&p.restDiff));
  const file=path.join(dir,cfg.cells[0].file),cell=fs.readFileSync(file,'utf8'),fnName=cfg.cells[0].take[0].names[0];
  const found=require(path.join(dir,'tests/helpers/inline-bundle.js')).inlineCellFiles().includes(file);
  const parser=require('@babel/parser'),ast=parser.parse(cell,{sourceType:'script'}),fn=ast.program.body[0].expression.callee.body.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===fnName);
  const oldStart=src.indexOf('  function '+fnName+'('),oldEnd=src.indexOf('\n  }',oldStart)+4,oldFn=src.slice(oldStart,oldEnd),newFn=cell.slice(fn.start,fn.end).replace(/\bL\./g,'');
  const samples=[['guest','guest_preview','게스트'],['u1','study','상민'],[null,'','']];
  const values=samples.map(args=>{const evaluate=text=>{const box={nowISO:()=> '2026-10-06T00:00:00.000Z',defaultSettings:()=>({sample:true})};vm.createContext(box);vm.runInContext(text,box);return JSON.stringify(box[fnName](...args));};return evaluate(oldFn)===evaluate(newFn);});
  assert.ok(found&&values.every(Boolean),name+' helper/function');cases.push({name,kind:'allowed',exit:check.exit,tokenSame:p.equivalent,restSame:p.restSame,preservedTails:p.preservedTails,helperReadsCell:found,functionSamples:values.length,functionValuesSame:values.every(Boolean),matchedExpected:true});return dir;
}
function mutation(name,dir,change){const originals=new Map();const edit=(file,fn)=>{const f=path.join(dir,file),raw=fs.readFileSync(f,'utf8');originals.set(f,raw);fs.writeFileSync(f,fn(raw),'utf8');};try{change(edit);const checked=inspect(dir);assert.ok(checked.exit!==0&&(!checked.report||!checked.report.ok),name);const p=checked.report;cases.push({name,kind:'mutation',exit:checked.exit,tokenSame:p&&p.equivalent,restSame:p&&p.restSame,lineChecks:p&&p.lineCheck,preservedTails:p&&p.preservedTails,matchedExpected:true});}finally{for(const [file,raw] of originals)fs.writeFileSync(file,raw,'utf8');}}
try{
  const oldProbe=fixture(original,cloneCfg()),oldResult=generate(oldProbe,oldGen);assert.ok(oldResult.status!==0&&oldResult.stderr.includes('문 끝 줄 뒤에 다른 코드'));cases.push({name:'기존 생성기의 실제 defaultProfile 차단',kind:'before',exit:oldResult.status,matchedExpected:true});
  const prototype=allowed('실제 defaultProfile 단순 노출 원문 보존');
  allowed('suffix 공백·라인 주석 보존',replaceSuffix(original,' \twindow.defaultProfile\t= defaultProfile; // 원문 주석'));
  allowed('CRLF 입력 같은 범위 보존',original.replace(/\r?\n/g,'\r\n'));
  const dollarCfg=cloneCfg();dollarCfg.cells[0].take[0].names=['$profile'];allowed('$ 식별자 원문 보존',original.replace(/defaultProfile/g,'$profile'),dollarCfg);
  blocked('opt-in 없음',null,c=>delete c.cells[0].take[0].preserveWindowSuffix);
  blocked('opt-in false',null,c=>c.cells[0].take[0].preserveWindowSuffix=false);
  blocked('계산 프로퍼티',s=>replaceSuffix(s," window['defaultProfile'] = defaultProfile;"));
  blocked('연쇄 대입',s=>replaceSuffix(s,' window.defaultProfile = window.other = defaultProfile;'));
  blocked('다른 함수 노출',s=>replaceSuffix(s,' window.defaultProfile = defaultSettings;'));
  blocked('다른 속성 노출',s=>replaceSuffix(s,' window.other = defaultProfile;'));
  blocked('suffix 두 문',s=>replaceSuffix(s,suffix+' window.other = defaultSettings;'));
  blocked('세미콜론 없음',s=>replaceSuffix(s,' window.defaultProfile = defaultProfile'));
  blocked('중간 블록 주석',s=>replaceSuffix(s,' /* 중간 주석 */'+suffix));
  blocked('앞 문과 시작 줄 공유',s=>s.replace('  function defaultProfile(','  var tailProbe = 1; function defaultProfile('));
  blocked('한 줄 함수',s=>{const start=s.indexOf('  function defaultProfile('),end=s.indexOf('  }'+suffix,start)+3;return s.slice(0,start)+'  function defaultProfile(id, username, displayName){ return {}; }'+s.slice(end);});
  blocked('끝 줄에 다른 함수 본문',s=>s.replace('    };\n  }'+suffix,'    }; }'+suffix));
  blocked('window 지역 이름 가림',s=>s.replace('  function defaultProfile(','  var window = {};\n  function defaultProfile('));
  blocked('top this',s=>s.replace("bio: '', avatarUrl:","bio: this.name, avatarUrl:"));
  blocked('top arguments',s=>s.replace("bio: '', avatarUrl:","bio: arguments[0], avatarUrl:"));
  blocked('같은 함수 두 세포 소유',null,c=>{const dup=JSON.parse(JSON.stringify(c.cells[0]));dup.key='duplicate';dup.file='js/core/default-profile-range-probe2.js';c.cells.push(dup);});
  blocked('원본 export 중복',s=>replaceSuffix(s,suffix+'\n  window.defaultProfile = defaultProfile;'));
  const f=config.cells[0].file;
  mutation('suffix 삭제',prototype,edit=>edit('index.html',s=>s.replace(suffix,'')));
  mutation('suffix 다른 export',prototype,edit=>edit('index.html',s=>s.replace(suffix,' window.other = defaultProfile;')));
  mutation('suffix 중복',prototype,edit=>edit('index.html',s=>s.replace(suffix,suffix+'\n  window.defaultProfile = defaultProfile;')));
  mutation('suffix 원래 순서 재배열',prototype,edit=>edit('index.html',s=>{const ls=s.split('\n'),at=ls.findIndex(l=>l.startsWith('  /* [#TASK-ES-573] defaultProfile →')),line=ls.splice(at,1)[0],state=ls.findIndex(l=>l.startsWith('  var state = {'));ls.splice(state+1,0,line);return ls.join('\n');}));
  mutation('suffix 공백 변조',prototype,edit=>edit('index.html',s=>s.replace(suffix,'  window.defaultProfile = defaultProfile;')));
  mutation('표지 끝 열 변조',prototype,edit=>edit(f,s=>s.replace(/(원문 AST 끝 \d+:)(\d+)/,(_,a,b)=>a+(+b+1))));
  mutation('추가 표지 주석 본문 끼워넣기',prototype,edit=>edit(f,s=>s.replace(/(^  \/\* 원문 AST 끝 .*\*\/$)/m,'$1\n$1')));
  mutation('함수 본문 변조',prototype,edit=>edit(f,s=>s.replace("bio: '',","bio: '변조',")));
  mutation('검사 opt-in false',prototype,edit=>edit('config.json',s=>{const c=JSON.parse(s);c.cells[0].take[0].preserveWindowSuffix=false;return JSON.stringify(c);}));
  for(const sample of [{name:'TASK-ES-552 세 셀',cfg:'inline-stage3-z2-552.json',ref:'3ced3a46'},{name:'TASK-ES-568 세 셀',cfg:'inline-next568.json',ref:'0a2e424d'}]){
    const cfg=JSON.parse(fs.readFileSync(path.join(app,rel+sample.cfg),'utf8')),src=gitText(sample.ref,'index.html'),before=fixture(src,cfg),after=fixture(src,cfg),b=generate(before,oldGen),a=generate(after);assert.strictEqual(b.status,0,sample.name+' old '+b.stderr);assert.strictEqual(a.status,0,sample.name+' new '+a.stderr);
    const files=['index.html',...cfg.cells.map(c=>c.file)],fingerprints=files.map(file=>{const x=fs.readFileSync(path.join(before,file)),y=fs.readFileSync(path.join(after,file));return {file,oldSha256:hash(x),newSha256:hash(y),same:x.equals(y)};});
    const bv=inspect(before,oldVerify),av=inspect(after),reportSame=JSON.stringify(bv.report)===JSON.stringify(av.report);const ok=fingerprints.every(x=>x.same)&&bv.exit===0&&av.exit===0&&reportSame;representatives.push({name:sample.name,inputRef:sample.ref,inputSha256:hash(src),files:fingerprints,oldVerifyExit:bv.exit,newVerifyExit:av.exit,verifyReportSame:reportSame,matchedExpected:ok});assert.ok(ok,sample.name+' output');
  }
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({tool:rel+'tail-range-check-573.js',kind:'작업자 비제품 도구 측정 — 법정 판정 아님',baselineCommit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:app,encoding:'utf8'}).trim(),oldGeneratorRef:oldRef,inputSha256:hash(original),generatorSha256:hash(fs.readFileSync(gen)),verifierSha256:hash(fs.readFileSync(verify)),cases,representatives,counts:{cases:cases.length,representatives:representatives.length,expected:cases.filter(x=>x.matchedExpected).length},allExpected:cases.every(x=>x.matchedExpected)&&representatives.every(x=>x.matchedExpected)},null,1)+'\n','utf8');console.log(JSON.stringify({cases:cases.length,representatives:representatives.length,allExpected:true}));
}finally{assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(temp,{recursive:true,force:true});}
