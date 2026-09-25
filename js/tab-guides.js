/**
 * OurGoal All Tabs Usage Guide System (All-in-One Guide Hub)
 * 6대 핵심 탭(홈, 목표, 일정, 기록, 소통, 설정) 통합 가이드 허브 엔진
 * 티켓: #TASK-ES-102, #TASK-ES-126, #TASK-ES-266, #TASK-ES-273
 * 상민님 지시: 각 탭 활용법 내용 최신화 및 실제 우수 사용사례 이미지/카드 첨부
 */
(function(root, factory){
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.TAB_GUIDES = api.TAB_GUIDES;
    root.TAB_SHOWCASES = api.TAB_SHOWCASES;
    root.showTabUsageGuide = api.showTabUsageGuide;
  }
}(typeof self !== 'undefined' ? self : this, function(){
  'use strict';

  var TAB_KEYS = [
    { key: 'home', label: '홈', icon: '🏠' },
    { key: 'goals', label: '목표', icon: '🎯' },
    { key: 'calendar', label: '일정', icon: '📅' },
    { key: 'records', label: '기록/통계', icon: '✍️' },
    { key: 'comm', label: '소통', icon: '💬' },
    { key: 'settings', label: '설정', icon: '⚙️' }
  ];

  // 6대 탭 실제 우수 사용사례 (Inspiring Best Practices Showcase)
  var TAB_SHOWCASES = {
    home: {
      persona: {
        name: '민우',
        role: '직장인 수험생 (세무사 1차 준비)',
        rank: 'Lv.23 코스믹 랭크',
        avatar: '🌌'
      },
      tagline: '퇴근 후 매일 3초 체크인과 루틴 완주로 98일 연속 스트릭 달성!',
      previewHtml: 
        '<div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;border-radius:10px;padding:8px 12px;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:20px;">🔥</span>' +
            '<div>' +
              '<div style="font-size:12px;font-weight:800;color:#fde047;">98일 연속 스트릭</div>' +
              '<div style="font-size:10px;color:#cbd5e1;">스트릭 프리즈 1회 보존 중</div>' +
            '</div>' +
          '</div>' +
          '<span style="font-size:10px;font-weight:700;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:12px;">+120 EXP 완충</span>' +
        '</div>' +
        '<div style="font-size:11px;background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:4px;padding:6px 8px;margin-bottom:6px;">' +
          '<strong>🤖 AI 조언:</strong> "민우님, 오늘로 목표 누적 달성률 84% 돌파! 이번 주말 기출 1회독 완료 페이스입니다."' +
        '</div>' +
        '<div style="display:flex;gap:4px;font-size:10px;">' +
          '<span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:6px;font-weight:600;">✓ 3초 체크인 완료</span>' +
          '<span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:6px;font-weight:600;">✓ 세법 1강 완강</span>' +
          '<span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:6px;font-weight:600;">✓ 25분 집중</span>' +
        '</div>',
      story: '퇴근길 지하철에서 3초 체크인으로 시작해, 나만의 홈 구성으로 불필요한 위젯을 숨겨 오직 오늘 할 일에만 집중했습니다. 작은 실천이 모여 코스믹 랭크까지 올라왔습니다.',
      tips: ['퇴근 즉시 3초 체크인', '나만의 홈 구성으로 위젯 최적화', '데일리 퀘스트 3종 완주']
    },
    goals: {
      persona: {
        name: '서연',
        role: '프로덕트 디자이너',
        rank: 'Lv.19 제우스 랭크',
        avatar: '⚡'
      },
      tagline: '3개월 앱 출시 비전을 주간 루틴과 3계층 로드맵으로 100% 실천!',
      previewHtml:
        '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#fff;margin-bottom:6px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
            '<span style="font-size:11px;font-weight:800;color:#1e293b;">🎯 사이드 프로젝트 iOS 앱 출시</span>' +
            '<span style="font-size:10px;font-weight:700;color:#2563eb;background:#dbeafe;padding:1px 6px;border-radius:8px;">진행률 82%</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:6px;">구글 캘린더 연동: 2026.09.15 ~ 2026.10.10 (D-14)</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap;font-size:10px;">' +
            '<span style="background:#f1f5f9;color:#334155;padding:2px 6px;border-radius:4px;">🚩 와이어프레임 (완료)</span>' +
            '<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-weight:700;">🚩 피그마 UI (진행중)</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#475569;background:#f8fafc;padding:4px 8px;border-radius:6px;">' +
          '<span>📅 루틴 탭:</span>' +
          '<span style="font-weight:700;color:#4f46e5;">평일 매일 Figma 40분 (월~금 필터 완주 +10 EXP)</span>' +
        '</div>',
      story: '막연했던 앱 출시의 꿈을 목표-마일스톤-할 일 3단계로 쪼개고, 신설된 "루틴" 탭에서 평일 저녁마다 40분씩 꾸준히 달렸더니 출시가 눈앞에 다가왔습니다.',
      tips: ['목표-마일스톤-할일 3계층 분할', '평일 루틴 칩 필터 활용', '구글 캘린더 D-Day 연동']
    },
    calendar: {
      persona: {
        name: '준호',
        role: '러너 & 마케터',
        rank: 'Lv.14 포세이돈 랭크',
        avatar: '🌊'
      },
      tagline: '달력 셀마다 생생한 러닝 사진이 박히는 사진형 일기로 풀코스 완주!',
      previewHtml:
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:6px;">' +
          '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px;text-align:center;">' +
            '<div style="font-size:9px;color:#1e40af;font-weight:700;">9/23 (수)</div>' +
            '<div style="font-size:14px;margin:2px 0;">🏃‍♂️</div>' +
            '<div style="font-size:9px;font-weight:800;color:#1e3a8a;">한강 10km (사진)</div>' +
          '</div>' +
          '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px;text-align:center;">' +
            '<div style="font-size:9px;color:#1e40af;font-weight:700;">9/24 (목)</div>' +
            '<div style="font-size:14px;margin:2px 0;">🏋️</div>' +
            '<div style="font-size:9px;font-weight:800;color:#1e3a8a;">하체 보강 (사진)</div>' +
          '</div>' +
          '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px;text-align:center;">' +
            '<div style="font-size:9px;color:#991b1b;font-weight:700;">9/25 (금)</div>' +
            '<div style="font-size:14px;margin:2px 0;">🏁</div>' +
            '<div style="font-size:9px;font-weight:800;color:#991b1b;">마라톤 D-30</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#0369a1;background:#f0f9ff;padding:4px 8px;border-radius:6px;">' +
          '📎 첨부 자료: "▶️ 유튜브 러닝 자세 교정 10분 가이드" 연동' +
        '</div>',
      story: '달력에 단순히 글자만 적는 게 아니라, 매일 뛴 사진이 썸네일로 쏙쏙 박히니 한 달 달력을 볼 때마다 벅찬 성취감이 차오르고 운동을 거를 수가 없습니다.',
      tips: ['76px 와이드 달력 셀 활용', '체크인 시 인증 사진 첨부', '일정별 참고 링크/영상 저장']
    },
    records: {
      persona: {
        name: '지훈',
        role: '백엔드 개발자',
        rank: 'Lv.17 제우스 랭크',
        avatar: '⚡'
      },
      tagline: '25분 몰입 스톱워치와 365일 초록 히트맵으로 이직 성공!',
      previewHtml:
        '<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;margin-bottom:6px;">' +
          '<div>' +
            '<div style="font-size:10px;color:#64748b;">3×2 콕핏 몰입 타이머</div>' +
            '<div style="font-size:14px;font-weight:800;color:#0f172a;">⏱️ 뽀모도로 25:00 집중 완료</div>' +
          '</div>' +
          '<span style="font-size:10px;font-weight:700;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:6px;">알고리즘 +50 EXP</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:3px;margin-bottom:4px;">' +
          '<span style="font-size:10px;color:#475569;margin-right:4px;">실천 히트맵:</span>' +
          '<span style="display:inline-block;width:10px;height:10px;background:#86efac;border-radius:2px;"></span>' +
          '<span style="display:inline-block;width:10px;height:10px;background:#4ade80;border-radius:2px;"></span>' +
          '<span style="display:inline-block;width:10px;height:10px;background:#22c55e;border-radius:2px;"></span>' +
          '<span style="display:inline-block;width:10px;height:10px;background:#15803d;border-radius:2px;"></span>' +
          '<span style="display:inline-block;width:10px;height:10px;background:#166534;border-radius:2px;"></span>' +
          '<span style="font-size:10px;font-weight:700;color:#15803d;margin-left:4px;">342일 달성 (4단계)</span>' +
        '</div>',
      story: '퇴근 후 딴짓 유혹이 들 때마다 전체화면 집중 타이머를 켰습니다. 히트맵이 빼곡한 초록빛으로 채워지는 걸 보며 이직 코딩테스트를 완벽하게 통과했습니다.',
      tips: ['25분 몰입 스톱워치 측정', '히트맵 콕핏으로 지속성 점검', '5단위 주간/월간 회고']
    },
    comm: {
      persona: {
        name: '수아',
        role: '임용고시 준비생',
        rank: 'Lv.12 포세이돈 랭크',
        avatar: '🌊'
      },
      tagline: '기상 크루들과 실시간 스탬프를 나누며 혼자만의 외로움 극복!',
      previewHtml:
        '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#fff;margin-bottom:6px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-bottom:4px;">' +
            '<span>📡 러닝메이트 콤팩트 레이더</span>' +
            '<span style="color:#2563eb;font-weight:700;">24명 동시 열공 중</span>' +
          '</div>' +
          '<div style="font-size:11px;color:#1e293b;font-weight:600;margin-bottom:6px;">' +
            '"오늘 교육학 모의고사 1회독 완료! 다들 파이팅입니다 🔥"' +
          '</div>' +
          '<div style="display:flex;gap:6px;font-size:10px;">' +
            '<span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:10px;">❤️ 응원해요 42</span>' +
            '<span style="background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:10px;">💡 도움돼요 18</span>' +
            '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;">🎁 마니또 스탬프</span>' +
          '</div>' +
        '</div>',
      story: '독서실에서 혼자 공부하다 지칠 때 소통 탭의 동류 레이더를 보면 나처럼 새벽을 불태우는 러너들이 보입니다. 서로 리액션과 스탬프를 주고받으며 슬럼프를 이겨냈습니다.',
      tips: ['체크인 즉시 1-클릭 피드 자랑', '진정성 있는 4대 피드 리액션', '내 전용 동반자 초대 링크 공유']
    },
    settings: {
      persona: {
        name: '현우',
        role: '스타트업 창업가',
        rank: 'Lv.25 코스믹 마스터',
        avatar: '🌌'
      },
      tagline: '100% 무손실 데이터 주권과 320종 AI 아바타로 지키는 나만의 인생 본부!',
      previewHtml:
        '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;border-radius:8px;padding:8px 10px;margin-bottom:6px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
            '<span style="font-size:11px;font-weight:800;color:#38bdf8;">🛡️ 100% 데이터 주권 3중 안전망</span>' +
            '<span style="font-size:9px;background:rgba(56,189,248,0.2);color:#38bdf8;padding:1px 5px;border-radius:4px;">원장 영속화</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#cbd5e1;">로컬 3중 백업 + Supabase 원격 보존 + 1-클릭 무손실 복구</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;font-size:10px;color:#475569;background:#f1f5f9;padding:4px 8px;border-radius:6px;">' +
          '<span>🎭 320종 AI 아바타 보관함:</span>' +
          '<span style="font-weight:700;color:#7c3aed;">10/10개 슬롯 만충 & 5대 랭크 배경 결합</span>' +
        '</div>',
      story: '폰을 바꾸거나 캐시를 지워도 "내 데이터 전체 복원" 한 번이면 3년간 쌓은 모든 목표와 히트맵이 1초 만에 되살아납니다. 데이터 주권이 보장되니 평생 믿고 쓸 수 있습니다.',
      tips: ['토스식 프로필 요약 카드 확인', '320종 AI 아바타 보관함 관리', '30일 탈퇴 유예 안전망 보장']
    }
  };

  var TAB_GUIDES = {
    home: {
      icon: '🏠',
      badge: 'Home Cockpit',
      title: '아워골 홈 화면 100% 활용법',
      subtitle: '3초 체크인과 루틴 스트릭, 나만의 홈 구성으로 완성하는 갓생 콕핏',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 3초 체크인 & 스트릭 실시간 축적',
          desc: '오늘 실천한 작은 행동을 3초 만에 적으세요. 기록하는 순간 스트릭(연속 달성일)이 쌓이고 히트맵과 성취 그래프에 즉각 동기화됩니다.'
        },
        {
          color: '#10b981',
          title: '2. 데일리 퀘스트 (+120 EXP) & 아바타 랭크 진화',
          desc: '① 3초 체크인(+30) ② 할 일 1개 완수(+40) ③ 25분 집중 시간기록(+50)을 달성하여 매일 EXP를 얻고, 새싹부터 코스믹 우주까지 5대 테마 랭크 날개를 진화시키세요.'
        },
        {
          color: '#8b5cf6',
          title: '3. 3대 맞춤 AI 피드백 & 오늘의 추천 미션',
          desc: '저장 즉시 3대 모드(기본·중간·정밀) AI가 맞춤 조언을 건네며, 무엇을 할지 막막할 때는 내 목표 기반 추천 미션 카드가 명쾌한 행동 가이드를 제시합니다.'
        },
        {
          color: '#f59e0b',
          title: '4. 나만의 홈 구성 (불필요한 위젯 끄기)',
          desc: '화면 상단 "나만의 홈 구성"을 통해 내게 불필요한 위젯은 숨기고, 가장 자주 쓰는 섹션만 전면에 배치하여 나만의 최적화된 콕핏을 완성하세요.'
        }
      ]
    },
    goals: {
      icon: '🎯',
      badge: 'Goal Hierarchy',
      title: '아워골 목표 관리 100% 활용법',
      subtitle: '거대한 비전을 주간 루틴과 3계층 로드맵으로 쪼개어 실천하는 목표 발전소',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 요일별 "루틴" 탭 (개인 탭 좌측 신설)',
          desc: '매일 반복할 습관을 요일별 칩 필터(오늘/월~일/전체)로 관리하고, 당일 루틴을 모두 완주하면 즉시 +10 EXP 보너스를 획득합니다. 교대근무 3종 모드 1초 치환도 지원합니다.'
        },
        {
          color: '#10b981',
          title: '2. 3계층 목표 분할 (목표 ➔ 마일스톤 ➔ 할 일)',
          desc: '거대한 목표를 3~5개의 핵심 마일스톤과 만만한 세부 할 일로 계층화하여 막연함과 심리적 압도감을 완벽히 해소합니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 구글 캘린더 일정 설정 & 기간(D-Day) 연동',
          desc: '목표·마일스톤 카드에서 바로 [일정설정] 버튼을 눌러 구글 캘린더와 동기화하고, D-Day 및 기간을 실시간으로 확인하며 페이스를 조절하세요.'
        },
        {
          color: '#f59e0b',
          title: '4. 팀 목표 (통합 수준관리 & 목표별 수준관리)',
          desc: '함께 달리는 크루들과 팀 목표를 공유하고, 팀 전체 수준관리와 목표별 개별 수준관리를 아코디언으로 분리하여 피로감 없이 시너지를 극대화합니다.'
        }
      ]
    },
    calendar: {
      icon: '📅',
      badge: 'Time & Schedule',
      title: '아워골 일정 및 캘린더 100% 활용법',
      subtitle: '사진형 일기(Photo Diary)와 목표 마감이 살아 숨 쉬는 4차원 실행 일정표',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 사진형 일기(Photo Diary) 썸네일 달력',
          desc: '체크인 시 업로드한 실천 인증 사진이 76px 와이드 달력 셀에 썸네일로 자동 연계되어, 한 달간 내가 해낸 기적 같은 변화를 사진 앨범처럼 한눈에 조망합니다.'
        },
        {
          color: '#10b981',
          title: '2. 월간 캘린더 & 주간 타임라인 듀얼 뷰',
          desc: '월간 뷰로 장기 마일스톤 마감을 조망하고, 일간 시간표 뷰로 오늘 하루의 24시간 블록을 밀도 있게 계획합니다. 상단 전환 버튼으로 언제든 자유롭게 오갑니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 일정별 스마트 참고자료 (유튜브/링크/메모) 첨부',
          desc: '일정마다 운동 루틴 영상, 학습 자료 링크, 준비물 메모를 미리 첨부해 두어 당일 실행 시 검색할 필요 없이 1초 만에 실행에 돌입합니다.'
        },
        {
          color: '#f59e0b',
          title: '4. 외부 캘린더 (WebCal / 구글) 실시간 구독 연동',
          desc: '구글 OAuth 무인 백그라운드 갱신 파이프라인 및 WebCal 구독 링크로 애플 캘린더, 구글 캘린더 등 자주 쓰는 캘린더 앱에 실시간으로 일정을 보냅니다.'
        }
      ]
    },
    records: {
      icon: '✍️',
      badge: 'Records & Analytics',
      title: '아워골 기록 및 성취 분석 100% 활용법',
      subtitle: '3×2 몰입 콕핏, 실천 히트맵, 5단위 회고로 증명하는 나의 진짜 성장',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 기록/통계 듀얼 허브 & 3×2 핵심 콕핏',
          desc: '집중 타이머, 인생 타임라인, 실천 히트맵, 5단위 회고, 다각화 통계, 안전 보관함 6대 기능을 3×2 그리드로 배치하여 시인성과 접근성을 극대화했습니다.'
        },
        {
          color: '#10b981',
          title: '2. ⏱️ 지금부터 시간기록 (몰입 타이머)',
          desc: '전체화면 집중 스톱워치와 뽀모도로 타이머로 지금 하는 일의 몰입 시간을 1초 단위로 측정하고 목표에 바로 배선하여 저장합니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 성취 통계 & 히트맵 콕핏',
          desc: '14px 스케일업된 고해상도 히트맵으로 내 실천 밀도를 확인하고, 오늘·1주·1달·1년 단위 회고를 통해 지속 가능한 자기 효능감을 키웁니다.'
        },
        {
          color: '#f59e0b',
          title: '4. 1초 체험 & 원클릭 데이터 완전 초기화',
          desc: '샘플 데이터로 아워골 통계의 진가를 1초 만에 맛보고, [기록 초기화] 버튼으로 언제든 깔끔하게 내 진짜 데이터만 남길 수 있습니다.'
        }
      ]
    },
    comm: {
      icon: '💬',
      badge: 'Social & Feed',
      title: '아워골 소통 탭 100% 활용법',
      subtitle: '고독한 싸움이 아닌, 동류와 함께 응원하고 나누는 건강한 성장 광장',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 실시간 러닝메이트 콤팩트 레이더',
          desc: '지금 이 순간 함께 달리고 있는 동류 러너들의 현황을 슬림한 콤팩트 카드로 확인하고, 혼자가 아니라는 든든한 연대감을 얻습니다.'
        },
        {
          color: '#10b981',
          title: '2. 10대 카테고리 피드 & 1-클릭 피드 자랑',
          desc: '운동, 학업, 어학, 재테크 등 10대 카테고리별로 실천 글을 탐색하고, 체크인 완료 즉시 [📢 피드에도 자랑하기 (+5 EXP)]로 내 성과를 당당히 공유합니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 진정성 있는 4대 피드 리액션 & 마니또 익명 응원',
          desc: '단순한 좋아요를 넘어 응원해요, 도움돼요, 조언해요 등 건설적인 피드백을 주고받으며, 매일 매칭되는 마니또에게 원클릭 웰컴 스탬프를 선물합니다.'
        },
        {
          color: '#f59e0b',
          title: '4. 내 전용 동반자 초대 링크 복사 & 닉네임 검색',
          desc: '소통 탭 상단에서 내 전용 동반자 초대 링크를 원클릭으로 복사해 친구를 초대하거나, 가입자 닉네임을 검색해 바로 메이트를 맺을 수 있습니다.'
        }
      ]
    },
    settings: {
      icon: '⚙️',
      badge: 'System & Sovereignty',
      title: '아워골 설정 100% 활용법',
      subtitle: '100% 데이터 주권과 320종 AI 아바타를 관리하는 토스식 컨트롤 센터',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 토스식 UI/UX 혁신 & 상단 프로필 요약 카드',
          desc: '복잡한 메뉴를 직관적인 카드형으로 개편하고 상단 프로필 요약 카드를 통해 내 레벨, EXP, 랭크 백그라운드를 한눈에 파악합니다.'
        },
        {
          color: '#10b981',
          title: '2. Gemini 비전 AI 320종 아바타 보관함 & 5대 랭크 배경',
          desc: '내 사진으로 만드는 나만의 AI 캐릭터와 10개 보관함 슬롯, 그리고 레벨업에 따라 진화하는 새싹·숲·포세이돈·제우스·우주 백그라운드 이미지를 관리합니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 100% 데이터 주권 & 5계층 무손실 보안 방어선',
          desc: '기기 로컬스토리지 3중 백업, Supabase 원격 영속화, 1-클릭 전체 복원 엔진으로 기기를 바꾸거나 브라우저를 지워도 데이터가 완벽히 보존됩니다.'
        },
        {
          color: '#10b981',
          title: '4. 30일 탈퇴 유예 안전망 & 공식 전담 지원',
          desc: '개인정보보호법 21조 및 3대 법령을 준수하며, 30일 탈퇴 유예 안전망, 비밀번호 암호화, 공식 업무용 고객지원 채널(ourgoal.support@gmail.com)로 유저의 권익을 완벽하게 보호합니다.'
        }
      ]
    }
  };

  function renderTabSegmentButtonsHtml(activeKey){
    return TAB_KEYS.map(function(t){
      var isActive = (t.key === activeKey);
      var bg = isActive ? 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)' : 'var(--bg-card, rgba(0,0,0,0.04))';
      var color = isActive ? '#ffffff' : 'var(--ink-soft)';
      var border = isActive ? 'transparent' : 'var(--rule)';
      var fw = isActive ? '800' : '600';
      var shadow = isActive ? '0 2px 6px rgba(99,102,241,0.3)' : 'none';
      return '<button type="button" class="tab-guide-seg-btn" data-guide-key="' + t.key + '" ' +
        'style="flex-shrink:0;padding:5px 11px;border-radius:12px;font-size:12px;font-weight:' + fw + ';color:' + color + ';background:' + bg + ';border:1px solid ' + border + ';box-shadow:' + shadow + ';cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s ease;">' +
        '<span>' + t.icon + '</span><span>' + t.label + '</span>' +
      '</button>';
    }).join('');
  }

  function renderBestPracticeShowcaseHtml(tabKey){
    var sc = TAB_SHOWCASES[tabKey] || TAB_SHOWCASES.home;
    var tipsHtml = (sc.tips || []).map(function(tip){
      return '<span class="showcase-tip-chip">💡 ' + tip + '</span>';
    }).join('');

    return '<div class="tab-guide-showcase-card">' +
      '<div class="showcase-header">' +
        '<span class="showcase-badge">🌟 실제 우수 사용사례 (Best Practice)</span>' +
        '<div class="showcase-persona-row">' +
          '<div class="showcase-avatar-icon">' + sc.persona.avatar + '</div>' +
          '<div class="showcase-persona-meta">' +
            '<div class="showcase-name">' + sc.persona.name + ' <span class="showcase-rank-tag">' + sc.persona.rank + '</span></div>' +
            '<div class="showcase-role">' + sc.persona.role + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="showcase-tagline">“' + sc.tagline + '”</div>' +
      '</div>' +
      '<div class="showcase-mini-preview">' +
        sc.previewHtml +
      '</div>' +
      '<div class="showcase-story-box">' +
        '<div class="showcase-story-title">💬 갓생 실천 비결</div>' +
        '<div class="showcase-story-text">' + sc.story + '</div>' +
      '</div>' +
      '<div class="showcase-tips-row">' +
        tipsHtml +
      '</div>' +
    '</div>';
  }

  function renderTabContentHtml(tabKey){
    var g = TAB_GUIDES[tabKey] || TAB_GUIDES.home;
    var showcaseHtml = renderBestPracticeShowcaseHtml(tabKey);
    var sectionsHtml = g.sections.map(function(s){
      return '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid ' + s.color + ';margin:0 0 10px 0;box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
        '<div style="font-weight:800;font-size:.875rem;color:' + s.color + ';margin-bottom:4px;">' + s.title + '</div>' +
        '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' + s.desc + '</div>' +
      '</div>';
    }).join('');

    return '<div class="tab-guide-hero" style="text-align:center;margin-bottom:14px;">' +
      '<div style="font-size:2.2rem;margin-bottom:6px;">' + g.icon + '</div>' +
      '<span style="display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary);margin-bottom:6px;">' + g.badge + '</span>' +
      '<h3 style="font-size:1.125rem;font-weight:800;color:var(--ink);margin:0;">' + g.title + '</h3>' +
      '<p style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;">' + g.subtitle + '</p>' +
    '</div>' +
    showcaseHtml +
    '<div style="display:flex;flex-direction:column;">' +
      sectionsHtml +
    '</div>';
  }

  function showTabUsageGuide(tabKey){
    var curKey = (tabKey && TAB_GUIDES[tabKey]) ? tabKey : (window.state && window.state.activeTab && TAB_GUIDES[window.state.activeTab] ? window.state.activeTab : 'home');

    var modalHtml = 
      '<div class="tab-guide-hub-modal" style="max-height:75vh;overflow-y:auto;padding:4px 2px;-webkit-overflow-scrolling:touch;">' +
        '<div class="tab-guide-segment-bar" id="tabGuideSegmentBar" style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px 2px 10px 2px;margin-bottom:14px;border-bottom:1px solid var(--rule);-webkit-overflow-scrolling:touch;">' +
          renderTabSegmentButtonsHtml(curKey) +
        '</div>' +
        '<div id="tabGuideContentSlot">' +
          renderTabContentHtml(curKey) +
        '</div>' +
      '</div>';

    if(typeof window.openModal === 'function'){
      window.openModal({
        title: '💡 아워골 100% 활용 가이드 허브',
        body: modalHtml,
        okText: '확인 및 닫기'
      });

      // 모달 오픈 직후 세그먼트 버튼 이벤트 리스너 바인딩
      setTimeout(function(){
        var segBar = document.getElementById('tabGuideSegmentBar');
        var slot = document.getElementById('tabGuideContentSlot');
        if(segBar && slot){
          segBar.addEventListener('click', function(e){
            var btn = e.target.closest('.tab-guide-seg-btn');
            if(!btn) return;
            var key = btn.getAttribute('data-guide-key');
            if(!key || !TAB_GUIDES[key]) return;
            curKey = key;
            segBar.innerHTML = renderTabSegmentButtonsHtml(curKey);
            slot.innerHTML = renderTabContentHtml(curKey);
            var parentModal = segBar.closest('.tab-guide-hub-modal');
            if(parentModal) parentModal.scrollTop = 0;
          });
        }
      }, 50);
    } else {
      var g = TAB_GUIDES[curKey];
      alert(g.title + '\n\n' + g.subtitle);
    }
  }

  var api = {
    TAB_KEYS: TAB_KEYS,
    TAB_GUIDES: TAB_GUIDES,
    TAB_SHOWCASES: TAB_SHOWCASES,
    renderTabSegmentButtonsHtml: renderTabSegmentButtonsHtml,
    renderBestPracticeShowcaseHtml: renderBestPracticeShowcaseHtml,
    renderTabContentHtml: renderTabContentHtml,
    showTabUsageGuide: showTabUsageGuide
  };

  return api;
}));
