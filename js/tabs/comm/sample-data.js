/**
 * OurGoal Comm Sample Data (소통 탭 — 둘러보기용 예시 자료)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G152.
 *   옮긴 선언(이전 전 줄): AI_DISCLOSURE_NOTICE(30182~30185) · SIM_PERSONAS(30186~30188) · MOCK_PEOPLE(30189~30189) · daysFromNow(30190~30193) · EXTERNAL_DATA(30339~30347) · CREATOR_TEMPLATES(30348~30375) · VISIBILITY_LABELS(30377~30380)
 * AI 표시 문구(AI_DISCLOSURE_NOTICE)·예시 사람(SIM_PERSONAS·MOCK_PEOPLE)·날짜 도우미(daysFromNow)·외부 자료(EXTERNAL_DATA)·크리에이터 템플릿(CREATOR_TEMPLATES)·공개 범위 이름(VISIBILITY_LABELS).
 * 예시 모임 MOCK_GROUPS 는 초기값이 로드 중에 daysFromNow → 인라인 pad 를 불러 index.html 에 남았다. window.CREATOR_TEMPLATES 노출 문도 제자리.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ RENDER: COMM ============ */
  /* ============ 200인 가상 페르소나 자율 활동 데이터 (20대~50대 남녀 각 100인씩 총 200인) ============ */
  var AI_DISCLOSURE_NOTICE = '이는 ai봇 생성물입니다 앱 런칭 초기에 앱 활용을 보여드리기 위함이고 곧 실제 사용자의 제작물로 가득 찰 것입니다';

  // [TASK-ES-332] 헌법 제4조 제1항 1호/7호 및 결심 490108 준수: 가상 페르소나 40명 전면 삭제 (0건화)
  var SIM_PERSONAS = [];

  var MOCK_PEOPLE = SIM_PERSONAS;

  function daysFromNow(n){
    var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n);
    return d.getFullYear()+'-'+L.pad(d.getMonth()+1)+'-'+L.pad(d.getDate());
  }

  /* 외부 연동 샘플 데이터 (스트라바·건강앱 mock) */
  var EXTERNAL_DATA = [
    { id:'x1', src:'Strava', icon:'🏃', text:'10km 러닝 43분 페이스 달성' },
    { id:'x2', src:'Strava', icon:'🚴', text:'자전거 32km 라이딩 1시간 12분' },
    { id:'x3', src:'헬스 앱', icon:'🏋️', text:'스쿼트 120kg 1RM 기록' },
    { id:'x4', src:'헬스 앱', icon:'👟', text:'오늘 걸음 수 12,480보 달성' },
    { id:'x5', src:'수면 트래커', icon:'😴', text:'수면 7시간 20분 · 깊은 수면 1시간 45분' }
  ];

  /* Ⓜ️ 인증 크리에이터 템플릿 (mock) — 마일스톤별 세부 할 일 포함 */
  var CREATOR_TEMPLATES = [
    { id:'t1', creator:'마인드코치 지윤', badge:'상담심리학 석사 · 상담 경력 8년', title:'상담심리학 기반 멘탈케어 4주 코스',
      desc:'하루 10분, 흔들리는 마음을 스스로 다잡는 4주 루틴', category:'etc', weeks:4, users:1240,
      ms:[
        { title:'1주차 · 내 감정 알아차리기', tasks:['자기 전 감정 단어 3개로 오늘 적기','기분이 요동친 순간 1개 기록하기','감정 일기 앱/노트 정하고 알림 맞추기'] },
        { title:'2주차 · 스트레스 원인 찾기', tasks:['스트레스 상황 5개 적고 공통점 찾기','내가 통제 가능/불가능한 것 나누기','회피 대신 대처한 사례 1개 쓰기'] },
        { title:'3주차 · 이완 습관 만들기', tasks:['4-7-8 호흡 하루 2회 하기','명상 앱으로 10분 세션 5회 채우기','자기 전 스마트폰 30분 끄기'] },
        { title:'4주차 · 나를 지지하는 말 만들기', tasks:['나에게 하는 응원 문장 3개 만들기','힘든 순간에 꺼내 볼 문장 저장하기','4주 회고 · 달라진 점 3줄 정리'] }
      ] },
    { id:'t2', creator:'슈퍼삼촌 태호', badge:'유아교육 전공 · 주말 돌봄 5년차', title:'조카와 함께하는 주말 활동 루틴',
      desc:'스마트폰 없이도 아이가 몰입하는 주말 4주 플랜', category:'etc', weeks:4, users:612,
      ms:[
        { title:'주말 1 · 밖에서 뛰놀기', tasks:['집 근처 공원/놀이터 3곳 후보 정하기','물통·간식·응급밴드 가방 미리 싸기','활동 사진 3장 남기기'] },
        { title:'주말 2 · 같이 만들어 먹기', tasks:['아이가 고른 간식 레시피 1개 정하기','장보기 목록 같이 쓰기','설거지까지 같이 하기'] },
        { title:'주말 3 · 책과 이야기', tasks:['도서관에서 그림책 2권 빌리기','목소리 바꿔가며 읽어주기','책 내용으로 질문 3개 주고받기'] },
        { title:'주말 4 · 규칙 있는 놀이', tasks:['보드게임 1개 규칙 같이 익히기','졌을 때 감정 이야기 나누기','다음 달 하고 싶은 활동 정하기'] }
      ] },
    { id:'t3', creator:'삼백일운동 현우', badge:'생활스포츠지도사 2급 · 수강생 900명', title:'헬스 초보자 12주 근력 루틴',
      desc:'헬스장이 처음이어도 3개월 뒤 3대 운동이 되는 계획', category:'exercise', weeks:12, users:3180,
      ms:[
        { title:'0~2주차 · 기록 세팅과 자세', tasks:['운동 기록 앱/노트 만들기','스쿼트·벤치·데드 빈 봉 자세 영상 찍기','주 3회 요일 고정하기'] },
        { title:'3~6주차 · 루틴 몸에 익히기', tasks:['전신 루틴 주 3회 6주 채우기','매 세션 무게·횟수 기록하기','단백질 하루 체중×1.2g 챙기기'] },
        { title:'7~9주차 · 중량 올리기', tasks:['3대 중량 각 5kg씩 올리기','부위별 보조운동 2개 추가','수면 7시간 주 5일 지키기'] },
        { title:'10~12주차 · 목표 기록 도전', tasks:['1RM 측정일 정하기','측정 전 주 디로드 하기','시작 전후 사진·기록 비교 정리'] }
      ] }
  ];

  /* #TASK-ES-179: 가짜 잇템 통계 목데이터 완전 제거 (헌법 제4조 준수) */

  var VISIBILITY_LABELS = { public:'전체 공개', theme:'같은 테마 공개', team:'팀원 공개', private:'나만 보기' };

  K.AI_DISCLOSURE_NOTICE = AI_DISCLOSURE_NOTICE;
  K.SIM_PERSONAS = SIM_PERSONAS;
  K.MOCK_PEOPLE = MOCK_PEOPLE;
  K.daysFromNow = daysFromNow;
  K.EXTERNAL_DATA = EXTERNAL_DATA;
  K.CREATOR_TEMPLATES = CREATOR_TEMPLATES;
  K.VISIBILITY_LABELS = VISIBILITY_LABELS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
