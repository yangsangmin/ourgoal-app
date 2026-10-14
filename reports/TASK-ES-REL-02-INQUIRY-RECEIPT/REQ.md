# 원078: REL-02 문의·평가 접수의 실제 영속 확인 및 클라이언트 입력 보존

작업: TASK-ES-REL-02-INQUIRY-RECEIPT. 기준 커밋: origin/main (0692dbd2).
원승인: 2026-10-15 상민님 출시계획 A안 승인.
목표: 문의·평가 접수 시 실제 원장(Supabase inquiries 또는 Notion 원장)에 저장되었을 때만 성공으로 처리하고, 저장 실패 시에는 접수 성공으로 위장하지 않고 입력과 모달을 보존하여 재시도할 수 있도록 한다.

## ① 파악
- R1: api/track.js 의 handleInquiry 는 Supabase inquiries 또는 Notion 저장 원장에 실제 저장되었을 때만 200 ok:true 와 receipt 를 반환하고, 저장 원장 적재가 모두 실패하면 503 ok:false 를 반환한다.
- R2: 클라이언트 앱 평가 모달은 서버가 접수 성공(httpOk && ok:true)을 확정한 경우에만 폼을 초기화하고 모달을 닫는다. 접수 실패 또는 네트워크 통신 오류 시에는 성공으로 안내하지 않고 입력 내용과 모달을 유지하며, 재시도 시 동일 평가 id를 갱신하여 로컬 중복을 방지한다.

## ② 본질·원인·중심·핵심
- 본질: 사용자가 보낸 피드백과 문의가 실제로 안전하게 저장되었는지 정직하게 소통하는 것이다.
- 원인: api/track.js 의 handleInquiry 가 3경로 저장 결과와 무관하게 무조건 res.status(200).json({ ok: true })를 반환했고, app-evaluation.js 가 응답 ok 여부나 catch 블록과 무관하게 폼 초기화 및 닫기를 실행했다.
- 중심: 서버의 접수 판정 일원화와 클라이언트의 실패 시 복구 보존이다.
- 핵심: 저장 실패 시 성공 위장 차단 및 사용자 입력 유실 방지다.

## ③ 해결방식
- api/track.js: storedInLedger = results.supabase || results.notion 검증. 미저장 시 503 응답. 성공 시 receipt.id 와 notify 상태 분리 반환.
- js/tabs/settings/app-evaluation.js: pendingEvalItem 으로 재시도 시 id 유지. httpOk && data.ok 확인 후에만 닫기 및 초기화. 실패/에러 시 모달과 입력 유지 안내.

## ④ 재검토
- 기존 T014 inquiries 스키마 및 support-modals.js 의 정상 접수 흐름과 완벽히 호환된다.
- 금고 파일이나 규범 파일 변경이 없으며 새 개인정보 수집이나 기존 기능 삭제가 없다.
