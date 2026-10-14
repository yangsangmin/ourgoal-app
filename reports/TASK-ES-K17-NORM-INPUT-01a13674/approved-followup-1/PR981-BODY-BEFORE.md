### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서
* **PR 번호**: #981 (draft, 병합 금지)
* **Task ID**: TASK-ES-K17-NORM-DRAFT-01a13674

#### [블록 1] 개요
- **작업 내용**: [결심 필요] 승인선⑤. 기존 홈 추천 칩·컨디션 제거 결정과 충돌하는 법령 전문 제2조9항3·4호를 맞추는 초안이다. 표현 먼저·분류 나중, 차원별 기존 값 보존을 유지한다. 삭제 원승인은 인수했으며 이번 별도 전문 개정의 명시 「헌법 개정 승인」은 아직 없다. 새 개정은 승인과 해당 PR의 원격 main 병합 전까지 효력이 없고, PR978 DIR006 승인을 재사용하지 않는다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
- **구체적 식별자**: 전문 제2조9항3·4호, docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md, CONSTITUTION_VERSIONS.md, #smartRecommendChips/#sliderEnergy/#sliderFocus/#quickCheckinChips(제품 영향 식별자만).
- **PLAN 체크리스트**: .claude/plan-K17-norm-draft.md. [4단계: 심사 청구] 준비/최종 head 공식 판정 확인 뒤 인계. docs/specs/REQ-TASK-ES-K17-NORM-DRAFT-01a13674.md에 원문·R1~R4·8원칙을 기록했다.

#### [블록 3] 핵심 변경사항
- **수정 파일 목록**: 법령 전문의 정확 두 행 및 전문 판 안내, 같은 커널을 명시한 전문-only 대장 행, 직전 전문 원문 archive, 자기 문서·원승인 인수·claims·검증 raw. 관련 수치는 reports/TASK-ES-K17-NORM-DRAFT-01a13674/draft-1/prepared-measurement.json와 최종 변경 목록에 있다.
- **소블록 자가분열 준수**: JS/제품 코드 변경 없음.
- **세포 영향**: 세포·신고서·기준선 변경 없음. 커널내용/버전 v2026.10.14-DIR006-SAVE·포인터·ACTIVE·Court/게이트는 그대로다. 기존 저장자료·원격 권위·DIR006 순서 예외를 바꾸지 않는다. 기획정본10장·6.2의 같은 강제와 커닝페이퍼 후속 정합은 tri-sync 기존 경로와 단독 writer 미확인으로 별도 미완이며, 이 두 행을 전체 규범 정합 완료라고 주장하지 않는다.

#### [블록 4] Claims (주장)
- reports/TASK-ES-K17-NORM-DRAFT-01a13674/claims.json 기록 완료.
- **주장 항목**: 작업자 주장(법정이 확인한 것 아님): 검토된 두 행·전문판/대장/원문archive·새 효력 없음·제품예산0·기획정본 후속 분리를 정적으로 청구한다. 원삭제 문구/후속맞음/원66개와 074~082 연결은 기존 evidence.json로 인수했다. 원 최초소견·closure는 바이트 그대로 보존했다.
- **검증 범위**: 부록 버전·별표/대장 글자 검사와 claims 형식·원문/보호대상 byte 대조를 수행했다. 정상 git hooks가 요구하는 quick 검사는 그대로 실행하며 로컬 예비 결과를 공식판정으로 표시하지 않는다. CRLF/LF 비교의 최초 false, 잘못된 check 인자, stdout encoding 오류는 원기록을 보존하고 별도 교정했다. 기존 SQL3·첫 지표·허용 한 건·실계정 UI·full22 시험은 반복하지 않았다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)
판정: 확인 부족(막지는 않지만, 확인 못 한 채 나가는 것이 있습니다) — 채점 기준(금고) 변경입니다 — 상민님 결심이 있어야 합니다
상민님이 하실 일: 내용을 보시고 승인하시려면 “금고 변경 승인” 또는 “헌법 개정 승인”이라고 말씀해 주십시오. “1”·“진행”으로는 승인되지 않습니다.
지시 항목 기준 분포: 없음(제품 코드 변경이 없어 주장 심사 대상이 아닙니다)
심사 대상 커밋 73dfc5b (기준 d326db5) · 판정번호 61A96AEC · GitHub 에서 법정이 직접 실행(작업자 PC 밖 · 실행 번호 38507338720) · 이 PR 돌려보냄 누적 0회
GitHub court 검사 결론: success(통과 또는 확인 부족) · https://github.com/yangsangmin/ourgoal-app/actions/runs/38507338720/job/115667743233

규범 초안의 공식 판정은 확인 부족이며 승인이 있어야 합니다. 제품 변경이 없어 지시항목 분포는 없습니다. 독립 검토는 작성 종료 head 73dfc5bc에서 완료했고, 최초 의견과 조건은 reports/TASK-ES-K17-NORM-INDEPENDENT-01a13674/HANDOFF.md 및 CONDITIONS.md에 고정했습니다(독립 보고 HEAD 0cb28af0b77b90d8759acafda1eba07215fe029c). 한정 문구에서 새 명백한 결함을 발견하지 않았다는 의견이며 공식 통과·승인·효력이 아닙니다. 승인·병합 뒤에도 제품 삭제에 앞서 기획정본 MASTER_PLAN_OURGOAL.md 제10장·6.2의 정합과 원작업 078의 기존 컨디션 사용처·계산 조사 및 보고가 선행합니다. 저장된 값은 보존하며 DB 열 삭제·자료 파기·운영 경로 또는 writer 권한 확대를 승인하는 초안이 아닙니다. 새 승인·병합·발효·운영·제품사용·효과는 없거나 미확인입니다. 마지막 source/PR본문/clean/PID 관측은 C:/Users/HP/handover/2026-10-14-k17-norm-draft-01a1385b/final-seal.json로 별도 인계합니다.
