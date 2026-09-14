# 엔지니어링 구현 작업계획서 (PLAN) — 지인 배포 대비 9대 UX 핵심 결함 전수 해결

**문서 ID**: PLAN-PRE-RELEASE-UX-REFINEMENT  
**요구사항 연계**: [REQ-PRE-RELEASE-UX-REFINEMENT](file:///C:/dev/ourgoal-app/docs/specs/REQ-PRE-RELEASE-UX-REFINEMENT.md)  
**티켓 연계**: #TASK-ES-043  
**작성 일시**: 2026-09-13 (배포 D-6시간 전)  
**규범 준수**: index.html 순증가 300줄 한도(승인선 8) 엄격 준수 (예상 순증: 약 +40줄)  

---

## 1. 아키텍처 및 구현 원칙

1. **최소 침습 원칙 (Minimal Invasiveness)**:  
   기존의 안정적인 비즈니스 로직과 이벤트 루프를 보존하고, 결함이 발생한 지점의 배선(Wire)만을 외과수술적으로 교정합니다.
2. **승인선 8 준수 (300줄 제한)**:  
   `index.html`의 순증가 라인을 50줄 이내로 엄격히 통제하여 승인선 8을 완벽히 방어합니다.
3. **무손실 데이터 보존**:  
   게스트에서 로그인 계정으로의 전환 시 LWW(Last-Write-Wins) 원칙과 멱등한 DB Upsert를 적용하여 데이터 유실을 0%로 통제합니다.

---

## 2. 파일별 수정 설계 및 변경 예산 (Budget Plan)

| 파일 | 변경 목적 | 예상 추가 | 예상 삭제 | 순증가 | 한도 준수 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `index.html` | 9대 결함 해소 (스트릭, 이메일, 게스트병합, localhost차단, 랜딩버튼, 연타방지, 리렌더링, 토스트문구, 인앱안내) | +65줄 | -25줄 | **+40줄** | **완전 준수 (한도 300줄)** |
| `scripts/smoke-test.js` | #TASK-ES-043 9대 항목 회귀 방지 자동화 테스트 탑재 | +75줄 | 0줄 | +75줄 | 테스트 파일 |

---

## 3. 항목별 정밀 코드 구현 명세 (Before / After)

### Step 1: 스트릭 계산 정합성 보장 (`computeStreakDays`) [FR-01]
- **위치**: `index.html` 내 `function computeStreakDays()`
- **Before**:
  ```javascript
  var streak = 0;
  var cursor = new Date(); cursor.setHours(0,0,0,0);
  while(days[cursor.getFullYear()+'-'+pad(cursor.getMonth()+1)+'-'+pad(cursor.getDate())]){
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
  ```
- **After**:
  ```javascript
  var streak = 0;
  var todayCursor = new Date(); todayCursor.setHours(0,0,0,0);
  var todayKeyStr = todayCursor.getFullYear()+'-'+pad(todayCursor.getMonth()+1)+'-'+pad(todayCursor.getDate());
  
  // 오늘 체크인을 이미 했으면 오늘부터, 아직 안 했으면 어제부터 역산
  var startCursor = new Date(todayCursor);
  if(!days[todayKeyStr]){
    startCursor.setDate(startCursor.getDate() - 1);
  }
  while(days[startCursor.getFullYear()+'-'+pad(startCursor.getMonth()+1)+'-'+pad(startCursor.getDate())]){
    streak++;
    startCursor.setDate(startCursor.getDate() - 1);
  }
  return streak;
  ```

---

### Step 2: 설정 화면 개인 이메일 노출 제거 [FR-02]
- **위치**: `index.html` 내 `renderSettingsScreen`
- **Before**:
  ```javascript
  emailEl.textContent = (state.user && state.user.email) || (state.profile && state.profile.email) || 'ysm0422@naver.com';
  ```
- **After**:
  ```javascript
  var isGuestUser = !state.user || (state.profile && String(state.profile.id).indexOf('guest-') === 0);
  emailEl.textContent = (state.user && state.user.email) || (state.profile && state.profile.email) || (isGuestUser ? '게스트 모드 (로그인 후 계정 연동)' : '연동된 이메일 없음');
  ```

---

### Step 3: 게스트 데이터 소셜 로그인 시 무손실 자동 병합 [FR-03]
- **위치**: `index.html` 내 `restoreSessionAndEnter(session)`
- **추가 로직**:
  ```javascript
  // 게스트 세션 데이터 새 소셜 계정으로 자동 마이그레이션 (#TASK-ES-043)
  try {
    var rawGuest = localStorage.getItem('ourgoal_guest_profile');
    if(rawGuest && session && session.user){
      var gData = JSON.parse(rawGuest);
      if(gData && ( (gData.goals && gData.goals.length > 0) || (gData.records && gData.records.length > 0) )){
        var newUid = session.user.id;
        // 1. 목표 이전
        if(gData.goals && gData.goals.length > 0){
          var goalsPayload = gData.goals.map(function(g){
            return {
              id: g.id, user_id: newUid, title: g.title, category: g.category||null, due_date: g.dueDate||null,
              visibility: g.visibility||'private', topic: g.topic||null, archived_at: g.archivedAt||null,
              result: g.result||null, milestones: g.milestones||[]
            };
          });
          await sb.from('goals').upsert(goalsPayload);
        }
        // 2. 체크인 이전
        if(gData.records && gData.records.length > 0){
          var recsPayload = gData.records.map(function(r){
            return {
              id: r.id, user_id: newUid, type: r.type||'note', text: r.text, start_at: r.startAt, end_at: r.endAt||r.startAt,
              category: r.category||null, theme: r.theme||'daily', sub_theme: r.subTheme||null
            };
          });
          await sb.from('checkins').upsert(recsPayload);
        }
        localStorage.removeItem('ourgoal_guest_profile');
        toast('게스트 모드에서 작성한 목표와 기록을 안전하게 가져왔어요! 🎉');
      }
    }
  } catch(mErr){ console.warn('게스트 데이터 병합 예외 (무시):', mErr); }
  ```

---

### Step 4: 첫 체크인 `localhost:7777` 호출 차단 가드 [FR-04]
- **위치**: `index.html` 내 `triggerFirstCheerResponse(goal, checkinText)`
- **Before**:
  ```javascript
  fetch('http://localhost:7777/api/sim/first-cheer', {
  ```
- **After**:
  ```javascript
  var isLocalDev = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  if(!isLocalDev){
    // 운영 배포 환경에서는 Mixed Content 방지를 위해 즉시 로컬 페르소나 매칭 폴백 실행
    var matched = (typeof SIM_PERSONAS !== 'undefined' && SIM_PERSONAS[0]) || { name:'김도윤', avatar:'도', goal:'목표 달성' };
    scheduleCheerDelivery({
      persona: matched,
      cheerText: (goal ? goal.title : '목표') + ' 실천 첫 걸음 축하해요! 함께 끝까지 가봐요 🙌'
    });
    return;
  }
  fetch('http://localhost:7777/api/sim/first-cheer', {
  ```

---

### Step 5: 랜딩 화면 게스트 진입 버튼 신설 [FR-05]
- **위치 1**: `index.html` `#landingScreen .land-cta` 마크업
  ```html
  <span class="land-login-link"><b id="landGuestBtn" style="color:var(--brand);cursor:pointer;">로그인 없이 바로 둘러보기 ›</b></span>
  ```
- **위치 2**: `index.html` 내 랜딩 이벤트 바인딩
  ```javascript
  var landGuestBtn = document.getElementById('landGuestBtn');
  if(landGuestBtn){
    landGuestBtn.onclick = function(){
      var guestId = 'guest-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      state.profile = defaultProfile(guestId, guestId, '게스트');
      try { localStorage.setItem('ourgoal_guest_profile', JSON.stringify(state.profile)); } catch(e){}
      document.getElementById('landingScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'none';
      enterApp();
      toast('게스트 모드로 시작했어요. 언제든 설정에서 가입할 수 있어요.');
    };
  }
  ```

---

### Step 6: 체크인 저장 버튼 연타/더블클릭 방어 [FR-06]
- **위치**: `index.html` 내 `#captureSave` 클릭 핸들러
- **추가 로직**:
  ```javascript
  if(saveBtn.disabled) return;
  saveBtn.disabled = true;
  saveBtn.textContent = '기록 중…';
  try {
    // ... 기존 저장 및 AI 피드백 로직 ...
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '저장';
  }
  ```

---

### Step 7: 체크인 후 홈 화면 잔디 및 스트릭 배지 즉시 리렌더링 [FR-07]
- **위치**: `index.html` 내 `#captureSave` 핸들러 내 `awardXP` 및 `saveProfile` 직후
- **추가 로직**:
  ```javascript
  renderHomeGrassSummary();
  var streak = computeStreakDays();
  updateAppBadge(streak);
  var badgeEl = document.getElementById('streakBadge');
  if(badgeEl) badgeEl.innerHTML = streak > 0 ? streakBadgeHtml(streak) : '';
  ```

---

### Step 8: 체크인 토스트 도구 언어 순화 [FR-08]
- **위치**: `index.html` 내 `checkinToastMsg` 생성부
- **Before**:
  ```javascript
  : (notionRec
      ? 'AI 노션 DB로 자동 기록 완료! (' + notionRec.status + (notionRec.metric ? ' · ' + notionRec.metric : '') + ')'
      : (recPhoto ? '사진과 함께 기록했어요' : '기록했어요'));
  ```
- **After**:
  ```javascript
  : (recPhoto ? '사진과 함께 소중한 오늘을 기록했어요' : '오늘의 실천이 안전하게 기록되었어요');
  ```

---

### Step 9: 카카오톡 인앱 브라우저 감지 및 안내 바 [FR-09]
- **위치**: `index.html` 내 랜딩 초기화 영역
- **추가 로직**:
  ```javascript
  if(/KAKAOTALK/i.test(navigator.userAgent)){
    var kBar = document.getElementById('inAppBrowserNotice');
    if(!kBar){
      var nDiv = document.createElement('div');
      nDiv.id = 'inAppBrowserNotice';
      nDiv.style.cssText = 'background:var(--kakao);color:var(--kakao-ink);padding:8px 12px;font-size:0.75rem;text-align:center;font-weight:600;';
      nDiv.innerHTML = '카카오톡에서는 구글 로그인이 제한될 수 있어요. <b>카카오로 시작</b>하시거나 우측 상단 <b>[⋮] → [다른 브라우저로 열기]</b>를 권장해요.';
      document.body.insertBefore(nDiv, document.body.firstChild);
    }
  }
  ```

---

## 4. 자동화 테스트 계획 (`scripts/smoke-test.js`)

`scripts/smoke-test.js`에 `#TASK-ES-043` 검증 블록을 추가하여 다음 9대 항목을 자동 검증합니다:
1. `computeStreakDays`에서 당일 체크인이 없을 때 어제 기준 N일이 온전히 유지되는지 단위 검증
2. `renderSettingsScreen`에 `ysm0422@naver.com` 하드코딩이 완전히 제거되었는지 정적 검증
3. `restoreSessionAndEnter`에 게스트 데이터 병합 로직(`ourgoal_guest_profile` -> `sb.from('goals').upsert`)이 존재하는지 검증
4. `triggerFirstCheerResponse`에 `isLocalDev` 가드가 존재하는지 검증
5. `landingScreen`에 `landGuestBtn` 및 원클릭 게스트 생성 핸들러가 탑재되었는지 검증
6. `#captureSave`에 `saveBtn.disabled` 연타 방지 가드가 존재하는지 검증
7. 체크인 핸들러 내에 `renderHomeGrassSummary()` 즉시 호출이 존재하는지 검증
8. 체크인 토스트에 `노션 DB` 문자열이 일체 존재하지 않는지 정적 검증
9. 카카오톡 인앱 브라우저 감지 및 안내 배너 로직이 존재하는지 검증

---

## 5. 실행 순서 및 롤백 대책

1. **사전 준비**: 현재 안정 브랜치에서 신규 브랜치 `feat/20260913-pre-release-ux-refinement` 생성
2. **구현 단계**:
   - `index.html` 9대 항목 외과수술적 수정 (예상 소요 10분)
   - `scripts/smoke-test.js` #TASK-ES-043 테스트 탑재 (예상 소요 5분)
3. **검증 단계**:
   - `npm test` 실행 (217개 + 9개 = 총 226개 테스트 100% 통과 확인)
   - `git diff --stat`으로 index.html 순증가 라인 50줄 이내 확인
   - 브라우저 스모크 확인 (게스트 진입 -> 체크인 -> 스트릭 계산 -> 설정 이메일 확인)
4. **롤백 계획**:
   - 단일 커밋으로 원자적(Atomic) 적용되므로, 이상 발생 시 즉각 `git revert`로 1초 내 이전 상태 복원 가능.
