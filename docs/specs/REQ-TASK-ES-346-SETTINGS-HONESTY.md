# 요구사항 정의서 (REQ) — 설정 탭 정직성: 탈퇴 고지(SET-02) · 가짜 보안 표시(SET-01)

> **문서 ID**: REQ-TASK-ES-346-SETTINGS-HONESTY
> **티켓 연계**: #TASK-ES-346 (노션 「아워골 UI/UX 대개편 작업 티켓 DB」 SET-01, SET-02 · 생각 메모장 16·17·70·71)
> **작성 일시**: 2026-10-04
> **작성자**: Claude Code 세션 (오케스트레이터 지시 위임)
> **규범 준수**: AGENTS.md(헌법) · court/README.md 4절(claims 형식)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **지시 원문(요지, 오케스트레이터 경유 상민님 작업 지시)**: "설정 탭 티켓 SET-02(탈퇴 고지가 사실과 다름)와 SET-01(가짜 보안 표시)을 고치는 PR 하나를 만든다. 병합은 하지 않는다." 세부 항목은 아래 R1~R10.
  - R1 탈퇴 팝업의 '30일 후 완전 자동 영구 파기'·개인정보보호법 준수 고지를 실제 처리(요청 접수·유예·자동 파기 미실행 사실·문의 경로)에 맞게 고친다. api/withdraw.js 와 관련 코드를 먼저 읽어 실제 동작을 확인한다.
  - R2 `#badge2faStatus` 초기 마크업 '✓ 2단계 인증 보호 중' 하드코딩 → 실제 상태(설정됐을 때만). `refreshSecurityStatus` 도 정직하게.
  - R3 '2단계 인증'은 실제로 이 기기 안의 PIN 비교 → 이름을 '앱 잠금 PIN (이 기기)'처럼 실제대로 바꾼다.
  - R4 PIN 은 평문 대신 해시(SubtleCrypto SHA-256 + 소금)로 저장·비교. 기존 평문 PIN 사용자는 첫 검증 성공 시 해시로 이전(잠김 방지).
  - R5 `getRegisteredDevices` 가 저장값이 없으면 실재하지 않는 기기 2대와 위치를 만들어 저장 → 생성 제거, 현재 기기만. 이미 저장된 가짜 항목은 로드 시 정리.
  - R6 개별 '원격 로그아웃'·`killDeviceSession` 이 토스트만 → '끊었다'는 토스트·결과를 없애고 실제로 되는 '다른 기기에서 모두 로그아웃'(`sb.auth.signOut({ scope: 'others' })`)으로 안내.
  - R7 보안 카드의 하드코딩 '서울, 대한민국'·'현재 1개의 활성 세션' 문구 → 사실대로 또는 제거.
  - R8 `#cacheSizeText` '14.2 MB' 하드코딩, `clearCacheBtn` 문구만 '0 KB' → 실측(navigator.storage.estimate) 또는 '측정 불가'.
  - R9 "데이터는 이 기기(이 대화)에만 저장됩니다" → 실제 저장 방식대로.
  - R10 측정·문서·PR (승인선: 실제 30일 후 영구 파기 구현·서버 2단계 인증·기기 세션 수집·버튼 삭제 금지).
- **현재 발생하는 문제 (표면)**: 설정 화면이 사용자에게 사실이 아닌 보안·삭제 상태를 말한다.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: `api/withdraw.js` 는 화면에서 호출되지 않는다. `submitWithdrawAccount`(index.html)는 `settings.pendingDeletionAt`(이 기기 localStorage)와 `sb.auth.updateUser({ data: { account_status: 'pending_deletion', deleted_at } })` 만 기록하고 로그아웃한다. 자동 파기 크론·호출 경로는 없다(vercel.json 크론 없음). 개별 기기 '원격 로그아웃'의 `device_remote_revocations` 방송은 받는 쪽이 0곳.
  - **2층 (구조/프로세스 부재)**: 문구 존재만 확인하는 문자열 시험(scripts/smoke-test.js, tests/*.js)이 거짓 문구를 오히려 고정했다.
  - **3층 (체감 괴리)**: PIN 을 켜지 않은 사용자도 '보호 중'으로 안심하고, 존재하지 않는 기기 2대를 보고 불안해하며, 탈퇴하면 지워진다고 믿는다.
- **사용자 상황**: 설정 탭을 여는 모든 사용자(게스트 포함), 탈퇴를 고민하는 회원.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축**: FIX
- **[본질]**: 화면 문구가 코드의 실제 동작보다 앞서 나갔다. 고칠 것은 동작을 지어내는 일이 아니라 문구를 동작에 맞추는 일이다.
- **[원인]**:
  1. **원인 1**: 기능 목업(가짜 기기 시드, 고정 배지, 고정 용량)이 실제 배선 없이 남았다.
  2. **원인 2**: 탈퇴 고지가 계획(30일 후 파기)을 현재 사실처럼 적었다 — 파기 실행 경로가 없다.
  3. **원인 3**: PIN 이 평문으로 이 기기 localStorage(`ourgoal_settings_<uid>`, 게스트는 `ourgoal_guest_profile`)에 저장된다.
- **[중심]**: 문장마다 "코드가 실제로 그렇게 하는가"를 대조한 표(아래 3-4).
- **[핵심]**: 승인선 — 영구 파기 실행·서버 2단계 인증·기기 세션 수집·버튼 삭제는 하지 않는다. 기존 평문 PIN 사용자가 잠기지 않아야 한다.
- **체감 가설**: *"사용자가 설정 탭에서 보안 카드를 볼 때, 켜 둔 것만 켜져 있다고 보이므로 표시를 믿고 필요한 것을 직접 켠다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 앱 진입 PIN 확인(`enterApp` → `challengeTwoFactorModal`)의 비교가 해시 비교로 바뀐다. 평문 저장값은 그대로 통과 후 해시로 이전.
  - 홈·스트릭: 영향 없음.
  - 기록·통계·캘린더: 영향 없음. 캐시 비우기는 Cache API 만 지우며 localStorage(목표·기록·설정)는 건드리지 않는다.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것**: 30일 후 자동 영구 파기 구현, 서버 2단계 인증, 다른 기기 세션 수집, 버튼 삭제, api/withdraw.js 동작 변경.
- **해야 할 것**: 문구를 실제 동작에 맞춘다. 거짓 결과를 만드는 코드(가짜 기기 시드, 가짜 '차단됨' 표시)를 없앤다. 실제로 되는 경로(`signOut({ scope: 'others' })`)로 버튼을 잇는다. PIN 을 해시로 저장한다. 용량을 실측한다.
- **왜 이 방식인가**: 문구 정정은 되돌릴 수 있고 승인선에 걸리지 않는다. 동작을 새로 만들면(파기·세션 수집) 승인선에 걸린다.

### 3-1. 스토리지 원장화 3대 명세
- **1호 (원격 DB 스키마)**: 변경 없음.
- **2호 (저장 분기)**: `settings.twoFactorPin` 값 형식만 `sha256v1$<소금>$<64자 16진수>` 로 바뀐다(소금 = 설정 당시 uid + 무작위 16바이트). 저장 위치(이 기기 localStorage)는 그대로. `ourgoal_registered_devices_<uid>` 는 이 기기 한 대 항목으로 덮어쓴다.
- **3호 (뷰 전파)**: `renderSettingsScreen` → `paintSecurityCard`·`renderActiveDevicesList`·`paintCacheUsage`.

### 3-2. 전수 인터랙션 명세표
| UI 요소 | 위치 | 액션 | 기대 동작 | 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#badge2faStatus` | 보안 카드 | (표시) | `paintSecurityCard()` 가 PIN 설정 여부로 '앱 잠금 PIN 설정됨 (이 기기)' / '앱 잠금 PIN 꺼짐' | 텍스트 |
| `#btnSettingsSecurityRefresh` | 보안 카드 | 클릭 | `refreshSecurityStatus()` 재표시 | 상태별 토스트 |
| `#btnDeviceKillSwitch` | 보안 카드 | 클릭 | `killDeviceSession()` → `openLogoutOtherDevicesConfirmModal()` | 확인 창 / 게스트 안내 토스트 |
| `#logoutOtherDevicesBtn` | 계정 묶음 | 클릭 | 확인 창 → `#btnConfirmLogoutOtherModal` → `sb.auth.signOut({ scope: 'others' })` | 성공/실패 토스트 |
| `.btn-revoke-device` | 기기 목록 | 클릭 | 개별 차단 기능 없음 안내 + 일괄 로그아웃 창 | 토스트 |
| `#twoFactorSwitch`·`#btnSave2Fa`·`#btnConfirmDisable2Fa`·`#challenge2FaPin` | 계정 묶음·진입 | 입력·클릭 | `hashAppLockPin`·`verifyAppLockPin` | 토스트 |
| `#clearCacheBtn` | 데이터 묶음 | 클릭 | `caches.delete` 전부 → `paintCacheUsage()` | 지운 묶음 수 토스트 |

### 3-3. 유저 데이터 무손실 보존 규격
- 목표·기록·아바타·화면 설정: 건드리지 않는다. 캐시 비우기는 Cache API 만.
- PIN: 평문 사용자는 첫 성공 때 같은 PIN 의 해시로 바뀐다(잠김 없음). 해시 계산 불가 환경에서 평문 사용자는 평문 비교로 계속 통과.

### 3-4. 탈퇴 고지 문장 ↔ 실제 동작 대조표
| 바꾸기 전 문장 | 실제 코드 | 바꾼 문장 |
| :--- | :--- | :--- |
| 30일이 경과하면 모든 자산이 영구히 소각 | 파기 호출·크론 없음 | 탈퇴 신청만으로 지워지지 않고 서버에 남음, 현재 30일이 지나도 자동 삭제 안 됨, 삭제는 3번 방법으로 요청 |
| 탈퇴 신청 즉시 계정 비활성화·안전 보관 | 이 기기 로그아웃 + 계정 메타데이터 `account_status: pending_deletion` 기록 | 이 기기에서 로그아웃, 계정 정보에 탈퇴 신청 표시·시각 기록 |
| 30일 이내 재로그인 시 원클릭 100% 무손실 복구 | `checkPendingDeletionRestore`(js/auth-safety.js)는 이 기기 localStorage 의 `pendingDeletionAt` 이 있을 때만 복구 창 | 30일 안에 이 기기에서 다시 로그인하면 복구 안내 → 그대로 이어서 사용 |
| 30일 후 백업 포함 완전 자동 영구 파기 | 없음. 이 기기에서 30일 경과 후 로그인 시 로그아웃만 | 이 기기에서는 앱에 못 들어감, 서버 데이터는 자동 삭제 안 됨 |
| 개인정보보호법 제21조 준수(30일 유예 후 자동 파기) | 자동 파기 없음 | 제21조 내용 + 자동 파기를 아직 실행하지 않음 + 삭제 요청 경로 |
| 전자상거래법·통신비밀보호법에 따라 분리 보관 후 파기 | 분리 보관·파기 처리 없음 | 삭제(지금 서버에 남는 것·이 기기에 남는 것을 사실대로) |
| 탈퇴 시점 식별값 해시 별도 격리 보관 | 구현 없음 | 삭제 |
| (토스트) 30일 이내 로그인하면 언제든 복구 | 이 기기 한정 | 30일 안에 이 기기에서 다시 로그인하면 복구 + 삭제 요청 이메일 |

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- 기기 목록이 이 기기 한 대뿐이면 예전 '다른 기기 일괄 로그아웃' 창이 "다른 기기 없음"으로 막혔다 → 목록과 무관하게 열리도록 바꿨다(그래야 실제 `signOut others` 가 실행된다).
- `signOut` 실패 시 성공 토스트를 내지 않는다.
- 게스트(`guest_user`)는 세션이 없으므로 안내만.
- `crypto.subtle` 없는 비보안 접속: PIN 새로 켜기 거부(평문 저장 방지), 평문 사용자 검증은 유지.
- `js/components.js` 의 `handle인증_Item71Action` 은 평문 `pin` 을 넣을 수 있으나 화면 어디에도 연결돼 있지 않다(`og-task-71-action-btn` 마크업 없음). 들어오더라도 `verifyAppLockPin` 이 평문을 통과·이전한다.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. index.html 마크업 문구(보안 카드·계정 묶음·저장공간·저장 방식 안내) 수정.
2. `getRegisteredDevices`·`renderActiveDevicesList`·`openLogoutOtherDevicesConfirmModal` 수정.
3. PIN 블록(`hashAppLockPin`·`verifyAppLockPin`·설정·해제·진입 확인) 교체.
4. `paintSecurityCard`·`refreshSecurityStatus`·`killDeviceSession`·`paintCacheUsage`·`clearCacheBtn` 수정, `renderSettingsScreen` 에서 호출.
5. 탈퇴 팝업 문구·토스트 수정.
6. 거짓 문구를 고정하던 문자열 시험을 새 사실 문구로 교체(claims.json `retire` 에 사유).

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **반론 1**: "가짜 기기를 지우면 '다른 기기 일괄 로그아웃'이 영영 안 열린다." → 격파: 창을 목록과 분리해 항상 열리게 했고, 헤드리스 측정(M2_open)에서 창이 열리는 것을 확인했다.
- **반론 2**: "PIN 해시로 바꾸면 기존 사용자가 잠긴다." → 격파: 평문 저장값은 그대로 비교해 통과시키고 그때 해시로 바꾼다. 헤드리스 측정(M3_legacy)에서 평문 '4321' 사용자 통과·이전·이전 후 같은 PIN 통과·틀린 PIN 실패를 확인했다.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- grep: `14.2 MB` 0, `dev_tablet_tab` 0, `2단계 인증 보호 중` 0 (index.html).
- 헤드리스(reports/TASK-ES-346/measure-settings-honesty.js): PIN 미설정 배지 '꺼짐', 가짜 기기 생성 0·정리 후 0, 저장 PIN 평문 아님, 틀린 PIN 실패·맞는 PIN 통과, 평문 이전, 용량 '브라우저 추정치'.
- `npm test` 종료코드 0.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- 법정은 로그인 화면(실계정)을 열 수 없다 → 탈퇴 팝업·실제 `signOut others` 는 `unverified`(needs-login / needs-two-accounts).
- 법정 자동 브라우저의 `navigator.storage.estimate` 가 없으면 '측정 불가'로 표시되어 시나리오의 '추정치' 기대가 실패할 수 있다.
- 다른 기기에서의 탈퇴 복구 창(서버 메타데이터 기준)은 이번 범위 밖 — 후속 후보.
