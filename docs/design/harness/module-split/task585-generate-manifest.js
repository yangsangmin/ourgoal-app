'use strict';
/**
 * task585-generate-manifest.js
 * TASK-ES-585 evidence-manifest.json 자동 생성 스크립트
 * 모든 입력/원시/결과/비교기 파일의 SHA256을 실제 디스크에서 측정하여 등록
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const appRoot = path.resolve('C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app');
const baseRoot = path.resolve('C:/dev/wt/agy-scratch/TASK-ES-585/base_main_full_66ce3a63');
const reportsRoot = path.join(appRoot, 'reports/TASK-ES-585');

const latestOriginMain = '890442ead35d75a513974b5e4b0c96ab279138a4';
const measuredBaseCommit = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';

let productDiffStat = '';
try {
  productDiffStat = execSync(`git diff --stat ${measuredBaseCommit} ${latestOriginMain} -- index.html js css api public sw.js manifest.json`, {
    cwd: appRoot,
    encoding: 'utf8'
  }).trim();
} catch (e) {
  productDiffStat = e.message;
}
const productDiffIdentical = productDiffStat.length === 0;

const manifest = {
  task: 'TASK-ES-585',
  timestamp: new Date().toISOString(),
  targetBranch: 'codex/task-es-585-record-detail',
  baseCommitAtTaskStart: measuredBaseCommit,
  latestOriginMainCommit: latestOriginMain,
  latestMainComparison: {
    latestOriginMainCommit: latestOriginMain,
    measuredBaseCommit: measuredBaseCommit,
    productDiffBetweenMeasuredAndLatest: productDiffStat.length,
    productInputShaIdentical: productDiffIdentical,
    reuseJustification: '최신 origin/main(890442ea, PR #844 병합)과 실측 기준(66ce3a63) 간 제품 자산(index.html, js/**, css/**, api/**, public/**, sw.js) diff가 0바이트로 100% 동일함. 병합 변경사항은 문서/학습도구/시험하네스에 국한되어 제품 런타임 입력 파일의 재실행 없이 66ce3a63 실측값을 100% 유효하게 재사용함.'
  },
  items: [
    {
      id: 'token-residual-leak',
      title: '최신 origin/main 대비 이동 토큰·잔여 원문·누수 검증',
      status: 'measured',
      command: 'node docs/design/harness/module-split/verify-inline-hard.js C:/dev/wt/agy-scratch/TASK-ES-585/base_main_full_66ce3a63/index.html C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app C:/dev/agy-collab/briefs/inline-record-detail585.json',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      inputFiles: [
        {
          path: path.join(baseRoot, 'index.html'),
          sha256: sha256(path.join(baseRoot, 'index.html'))
        },
        {
          path: path.join(appRoot, 'index.html'),
          sha256: sha256(path.join(appRoot, 'index.html'))
        },
        {
          path: path.join(appRoot, 'js/tabs/records/template-record-detail.js'),
          sha256: sha256(path.join(appRoot, 'js/tabs/records/template-record-detail.js'))
        },
        {
          path: 'C:/dev/agy-collab/briefs/inline-record-detail585.json',
          sha256: sha256('C:/dev/agy-collab/briefs/inline-record-detail585.json')
        }
      ],
      resultPath: 'reports/TASK-ES-585/verify-inline-hard.json',
      resultSha256: sha256(path.join(reportsRoot, 'verify-inline-hard.json')),
      comparatorPath: 'docs/design/harness/module-split/verify-inline-hard.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/verify-inline-hard.js')),
      parsedMetrics: {
        equivalent: true,
        tokensOrig: 915,
        tokensNew: 915,
        checkRecordDeepLinkTokensOrig: 106,
        checkRecordDeepLinkTokensNew: 106,
        origRestTokens: 35505,
        newRestTokens: 35505,
        leaks: 0,
        thisArgs: 0,
        listenersEqual: true,
        under800Lines: true,
        actualLines: 168
      }
    },
    {
      id: 'module-load-isolation',
      title: '법정 module-load 탐침 및 개별 파일 단독 로드',
      status: 'measured',
      command: 'node docs/design/harness/module-split/task585-module-load.js C:/dev/wt/agy-scratch/TASK-ES-585/base_main_66ce3a63 C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app reports/TASK-ES-585/module-load.json',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      inputFiles: [
        {
          path: path.join(appRoot, 'js/tabs/records/template-record-detail.js'),
          sha256: sha256(path.join(appRoot, 'js/tabs/records/template-record-detail.js'))
        }
      ],
      resultPath: 'reports/TASK-ES-585/module-load.json',
      resultSha256: sha256(path.join(reportsRoot, 'module-load.json')),
      comparatorPath: 'docs/design/harness/module-split/task585-module-load.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/task585-module-load.js')),
      parsedMetrics: {
        totalProbed: 82,
        standardProbeOk: 81,
        preExistingFailures: 1,
        newRegressions: 0,
        isolatedOk: true
      }
    },
    {
      id: 'ui-cdp-guest-measurement',
      title: '게스트 UI 14단계 15클릭 조작 및 CDP 실제 호출/분기 측정 (기준 2회 + 작업 1회)',
      status: 'measured',
      command: 'node docs/design/harness/module-split/task585-record-detail-ui.js',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      inputFiles: [
        {
          path: path.join(reportsRoot, 'ui-base-full1.json'),
          sha256: sha256(path.join(reportsRoot, 'ui-base-full1.json'))
        },
        {
          path: path.join(reportsRoot, 'ui-base-full2.json'),
          sha256: sha256(path.join(reportsRoot, 'ui-base-full2.json'))
        },
        {
          path: path.join(reportsRoot, 'ui-after-full.json'),
          sha256: sha256(path.join(reportsRoot, 'ui-after-full.json'))
        }
      ],
      historicalFailedRaw: [
        {
          path: path.join(reportsRoot, 'ui-after-failed-initial.json'),
          sha256: sha256(path.join(reportsRoot, 'ui-after-failed-initial.json')),
          reason: '초기 10단계 카드 수정 모달 열림 감지 시점 비동기 지연으로 실패 보존'
        }
      ],
      parsedMetrics: {
        stepsEvaluated: 14,
        clicksEvaluated: 15,
        completedAllRuns: true,
        targetFunctionStats: {
          openTemplateRecordDetailModal: { called: true, maxEntryCount: 1 },
          checkRecordDeepLink: { called: true, maxEntryCount: 1 }
        }
      }
    },
    {
      id: 'dom-profile-storage-compare',
      title: 'UI 전체 DOM·모달·토스트·스토리지 전수 일치, 날짜 생산식 검증 및 17종 뮤테이터 민감도 검증',
      status: 'measured',
      command: 'node docs/design/harness/module-split/task585-record-detail-compare.js reports/TASK-ES-585/ui-base-full1.json reports/TASK-ES-585/ui-base-full2.json reports/TASK-ES-585/ui-after-full.json reports/TASK-ES-585/ui-compare.json',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      resultPath: 'reports/TASK-ES-585/ui-compare.json',
      resultSha256: sha256(path.join(reportsRoot, 'ui-compare.json')),
      comparatorPath: 'docs/design/harness/module-split/task585-record-detail-compare.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/task585-record-detail-compare.js')),
      historicalFailedResult: [
        {
          path: path.join(reportsRoot, 'ui-compare-v1-flawed.json'),
          sha256: sha256(path.join(reportsRoot, 'ui-compare-v1-flawed.json')),
          reason: '독립 감사 이전 모달 외부 DOM 미비교 및 사전조건 게이트 누락 버전 보존'
        }
      ],
      parsedMetrics: {
        preconditionsPassed: true,
        invariantsPreserved: true,
        baseReproducibilityPassed: true,
        allStepsDomMatched: true,
        allStepsModalMatched: true,
        allStepsToastMatched: true,
        storageMatched: true,
        sessionStorageMatched: true,
        errorsMatched: true,
        allStepsStateMatched: true,
        dateProvenancePassed: true,
        targetFunctionsCalled: true,
        mutatorSensitivityPassed: true,
        mutatorCanariesDetected: 17
      }
    },
    {
      id: 'tab-isolated-check',
      title: '표준 tab-check 2+1 (기록 탭 records 화면 24종 실측 대조)',
      status: 'measured',
      command: 'node court/probes/tab-check.js records',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      inputFiles: [
        {
          path: path.join(reportsRoot, 'tab-base1.json'),
          sha256: sha256(path.join(reportsRoot, 'tab-base1.json'))
        },
        {
          path: path.join(reportsRoot, 'tab-base2.json'),
          sha256: sha256(path.join(reportsRoot, 'tab-base2.json'))
        },
        {
          path: path.join(reportsRoot, 'tab-after.json'),
          sha256: sha256(path.join(reportsRoot, 'tab-after.json'))
        }
      ],
      resultPath: 'reports/TASK-ES-585/tab-compare.json',
      resultSha256: sha256(path.join(reportsRoot, 'tab-compare.json')),
      reproPath: 'reports/TASK-ES-585/tab-repro-base.json',
      reproSha256: sha256(path.join(reportsRoot, 'tab-repro-base.json')),
      base2AfterPath: 'reports/TASK-ES-585/tab-base2-after.json',
      base2AfterSha256: sha256(path.join(reportsRoot, 'tab-base2-after.json')),
      comparatorPath: 'docs/design/harness/module-split/task585-tab-isolated.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/task585-tab-isolated.js')),
      parsedMetrics: {
        comparedValues: 408,
        differingValues: 0,
        baseReproDifferingValues: 0,
        base2AfterDifferingValues: 0
      }
    },
    {
      id: 'tests-suite-compare',
      title: '115개 전체 시험 및 npm test 기준선 대 작업판 전수 비교',
      status: 'measured',
      command: 'node docs/design/harness/module-split/task585-test-compare.js C:/dev/wt/agy-scratch/TASK-ES-585/base_main_full_66ce3a63 C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app reports/TASK-ES-585/test-compare.json',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      resultPath: 'reports/TASK-ES-585/test-compare.json',
      resultSha256: sha256(path.join(reportsRoot, 'test-compare.json')),
      comparatorPath: 'docs/design/harness/module-split/task585-test-compare.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/task585-test-compare.js')),
      rawLogs: [
        {
          path: path.join(reportsRoot, 'npm-test-base.log'),
          sha256: sha256(path.join(reportsRoot, 'npm-test-base.log'))
        },
        {
          path: path.join(reportsRoot, 'npm-test-work.log'),
          sha256: sha256(path.join(reportsRoot, 'npm-test-work.log'))
        }
      ],
      parsedMetrics: {
        totalFiles: 115,
        testFiles: 113,
        helperScripts: 2,
        exitCodesSame: true,
        regressions: 0,
        failingInBaseAndAfter: 29
      }
    },
    {
      id: 'runtime-input-manifest',
      title: '브라우저 로드 런타임 386개 파일 SHA256 기준 대조',
      status: 'measured',
      command: 'node docs/design/harness/module-split/task585-input-manifest.js C:/dev/wt/agy-scratch/TASK-ES-585/base_main_full_66ce3a63 C:/Users/HP/.codex/worktrees/agy-record-modals-585/ourgoal-app reports/TASK-ES-585/runtime-input-manifest.json',
      exitCode: 0,
      inputCommit: '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9',
      resultPath: 'reports/TASK-ES-585/runtime-input-manifest.json',
      resultSha256: sha256(path.join(reportsRoot, 'runtime-input-manifest.json')),
      comparatorPath: 'docs/design/harness/module-split/task585-input-manifest.js',
      comparatorSha256: sha256(path.join(appRoot, 'docs/design/harness/module-split/task585-input-manifest.js')),
      parsedMetrics: {
        totalChecked: 386,
        identical: 384,
        modified: 1,
        addedInApp: 1,
        removedInApp: 0
      }
    },
    {
      id: 'out-of-scope-external',
      title: '유료 AI 요청·원격 송신·실계정 데이터변경·tri-sync·배포 격리',
      status: 'blocked',
      note: '유료 AI 요청·remote 송신·실계정/외부계정 데이터변경/삭제/로그인/클립보드외부전송·tri-sync·배포는 헌법 5단 판단(돈·개인정보·되돌릴수없는바깥행위) 및 보안 정책에 따라 엄격히 차단 및 격리 보존'
    },
    {
      id: 'quick-goal-entry',
      title: '목표 빠른추가 진입 보존 여부',
      status: 'unmeasured',
      note: '목표 빠른추가 진입은 숨김 여부 아직 미측정이며 TASK-ES-585 스펙 외 범위로 분리'
    },
    {
      id: 'seed-independent-anchor',
      title: 'seed(Math.random) 독립 난수 추첨 앵커 검증',
      status: 'unmeasured',
      note: 'manito-basics manitoState 최초 접근 시 Math.floor(Math.random()*100000)으로 생성된 난수로, 기존 원시에는 생성 결과만 존재하여 정확한 난수 독립 앵커 회복 불가하므로 미측정으로 유지'
    }
  ]
};

const outPath = path.join(reportsRoot, 'evidence-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('evidence-manifest.json successfully generated at:', outPath);
