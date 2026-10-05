# 에이전트 공통 작업참고 — 저장소 사본

헌법 `SNOWBALL`(v2026.10.06): 모든 에이전트(Claude·안티그래비티·코덱스·새 세션·다른 도구)는 작업·명령·질의 전에 최신 작업참고를 끝까지 읽는다.

## 어느 것을 읽나
1. **로컬 정본이 있으면 그것**: `C:/dev/agent-knowledge/WORK-REFERENCE.md` — PR 이 병합될 때마다 병합한 세션이 다시 만든다(최신판).
2. 없으면(다른 PC·클라우드 세션) **이 폴더의 사본**: `docs/agents/WORK-REFERENCE.md` — 생성 지도 일괄 갱신 때 함께 동기화되므로 로컬보다 몇 PR 늦을 수 있다. 첫 줄의 「기준 PR #N」으로 얼마나 최신인지 확인한다.

## 파일
- `WORK-REFERENCE.md` — 생성물. 손으로 고치지 않는다(`C:/dev/agent-knowledge/gen-reference.js` 가 만든다).
- `lessons.json` — 경험칙 원장 사본(정본은 `C:/dev/agent-knowledge/lessons.json`).

## 갱신 (헌법 SNOWBALL 갱신 의무)
- PR 병합 직후, 병합한 세션: 원장에 배운 것 반영 → `node C:/dev/agent-knowledge/gen-reference.js --pr <번호> --commit <해시>` → 노션 「에이전트 공통 작업참고」 기준 PR 표시 맞추기.
- 이 저장소 사본은 분열·기능 PR 마다 커밋하지 않는다(충돌 왕복 방지). 생성 지도 일괄 갱신 PR 에서 로컬 정본을 복사해 함께 올린다.
- 노션(사람이 보는 사본): 아워골 프로젝트 컨트롤타워 허브 → 「에이전트 공통 작업참고 (경험칙·가이드라인)」.
