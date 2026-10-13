# PR978 병합 담당의 세포지도 후속 — 읽기 인수만

승인 경로 정본은 현행 kernel의 CELL_MAP/sync_duty와11.3~5다. **모든 원격main 병합마다** 병합 담당이 웹/노션/허브의 source와 시각을 갱신한다. `scripts/cell-map-sync.md`의 '제품/세포파일을 바꿨으면' 조건보다 상위 커널 의무를 따른다. 이번 담당의 지도/Notion/공용기록 쓰기·게시·원격되읽기 실측은 없다(null). root가 병합과 후속을 맡는다.

| 자료/경로 | 원문에서 인수한 실행 계약 |
|---|---|
| `docs/architecture/MODULE-BLUEPRINT.md` 머리·kernel CELL_MAP | 웹 지도 `https://claude.ai/artifact/VvfYJf37tYgRGwKezpHW2J`, 노션 지도 `https://app.notion.com/p/3f0598db9096810aa8ace3e2e6dcf2aa`, 허브 첫블록 두 지도 링크/갱신시각/source. 주소는 읽기 source이지 현재접근/갱신실측 아님 |
| `scripts/cell-map-export.js --check` / 생성기 | 병합 뒤 최신origin/main의 별도worktree에서 지도내용 비교. source 도장(commit/short/committedAt/subject)은 freshness비교에서 제외하므로 내용최신을 현재병합commit 도장갱신으로 주장하지 않음. basisPaths가 제품파일에 한정돼 문서병합커밋과 다를 수 있음 |
| `scripts/cell-map-publish.js --root <병합sourceWT> --db-out <재료/db> --notion-out <재료/notion> --stored-at <실제ISO>` | 생성정본과 내용이 다르면 게시하지않고exit1. 같은생성기출력에서 DB meta/chunks 및 notion-0.md…를 생성하며, 게시시점 PR/이력은root기준으로계산. 자료원본/비밀을중앙복제하지않음 |
| 웹 저장본 포맷 | `cellchunks/c0…` JSON은 index/commit/cells, `cellmap/meta`는source·chunkCount·cellIds·storedAt. CAS(if_version)로chunk를먼저, meta마지막. fetch후cells가생성정본과deepEqual. 옛ArtifactData 도구 경로는 현재root에서 없다고 확인돼 미실행/pending; 허구게시로 대체하지않음 |
| 노션 생성재료/검증 | 기존문서는 whole-page replace_content와추가조각insert_content를 적지만, root의 최신읽기에는 양비스자동생성구역markers가 있다. 그구역 밖과기존사람내용을보존한 좁은 갱신만root가검토해야하며wholepage삭제0. 정확현재marker/adapter지원은root의최신native읽기근거로대조. child직접Notion호출0 |
| `cell-map-publish.js --verify-notion <실제fetch파일>` | 생성된본문/세포설명/기준commit를실제되읽기로대조. 일부marker구역만수정했으면기존validator가전체페이지를가정하는지확인하며, 미지원이면검증부족pending을기록. 기존기계수정/우회로긍정판정하지않음 |
| jsDelivr | 문서에는purge/CDN되읽기경로가있지만웹artifact Failed-to-fetch 한계를 별도로 적었다. CDNsource가같다는것만으로웹저장본/Notion/허브갱신을완료표시하지않음 |

TASK705의 `docs/specs/{REQ,PLAN}-TASK-ES-705-CELL-MAP.md`는 기존생성기/게시재료를만들었고 원격웹/노션/허브는pending임을보존한다. 현재latestsource와해시를부담당이직접게시한것으로승격하지않는다. 이번회차추가제품/지도시험을돌리지않고경로·포맷만읽었다.
