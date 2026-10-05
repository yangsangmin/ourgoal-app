/**
 * OurGoal Tab Guide (설정 탭 — 탭별 200% 활용법 창)
 *
 * #TASK-ES-442 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   TAB_GUIDE_DATA — 「[#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법」(이전 전 6322~6458줄)
 *   renderTabGuideContent — 「[#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법」(이전 전 6460~6498줄)
 *   openTabGuideHubModal — 「[#TASK-ES-160, #TASK-ES-166, #TASK-ES-180] 각 탭 200% 활용법」(이전 전 6500~6576줄)
 * 각 탭 활용법·우수 사용사례 허브 창과 탭별 내용 그리기.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  var TAB_GUIDE_DATA = {
    avatar: {
      name: '아바타',
      icon: '👤',
      badge: '성장 랭크 & 페르소나',
      features: [
        { title: '베일에 싸인 시크릿 랭크 & 히든 오라 🔮', desc: '“다음엔 어떤 오라가 켜질지는 절대 비밀!” 실천 XP가 쌓일수록 내 아바타 등 뒤에 상상도 못한 신비로운 전설의 아우라와 이펙트가 하나씩 깨어나요. 어떤 모습으로 각성할지는 끝까지 가본 자만이 누릴 수 있는 특권이에요.' },
        { title: '앱 진입 대형 인사 팝업 & 시간대별 맞춤 멘트 👋', desc: '앱을 켤 때마다 화면 절반 가득 아바타가 반갑게 맞이하며, 아침/오후/저녁/새벽 시간대별 격려 멘트와 기준 시간을 설정창에서 나만의 톤앤매너로 자유롭게 커스텀할 수 있어요.' },
        { title: '나만의 아바타 생성 & 무제한 보관함 관리 🎨', desc: '320종 페르소나 풀과 퍼스널 컬러 합성, 성장 성향 프롬프트로 세상에 단 하나뿐인 캐릭터를 만들고, 3중 안전 영속화된 보관함(서랍)에서 기분 따라 원클릭 교체해요.' }
      ],
      showcase: {
        badgeText: '실제 유저 제보 (각성 성공)',
        user: '익명의 갓생 실천러 (180일 연속 실천, 각성 완료)',
        title: '“도대체 어디까지 진화하는 거야?!” 히든 랭크를 직접 깨우는 재미',
        quote: '“처음엔 조그만 모습이었는데, 매일 체크인하다 보니 갑자기 등 뒤에서 말도 안 되는 눈부신 전설의 아우라가 폭발했어요 ㅋㅋㅋ 다음 레벨엔 대체 뭐가 튀어나올지 너무 궁금해서 하루도 실천을 안 쉴 수가 없습니다!”',
        mockupHtml: '<div style="background:var(--surface-1);padding:10px 12px;border-radius:10px;border:1px solid rgba(168,85,247,0.3);box-shadow:0 4px 14px rgba(168,85,247,0.15);">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<span style="font-size:1.6rem;filter:drop-shadow(0 0 6px rgba(168,85,247,0.6));">🔮</span>' +
              '<div><b style="font-size:.875rem;">Lv.??? 각성 페르소나</b><br><span style="font-size:.72rem;color:var(--brand);">✨ 베일에 싸인 시크릿 오라 발동 중!</span></div>' +
            '</div>' +
            '<span class="badge" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;font-size:.72rem;padding:3px 8px;border-radius:6px;font-weight:800;">🔒 ??? 랭크</span>' +
          '</div>' +
          '<div style="font-size:.75rem;background:rgba(255,255,255,0.06);padding:6px 10px;border-radius:6px;color:var(--ink-soft);">' +
            '💬 인사 멘트: “대체 어디까지 올라갈 셈이야?! 오늘도 전설을 향해 질주해봐요! 🚀”' +
          '</div>' +
        '</div>'
      }
    },
    home: {
      name: '홈',
      icon: '🏠',
      badge: '오늘의 성장 루틴 & 위젯',
      features: [
        { title: '상단 고정 아바타(경험치) & 오늘 기록하기 📌', desc: '가장 중요한 내 성장치와 오늘 기록하기를 상단에 고정해 한 번의 탭으로 당일 실천을 빠르게 시작할 수 있어요.' },
        { title: '나만의 홈 구성 커스텀 & 기기 바탕화면 위젯 📱', desc: '내 성장·히트맵·3대 퀘스트 순서를 자유롭게 커스텀하고, 앱을 켤 필요 없는 기기 바탕화면 위젯(3종×3구성)을 지원해요.' },
        { title: '오늘의 카드 & 언제든 가능한 솔직 평가 💡', desc: '뭘 할지 고민될 땐 내 목표 기반 ‘오늘의 카드’ 추천을 받고, 하단 평가 배너를 통해 언제 얼마든지 자유롭게 피드백을 전할 수 있어요.' }
      ],
      showcase: {
        badgeText: '우수 사용사례',
        user: '김지훈 (스타트업 개발자, 120일 연속 실천)',
        title: '바탕화면 위젯과 상단 고정으로 갓생 하루를 여는 루틴러',
        quote: '“스마트폰 홈 화면에 일정·목표 위젯을 띄워두고 출근길에 확인해요. 상단에 고정된 오늘 기록하기 버튼으로 바로 체크인하고, 완벽히 채워진 히트맵을 볼 때마다 벅찬 성취감이 듭니다.”',
        mockupHtml: '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-1);padding:8px 12px;border-radius:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:1.4rem;">📱</span>' +
            '<div><b style="font-size:.875rem;">바탕화면 위젯 & 오늘 퀘스트 3/3</b><br><span style="font-size:.72rem;color:var(--emerald);">🔥 120일 연속 히트맵 달성 중</span></div>' +
          '</div>' +
          '<span class="badge" style="background:#F59E0B;color:#fff;font-size:.75rem;padding:2px 6px;border-radius:4px;">Lv.18 제우스</span>' +
        '</div>'
      }
    },
    goals: {
      name: '목표',
      icon: '🎯',
      badge: '템플릿백과사전 & 3계층 로드맵',
      features: [
        { title: '📖 템플릿백과사전 (실사용 유저 사전 & AI 60선)', desc: '실제 유저들이 검증한 고득점 템플릿을 통째로 복사해오거나 아워골 AI 60선 전문가 커리큘럼으로 1초 만에 로드맵을 완성해요.' },
        { title: '목표 ➔ 마일스톤 ➔ 할일 3계층 & 캘린더 연동', desc: '목표와 할 일에 일정을 지정하면 캘린더 24시간 블록과 양방향 자동 동기화되며 목표만/마일스톤 뷰를 자유롭게 토글해요.' },
        { title: '루틴(Routine) 관리 & 10 EXP 즉시 획득 🔥', desc: '매일 반복하는 일상 루틴을 등록하고 완료할 때마다 10 EXP를 획득하며, 목표탭을 닮은 상세 편집 모달로 정교하게 관리해요.' }
      ],
      showcase: {
        badgeText: '우수 사용사례',
        user: '이수진 (마케터, 체지방 8% 달성)',
        title: '템플릿백과사전 복사로 1초 만에 세운 100일 완주 로드맵',
        quote: '“템플릿백과사전에서 다른 유저의 바디프로필 실사용 템플릿을 복사해와 내 일정에 맞췄어요. 마일스톤이 캘린더와 자동 연동되고 매일 루틴 10 EXP를 챙기니 100일간 하루도 밀리지 않았습니다!”',
        mockupHtml: '<div style="background:var(--surface-1);padding:8px 12px;border-radius:8px;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><b style="font-size:.875rem;">🏃 하프마라톤 100일 완성</b><span style="font-size:.75rem;font-weight:700;color:var(--brand);">85% 달성</span></div>' +
          '<div style="width:100%;height:6px;background:var(--rule);border-radius:3px;overflow:hidden;"><div style="width:85%;height:100%;background:var(--emerald);"></div></div>' +
          '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:6px;">📖 백과사전 템플릿 연동 · 📅 24시간 시간표 자동 동기화</div>' +
        '</div>'
      }
    },
    calendar: {
      name: '일정',
      icon: '📅',
      badge: '사전 알림 & 비주얼 다이어리',
      features: [
        { title: '일정 사전 알림 (정시 ~ 1일 전 N분 전 지정) ⏰', desc: '놓치기 쉬운 일정을 위해 5분, 10분, 30분, 1시간 전 등 원하는 시간 전에 알림이 울리도록 사전 알림을 설정해요.' },
        { title: '일정 체크 완료 토글 & 구글 캘린더 실시간 싱크', desc: '일간 타임라인에서 완료 여부를 바로 체크하고, 상단 헤더의 미니 구글 G 아이콘으로 팝업 없이 무음 양방향 동기화해요.' },
        { title: '이 날의 감성 배경사진 (50% 투명도 보존) 🖼️', desc: '그날의 인증 사진이나 추억을 50% 반투명 배경으로 지정해 글씨는 선명하게 읽으면서 감성 포토 다이어리로 활용해요.' }
      ],
      showcase: {
        badgeText: '우수 사용사례',
        user: '박서준 (프리랜서 디자이너)',
        title: '사전 알림과 감성 사진 배경으로 완벽해진 스케줄러',
        quote: '“중요한 마감 30분 전에 사전 알림이 울려 놓치지 않고, 러닝 후 찍은 사진을 그날 캘린더 배경으로 깔아두니 나만의 인생 다이어리가 되었어요. 구글 캘린더와도 완벽히 동기화됩니다!”',
        mockupHtml: '<div style="background:var(--surface-1);padding:8px 12px;border-radius:8px;border-left:3px solid #4285F4;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<b style="font-size:.875rem;">🔔 09.18 디자인 시안 제출 (30분 전 알림)</b>' +
            '<span style="font-size:.7rem;padding:2px 6px;border-radius:4px;background:#e8f0fe;color:#1a73e8;font-weight:700;">G-Cal 무음 연동</span>' +
          '</div>' +
          '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:4px;">50% 감성 배경사진 적용 · 14:00 완료 체크 토글 연동</div>' +
        '</div>'
      }
    },
    records: {
      name: '기록',
      icon: '📝',
      badge: '스톱워치 랩메모 & 6대 지표 분석',
      features: [
        { title: '스톱워치 랩타임 메모 & ‘표에시간기입’ ⏱️', desc: '1초 단위 스톱워치로 구간 기록을 재고 랩 메모를 남기며, 원하는 셀을 누르고 ‘표에시간기입’을 누르면 즉시 자동 입력돼요.' },
        { title: '6대 차등 정밀 지표 분석 & 다중선택 그래프 📊', desc: '체중 7일 이동평균, 헬스 1RM, 러닝 페이스존, 공부 몰입도, 저축가속도, 수면 점수를 다중선택 칩으로 동시에 비교 분석해요.' },
        { title: '안전한 초기화 2중 확인 & 노션 다이렉트 전송 📋', desc: '실수 방지 2중 확인 모달로 소중한 타이머 기록을 보호하고, 원클릭으로 내 개인 노션 DB로 즉시 영구 전송해요.' }
      ],
      showcase: {
        badgeText: '우수 사용사례',
        user: '최민우 (파워리프터, 3대 520kg 달성)',
        title: '스톱워치 랩메모와 1RM 정밀 분석 차트로 한계 돌파',
        quote: '“세트마다 인앱 스톱워치 랩메모로 휴식시간과 느낌을 적고 표에시간기입 버튼으로 바로 채웠어요. 1RM 에플리 추정 곡선과 주간 볼륨 차트를 보며 3대 500을 마침내 돌파했습니다!”',
        mockupHtml: '<div style="background:var(--surface-1);padding:8px 12px;border-radius:8px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;"><b style="font-size:.875rem;">📊 3대 운동 1RM & 볼륨 동시 분석</b><span style="font-size:.72rem;color:var(--emerald);font-weight:700;">520 kg 돌파</span></div>' +
          '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:4px;">⏱️ 랩메모(세트별 휴식 90초) 자동 기입 · 📋 노션 원클릭 싱크 완료</div>' +
        '</div>'
      }
    },
    social: {
      name: '소통',
      icon: '💬',
      badge: '사진인증 피드 & 카톡 스타일 DM',
      features: [
        { title: '직접 사진 첨부(카메라/앨범) & 10대 카테고리 📸', desc: '오늘의 실천 사진을 모바일에서 바로 업로드하고, 공부·운동·생활·육아 등 10대 카테고리를 가로 스크롤로 쾌적하게 탐색해요.' },
        { title: '최신 실천기록 자동선택 & 맞춤 AI피드백/다짐 ✨', desc: '피드 게시 시 가장 최근 실천기록이 먼저 자동 적용되며, 기록 선택에 맞춰 나누고 싶은 다짐과 AI 코칭 조언이 실시간 동기화돼요.' },
        { title: '카카오톡 방식 DM(전송시각 & 노란색 1 읽음) & 자유 팀 👥', desc: '말풍선 옆 전송 시각과 읽지 않음(1) 카운트다운으로 답답함 없이 소통하고, 정원/주기 제약 없는 자유로운 팀을 만들어요.' }
      ],
      showcase: {
        badgeText: '우수 사용사례',
        user: '정유나 (미라클모닝 크루장)',
        title: '사진인증과 카톡 스타일 DM으로 끈끈해진 소통방',
        quote: '“아침마다 피드에 사진을 바로 올리고, 크루원들과 1:1 DM을 나눌 때 카톡처럼 보낸 시간과 1(읽음 확인)이 바로 뜨니까 소통이 훨씬 즐거워요. 불필요한 제약이 없는 자유 팀이라 누구나 편하게 참여합니다!”',
        mockupHtml: '<div style="background:var(--surface-1);padding:8px 12px;border-radius:8px;">' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:1.1rem;">📸</span><b style="font-size:.875rem;">사진인증 피드 · 1:1 DM: 오전 06:05 (읽음)</b></div>' +
          '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:4px;">“오늘도 멋져요! 하루 힘차게 시작해봐요 👏” · 10대 카테고리 필터 연동</div>' +
        '</div>'
      }
    }
  };

  function renderTabGuideContent(tabKey){
    var item = TAB_GUIDE_DATA[tabKey] || TAB_GUIDE_DATA.avatar || TAB_GUIDE_DATA.home;
    var sc = item.showcase;

    var featsHtml = item.features.map(function(f){
      return '<div class="guide-feature-item">' +
        '<span class="guide-feature-bullet">✓</span>' +
        '<div><b>' + L.escapeHtml(f.title) + '</b><br><span style="font-size:.8rem;color:var(--ink-soft);">' + L.escapeHtml(f.desc) + '</span></div>' +
      '</div>';
    }).join('');

    var actionBtnText = (tabKey === 'avatar') 
      ? '🎨 나만의 아바타 꾸미러 가기' 
      : ('🚀 ' + L.escapeHtml(item.name) + ' 탭 바로 실천하러 가기');

    return '<div class="guide-feature-block">' +
        '<div style="font-size:.8125rem;font-weight:800;color:var(--brand);margin-bottom:8px;">✨ ' + L.escapeHtml(item.name) + ' 탭 핵심 혁신 기능</div>' +
        featsHtml +
      '</div>' +

      '<!-- 실제 우수 사용사례 쇼케이스 -->' +
      '<div class="guide-showcase-card">' +
        '<div class="guide-showcase-header">' +
          '<span class="showcase-badge">🌟 ' + L.escapeHtml(sc.badgeText) + '</span>' +
          '<span class="showcase-user-info">' + L.escapeHtml(sc.user) + '</span>' +
        '</div>' +
        '<div class="guide-showcase-title">' + L.escapeHtml(sc.title) + '</div>' +
        '<div class="guide-showcase-quote">' + sc.quote + '</div>' +
        '<div class="showcase-mockup-wrap">' +
          sc.mockupHtml +
        '</div>' +
      '</div>' +

      '<div style="margin-top:14px;">' +
        '<button type="button" class="btn btn-primary guide-action-try-btn" data-targettab="' + tabKey + '" style="width:100%;font-weight:800;padding:12px 14px;border-radius:12px;">' +
          actionBtnText +
        '</button>' +
      '</div>';
  }

  function openTabGuideHubModal(initialTab){
    var curTab = initialTab || 'avatar';
    var tabs = [
      { key: 'avatar', label: '아바타', icon: '👤' },
      { key: 'home', label: '홈', icon: '🏠' },
      { key: 'goals', label: '목표', icon: '🎯' },
      { key: 'calendar', label: '일정', icon: '📅' },
      { key: 'records', label: '기록/통계', icon: '📝' },
      { key: 'social', label: '소통', icon: '💬' }
    ];

    var navHtml = tabs.map(function(t){
      var activeCls = (t.key === curTab) ? ' active' : '';
      return '<button type="button" class="guide-tab-nav-btn' + activeCls + '" data-tabkey="' + t.key + '">' +
        t.icon + ' ' + t.label +
      '</button>';
    }).join('');

    var modalHtml = '' +
      '<div id="tabGuideHubModal" class="tab-guide-hub-container">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
          '<h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>🌟</span> 각 탭 200% 활용법 & 우수사례' +
          '</h3>' +
          '<button type="button" id="btnTabGuideClose" class="btn-close" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:var(--ink-soft);padding:4px;" aria-label="닫기">×</button>' +
        '</div>' +
        '<p style="margin:-6px 0 6px;font-size:.8125rem;color:var(--ink-soft);">' +
          '“와 나도 저렇게 목표 세우고, 일정 세우고, 기록하고, 소통하고 싶다!” — 실제 갓생 실천 꿀팁' +
        '</p>' +
        '<div class="tab-guide-nav-bar">' + navHtml + '</div>' +
        '<div id="tabGuideDynamicContent">' + renderTabGuideContent(curTab) + '</div>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      var closeBtn = sheet.querySelector('#btnTabGuideClose');
      if(closeBtn) closeBtn.onclick = L.closeModal;

      var contentEl = sheet.querySelector('#tabGuideDynamicContent');

      function wireTryButton(){
        var tryBtn = sheet.querySelector('.guide-action-try-btn');
        if(tryBtn){
          tryBtn.onclick = function(){
            var target = tryBtn.getAttribute('data-targettab');
            L.closeModal();
            setTimeout(function(){
              if(target === 'avatar'){
                if(typeof openAvatarModal === 'function'){
                  openAvatarModal();
                } else if(typeof L.openProfileEditor === 'function'){
                  L.openProfileEditor();
                } else {
                  L.toast('아바타 설정창을 불러오는 중입니다.');
                }
              } else {
                if(typeof L.switchTab === 'function') L.switchTab(target);
                var tabName = (TAB_GUIDE_DATA[target] && TAB_GUIDE_DATA[target].name) ? TAB_GUIDE_DATA[target].name : target;
                L.toast(tabName + ' 탭으로 이동했어요! 지금 시작해보세요.');
              }
            }, 80);
          };
        }
      }
      wireTryButton();

      var navBtns = sheet.querySelectorAll('.guide-tab-nav-btn');
      navBtns.forEach(function(btn){
        btn.onclick = function(){
          var key = btn.getAttribute('data-tabkey');
          navBtns.forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          contentEl.innerHTML = renderTabGuideContent(key);
          wireTryButton();
        };
      });
    });
  }

  K.TAB_GUIDE_DATA = TAB_GUIDE_DATA;
  K.renderTabGuideContent = renderTabGuideContent;
  K.openTabGuideHubModal = openTabGuideHubModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
