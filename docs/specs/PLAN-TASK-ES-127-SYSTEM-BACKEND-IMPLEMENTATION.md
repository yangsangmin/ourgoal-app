# #TASK-ES-127 활용법 감찰 적발 미구현 시스템 전수 백엔드·로직 완결 구현 설계서 (PLAN)

## 1. 아키텍처 및 구현 계획
1. **pi/calendar.js (신규 Vercel Serverless Function)**:
   - Method: GET
   - Query: 	oken (사용자 ID 또는 세션 토큰)
   - Header: Content-Type: text/calendar; charset=utf-8, Content-Disposition: inline; filename="ourgoal-schedule.ics"
   - Body: BEGIN:VCALENDAR ... END:VCALENDAR
   - Supabase 조회: 사용자의 events 및 goals 내 미완료/완료 마일스톤을 조회하여 표준 UTC DTSTART, DTEND, SUMMARY, DESCRIPTION 생성. 토큰이 없을 경우 데모 ics 반환.
2. **index.html 데일리 퀘스트 실제 EXP 누적 배선**:
   - enderDailyQuestBar(animate) 함수 내에서:
     - state.profile.settings.questRewards = state.profile.settings.questRewards || { date: '', q1: false, q2: false, q3: false }
     - 당일 날짜와 다를 경우 리셋.
     - q1Done && !rewards.q1 -> wardXP(30, '데일리 퀘스트: 오늘 체크인 완료')
     - q2Done && !rewards.q2 -> wardXP(40, '데일리 퀘스트: 핵심 마일스톤 실행')
     - q3Done && !rewards.q3 -> wardXP(50, '데일리 퀘스트: 25분 집중 완주')
     - 저장 및 프로필 레벨업 애니메이션 트리거.
3. **index.html 목표 도달 예정일 동적 계산 알고리즘**:
   - computePredictedGoalCompletionDate(goal) 함수 작성.
   - 남은 마일스톤 수와 최근 14일간 마일스톤 달성 주기(평균 일수) 계산.
   - 예상 완료일 산출 및 목표 헤더에 '페이스 기준 도달 예정일: YYYY.MM.DD' 뱃지 표시.
4. **pi/withdraw.js 30일 탈퇴 유예 안전망 구현**:
   - 즉시 영구 삭제 모드(immediate=true)와 유예 신청 모드(grace_period) 지원.
   - 기본 탈퇴 시 users 테이블의 status = 'withdrawal_pending', deleted_at = now() + interval '30 days' 마킹.
   - 탈퇴 신청 상태 유저가 30일 내 로그인 시 "탈퇴 유예 중(D-XX일 남음) · 탈퇴 취소하고 계정 복구" 옵션 제공.

## 2. 검증 계획
- 
pm test: 기존 267개 테스트 무결성 유지 (0 failure)
- 신규 스모크 테스트 추가: pi/calendar.js iCal 포맷 검증, 데일리 퀘스트 XP 누적 검증, 도달 예정일 알고리즘 검증, 탈퇴 유예 로직 검증.
- 로컬 브라우저 수동 확인 (3단계)
- PR 발행 및 프리뷰 배포 (4단계)
