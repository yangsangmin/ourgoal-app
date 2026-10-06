# TASK-ES-573 함수 끝 같은 줄 단순 window 노출 보존 도구

작업참고 기준 PR #833 (f91b0979), L051. 유형 이탈: 생성기의 줄 단위 추출 차단을 명시 opt-in의 좁은 AST 끝 범위로 대체한다. 제품 분열은 이 작업에 포함하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악

origin/main f91b0979 index.html의 defaultProfile 끝은 `} window.defaultProfile = defaultProfile;` 한 줄이다. gen-inline-hard.js tailCode는 이를 막는다. 차단만 풀면 range(it.segStart,it.end)가 노출까지 새 세포에 복사하고 index splice가 그 노출을 지운다. verify-inline-hard.js의 movedRanges도 끝 줄 전체 토큰을 빼므로 노출 유실을 검출하지 못한다.

## 2. [원칙 ②] 본질·원인·중심·핵심

함수 끝 AST 위치와 원래 노출문의 실행 위치가 서로 다른 책임인데 한 물리 줄을 공유한다. 원문 AST 끝 열을 추출 경계로 쓰고 나머지 문자열을 같은 치환 위치에 그대로 남기는 것이 핵심이다. Babel loc.column과 JS slice는 같은 UTF-16 열을 쓰며 기존 CRLF→LF 정규화는 유지한다.

## 3. [원칙 ③] 해결방식

take.preserveWindowSuffix=true일 때만 여러 줄 FunctionDeclaration, 앞 문과 줄 공유 없음, 끝 열까지 공백+닫는 }만 있음, 다음 AST 문이 같은 줄의 비계산 window.함수이름=같은함수 대입 하나, 끝 세미콜론 필수·뒤 공백/라인주석만 허용한다. IIFE 안 window 이름이 가려졌으면 차단한다. 기존 `이전 전 index.html a~b줄` 표지를 유지하고 다음 줄에 `원문 AST 끝 b:열 · 함수명 · 같은 줄 window 노출 보존` 표지를 추가한다. 추출 끝·index 치환·meta에 실제 열을 기록한다.

## 4. [원칙 ④] 재검토

반론1: AST만 같으면 노출 공백·주석을 잃어도 된다. 그렇지 않다. 원본 suffix와 새 index 표지 뒤 문자열을 글자 그대로 비교한다. 반론2: 검사 표지 열을 믿으면 범위를 넓혀 노출을 검사에서 빼돌릴 수 있다. 원본 AST의 같은 함수 끝·명시 설정·뒤 대입 문과 대조해 끝 열 표지가 맞아야 한다. 일반 같은 줄 문·대입 연쇄·계산 속성·다른 이름 노출·한 줄 함수·함수 앞 문은 계속 차단한다.

## 5. [원칙 ⑤] 절차

번호·빈 브랜치 예약→원본 제약·시험 읽기 조사→명세/경계 도구→생성기·검사기만 수정→실제 defaultProfile 임시 사본 추출·토큰/rest/suffix 검사→기존 대표 설정 이전/개선 도구 출력 대조→앞선 병합 뒤 최종 기준 통지→비제품 측정 보고·커밋→root 도구 PR 심사.

## 6. [원칙 ⑥] 절차 재검증

defaultProfile은 FN_NAMES에 없다. smoke APP_SRC는 core 파일을 읽고 direct-login-guard는 inline-bundle을 읽는다. coreMovedCellFiles의 기존 표지 정규식은 변경하지 않으며 추가 표지는 기존 표지 다음 줄이다. 실제 제품 분열 때는 별도 TASK가 전체 CELL_SPLIT_PROOF를 수행한다. 이 도구의 직접 함수·문자 비교 결과를 법정 실측이나 실계정 E2E로 부르지 않는다. 기존 시험지·기대값·법정·금고·규범은 고치지 않는다.

## 7. [원칙 ⑦] 식별자별 실행

R1: gen-inline-hard.js의 windowSuffixEnd와 take.preserveWindowSuffix로 좁은 지원을 구현한다.
R2: verify-inline-hard.js lineCheck.sourceEndOk·preservedTails.suffixSame·restSame이 함수 원문·남은 노출을 함께 검증한다.
R3: inline-stage3-z2-552.json과 inline-next568.json을 각 이전 입력에서 기존/개선 생성기로 실행해 생성 index·세포 파일·검사 보고가 같다.
R4: tail-range-check-573.js는 허용·차단·노출 삭제/추가/공백 변경·표지 끝 열 변조를 독립 임시 디렉터리에서 확인한다. 기본 flag 없음은 계속 차단한다.
R5: 저장소 index.html·js/**·기존 tests/**·규범·금고 변경0을 확인한다.

## 8. [원칙 ⑧] 실패 예상·측정

검사 설정 flag와 표지 열이 어긋나면 실패한다. generator prefix 치환은 함수 끝 줄이 닫는 }만 있는 경우로 제한해 열 이동이 없다. 단순 노출에 추가 실행 문·주석 끼워넣기·다른 이름이 있으면 원본 보존하고 차단한다. 기존 대표 출력이 달라지면 지원을 좁히거나 이 작업을 보류한다. 최신 main을 받은 뒤 생성 도구와 동일 입력으로 재측정하며 제품 분열은 진행하지 않는다.

이탈 네 가지: ① 기존 #482는 같은 줄 뒤 코드가 있으면 전부 차단했다. ② 실제 defaultProfile 뒤 노출 한 문장 때문에 독립 책임 이동이 막혔고 단순 차단 해제는 노출 유실을 만든다. ③ 명시 opt-in·AST 끝열·원문 suffix 보존으로 한 형태만 지원한다. ④ 기존 토큰/원문/rest/누수/처리기 검사에 AST 끝열·suffix 원문 검사를 추가하고 음성 대조로 훼손을 확인한다.

최종 작업자 도구 측정: reports/TASK-ES-573/tail-range-check.json. 기준 f91b0979072b48fda91ac9bbd38bc30d530ec22b, 경계 검사·기존 대표 출력 비교와 npm 종료는 보고 파일에 기록한다. static config 주장은 소스 식별자·설정 또는 보고값 적재만 확인하며 도구 재실행 판정은 아니다.
