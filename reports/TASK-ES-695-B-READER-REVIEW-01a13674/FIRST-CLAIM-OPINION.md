# exact claims 최초 독립 source 의견 — 불변

원 reader 의견의 당시 claims pending은 불변 보존한다. 이 후속 의견은 root가 전달한 exact 통합 `6a69db41e748700479322a8a5cdbd0e811aa9468`의 claims/REQ를 읽기로 인수한 것이다. 자기 WT reader source는 원 `eb232b3b4f96c2d56a17d929fc9f2b6961830737`에서 바꾸지 않았다. author `11ad8f7a...` / closure `7fd740fe...`와 전달된 claims/seal/closure/root-intake hash가 `claim-static.json`에 대응한다.

`oldClaimsObjectsExact/oldClaimsLiteralObjectsExact`, `oldRequirementsObjectsExact/oldRequirementsLiteralObjectsExact`, `requirementsSourcePrefixExact`, `originalC1ScenarioSha256Unchanged`는 별도 source 비교 산출이다. 기존 C1–C3/R1–R3, guest 원시나리오 및 REQ prefix를 그대로 두고 R4만 추가했다. `productAndTestPathsChanged`, `courtFilesChanged`는 빈 배열이며 reader·제품·구조·법정 source는 기존 의견 대상과 같다.

새 C4–C6는 `kind=static/domain=config/check.type=codeContains`다. 각 `check.file`이 그 주장의 유일 touches이며 source에 선언된 loader 참조문을 인수한다. `newClaims[].textContainsBySource`, `sourceGuidedShape`, `sourceSha256`는 정확 source 확인값이다. C4의 account reader3509, C5의 P0 reader0c39, C6의 direct readeref20을 같은 원source에서 읽었다. 새 claim은 stub이나 새 기능/저장 proof를 추가하지 않는다.

`court/grade-floors.json`의 config 하한은 L1이고 해당 tests path/문장에 대해 설정된 path/keyword rule의 매칭 후보는 `newClaims[].pathFloorMatches/keywordFloorMatches`에 기록했다. 이것은 **읽기 비교**이며 Court validator/grade/judge를 실행하거나 최종 하한 통과를 판정한 것이 아니다. `court/claims.js:95–102`는 codeContains 형식/check.file의 touches 포함을 요구하고 `:233–238`은 static 결과를 글자 확인으로 구분한다. 생성기 전용 sourcePreservation을 쓰지 않았다.

새 statement는 참조문 포함 사실만 명시하고 실행 결과를 제외한다. 그러므로 범위·문장·형식이 source 참조 사실에 한정된다고 읽을 수 있다. **실제 reader 로드 성공·원단언 전체 보존·데이터 무손실·실계정/UI·R4 요구 전체 충족은 이 정적 claim으로 증명되지 않는다.** 원작성자의 선정 component 결과와 독립 reader source 비교는 각각 별도 출처이며 새 Court coverage/CI·사용·효과로 승격하지 않는다.

원 65E957E7 exact9cf의 확인 부족/unclaimed test와 CI940e 실패, 첫68BA 반려, 원독립 결함/원raw는 그대로다. 새 claim 때문에 그 과거 결과를 해소된 판정으로 바꾸지 않는다. 다음은 root가 고정한 source와 본 독립 source 의견을 인수해 새 통합의 필수 CI 및 공식 Court를 확인하는 것이다. 이 검토는 제품·시험·claims·원raw·법정 수정 및 기존시험/선정/validate 재실행을 하지 않았다.
