# 아워골 보고 서식 정본 (REPORT-TEMPLATES)

> **정본 위치**: 이 파일. 헌법 커널 v2026.10.10-SLIM 개정에서 커널 `situational_reporting_templates` 블록의 서식 본문 5종을 글자 그대로 이곳으로 옮겼다(커널에는 서식 **규칙** `mandatory_formatting` 과 이 파일의 경로만 남는다).
> **효력 관계**: 서식을 지키라는 의무와 "성공값을 미리 적지 않는다"는 규칙은 헌법(커널 `mandatory_formatting`·조문 8.2)이 정한다. 서식의 **칸·제목·순서**는 이 파일이 정한다. 서식 본문을 고치는 것은 운영 문서 PR(법정 심사)이고, 서식 규칙을 고치는 것은 헌법 개정(승인선 ⑤)이다.
> **상민님 대화 보고**는 이 서식이 아니라 조문 8.3(한 것 / 측정으로 검증한 것 / 다음에 열리는 것 · 결심 형식)을 따른다. 법령 전문 제8조 1호 「아워골 단일 표준 보고 서식」이 이 파일을 가리킨다.
> **빈 칸 규칙**: 대괄호 칸은 측정값과 출처로 채우고, 못 잰 칸은 「측정불가」. 성공값(PASS 등)이 미리 적힌 칸은 두지 않는다.

## 서식 5종 (커널 원문 · 식별자 보존)

| 식별자 | 대상 모드 | 쓰는 때 |
|---|---|---|
| TEMPLATE_MODE_1_ANALYSIS | MODE_1 | 분석·영향도 검토 보고서 |
| TEMPLATE_MODE_2_PLAN | MODE_2 | 구상·기획 초안(REQ·PLAN) |
| TEMPLATE_MODE_4A_DRAFT_PR | MODE_4A | 초안 PR 본문 — 5대 고정 블록 |
| TEMPLATE_MODE_4B_DEPLOY | MODE_4B | 배포 승인·최종 병합 보고서 |
| TEMPLATE_HALT_DECISION | PIN_02 | 서브에이전트 3회 핑퐁 정지 — [결심 필요] |

```xml
<template id="TEMPLATE_MODE_1_ANALYSIS" target_mode="MODE_1">
      <name>분석 및 영향도 검토 보고서</name>
      <structure_markdown>
### 🔍 [MODE_1] 분석 및 영향도 검토 보고서
* **작업 대상**: [기능명 / 이슈 번호]
* **검토 목적**: [상민님의 질의 요약]

#### 1. 구조 및 영향도 분석
- **수정/영향 대상 파일**: 
- **연관 모듈 및 컴포넌트**: 

#### 2. 사이드 이펙트 및 위헌 리스크
- **데이터 영속성 영향**: [Supabase DB 및 Tri-Sync 영향 여부]
- **기존 방어 코드 영향**: [Step 0 정독 결과 기존 로직 훼손 여부]

#### 3. 추천 구현 방향 및 선택지
- **선택지 A**: [장점 및 단점]
- **선택지 B**: [장점 및 단점]
- **최종 권장안**: [이유 명시]
      </structure_markdown>
    </template>

    <template id="TEMPLATE_MODE_2_PLAN" target_mode="MODE_2">
      <name>구상 및 기획 초안 보고서 (REQ / PLAN)</name>
      <structure_markdown>
### 📋 [MODE_2] 구상 및 기획 초안 보고서
* **Task ID**: 
* **작업 개요**: [작업 범위 명시]

#### 1. REQ (요구사항 정의서)
- **대상 DOM ID**: 
- **대상 함수명**: 
- **수정/생성 파일**: 

#### 2. PLAN (작업계획서 - 문제해결 8원칙)
- [ ] 1. 목표 정의: ...
- [ ] 2. 현상 분석: ...
- [ ] 3. 원인 추정: ...
- [ ] 4. 대안 탐색: ...
- [ ] 5. 실행 계획: ...
- [ ] 6. 절차 재검증 및 반론 격파: [반론 2가지 및 논리적 격파]
- [ ] 7. 즉시 실행: ...
- [ ] 8. 성과 측정: ...
* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
      </structure_markdown>
    </template>

    <template id="TEMPLATE_MODE_4A_DRAFT_PR" target_mode="MODE_4A">
      <name>5대 고정 블록 표준 구현 보고서 (Draft PR)</name>
      <structure_markdown>
### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서
* **PR 번호**: 
* **Task ID**: 

#### [블록 1] 개요
- **작업 내용**: [구현된 기능 및 버그 수정 요약]

#### [블록 2] REQ / PLAN 및 구체적 식별자
- **구체적 식별자**: DOM , 함수 , 파일 
- **PLAN 체크리스트**: [4단계: 심사 청구] 완료 상태

#### [블록 3] 핵심 변경사항
- **수정 파일 목록**:  (+XX lines, -YY lines)
- **소블록 자가분열 준수**: [바뀐 js 파일별 줄 수 · 측정 명령 / 측정불가]
- **세포 영향**: 바뀐 세포(신고서 id) · `node scripts/module-guard.js` 결과 · 기준선 `--update` 여부(올렸다면 사유)

#### [블록 4] Claims (주장)
-  기록 완료
- **주장 항목**: [구현 사실 및 무손실 입증 사실]

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)

      </structure_markdown>
    </template>

    <template id="TEMPLATE_MODE_4B_DEPLOY" target_mode="MODE_4B">
      <name>배포 승인 및 최종 병합 보고서</name>
      <structure_markdown>
### 🚢 [MODE_4B] 배포 승인 및 최종 병합 보고서
* **Main Merge Commit**: 
* **상민님 승인 명령**: '[승인 키워드]'

#### 1. 병합 및 배포 현황
- **원격 main 병합 완료**: [병합 커밋 해시 · PR 병합 기록 주소]
- **Vercel / Production 배포 상태**: [배포 주소 응답 코드 · 측정 시각 / 측정불가]

#### 2. PLAN 체크리스트 최종 승격
- [ ] [5단계: 배포 완료] — 원격 main 병합 커밋을 확인한 뒤 [x]
- [ ] [6단계: 원격 검증 완료] — 운영 주소 실측 뒤 [x]

#### 3. 원격 원장(Supabase) 및 Tri-Sync 상태
- **DB Realtime 동기화**: [확인한 시나리오 · 확인 수준(별표 2) / 측정불가]
- **데이터 자가치유 복원 입증**: [수명주기 4단계 실측 결과 · 출처 / 측정불가]

#### 4. 세포지도 갱신 (제11조 제3항)
- **출처 커밋**: [병합 커밋]
- **웹 세포지도 · 노션 세포지도 · 허브 최상단**: [갱신·되읽기 대조 완료 / pending — 사유]
      </structure_markdown>
    </template>

    <template id="TEMPLATE_HALT_DECISION" target_mode="PIN_02">
      <name>3회 핑퐁 정지 및 상민님 결심 요청 보고서</name>
      <structure_markdown>
### ⚠️ [결심 필요] 서브에이전트 3회 핑퐁 정지 보고서
* **Task ID**: 
* **정지 사유**: 빌더-레드팀 간 수정-반려 3회 초과 (PIN_02 트립와이어 발동)

#### 1. 대립 및 병목 개요
- **빌더 에이전트 주장**: [구현 방식 및 당위성]
- **레드팀 감찰 지적**: [지적된 헌법 위반 또는 결함 내용]

#### 2. 대립 지점 상세
- **쟁점 1**: ...
- **쟁점 2**: ...

#### 3. 상민님 결심 요청 항목 (Decision Required)
- [ ] **선택지 A**: [상민님의 결정이 필요한 안건 A]
- [ ] **선택지 B**: [상민님의 결정이 필요한 안건 B]
      </structure_markdown>
    </template>
```

## 이력
- 2026-10-10 v2026.10.10-SLIM: 커널 604~731행(128줄)에서 이관. 원문은 `docs/rules/archive/AGENTS_KERNEL_v2026.10.10-OUTCOME.md` 604~731행과 글자 동일(이관 PR 의 claims 가 대조).
