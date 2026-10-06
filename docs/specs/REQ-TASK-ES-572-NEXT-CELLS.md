# TASK-ES-572 알림 헬퍼·목표 상세 서랍 분열
작업참고 기준 PR #832. 최종 입력은 origin/main e45c27299be9750986d15ac68e4e067ac7bc185d이며 해시는 보고 출처로만 기록한다.
## 1. [원칙 ①] 파악
isWithinDND·generateDynamicNotification은 js/tabs/settings/notify-timer.js의 실제20초타이머가 부른다. openGoalDetailDrawer·closeGoalDetailDrawer·toggleMilestoneInDrawer는 성지 #sGoalDetailBtn·#goalDrawerBody [onclick]·#btnGoalDrawerClose 경로다.
## 2. [원칙 ②] 본질·원인·중심·핵심
알림 문구·방해금지 판별과 목표 상세 화면의 책임을 각각 js/tabs/settings/notification-helper.js·js/tabs/goals/goal-detail-drawer.js로 분열한다. 원문 버그·window 노출·저장 순서는 보존한다.
## 3. [원칙 ③] 해결방식
inline-next572.json과 gen-inline-hard.js 사용. OurgoalSettingsKit/_settingsKit·OurgoalGoalsKit/_goalsKit 기존 통로와 HO 자리 사용. calendarAvailable와 arguments를 쓰는 saveGoogleToken은 이번 범위에서 제외한다.
## 4. [원칙 ④] 재검토
smoke FN_NAMES에 알림 두 함수가 있지만 fnSource가 inline-bundle로 app-scope 세포를 같은 원문으로 읽는 지원이 있다. 시험·기대값은 변경하지 않는다. 서랍 닫힌 CSS 상태는 정상 열림/닫힘 상태 쌍이며 영구 은폐가 아니다.
## 5. [원칙 ⑤] 절차
원본 UI 도달: 별도 headless context.overridePermissions(base,['notifications']) → #checkinTimesRow time input change → #notifySwitch 실제 click → Date/타이머 교체 없이20~40초 관측. 목표는 성지 추천 목표 '+담기' 실제 버튼으로 만들고 서랍·마일스톤·닫기를 실제 클릭한다. 함수 직접 호출/상태주입0, 원격api/rest/storage 쓰기 차단.
## 6. [원칙 ⑥] 절차 재검증
반론1: 테스트 알림 버튼으로 충분하다. 답: 실제 notify engine 분기는 동적 헬퍼를 부르지 않으므로 진짜 타이머를 기다려 호출수로 확인한다.
반론2: 서랍 CSS 닫힘은 숨긴 기능이다. 답: 상세 버튼으로 open 클래스를 붙이고 닫기 버튼으로 제거하는 정상 패널이며 실제 마일스톤 저장 변화까지 재야 한다.
## 7. [원칙 ⑦] 단계별 실행
최신 main을 입력으로 재생성·토큰/나머지동일·독립로드·화면 기준2/후1·게스트조작·Git전체시험 전후0을 측정한다. 새JS는 git add 뒤 이력시험을 돌린다. 정상 훅 커밋을 부모에게 인계하고 원격 제품 push는 부모가 담당한다.
## 8. [원칙 ⑧] 막히는 지점 예상
법정 scenario DSL에는 native Notification permission override가 없어 타이머 경로를 같은 방식으로 재생할 수 없는 도구 한계를 부모에게 보고한다. boot scenario를 실제헬퍼 도달 증명으로 사용하지 않는다. 원격 writes0을 강제한다. 시각경계는 UI 시간입력으로 다음분을 고르고 45초까지 관측한다.

## 법정 한계 주장 분리
알림 R1은 reason=tool-cannot-measure, cannotBecause=native-dialog인 native 알림 권한창만 한계로 기록한다. 실측은 R3 config 보고값 적재 항목에 분리한다. needs-real-device·push-notification·long-duration을 쓰지 않는다. drawer R2는 실제 UI 시나리오로 검증한다.

## 준비 실측(최종 증명 아님)
{"source":"reports/TASK-ES-572/reach-original.json","notificationWaitMs":19441,"calls":{"isWithinDND":2,"generateDynamicNotification":1,"openGoalDetailDrawer":2,"toggleMilestoneInDrawer":1,"closeGoalDetailDrawer":1},"pageerrors":[],"rowsWrittenRemote":0}

## 최종 병렬 촬영 설계
tab-isolated572.js는 기존 tab-check.js를 메모리에서 실행하며 포트4700~4999 난수만 listen(0)/server.address().port로 바꾼다. 원본 파일·검사·테마4·폭2·상태·Chrome 설정은 그대로다. 부모 통지 뒤 baseline1/baseline2/after의 각 process·Chrome 임시프로필·OS배정debugport·정적서버port·outdir를 분리하고 병렬 실행한다. baseline2/after1 비교 품질은 줄이지 않는다.

## 최종 작업자 측정(법정 판정 아님)
{
  "source": "reports/TASK-ES-572/snapshot-final.json",
  "base": {
    "inlineScriptLines": 6133,
    "indexFunctionDecls": 81,
    "windowAssignments": 261,
    "oversizeJsFiles": 0,
    "crossTabRefs": 0
  },
  "after": {
    "inlineScriptLines": 6021,
    "indexFunctionDecls": 76,
    "windowAssignments": 261,
    "oversizeJsFiles": 0,
    "crossTabRefs": 0
  },
  "inlineReduction": 112,
  "functionReduction": 5,
  "uiValues": 1125,
  "uiDiffs": [
    0,
    0,
    0
  ],
  "testSource": "reports/TASK-ES-572/test-final.json",
  "baseNpm": {
    "npmExit": 0,
    "npmTest": {
      "smoke": [
        440,
        0
      ],
      "integrity": [
        38,
        38,
        0
      ],
      "buttons": [
        918,
        918
      ],
      "shipyardModularFiles": 176,
      "moduleGuard": [
        6133,
        81,
        261,
        0,
        0
      ]
    }
  },
  "workNpm": {
    "npmExit": 0,
    "npmTest": {
      "smoke": [
        440,
        0
      ],
      "integrity": [
        38,
        38,
        0
      ],
      "buttons": [
        918,
        918
      ],
      "shipyardModularFiles": 178,
      "moduleGuard": [
        6021,
        76,
        261,
        0,
        0
      ]
    }
  },
  "tests": {
    "files": 115,
    "sameFileList": true,
    "exitCodesSame": true,
    "exitDiff": [],
    "outputDiffAfterNormalize": [],
    "outputsSame": true,
    "failingInBaseAndAfter": [
      "achievement-stats-shell-button-removal.test.js",
      "app-evaluation-notice.test.js",
      "avatar-icon-enlarge-all.test.js",
      "avatar-welcome-modal.test.js",
      "calendar-photo-diary-dismiss-guide.test.js",
      "comm-feed-cleanup.test.js",
      "comm-post-feed-button-fix.test.js",
      "component-modularization.test.js",
      "dm-delivery-read-receipt.test.js",
      "dm-keyboard-autofocus-fix.test.js",
      "enlarge-avatar-icons.test.js",
      "feed-ai-bot-reduction.test.js",
      "feed-post-category-diversity.test.js",
      "feed-post-photo-upload.test.js",
      "feed-post-selectable-targets.test.js",
      "feed-share-latest-record.test.js",
      "goal-ai-advice-status.test.js",
      "goal-template-legacy-cleanup.test.js",
      "goals-only-view.test.js",
      "goals-schedule-sync.test.js",
      "goals-smart-attachments.test.js",
      "records-stats-metrics.test.js",
      "remove-duplicate-home-layout-button.test.js",
      "routine-tab-scheduler.test.js",
      "settings-collapse-default.test.js",
      "trio-es143-es145.test.js",
      "test-universal-import.js"
    ],
    "normalize": "경로·트리 폴더 이름(root: …)·스택 줄 번호·ms·duration_ms·ISO 시각"
  },
  "smokeTitleDiff": {
    "onlyBase": [
      "✓ Checked 176 modular files: ALL under 800 lines (range: 68~118 lines)"
    ],
    "onlyWork": [
      "✓ Checked 178 modular files: ALL under 800 lines (range: 68~118 lines)"
    ]
  }
}
표준 탭은 설정2상태·목표3상태를 테마4×폭2로 각각 측정하여 한 벌40장, 기준2벌·작업1벌 총120장이다. tab-compare 두 비교는 각680값 차이0이다. 어댑터는 원문 포트 구문 두 곳만 각1회 바꾸고 표준3파일은 그대로다. 각 포트·Chrome debugport·프로필·출력 경로와 원문/변환 해시는 provenance-final.json에 있다.
독립 게스트의 ID·실제 시각·현재 time UI입력·기존 랜덤manito seed를 정규화했다. ID를 포함한 캐시 hash는 기준끼리도6차이가 있어 최초비교를 보존하고, 변경없는 ai-status.js의 순수 해시 함수를 측정 도구에서 실제 저장목표에 적용하여 저장hash가 정확함을 확인한 뒤 canonical ID로 다시 계산해 대조했다. 이는 UI 도달을 제품 함수 직접호출로 대신한 것이 아니다. 실제 UI 호출수는 별도 런타임 계수로 측정했다.
전체 실행 목록은113시험지와2보조스크립트이며115시험지라고 부르지 않는다. 비교 도구 자체 종료1은 모듈 파일수176→178과 모듈 지표 감소에 따른 측정값·제목 차이이다. npm 양쪽0 및 전체 실행 종료코드/정규화 출력 차이0은 원문 보고서 그대로 기록했다. 시험 기대값 변경·검사 폐기는0이다.
작업 UI 첫 Chrome launch의 DebugPort 오류는 증거파일 미생성 상태에서 소유 프로세스만 종료하고 작업1벌만 재실행했다. 기준2벌과 전체 시험·촬영은 반복하지 않았다. 로그인 전용 경로를 새로 주장하지 않으며 이 범위는 실제 게스트 UI로 측정했다. 법정 native-dialog 한계는 native 알림 권한창에만 한정한다.
