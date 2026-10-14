# C081 추가 전제의 selector 결함

원 FIRST d92a32974d9404479e2df5bf727a0aa008b9cf70bd09aca54db912fe2e81a3f6 및 652e9c6b 시나리오를 변경하지 않는다. FIRST에 적은 author count와 공식 visible-count의 차이를 작성자에게 전달했고, 작성자가 숨김 대상이라는 원인을 보고했다. 이어 독립적으로 exact9f source를 직접 확인했다.

index.html:904의 #goalChipRow는 inline display:none 및 aria-hidden=true다. js/tabs/goals/render.js:110 이후는 그 안에 [data-chip] 버튼을 만들지만 display를 복원하지 않는다. 해당 id의 전체 제품 참조도 확인했다. court/lib/scenario.js:226의 count는 h.vis로 걸러 보이는 개수만 센다. 따라서 C081에 추가된 '#goalChipRow [data-chip]' equals2는 실제로 목표 둘이 만들어져도 공식 실행기에서 참이 될 수 없다. author의 전체 DOM count 성공이 이 결함을 가렸다.

이 결함은 원 제품 또는 원 기대를 고칠 근거가 아니다. 추가한 양성 전제의 대상 selector/관측 위치를 실제 보이는 목표 목록으로 교정해야 한다. 원 두 목표·원 부재 기대와 C082를 보존한다. 현재652e9c6b를 재심 준비 완료로 인계하지 않는다. 새 교정 동결 뒤 이 추가 count 경계만 별도 확인한다. 독립 브라우저 실행이나 공식 재심은 하지 않았다.
