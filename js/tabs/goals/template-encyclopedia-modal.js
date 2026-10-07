/**
 * OurGoal Template Encyclopedia Modal (목표 템플릿 백과사전 전체화면 팝업 및 상호작용)
 *
 * 목표 템플릿 백과사전 팝업을 열고 닫는 제어, UI 렌더링(AI 추천, 실유저 템플릿), 탭 전환 상호작용을 처리합니다.
 * #TASK-ES-591(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 4709~4890 · 4895~4901 · 4902~4906 · 4909~4946 · 4947~4953 · 4954~4958 · 4959~4972 · 4974~5007 · 5009~5015 · 5016~5020 · 5021~5061 · 5063~5155 · 5156~5234 · 5245~5249 · 5250~5259 · 5263~5269줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 4709~4890줄(#TASK-ES-591 생성기 표지) ---- */
  var REAL_USER_TEMPLATES = [
    {
      id: 'tpl_real_01',
      title: '3개월 만에 정보처리기사 자격증 취득',
      author: '자격증마스터',
      authorBadge: '필기/실기 원패스',
      badge: 'IT/자격증',
      weeks: 12,
      category: 'study',
      kpi: '필기/실기 기출 5회독 & 원패스 동차합격',
      desc: '비전공자 직장인이 주말과 퇴근 후 2시간씩 투자해 12주 만에 정보처리기사 동차 합격한 실제 플랜입니다.',
      likes: 54,
      ms: [
        {
          title: '1단계: 필기 핵심이론 1회독 & 요약노트',
          tasks: ['필기 1~2과목 핵심 요약 및 기출 5개년', '필기 3~5과목 핵심 요약 및 기출 5개년', '필기 모의고사 3회 70점 이상 달성']
        },
        {
          title: '2단계: 필기 기출 집중 풀이 및 CBT 연습',
          tasks: ['최근 3개년 오답노트 정리', 'CBT 기출 실전 모의테스트 3회', '필기시험 응시 및 가답안 합격 확인']
        },
        {
          title: '3단계: 실기 프로그래밍(C/Java/Python/SQL) 정복',
          tasks: ['기본 문법 및 포인터/클래스 기출 30제', 'SQL 기본문 및 응용 쿼리 마스터', '신기술 용어 단어장 매일 20개 암기']
        },
        {
          title: '4단계: 실기 파이널 모의고사 & 최종 합격',
          tasks: ['실기 수제비 파이널 모의고사 5회', '단답형 핵심 키워드 100제 총정리', '실기시험 최종 응시 및 합격']
        }
      ]
    },
    {
      id: 'tpl_real_02',
      title: '주 3회 5km 러닝 & 10km 마라톤 완주',
      author: '러너스하이',
      authorBadge: '러닝 크루장',
      badge: '운동/건강',
      weeks: 8,
      category: 'health',
      kpi: '10km 55분 컷 완주 & 체지방 3kg 감량',
      desc: '초보 러너가 8주 동안 부상 없이 인터벌과 LSD를 병행하여 10km 마라톤을 55분 이내로 완주한 실전 루틴입니다.',
      likes: 68,
      ms: [
        {
          title: '1단계: 3km 쉬지 않고 달리기 기초 체력',
          tasks: ['러닝화 및 무릎 보호대 세팅', '주 3회 3km 6:30 페이스 조깅', '달리기 전후 동적/정적 스트레칭']
        },
        {
          title: '2단계: 5km 안정적 페이스 도달',
          tasks: ['주 2회 5km 6:00 페이스 빌드업', '주 1회 하체 보강 인터벌(400m x 5)', '주말 폼롤러 전신 근막 이완']
        },
        {
          title: '3단계: 7~8km 장거리(LSD) 적응',
          tasks: ['주말 8km 지속주 완주', '수분 보충 및 에너지젤 섭취 훈련', '주중 5km 페이스주 (5:30 유지)']
        },
        {
          title: '4단계: 10km 대회 실전 테이퍼링 & 완주',
          tasks: ['대회 1주 전 5km 가벼운 조깅', '대회 전날 탄수화물 로딩 및 꿀잠', '10km 마라톤 대회 55분 완주!']
        }
      ]
    },
    {
      id: 'tpl_real_03',
      title: '100일간 하루 1커밋 & 풀스택 포트폴리오 완성',
      author: '주니어개발자',
      authorBadge: '취뽀성공러',
      badge: '커리어/개발',
      weeks: 14,
      category: 'career',
      kpi: 'GitHub 100일 연속 히트맵 & Vercel 배포 포트폴리오 3건',
      desc: '매일 최소 1커밋을 실천하고 3개 실전 프로젝트를 클라우드에 배포하여 개발자 취업에 성공한 포트폴리오 템플릿입니다.',
      likes: 82,
      ms: [
        {
          title: '1단계: 개발 환경 셋업 & 매일 1알고리즘',
          tasks: ['GitHub 프로필 리드미 꾸미기', '백준/프로그래머스 하루 1문제 풀이', 'Git 커밋 컨벤션 규칙 준수 루틴']
        },
        {
          title: '2단계: 토이 프로젝트 1탄(클론 코딩) 배포',
          tasks: ['UI/UX 인터랙션 컴포넌트 개발', '반응형 모바일 뷰 최적화', 'Vercel / GitHub Pages 라이브 배포']
        },
        {
          title: '3단계: 풀스택 메인 프로젝트(인증/DB/API)',
          tasks: ['DB 스키마 모델링 및 API 설계', 'JWT/소셜 로그인 인증 파이프라인', '실시간 데이터 CRUD 및 상태 관리']
        },
        {
          title: '4단계: 기술 블로그 정리 & 이력서 첨부',
          tasks: ['트러블슈팅 회고록 3편 작성', 'Lighthouse 성능 점수 90점 달성', '완성된 포트폴리오 이력서에 링크']
        }
      ]
    },
    {
      id: 'tpl_real_04',
      title: '토익 900점 달성 8주 집중 스프린트',
      author: '토익단기완성',
      authorBadge: '토익 945점',
      badge: '어학/학습',
      weeks: 8,
      category: 'study',
      kpi: 'LC 470점 + RC 430점 = 총 900점 달성',
      desc: '파트별 정답 패턴 공략과 매일 LC 섀도잉, RC 문법 오답노트로 8주 만에 700점대에서 900점 돌파한 실제 기록입니다.',
      likes: 49,
      ms: [
        {
          title: '1단계: 파트 5/6 빈출 문법 공식 30선',
          tasks: ['품사/시제/수일치 핵심 공식 암기', '매일 파트 5 30문제 10분 컷 연습', '모르는 토익 어휘 50개 단어장 정리']
        },
        {
          title: '2단계: 파트 1~4 LC 섀도잉 & 발음 훈련',
          tasks: ['파트 2 우회적 답변 50문장 훈련', '파트 3/4 스키밍 및 패러프레이징', '1.2배속 음원으로 LC 1세트 청취']
        },
        {
          title: '3단계: 파트 7 독해 속독 & 시간 관리',
          tasks: ['이중/삼중 지문 단서 매칭 스킬 훈련', '파트 7 54문항 50분 내 풀이 연습', '주말 실전 모의고사 1회 풀세트 응시']
        },
        {
          title: '4단계: 3개년 기출 풀세트 오답 정리 & 시험',
          tasks: ['ETS 최신 기출 3회 풀이 및 오답 분석', '취약 유형 파트 집중 복습', '정기 토익 시험 응시 및 900점 달성']
        }
      ]
    },
    {
      id: 'tpl_real_05',
      title: '미라클 모닝 6시 기상 & 모닝 루틴 50일',
      author: '새벽루티너',
      authorBadge: '50일 완주자',
      badge: '마음/습관',
      weeks: 7,
      category: 'mind',
      kpi: '50일 연속 6시 기상 & 자기계발 도서 5권 완독',
      desc: '작심삼일에서 벗어나 아침 1시간을 나만의 온전한 성장 시간으로 만든 50일 기적의 루틴 템플릿입니다.',
      likes: 73,
      ms: [
        {
          title: '1단계: 수면 환경 리셋 & 6:30 기상 적응',
          tasks: ['밤 11시 취침 루틴 고정', '기상 직후 따뜻한 미온수 한 잔', '가벼운 스트레칭 5분으로 뇌 깨우기']
        },
        {
          title: '2단계: 6:00 정각 기상 & 모닝 독서 20분',
          tasks: ['스마트폰 침대 밖 멀리 두기', '자기계발 도서 매일 20페이지 독서', '독서 후 인상 깊은 문장 1줄 필사']
        },
        {
          title: '3단계: 모닝 확언 & 오늘 우선순위 3가지',
          tasks: ['감사일기 3줄 작성', '오늘 가장 중요한 원씽(One Thing) 정의', '가벼운 산책 또는 러닝 15분']
        },
        {
          title: '4단계: 50일 연속 달성 회고 & 셀프 보상',
          tasks: ['40일차 루틴 점검 및 개선점 메모', '50일 달성 기념 나를 위한 선물', '다음 시즌 미라클 모닝 계획 수립']
        }
      ]
    },
    {
      id: 'tpl_real_06',
      title: '월 100만원 부수입 블로그 파이프라인 구축',
      author: '머니파이프라인',
      authorBadge: '수익화 마스터',
      badge: '부업/재테크',
      weeks: 12,
      category: 'career',
      kpi: '일 방문자 3,000명 & 애드센스+제휴마케팅 100만 원',
      desc: '키워드 발굴부터 고품질 정보성 포스팅, 애드센스 승인 및 제휴마케팅 전환까지 12주 완성형 부수입 파이프라인입니다.',
      likes: 91,
      ms: [
        {
          title: '1단계: 블로그 주제 선정 & 1일 1포스팅',
          tasks: ['수익성 높은 메인 카테고리 1개 확정', '구글 애드센스 가이드에 맞춘 글 15편', '블로그 UI 및 카테고리 메뉴 세팅']
        },
        {
          title: '2단계: 구글 애드센스 한 번에 승인받기',
          tasks: ['서론/본론/결론 1,500자 포맷 글 10편', '애드센스 신청 및 광고 코드 삽입', '구글 서치콘솔 & 네이버 서치어드바이저 등록']
        },
        {
          title: '3단계: 황금 키워드 발굴 & 유입 트래픽 3배',
          tasks: ['키워드마스터 활용 검색량 분석', '롱테일 키워드 중심 정보글 주 5회', '일 방문자 1,000명 달성 모니터링']
        },
        {
          title: '4단계: 제휴마케팅 연계 & 월 100만 돌파',
          tasks: ['실사용 리뷰 기반 제휴마케팅 링크 연계', '수익형 배너 최적 위치 A/B 테스트', '월 수익 100만원 결산 및 자동화 플랜']
        }
      ]
    }
  ];

  /* ---- 이전 전 index.html 4895~4901줄(#TASK-ES-591 생성기 표지) ---- */

  function openTemplateEncyclopediaModal(initialTab){
    var m = document.getElementById('templateEncyclopediaModal');
    if(!m) return;
    m.style.display = 'flex';
    switchTemplateEncyclopediaTab(initialTab || 'realUser');
  }
  /* ---- 이전 전 index.html 4902~4906줄(#TASK-ES-591 생성기 표지) ---- */
  function closeTemplateEncyclopediaModal(){
    var m = document.getElementById('templateEncyclopediaModal');
    if(!m) return;
    m.style.display = 'none';
  }

  /* ---- 이전 전 index.html 4909~4946줄(#TASK-ES-591 생성기 표지) ---- */

  function switchTemplateEncyclopediaTab(tab){
    L._tplActiveTab = tab;
    var btnReal = document.getElementById('tabTplRealUser');
    var btnAi = document.getElementById('tabTplOurgoalAi');
    var cReal = document.getElementById('tplRealUserContent');
    var cAi = document.getElementById('tplOurgoalAiContent');

    if(tab === 'realUser'){
      if(btnReal){
        btnReal.style.borderBottom = '2.5px solid var(--brand)';
        btnReal.style.color = 'var(--brand)';
        btnReal.style.fontWeight = '700';
      }
      if(btnAi){
        btnAi.style.borderBottom = '2.5px solid transparent';
        btnAi.style.color = 'var(--ink-soft)';
        btnAi.style.fontWeight = '600';
      }
      if(cReal) cReal.style.display = 'block';
      if(cAi) cAi.style.display = 'none';
      renderRealUserTemplatesList();
    } else {
      if(btnReal){
        btnReal.style.borderBottom = '2.5px solid transparent';
        btnReal.style.color = 'var(--ink-soft)';
        btnReal.style.fontWeight = '600';
      }
      if(btnAi){
        btnAi.style.borderBottom = '2.5px solid var(--brand)';
        btnAi.style.color = 'var(--brand)';
        btnAi.style.fontWeight = '700';
      }
      if(cReal) cReal.style.display = 'none';
      if(cAi) cAi.style.display = 'block';
      renderAiTemplatesList();
    }
  }
  /* ---- 이전 전 index.html 4947~4953줄(#TASK-ES-591 생성기 표지) ---- */

  function getLikedTemplateMap(){
    try {
      var raw = localStorage.getItem('ourgoal_tpl_likes');
      return raw ? JSON.parse(raw) : {};
    } catch(e){ return {}; }
  }
  /* ---- 이전 전 index.html 4954~4958줄(#TASK-ES-591 생성기 표지) ---- */
  function setLikedTemplateMap(map){
    try {
      localStorage.setItem('ourgoal_tpl_likes', JSON.stringify(map));
    } catch(e){}
  }
  /* ---- 이전 전 index.html 4959~4972줄(#TASK-ES-591 생성기 표지) ---- */

  function cheerRealUserTemplate(tmplId){
    var likedMap = getLikedTemplateMap();
    var isLiked = !!likedMap[tmplId];
    likedMap[tmplId] = !isLiked;
    setLikedTemplateMap(likedMap);

    var target = REAL_USER_TEMPLATES.find(function(t){ return t.id === tmplId; });
    if(target){
      target.likes = Math.max(0, (target.likes || 0) + (isLiked ? -1 : 1));
    }
    L.toast(isLiked ? '응원을 취소했어요.' : '응원을 보냈어요! 🎉 +1');
    renderRealUserTemplatesList();
  }

  /* ---- 이전 전 index.html 4974~5007줄(#TASK-ES-591 생성기 표지) ---- */

  async function copyRealUserTemplate(tmplId){
    var t = REAL_USER_TEMPLATES.find(function(x){ return x.id === tmplId; });
    if(!t) return;
    var goal = {
      id: L.newId(),
      title: t.title,
      dueDate: null,
      category: t.category,
      createdAt: L.nowISO(),
      visibility: 'private',
      milestones: (t.ms || []).map(function(m){
        return {
          id: L.uid('ms'),
          title: m.title,
          status: 'todo',
          dueDate: null,
          tasks: (m.tasks || []).map(function(tk){
            return { id: L.uid('task'), title: tk, done: false };
          })
        };
      })
    };
    if(!L.state.profile.goals) L.state.profile.goals = [];
    L.state.profile.goals.unshift(goal);
    L.state.activeGoalId = goal.id;
    if(typeof L.trackGoalCreated === 'function') L.trackGoalCreated(goal, 'encyclopedia_real_user');
    await L.saveProfile();
    L.toast('\'' + (t.title.length > 16 ? t.title.slice(0, 16) + '...' : t.title) + '\' 목표를 내 목표함에 담았어요! 🎯');
    closeTemplateEncyclopediaModal();
    L.setTab('goals');
    L.state.goalsSubTab = 'personal';
    L.renderGoalsScreen();
  }

  /* ---- 이전 전 index.html 5009~5015줄(#TASK-ES-591 생성기 표지) ---- */

  function getUserSharedTemplates(){
    try {
      var raw = localStorage.getItem('ourgoal_user_shared_templates');
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  /* ---- 이전 전 index.html 5016~5020줄(#TASK-ES-591 생성기 표지) ---- */
  function saveUserSharedTemplates(list){
    try {
      localStorage.setItem('ourgoal_user_shared_templates', JSON.stringify(list));
    } catch(e){}
  }
  /* ---- 이전 전 index.html 5021~5061줄(#TASK-ES-591 생성기 표지) ---- */

  function shareMyActiveGoalAsTemplate(){
    var goals = (L.state && L.state.profile && L.state.profile.goals) || [];
    if(!goals || !goals.length){
      if(typeof L.toast === 'function') L.toast('공유할 수 있는 등록된 목표가 없습니다. 먼저 목표를 생성해주세요!');
      return;
    }
    var activeGoal = goals.find(function(g){ return g.id === L.state.activeGoalId; }) || goals[0];
    var authorName = (L.state.profile && (L.state.profile.nickname || L.state.profile.name)) || '아워골 크루';
    
    var shared = getUserSharedTemplates();
    var already = shared.find(function(s){ return s.originalGoalId === activeGoal.id; });
    if(already){
      if(typeof L.toast === 'function') L.toast('이미 실사용 템플릿 사전에 공유된 목표입니다! 🎉');
      return;
    }

    var newTpl = {
      id: 'usr_tpl_' + Date.now(),
      originalGoalId: activeGoal.id,
      title: activeGoal.title || '나만의 실천 목표',
      author: authorName,
      authorBadge: '인증 크루',
      badge: activeGoal.category || '실전 루틴',
      weeks: 8,
      category: activeGoal.category || 'personal',
      desc: (activeGoal.title || '목표') + '를 직접 실천하고 검증한 실 유저 공유 템플릿입니다.',
      likes: 1,
      copies: 0,
      ms: (activeGoal.milestones || []).map(function(m){
        return {
          title: m.title || '마일스톤',
          tasks: (m.tasks || []).map(function(tk){ return typeof tk === 'string' ? tk : (tk.title || '할 일'); })
        };
      })
    };
    shared.unshift(newTpl);
    saveUserSharedTemplates(shared);
    if(typeof L.toast === 'function') L.toast('내 목표를 실사용 템플릿 사전에 성공적으로 공유했어요! 🎉');
    renderRealUserTemplatesList();
  }

  /* ---- 이전 전 index.html 5063~5155줄(#TASK-ES-591 생성기 표지) ---- */

  function renderRealUserTemplatesList(){
    var container = document.getElementById('tplRealUserContent');
    if(!container) return;

    var sharedTemplates = getUserSharedTemplates();
    var baseTemplates = Array.isArray(REAL_USER_TEMPLATES) && REAL_USER_TEMPLATES.length ? REAL_USER_TEMPLATES : [
      { id: 'ru_marathon_full', title: '🏃 100일 하프마라톤 완주 템플릿', author: '러너상민', authorBadge: '완주자', copies: 142, category: '운동/러닝', desc: '초보자도 부상 없이 21km 완주할 수 있는 주차별 마일스톤 가이드', ms: [{title:'1단계: 5km 러닝', tasks:['주 3회 3km','러닝화 구매']}], likes: 88 },
      { id: 'ru_coding_boot', title: '💻 60일 알고리즘 & 토이프로젝트 정복', author: '코딩마스터', authorBadge: '시니어', copies: 98, category: '개발/커리어', desc: '자료구조부터 실전 웹서비스 배포까지 완성하는 개발자 목표 템플릿', ms: [{title:'1단계: 알고리즘 100제', tasks:['하루 1문제 풀이']}], likes: 54 },
      { id: 'ru_miracle_morning', title: '🌅 미라클 모닝 30일 루틴 챌린지', author: '아침형인간', authorBadge: '50일 완주', copies: 215, category: '생활/루틴', desc: '오전 6시 기상, 명상 10분, 독서 20분으로 하루를 2배 길게 쓰는 템플릿', ms: [{title:'1단계: 기상 습관', tasks:['6시 알람 기상']}], likes: 112 },
      { id: 'ru_money_saving', title: '💰 6개월 1,000만원 모으기 가계부 팩', author: '절약왕', authorBadge: '자산가', copies: 176, category: '재테크', desc: '불필요한 지출 통제 및 선저축 습관을 기르는 실천형 재테크 로드맵', ms: [{title:'1단계: 소비 통제', tasks:['가계부 매일 기록']}], likes: 93 }
    ];

    var allTemplates = sharedTemplates.concat(baseTemplates);
    var likedMap = getLikedTemplateMap();

    container.innerHTML = '<div style="margin-bottom:12px;">' +
      '<div style="background:var(--surface-2);border:1px solid var(--rule);border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">' +
        '<div>' +
          '<div style="font-weight:800;font-size:.9375rem;color:var(--ink);">👥 실 유저 공유 템플릿 둘러보기</div>' +
          '<div class="faint" style="font-size:.78125rem;margin-top:2px;">실제 완수자들이 검증한 목표를 내 목표함에 즉시 복제하고 응원하세요.</div>' +
        '</div>' +
        '<button type="button" id="btnShareMyGoalToTpl" class="btn btn-ghost btn-sm" style="font-size:.8125rem;font-weight:700;padding:6px 12px;border:1px solid var(--brand);color:var(--brand);border-radius:8px;background:var(--card);">' +
          '➕ 내 목표 공유하기' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        allTemplates.map(function(t){
          var isLiked = !!likedMap[t.id];
          var likeCount = (t.likes || 0);
          var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
          var msCount = (t.ms || []).length;
          return '<div class="real-tpl-card" style="background:var(--card);border:1px solid var(--rule);border-radius:14px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.02);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
              '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
                '<span class="tag on" style="font-size:.6875rem;padding:2px 8px;background:var(--brand);color:#fff;border-radius:4px;font-weight:700;">' + L.escapeHtml(t.badge || t.category || '공유템플릿') + '</span>' +
                '<b style="font-weight:800;font-size:.9375rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(t.title) + '</b>' +
              '</div>' +
              '<span class="faint" style="font-size:.75rem;white-space:nowrap;">' + (t.weeks ? t.weeks + '주 완주' : '실천형') + '</span>' +
            '</div>' +
            '<div class="faint" style="font-size:.8125rem;margin-bottom:8px;line-height:1.45;color:var(--ink-soft);">' + L.escapeHtml(t.desc || '') + '</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
              '<span>🎯 마일스톤 <b>' + msCount + '단계</b></span>' +
              '<span>· 세부 할 일 <b>' + totalTasks + '개</b></span>' +
              (t.kpi ? '<span>· 🏆 ' + L.escapeHtml(t.kpi) + '</span>' : '') +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px dashed var(--rule);padding-top:10px;font-size:.78125rem;color:var(--ink-soft);gap:8px;flex-wrap:wrap;">' +
              '<div>' +
                '작성자: <b>' + L.escapeHtml(t.author || '익명크루') + '</b>' +
                (t.authorBadge ? ' <span style="font-size:.6875rem;padding:1px 5px;background:var(--surface-2);border-radius:4px;color:var(--ink-soft);">' + L.escapeHtml(t.authorBadge) + '</span>' : '') +
                ' · 복제 <b>' + (t.copies || 0) + '회</b>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;margin-left:auto;">' +
                '<button type="button" class="btn btn-ghost btn-xs btn-cheer-tpl" data-cheerid="'+t.id+'" style="font-size:.75rem;padding:4px 8px;border:1px solid '+(isLiked?'#ef4444':'var(--rule)')+';border-radius:6px;color:'+(isLiked?'#ef4444':'var(--ink-soft)')+';background:'+(isLiked?'rgba(239,68,68,0.06)':'transparent')+';">' +
                  (isLiked ? '❤️' : '🤍') + ' 응원 ' + likeCount +
                '</button>' +
                '<button type="button" class="btn btn-primary btn-xs btn-copy-real-tpl btn-auto-import-tpl" data-copyid="'+t.id+'" data-tplid="'+t.id+'" data-tpltit="'+L.escapeHtml(t.title)+'" data-tplcat="'+L.escapeHtml(t.category)+'" style="font-size:.78125rem;font-weight:700;padding:5px 12px;border-radius:6px;">' +
                  '📥 내 목표로 복사' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

    var btnShare = container.querySelector('#btnShareMyGoalToTpl');
    if(btnShare){
      btnShare.addEventListener('click', shareMyActiveGoalAsTemplate);
    }

    container.querySelectorAll('.btn-cheer-tpl').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        cheerRealUserTemplate(btn.dataset.cheerid);
      });
    });

    container.querySelectorAll('.btn-copy-real-tpl').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var tmplId = btn.dataset.copyid;
        var found = allTemplates.find(function(x){ return x.id === tmplId; });
        if(found){
          if(!REAL_USER_TEMPLATES.find(function(x){ return x.id === tmplId; })){
            REAL_USER_TEMPLATES.push(found);
          }
          found.copies = (found.copies || 0) + 1;
        }
        copyRealUserTemplate(tmplId);
      });
    });
  }
  /* ---- 이전 전 index.html 5156~5234줄(#TASK-ES-591 생성기 표지) ---- */

  function renderAiTemplatesList(){
    var chipsContainer = document.getElementById('tplAiCategoryChips');
    var cardsContainer = document.getElementById('tplAiCardsList');
    if(!chipsContainer || !cardsContainer) return;

    var catTabs = [
      { id: 'all', label: '전체 (60선)' },
      { id: 'health', label: '💪 운동·건강' },
      { id: 'study', label: '📚 학습·자격' },
      { id: 'career', label: '💼 커리어·머니' },
      { id: 'hobby', label: '🎨 취미·창작' },
      { id: 'mind', label: '🧘 마음·습관' },
      { id: 'relation', label: '🏘️ 관계·생활' }
    ];

    chipsContainer.innerHTML = catTabs.map(function(c){
      var on = (c.id === L._tplAiCurCat);
      return '<button type="button" class="btn btn-xs ' + (on ? 'btn-primary' : 'btn-ghost') + '" data-encycl-cat="' + c.id + '" style="font-size:.75rem;white-space:nowrap;padding:4px 10px;border-radius:14px;' + (on ? 'font-weight:700;' : 'border:1px solid var(--rule);') + '">' +
        c.label +
      '</button>';
    }).join('');

    chipsContainer.querySelectorAll('[data-encycl-cat]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        L._tplAiCurCat = btn.dataset.encyclCat;
        renderAiTemplatesList();
      };
    });

    var templates = [];
    if(window.OURGOAL_60_TEMPLATES && typeof window.OURGOAL_60_TEMPLATES.getByCategory === 'function'){
      templates = window.OURGOAL_60_TEMPLATES.getByCategory(L._tplAiCurCat);
    } else {
      templates = window.CREATOR_TEMPLATES || [];
    }

    cardsContainer.innerHTML = templates.map(function(t){
      var totalTasks = (t.ms || []).reduce(function(a, m){ return a + (m.tasks || []).length; }, 0);
      var badgeText = t.badge || (t.categoryMinor ? t.categoryMinor : '전문가');
      return '<div class="tmpl-card" style="padding:12px;background:var(--card);border:1px solid var(--rule);border-radius:12px;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span style="background:var(--brand);color:#fff;font-size:.6875rem;padding:1px 6px;border-radius:4px;font-weight:700;">' + L.escapeHtml(badgeText) + '</span>' +
          '<b style="font-size:.875rem;color:var(--ink);">' + L.escapeHtml(t.title) + '</b>' +
          '<span class="faint" style="font-size:.75rem;margin-left:auto;white-space:nowrap;">' + (t.weeks || 12) + '주 과정</span>' +
        '</div>' +
        '<div style="font-size:calc(.875rem - 3pt);color:var(--ink-soft);margin:2px 0 4px;font-weight:500;">ai생성템플릿입니다</div>' +
        '<div style="font-size:.8125rem;color:var(--ink-soft);margin-bottom:6px;line-height:1.4;">' + L.escapeHtml(t.desc) + '</div>' +
        '<div class="faint" style="font-size:.75rem;margin-bottom:8px;">4단계 마일스톤 ' + (t.ms||[]).length + '개 · 세부할일 ' + totalTasks + '개' + (t.kpi ? ' · 🎯 ' + L.escapeHtml(t.kpi) : '') + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;">' +
          '<button class="btn btn-ghost btn-sm" data-ai-preview="' + t.id + '" type="button" style="flex:1;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '👀 둘러보기' +
          '</button>' +
          '<button class="btn btn-primary btn-sm" data-ai-start="' + t.id + '" type="button" style="flex:1.4;font-size:.8125rem;font-weight:700;padding:6px 0;border-radius:8px;">' +
            '✨ 이 템플릿으로 시작' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    cardsContainer.querySelectorAll('[data-ai-preview]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openTemplatePreviewModal){
          window.OurgoalTeamInviteComm.openTemplatePreviewModal(btn.dataset.aiPreview);
        }
      };
    });
    cardsContainer.querySelectorAll('[data-ai-start]').forEach(function(btn){
      btn.onclick = async function(e){
        e.stopPropagation();
        if(typeof L.cloneTemplate === 'function'){
          await L.cloneTemplate(btn.dataset.aiStart);
          closeTemplateEncyclopediaModal();
        }
      };
    });
  }

  /* ---- 이전 전 index.html 5245~5249줄(#TASK-ES-591 생성기 표지) ---- */
  function bindTemplateEncyclopediaModalClick() { /* [#TASK-ES-591] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.modalTplEncyclElem){
    L.modalTplEncyclElem.addEventListener('click', function(e){
      if(e.target === L.modalTplEncyclElem) closeTemplateEncyclopediaModal();
    });
  }
  } /* bindTemplateEncyclopediaModalClick */
  /* ---- 이전 전 index.html 5250~5259줄(#TASK-ES-591 생성기 표지) ---- */
  function bindTemplateEncyclopediaEscape() { /* [#TASK-ES-591] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */

  // ESC 키 닫기 이벤트 리스너 보장
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' || e.keyCode === 27){
      var m = document.getElementById('templateEncyclopediaModal');
      if(m && m.style.display !== 'none'){
        closeTemplateEncyclopediaModal();
      }
    }
  });
  } /* bindTemplateEncyclopediaEscape */

  /* ---- 이전 전 index.html 5263~5269줄(#TASK-ES-591 생성기 표지) ---- */
  function bindHeaderTemplateEncyclopediaClick() { /* [#TASK-ES-591] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.btnHeaderTplEncycl){
    L.btnHeaderTplEncycl.addEventListener('click', function(e){
      e.stopPropagation();
      L.state.goalsSubTab = 'templateEncyclopedia';
      openTemplateEncyclopediaModal();
    });
  }
  } /* bindHeaderTemplateEncyclopediaClick */

  K.REAL_USER_TEMPLATES = REAL_USER_TEMPLATES;
  K.openTemplateEncyclopediaModal = openTemplateEncyclopediaModal;
  K.closeTemplateEncyclopediaModal = closeTemplateEncyclopediaModal;
  K.switchTemplateEncyclopediaTab = switchTemplateEncyclopediaTab;
  K.getLikedTemplateMap = getLikedTemplateMap;
  K.setLikedTemplateMap = setLikedTemplateMap;
  K.cheerRealUserTemplate = cheerRealUserTemplate;
  K.copyRealUserTemplate = copyRealUserTemplate;
  K.getUserSharedTemplates = getUserSharedTemplates;
  K.saveUserSharedTemplates = saveUserSharedTemplates;
  K.shareMyActiveGoalAsTemplate = shareMyActiveGoalAsTemplate;
  K.renderRealUserTemplatesList = renderRealUserTemplatesList;
  K.renderAiTemplatesList = renderAiTemplatesList;
  K.bindTemplateEncyclopediaModalClick = bindTemplateEncyclopediaModalClick;
  K.bindTemplateEncyclopediaEscape = bindTemplateEncyclopediaEscape;
  K.bindHeaderTemplateEncyclopediaClick = bindHeaderTemplateEncyclopediaClick;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
