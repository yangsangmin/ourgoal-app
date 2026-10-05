# 세포지도 갱신 절차 (#TASK-ES-414)

상민님이 보는 세포지도는 세 곳이다. 셋 다 **같은 생성기 출력** 하나(`docs/architecture/cell-map.json`)에서 나온다. 손으로 고치지 않는다.

| 어디 | 주소 | 무엇을 읽나 |
| :-- | :-- | :-- |
| 저장소 | `docs/architecture/cell-map.json` | 생성기 `scripts/cell-map-export.js` 가 만든 정본 |
| 웹페이지 | https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J | ① jsDelivr `https://cdn.jsdelivr.net/gh/yangsangmin/ourgoal-app@main/docs/architecture/cell-map.json` ② 페이지 저장본(artifact db `cellmap/meta` + `cellchunks/c0…`) — 둘 다 되면 기준 커밋 시각이 늦은 쪽. 상태바에 출처·기준 커밋·시각 |
| 노션 | 「아워골 세포지도 (실시간)」 https://app.notion.com/p/3f0598db9096810aa8ace3e2e6dcf2aa (허브 맨 위에 링크) | `scripts/cell-map-publish.js --notion-out` 이 만든 본문 |

## 언제

- PR 이 main 에 병합된 뒤, 그 PR 이 `js/**`·`index.html`·`docs/architecture/modules.json`·`docs/architecture/module-baseline.json` 중 하나를 바꿨으면.
- 새 세포를 만들었으면 `docs/architecture/cell-descriptions.json` 에 「이 세포가 하는 일」 한 줄(사용자가 보는 기능 말로)을 더한다. 없으면 지도에 「설명 대기」로 뜬다.

## 세션이 할 일 (순서대로)

1. 최신 main 위에서 지도를 다시 만든다.
   ```
   git -C C:/dev/ourgoal-app fetch origin -q
   git -C C:/dev/ourgoal-app worktree add C:/dev/wt/cell-map-sync -b chore/<날짜>-cell-map-sync origin/main
   cd C:/dev/wt/cell-map-sync
   node scripts/cell-map-export.js --check     # 「갱신 필요」면 아래 계속, 「최신」이면 2단계부터(저장본·노션만 맞춘다)
   # --check 는 기준 커밋 도장(source.commit·short·committedAt·subject)을 빼고 내용만 비교한다(#TASK-ES-424) — 「도장만 다름」이면 다시 만들지 않는다
   node scripts/cell-map-export.js             # docs/architecture/cell-map.json 다시 씀
   NODE_PATH=C:/dev/ourgoal-app/node_modules node tests/cell-map-export-es414.test.js
   ```
   바뀐 `cell-map.json`(과 설명을 더했으면 `cell-descriptions.json`)만 커밋해 PR 을 낸다. 병합되면 jsDelivr 경로가 그 판을 내준다.
2. 재료를 만든다(작업 폴더는 세션 임시 폴더).
   ```
   node scripts/cell-map-publish.js --root . --db-out <임시>/db --notion-out <임시>/notion --stored-at <지금 ISO 시각>
   # --root . : 게시 시점의 병합 이력으로 세포별 PR 목록을 다시 계산해 싣는다(#TASK-ES-427). 저장본과 내용(도장·PR 목록 밖)이 다르면 게시하지 않고 종료 코드 1
   ```
3. 웹페이지 저장본 갱신 — `ArtifactData` 로 `url=https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J`:
   - `list` `cellchunks` 와 `get` `cellmap/meta` 로 지금 `version` 을 읽는다.
   - `batch` 한 번에 `set cellchunks/c0 … cN`(file_path `<임시>/db/chunk-N.json`, `if_version`) → 마지막에 `set cellmap/meta`(file_path `<임시>/db/meta.json`). 묶음 수가 줄었으면 남는 `cellchunks/cK` 는 `delete`.
   - 순서가 중요하다: 묶음을 먼저, meta 를 마지막에. 페이지는 meta 의 `source.commit` 과 같은 commit 을 가진 묶음만 이어 붙인다(섞이면 「세포 묶음 n/m」 실패로 보인다). meta 가 바뀌면 열려 있는 페이지가 스스로 다시 읽는다.
   - 확인: `list cellchunks` 를 `out_dir` 로 받아 이은 `cells` 가 `cell-map.json` 의 `cells` 와 `deepStrictEqual`.
4. 노션 갱신 — 페이지 `3f0598db9096810aa8ace3e2e6dcf2aa`:
   - `notion-update-page` `replace_content` 에 `<임시>/notion/notion-0.md` 를 넣고, `notion-1.md`… 을 `insert_content`(position end)로 차례대로 붙인다(한 번에 넣기 큰 본문을 나눈 조각).
   - 되읽기 대조: `notion-fetch` 결과 파일로 `node scripts/cell-map-publish.js --verify-notion <fetch 결과 파일>` → 「세포 펼침 N/N · 하는 일 일치 N/N · 깨진 글자 0 · 기준 커밋 있음」이어야 한다(아니면 종료 코드 1).
5. jsDelivr 캐시 — `@main` 은 최대 12시간 늦을 수 있다. 병합 직후에는 purge 를 한 번 부른다.
   ```
   curl -s https://purge.jsdelivr.net/gh/yangsangmin/ourgoal-app@main/docs/architecture/cell-map.json
   curl -s https://cdn.jsdelivr.net/gh/yangsangmin/ourgoal-app@main/docs/architecture/cell-map.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).source.short))"
   ```
   마지막 줄이 병합된 기준 커밋과 같으면 끝.

## 알려진 한계 (측정 2026-10-05)

- 웹페이지(claude.ai artifact) 안에서 jsDelivr 로 `fetch` 하면 **「Failed to fetch」** 로 막힌다(같은 페이지를 로컬 파일로 열면 같은 주소가 응답한다 — artifact 보안 규칙이 외부 주소 읽기를 막는 것으로 판단). 그래서 웹페이지의 실제 갱신 경로는 3단계(페이지 저장본)다. jsDelivr 시도는 남겨 두어, 규칙이 풀리면 바로 저장소 main 을 실시간으로 읽는다.
- 저장소의 `cell-map.json` 은 다른 PR 이 자동으로 고치지 않는다(npm test 가 다른 PR 에 지도 갱신을 강제하지 않게 일부러 뺐다 — 모든 PR 이 같은 파일을 고치면 충돌이 난다). 갱신은 위 절차로 한다. 지금 지도가 낡았는지는 `node scripts/cell-map-export.js --check` 가 알려 준다. 생성기는 git 이 추적하는 파일만 읽는다(#TASK-ES-417) — 다른 세션이 작업 폴더에 남긴 미추적 문서·코드는 지도와 --check 결과에 들어가지 않는다.
