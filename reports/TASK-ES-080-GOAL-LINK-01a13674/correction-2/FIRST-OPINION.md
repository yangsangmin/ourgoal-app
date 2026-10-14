# 최초 공식 반려 재현 의견

F7860C3B/38612643260 원판정은C080확인·C081/C082실패다. 이번자료는판정이아닌후속이다.

C081 exact9f 실제guest는step15 ngManualBtn없음을재현했다. 직전click시각dismissCooldown=true·modalActive=false였다. closeModal의기존400ms ghostguard 때문에 목표생성entry가진입하지않았다. 해당방어를삭제하지않고원source의재진입조건을동선에반영한다.

C082 원동선은네번째저장click에서막혔다(공식은앞type). 원raw의#btnGuestBackupLater가pointer를가렸고기기backup/pending은세기록이었다. 실제모달은기존guest보관권유이며source는셋째기록뒤350ms에이창을연다. 두번째/셋째목표제안은보이지않았다. 억제WeakMap의리셋이나새제안race를제품결함으로단정할근거는없다.

처음 자체runner는greeting notVisible를즉시검사해실패했다. original-ambiguous-pc 원raw는보존하고Court source의'곧사라진다'기대와맞춘qualified runner를새파일로분리했다. 원공식기대/제품변경0이며첫하네스오류를제품지적으로승격하지않았다. 다른reader/patch shape 메타오류는 FIRST-READER-QUALIFICATION.json에분리했다.
