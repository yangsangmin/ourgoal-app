/**
 * OurGoal Boot Comm Seeds (앱 시동 — 상태 기관에 맡기는 초깃값: 예시 모임 · 공유 함수 · 피드 캐시 · 공유 팀 불러옴 표시)
 *
 * 앱이 뜰 때 한 번 도는 상태 정의 줄과 window 대입 줄을 원래 순서·원래 자리 그대로 구역 함수로 묶었다. 글자는 통로 접두 말고 그대로다.
 * bootSampleGroups — 예시 모임 목록(배열)을 상태 기관에 MOCK_GROUPS 로 맡긴다.
 * bootShareHandle — 공유 엔진에 넘기는 공유 함수를 상태 기관에 shareContent 로 맡기고 window 에도 단다.
 * bootFeedCacheState — 소통 피드 캐시의 초깃값(아직 안 불러옴 = null)을 상태 기관에 맡긴다.
 * bootSharedGroupsFlag — 공유 팀을 아직 불러오지 않았다는 표시(false)를 window 에 단다.
 * #TASK-ES-676(구역 이전 2차 — 남은 로드 시점 문(상태 기관 정의 줄 · window 대입 줄)을 구역 함수로): index.html 인라인 IIFE 의 연속 구역(이전 전 2787~2932 · 2933~2953 · 2961~2963 · 2970~2970줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js mode:"region")로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 구역 안에서만 쓰던 var 는 그 함수의 지역 변수가 됐다.
 * 로드 중 바로 돌던 문들은 순서 그대로 함수 하나로 감싸 index.html 원래 자리에서 부른다. index.html 은 IIFE 머리에서 그 함수를 같은 이름으로 가져온다.
 * 설계: docs/architecture/CELL-REGISTRY-DESIGN.md 3.4절 · 5절 · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalUiHelpers = global.OurgoalUiHelpers || {};

  /* ---- 이전 전 index.html 2787~2932줄(#TASK-ES-676 생성기 표지) ---- */
  function bootSampleGroups() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-448] AI_DISCLOSURE_NOTICE · SIM_PERSONAS · MOCK_PEOPLE · daysFromNow → js/tabs/comm/sample-data.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */

  window.OurgoalAppState.define('MOCK_GROUPS', [
    { id:'g-workshop', isMock:true, icon:'🏢', name:'2026 하반기 전략 워크숍 TF', topic:'career/기획·전략', region:'서울 강남구', members:6, maxMembers:10, roomType:'small', inviteCode:'WORK-TF10', ownerName:'상민', progress:65, cadence:'주 3회', endDate:L.daysFromNow(21),
      desc:'회사 워크숍 장소·예산 확정부터 부서별 세션 발표, 팀빌딩 레크리에이션까지 성공적으로 완주해요', rule:'주 3회 담당 TF별 준비 체크리스트 및 마일스톤 인증',
      weeklyTarget:18, weeklyDone:12,
      roster:[{n:'상민',c:4},{n:'민혁',c:3},{n:'지우',c:3},{n:'태성',c:2}],
      activity:['상민님이 워크숍 대관 계약서 및 타임테이블을 공유했어요','지우님이 팀빌딩 아이스브레이킹 게임 기획안을 올렸어요'],
      verifications: [
        { id:'v-ws-1', userName:'상민', userAvatar:'🏢', time:'오늘 10:30', photoUrl:'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&auto=format&fit=crop&q=80', note:'워크숍 행사장 답사 및 빔프로젝터/음향 장비 체크 완료! 차질 없이 준비 중입니다 💼', cheers: 12 }
      ],
      teamGoals:[
        { id:'tg-ws-1', title:'2026 하반기 전사 전략 워크숍 준비 및 실행', dueDate:L.daysFromNow(21), milestones:[
          { id:'tgm-ws-1a', title:'1단계: 장소/숙소 대관 및 워크숍 예산안 최종 승인', status:'done', tasks:[
            { id:'t-ws-1a1', title:'행사장 대관 계약 체결 및 음향·빔프로젝터 점검', done:true },
            { id:'t-ws-1a2', title:'시간대별 세션 및 휴식 타임테이블 배포', done:true }
          ] },
          { id:'tgm-ws-1b', title:'2단계: 부서별 세션 아젠다 및 팀빌딩 프로그램 확정', status:'doing', tasks:[
            { id:'t-ws-1b1', title:'부서별 세션 발표자료(1page) 취합하기', done:true },
            { id:'t-ws-1b2', title:'팀빌딩 아이스브레이킹 게임 3종 및 상품 준비', done:false }
          ] },
          { id:'tgm-ws-1c', title:'3단계: 워크숍 본행사 진행 및 팀별 액션플랜 도출·회고', status:'todo', tasks:[
            { id:'t-ws-1c1', title:'워크숍 본행사 진행 및 타운홀 비전 공유', done:false },
            { id:'t-ws-1c2', title:'결과 보고서 작성 및 2027 후속 액션플랜 도출', done:false }
          ] }
        ] }
      ] },
    { id:'g-travel', isMock:true, icon:'✈️', name:'제주 3박4일 단체 힐링여행', topic:'hobby/여행·캠핑', region:'제주', members:4, maxMembers:6, roomType:'small', inviteCode:'TRIP-JEJU', ownerName:'유진', progress:70, cadence:'주 3회', endDate:L.daysFromNow(14),
      desc:'낙오자 없이 전원 만족하는 제주 단체여행! 항공·숙소·맛집·드라이브 코스 완벽 준비', rule:'주 3회 여행 준비 미션(동선 투표, 렌터카 예약, 짐 챙기기) 인증',
      weeklyTarget:12, weeklyDone:8,
      roster:[{n:'유진',c:3},{n:'서연',c:3},{n:'현우',c:2}],
      activity:['유진님이 애월 독채 펜션 예약 영수증을 인증했어요','서연님이 일자별 맛집 지도 동선을 완성했어요'],
      verifications: [
        { id:'v-tr-1', userName:'유진', userAvatar:'✈️', time:'오늘 09:15', photoUrl:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80', note:'제주 오션뷰 숙소 예약 완료! 바비큐 파티 준비물도 체크했습니다 🌴', cheers: 10 }
      ],
      teamGoals:[
        { id:'tg-tr-1', title:'낙오자 없는 제주 3박 4일 단체 여행 완성', dueDate:L.daysFromNow(14), milestones:[
          { id:'tgm-tr-1a', title:'1단계: 항공권 발권 및 독채 숙소 예약 확정', status:'done', tasks:[
            { id:'t-tr-1a1', title:'김포-제주 왕복 항공권 전원 발권 완료', done:true },
            { id:'t-tr-1a2', title:'애월 오션뷰 독채 펜션 예약 및 바비큐 확정', done:true }
          ] },
          { id:'tgm-tr-1b', title:'2단계: 렌터카 배차, 일자별 드라이브 코스 및 맛집 리스트업', status:'doing', tasks:[
            { id:'t-tr-1b1', title:'7인승 카니발 렌터카 배차 및 제2운전자 사전 등록', done:true },
            { id:'t-tr-1b2', title:'일자별 드라이브 코스 및 흑돼지 맛집 단체석 예약', done:false }
          ] },
          { id:'tgm-tr-1c', title:'3단계: 안전 여행 완주, 공용 경비 정산 및 베스트 샷 앨범 공유', status:'todo', tasks:[
            { id:'t-tr-1c1', title:'여행 필수품/상비약 체크리스트 점검 완료', done:false },
            { id:'t-tr-1c2', title:'모임통장 공용 경비 1/N 정산 및 앨범 공유', done:false }
          ] }
        ] }
      ] },
    { id:'g-marathon-pair', isMock:true, icon:'🏃', name:'친구와 1:1 마라톤 완주방', topic:'health/러닝·마라톤', region:'온라인', members:1, maxMembers:2, roomType:'pair', inviteCode:'RUN-PAIR2', ownerName:'민혁', progress:50, cadence:'주 3회', endDate:L.daysFromNow(30),
      desc:'친구와 둘이서 1:1로 서로의 페이스메이커가 되어 마라톤 풀코스/하프 완주를 달성해요', rule:'주 3회 러닝 거리·페이스 또는 완주 훈련 인증샷 업로드',
      weeklyTarget:6, weeklyDone:3,
      roster:[{n:'민혁',c:3}],
      activity:['민혁님이 10km 빌드업 러닝 48분 페이스를 인증했어요'],
      verifications: [
        { id:'v-mp-1', userName:'민혁', userAvatar:'🏃', time:'오늘 07:10', photoUrl:'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop&q=80', note:'오늘 아침 10km 지속주 4분 50초 페이스 완료! 친구와 함께 완주 목표 달릴 준비 완료 🔥', cheers: 5 }
      ],
      teamGoals:[
        { id:'tg-mp-1', title:'둘이서 이번 달 누적 84km 달리기', dueDate:L.daysFromNow(30), milestones:[
          { id:'tgm-mp-1a', title:'1단계: 1인당 42km 달성', status:'doing' },
          { id:'tgm-mp-1b', title:'2단계: 하프 마라톤 거리 완주', status:'todo' }
        ] }
      ] },
    { id:'g-marathon-small', isMock:true, icon:'🏃', name:'5인 소그룹 마라톤 완주방', topic:'health/러닝·마라톤', region:'온라인', members:3, maxMembers:5, roomType:'small', inviteCode:'RUN-CREW5', ownerName:'지우', progress:60, cadence:'주 3회', endDate:L.daysFromNow(45),
      desc:'5인 소그룹으로 뭉쳐 낙오자 없이 함께 달리는 마라톤 완주 크루', rule:'주 3회 5km 이상 러닝 기록 또는 완주 인증샷',
      weeklyTarget:15, weeklyDone:9,
      roster:[{n:'지우',c:4},{n:'태성',c:3},{n:'재훈',c:2}],
      activity:['지우님이 15km 장거리 지속주를 완료했어요','태성님이 5km 인터벌 러닝을 인증했어요'],
      verifications: [
        { id:'v-ms-1', userName:'지우', userAvatar:'🏃‍♀️', time:'오늘 06:40', photoUrl:'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&auto=format&fit=crop&q=80', note:'새벽 15km LSD 장거리주 완료! 5인 소그룹 멤버들 모두 완주 파이팅입니다 🏃‍♀️', cheers: 9 }
      ],
      teamGoals:[
        { id:'tg-ms-1', title:'크루 5인 전원 하프 마라톤 완주', dueDate:L.daysFromNow(45), milestones:[
          { id:'tgm-ms-1a', title:'1단계: 전원 10km 완주', status:'done' },
          { id:'tgm-ms-1b', title:'2단계: 전원 15km LSD 훈련', status:'doing' }
        ] }
      ] },
    { id:'g0', isMock:true, icon:'🏋️', name:'크로스핏 와드(WOD) 정복대', topic:'health/크로스핏·피트니스', region:'서울 마포구', members:89, maxMembers:100, roomType:'open', progress:74, cadence:'매일', endDate:L.daysFromNow(30),
      desc:'오늘의 WOD 기록과 운동 인증샷을 공유하며 한계 돌파!', rule:'오늘의 WOD 시간·무게 또는 체육관 인증샷 업로드',
      weeklyTarget:280, weeklyDone:205,
      roster:[{n:'민혁',c:21},{n:'지우',c:19},{n:'태성',c:16},{n:'수아',c:14},{n:'재훈',c:11}],
      activity:['민혁님이 오늘의 WOD Fran 3분 42초 인증샷을 올렸어요','지우님이 크로스핏 박스 출석 사진을 공유했어요','태성님이 풀업 15회 달성 인증을 남겼어요'],
      verifications: [
        { id:'v0-1', userName:'민혁', userAvatar:'🏋️', time:'오늘 07:15', photoUrl:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80', note:'오늘 Fran WOD 3분 42초 PR 달성! 온몸이 불타는 느낌 🔥', cheers: 8 },
        { id:'v0-2', userName:'지우', userAvatar:'🏃‍♀️', time:'오늘 08:30', photoUrl:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80', note:'아침 박스 출석 완료! 클린앤저크 55kg 성공했습니다 💪', cheers: 12 },
        { id:'v0-3', userName:'태성', userAvatar:'⚡', time:'어제 19:40', photoUrl:'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&auto=format&fit=crop&q=80', note:'퇴근 후 크로스핏 버피 100개 완료! 다들 화이팅입니다', cheers: 15 }
      ],
      teamGoals:[
        { id:'tg-g0-1', title:'크루 전체 이번 달 와드 250회 정복', dueDate:L.daysFromNow(20), milestones:[
          { id:'tgm-g0-1a', title:'1단계: 100회 돌파', status:'done' },
          { id:'tgm-g0-1b', title:'2단계: 200회 돌파', status:'doing' },
          { id:'tgm-g0-1c', title:'3단계: 250회 완수 및 팀 정모', status:'todo' }
        ] }
      ] },
    { id:'g1', isMock:true, icon:'💪', name:'벤치프레스 100kg 달성 팀', topic:'health/헬스·근력', region:'서울 강남구', members:128, progress:68, cadence:'주 3회', endDate:L.daysFromNow(24),
      desc:'같은 목표를 가진 사람들과 기록을 공유해요', rule:'운동한 날 무게·세트를 남기면 인증 완료',
      weeklyTarget:300, weeklyDone:214,
      roster:[{n:'민준',c:14},{n:'하늘',c:12},{n:'도윤',c:11},{n:'서아',c:9},{n:'지호',c:7}],
      activity:['민준님이 벤치 85kg 5회 인증했어요','하늘님이 7일 연속 인증을 달성했어요','도윤님이 이번 주 목표를 채웠어요'],
      verifications: [
        { id:'v1-1', userName:'민준', userAvatar:'💪', time:'오늘 08:20', photoUrl:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80', note:'벤치프레스 85kg 5x5 성공! 다음 주 90kg 도전', cheers: 6 },
        { id:'v1-2', userName:'하늘', userAvatar:'🏋️', time:'어제 21:00', photoUrl:'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80', note:'가슴 운동 루틴 완료! 펌핑감 최고네요', cheers: 9 }
      ],
      teamGoals:[
        { id:'tg-g1-1', title:'이번 달 전체 300회 인증 달성', dueDate:L.daysFromNow(20), milestones:[
          { id:'tgm-g1-1a', title:'상반월 150회 인증', status:'done' },
          { id:'tgm-g1-1b', title:'하반월 150회 인증', status:'doing' }
        ] }
      ] },
    { id:'g2', isMock:true, icon:'📚', name:'자격증 스터디', topic:'study/자격증·시험', region:'온라인', members:342, progress:45, cadence:'매일', endDate:L.daysFromNow(51),
      desc:'시험 준비, 서로 진도를 확인하며 함께 가요', rule:'그날 공부한 분량을 기록하면 인증 완료',
      weeklyTarget:800, weeklyDone:361,
      roster:[{n:'서연',c:21},{n:'유진',c:18},{n:'현우',c:15},{n:'민서',c:13},{n:'태호',c:10}],
      activity:['서연님이 기출 3회독을 마쳤어요','유진님이 오답노트 20문항을 올렸어요','민서님이 오늘도 인증했어요'],
      teamGoals:[] },
    { id:'g3', isMock:true, icon:'🏘️', name:'동네 아침 루틴', topic:'mind/기상·수면', region:'서울 마포구', members:76, progress:82, cadence:'매일', endDate:L.daysFromNow(9),
      desc:'우리 동네 사람들과 아침 습관 만들기', rule:'오전 8시 전에 기록을 남기면 인증 완료',
      weeklyTarget:180, weeklyDone:148,
      roster:[{n:'다현',c:19},{n:'준서',c:17},{n:'예린',c:16},{n:'상우',c:12},{n:'가은',c:8}],
      activity:['다현님이 19일 연속 아침 인증 중이에요','준서님이 새벽 러닝을 인증했어요','예린님이 응원을 3개 보냈어요'],
      teamGoals:[] },
    { id:'g4', isMock:true, icon:'🏃', name:'첫 10km 완주 클럽', topic:'health/러닝·마라톤', region:'경기 성남시', members:205, progress:57, cadence:'주 3회', endDate:L.daysFromNow(38),
      desc:'러닝 입문자끼리 페이스 공유하며 10km까지', rule:'러닝 거리·페이스를 남기면 인증 완료',
      weeklyTarget:400, weeklyDone:236,
      roster:[{n:'수민',c:16},{n:'재영',c:14},{n:'하은',c:11},{n:'정우',c:9},{n:'소라',c:6}],
      activity:['수민님이 7km 완주를 인증했어요','재영님이 개인 최고 페이스를 갱신했어요','하은님이 첫 5km를 완주했어요'],
      verifications: [
        { id:'v4-1', userName:'수민', userAvatar:'🏃', time:'오늘 06:45', photoUrl:'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop&q=80', note:'상쾌한 아침 7km 러닝 완료! 날씨가 정말 좋습니다', cheers: 11 },
        { id:'v4-2', userName:'재영', userAvatar:'👟', time:'어제 19:30', photoUrl:'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&auto=format&fit=crop&q=80', note:'5km 페이스 4분 50초 갱신 성공!', cheers: 14 }
      ],
      teamGoals:[] },
    { id:'g5', isMock:true, icon:'✍️', name:'매일 한 편 글쓰기', topic:'hobby/글쓰기', region:'온라인', members:97, progress:73, cadence:'매일', endDate:L.daysFromNow(16),
      desc:'짧아도 좋으니 매일 한 편씩 쓰는 사람들', rule:'글 링크나 분량을 남기면 인증 완료',
      weeklyTarget:250, weeklyDone:191,
      roster:[{n:'윤아',c:22},{n:'세훈',c:18},{n:'미래',c:15},{n:'동현',c:10},{n:'채원',c:7}],
      activity:['윤아님이 22일 연속 글쓰기를 이어가고 있어요','세훈님이 에세이 1편을 올렸어요','미래님이 응원을 보냈어요'],
      teamGoals:[] },
    { id:'g6', isMock:true, icon:'💰', name:'6개월 1000만원 모으기', topic:'career/절약·가계부', region:'온라인', members:412, progress:39, cadence:'주말', endDate:L.daysFromNow(74),
      desc:'가계부 인증하며 목표 금액까지 함께', rule:'주간 지출 정리와 저축액을 남기면 인증 완료',
      weeklyTarget:600, weeklyDone:234,
      roster:[{n:'지훈',c:12},{n:'서영',c:11},{n:'민재',c:9},{n:'예나',c:8},{n:'우진',c:5}],
      activity:['지훈님이 이번 주 저축 목표를 채웠어요','서영님이 무지출 3일을 인증했어요','민재님이 가계부를 공유했어요'],
      teamGoals:[] }
  ]);
  } /* bootSampleGroups */
  /* ---- 이전 전 index.html 2933~2953줄(#TASK-ES-676 생성기 표지) ---- */
  function bootShareHandle() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* [#TASK-ES-448] EXTERNAL_DATA · CREATOR_TEMPLATES → js/tabs/comm/sample-data.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] VISIBILITY_LABELS → js/tabs/comm/sample-data.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] TOPICS · topicLabel · topicPill · REGIONS · regionPickerHtml · wireRegionPicker · normalizeSubName · customSubsFor · categoryPickerHtml · wireCategoryPicker → js/tabs/goals/topic-region-picker.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */
  /* [#TASK-ES-448] SHARE_PLATFORMS · SHARE_CANVAS_DIMS · SHARE_DOMAIN → js/tabs/comm/share-card.js 로 옮김(인라인 스크립트 세포화 P2 — 앞 주석 포함) */

  /* 범용 외부 SNS 공유 엔진: js/viral-sharing.js 위임 */













  window.OurgoalAppState.define('shareContent', function(opts){ return window.OurgoalViralSharing ? window.OurgoalViralSharing.shareContent(opts) : Promise.resolve(); });
  window.shareContent = window.OurgoalAppScope.scope.shareContent;
  } /* bootShareHandle */

  /* ---- 이전 전 index.html 2961~2963줄(#TASK-ES-676 생성기 표지) ---- */
  function bootFeedCacheState() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ 소통 피드 (Supabase feed_posts, 실시간 동기화) ============ */
  // null=아직 안 불러옴, 로드 후 배열
  window.OurgoalAppState.defineVar('FEED_POSTS_CACHE', null);
  } /* bootFeedCacheState */

  /* ---- 이전 전 index.html 2970~2970줄(#TASK-ES-676 생성기 표지) ---- */
  function bootSharedGroupsFlag() { /* [#TASK-ES-676] 로드 중 구역 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(typeof window !== 'undefined'){ window.SHARED_GROUPS_LOADED = false; }
  } /* bootSharedGroupsFlag */

  K.bootSampleGroups = bootSampleGroups;
  K.bootShareHandle = bootShareHandle;
  K.bootFeedCacheState = bootFeedCacheState;
  K.bootSharedGroupsFlag = bootSharedGroupsFlag;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
