"""Source-only comparisons. Does not import app, test readers, harness or Court."""
import pathlib,subprocess,json,hashlib,re,datetime,sys,os
sys.stdout.reconfigure(encoding='utf8')
root=pathlib.Path(__file__).resolve().parents[2];out=pathlib.Path(__file__).resolve().parent;packet=root/'reports/TASK-ES-695-B-TEST-01a13674/p0-loading-1'
base='9cfb8574e3acb62f259b9991df5ef2f84bb506ca'
def git(*a):return subprocess.check_output(['git','-c','core.longpaths=true','-c','core.autocrlf=false',*a],cwd=root)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
def source(file,head=None):return git('show',head+':'+file) if head else (root/file).read_bytes()
proof=load(packet/'SOURCE-PRESERVATION.json');beforeP=source('tests/local-keep-p0.test.js',base).decode('utf8');afterP=source('tests/local-keep-p0.test.js').decode('utf8')
oldCache="['../js/record-ledger.js', '../js/account-isolation.js', '../js/core/local-keep.js', '../js/core/home-cockpit.js', '../js/core/profile-load.js']"
newCache="['../js/record-ledger.js', '../js/account-isolation.js', '../js/core/capabilities.js', '../js/core/device-save.js', '../js/core/local-keep.js', '../js/core/home-cockpit.js', '../js/core/profile-load.js']"
newRequire="  require('../js/core/capabilities.js'); require('../js/core/device-save.js');\n"
beforeD=source('tests/direct-login-guard.test.js',base).decode('utf8');afterD=source('tests/direct-login-guard.test.js').decode('utf8')
rawNew="var rawHtml = fs.readFileSync(HTML_PATH, 'utf8');\nvar html = require('./helpers/inline-bundle').withInlineCells(rawHtml);"
rawOld="var html = require('./helpers/inline-bundle').withInlineCells(fs.readFileSync(HTML_PATH, 'utf8'));"
branch="  if (rawHtml.indexOf('async function ensureUserRow(') < 0 && rawHtml.indexOf('async function loadProfile(') < 0) {\n    win.OurgoalAppScope = { scope: ctx };\n    ['js/core/capabilities.js', 'js/core/device-save.js', 'js/core/local-keep.js', 'js/core/profile-load.js'].forEach(function (file) {\n      vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });\n    });\n    ctx.ensureUserRow = win.OurgoalUiHelpers.ensureUserRow;\n    ctx.loadProfile = win.OurgoalUiHelpers.loadProfile;\n    names = names.filter(function (h) { return h !== 'async function ensureUserRow(' && h !== 'async function loadProfile('; });\n  }\n"
assertionLines=lambda s:[l for l in s.splitlines() if re.search(r'\bassert\.',l)]
pScopeExact=afterP.count(newCache)==1 and afterP.count(newRequire)==1 and afterP.replace(newCache,oldCache,1).replace(newRequire,'',1)==beforeP
dScopeExact=afterD.count(rawNew)==1 and afterD.count(branch)==1 and afterD.replace(rawNew,rawOld,1).replace(branch,'',1)==beforeD
protected=[]
for p in proof['protectedPins']:
 b=source(p['file'],base);a=source(p['file']);protected.append({'file':p['file'],'expected':p['baselineSHA256'],'baseline':sha(b),'current':sha(a),'exact':b==a and sha(a)==p['baselineSHA256']})
rawPath=pathlib.Path(proof['originalCI']['rawPath']);ciRaw=rawPath.read_bytes();metaPath=rawPath.parent/'metadata.json';metaBytes=metaPath.read_bytes()
packetPins=[{'file':p.relative_to(root).as_posix(),'sha256':sha(p.read_bytes())} for p in sorted(packet.rglob('*')) if p.is_file()]
sourceSeal=load(packet/'SOURCE-SEAL.json');historicalSourcePinMismatches=[]
for p in sourceSeal['files']:
 actual=sha(source(p['file'],'0cf68ce5221b75281637266144ca37d9768982ea'))
 if actual!=p['SHA256']:historicalSourcePinMismatches.append({'file':p['file'],'expected':p['SHA256'],'actual':actual})
headers=['function defaultProfile(','async function sha256Hex(','async function ensureUserRow(','async function loadProfile(','async function saveProfile(','async function migrateGuestDataToUser(','async function performLogout(','async function loginWithDirectIdentifier(']
raw=source('index.html').decode('utf8');legacyBranch=[]
for hasEnsure in [False,True]:
 for hasLoad in [False,True]:legacyBranch.append({'rawEnsureHeader':hasEnsure,'rawLoadHeader':hasLoad,'actualIIFEBranchBySourceCondition':not hasEnsure and not hasLoad,'sourceOnlyTruthTable':True})
log=pathlib.Path('C:/Users/HP/.codex/sessions/2026/10/14/rollout-2026-10-14T03-50-10-01a13699-c9f8-7bb3-8ec0-c23d9fb8f5a8.jsonl');ctx=None
for n,l in enumerate(log.read_text(encoding='utf8').splitlines(),1):
 e=json.loads(l)
 if e.get('type')=='turn_context':ctx={'source':str(log),'line':n,'timestamp':e.get('timestamp'),'model':e['payload'].get('model'),'effort':e['payload'].get('effort')}
r={'task':'TASK-ES-695-B-READER-REVIEW-01a13674','measuredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'collectorPid':os.getpid(),'exactSource':git('rev-parse','HEAD').decode('utf8').strip(),'base':base,'requested':{'model':'gpt-6.1-sol','effort':'high'},'actualContext':ctx,'reason':'原단언·legacyHTML로드와 정적/동작주장 혼동의 영향을 원writer와 분리해 대조한다.',
 'p0':{'beforeSha256':sha(beforeP.encode('utf8')),'afterSha256':sha(afterP.encode('utf8')),'onlyCacheAndRequireWhitelistDelta':pScopeExact,'assertionLinesExact':assertionLines(beforeP)==assertionLines(afterP),'assertionSourceLineCount':len(assertionLines(afterP)),'caseSourceCount':len(re.findall(r"^check(?:Async)?\('",afterP,re.M)),'providerLoadOrderBySource':afterP.index('global.window = global;')<afterP.index(newRequire.strip())<afterP.index("require('../js/core/profile-load.js')")},
 'direct':{'beforeSha256':sha(beforeD.encode('utf8')),'afterSha256':sha(afterD.encode('utf8')),'onlyRawReadAndIIFEBranchWhitelistDelta':dScopeExact,'assertionLinesExact':assertionLines(beforeD)==assertionLines(afterD),'assertionSourceLineCount':len(assertionLines(afterD)),'caseSourceCount':len(re.findall(r"await check\('",afterD)),'originalEightHeaderDeclarationExact':all(beforeD.count("'"+h+"'")>0 and afterD.count("'"+h+"'")>0 for h in headers),'fixtureSuffixExact':beforeD[beforeD.index('/* 이메일 로그인 진입'):]==afterD[afterD.index('/* 이메일 로그인 진입'):],'rawCurrentEnsureHeader':headers[2] in raw,'rawCurrentLoadHeader':headers[3] in raw,'legacyBranchTruthTable':legacyBranch,'legacyHeaderContract':'raw contains either header keeps original eight extraction; both absent chooses actual IIFEs; comment/alternate/mixed HTML generalized semantic support not proved'},
 'protectedPins':protected,'protectedPinCount':len(protected),'protectedPinMismatches':[p for p in protected if not p['exact']],'accountReaderSha256':sha(source('tests/account-switch-isolation.test.js')),'packetPins':packetPins,'historicalSourceSealPinMismatches':historicalSourcePinMismatches,
 'originalCI':{'rawSha256':sha(ciRaw),'rawExpectedShaExact':sha(ciRaw)==proof['originalCI']['rawSHA256'],'metadataSha256':sha(metaBytes),'metadataExpectedShaExact':sha(metaBytes)==proof['originalCI']['metadataSHA256'],'requestTypeErrorCountFromRaw':len(re.findall(r"Cannot read properties of undefined \(reading 'request'\)",ciRaw.decode('utf8'))),'rawCopied':False,'rawPrinted':False},
 'inheritedSelectedOnly':load(packet/'FIRST-SELECTED-RESULT.json'),'ownSuiteExecutions':0,'newL1':0,'claimsExactSourcePending':True,'Court':None,'actualCI':None,'use':None,'effect':None,'productWrites':0,'testWrites':0,'claimWrites':0,'rawWrites':0,'remoteCalls':0,'auth':False,'DB':False,'browser':False,'API':False,'SQL':False,'firstOwnToolIssue':'Windows rg literal court/probes/static* paths rejected; corrected to rg --files/--glob and bounded existing file reads; no source consequence.'}
with (out/'reader-static.json').open('x',encoding='utf8') as f:json.dump(r,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({k:r[k] for k in ['collectorPid','exactSource','p0','direct','protectedPinMismatches','historicalSourceSealPinMismatches','originalCI']},ensure_ascii=False))
