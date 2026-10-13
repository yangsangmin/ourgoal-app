/**
 * 기록 공유 의도 하나의 입력과 SDK 결과. #TASK-ES-701
 * @module records/share-feed-save
 * @kind tab
 * @role 현재 게시 창의 계정 귀속·중복 제출·미확정 재시도를 분리한다
 * 초안을 저장하지 않는다. 창 닫기·새로고침 복구는 지원하지 않는다.
 */
(function (global) {
  'use strict';
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }
  function createIntent(L) {
    var account = L.state.profile.id, id = 'post_' + L.newId();
    var preparedPost = null, inflight = false, accepted = false, sheet = null;
    function current() { return L.state.profile && L.state.profile.id === account; }
    function bind(target) { sheet = target; }
    function lockInput() {
      if (!sheet) return;
      sheet.querySelectorAll('input, textarea, select, button').forEach(function (el) {
        if (el.id !== 'shareConfirmBtn' && el.id !== 'sharePreviewBtn') el.disabled = true;
      });
      if (!sheet.querySelector('#shareFeedSaveStatus')) {
        var notice = global.document.createElement('p');
        notice.id = 'shareFeedSaveStatus'; notice.setAttribute('role', 'status');
        notice.textContent = '처음 준비한 문구와 선택이 고정됐어요. 같은 게시물 다시 시도는 이 입력 그대로 게시합니다. 수정하려면 취소 후 새로 작성하세요. 창을 닫거나 새로고침하면 작성 중인 내용은 보관되지 않아요.';
        sheet.querySelector('#shareConfirmBtn').before(notice);
      }
    }
    async function submit(post) {
      if (!current()) return { state: 'account-changed', currentAccount: false };
      if (inflight) return { state: 'sending', duplicate: true };
      if (accepted) return { state: 'accepted', post: copy(preparedPost), duplicate: true, currentAccount: true };
      if (!preparedPost) {
        if (!post || post.id !== id || post.user_id !== account) return { state: 'invalid' };
        preparedPost = freeze(copy(post));
      }
      lockInput();
      inflight = true;
      var result, state = 'unconfirmed';
      try {
        var map = global.OurgoalCategoryMap;
        if (!map || typeof map.insertFeedPost !== 'function') state = 'unsupported';
        else {
          result = await map.insertFeedPost(L.sb, copy(preparedPost));
          if (result && result.error === null) state = 'accepted';
          else if (result && result.error) state = 'rejected';
        }
      } catch (err) { state = 'unconfirmed'; }
      inflight = false;
      if (sheet && sheet.querySelector('#shareCancelBtn')) sheet.querySelector('#shareCancelBtn').disabled = false;
      if (state === 'accepted') accepted = true;
      return { state: state, post: copy(preparedPost), currentAccount: current(),
        metaStripped: !!(result && result.metaStripped), savedDraft: false, rowReadbackVerified: null };
    }
    return { id: id, account: account, submit: submit, bind: bind };
  }
  var caps = global.OurgoalCapabilities;
  if (caps) caps.provide('records.share-feed-intent', createIntent, {
    cell: 'records/share-feed-save', description: '현재 게시 창 입력의 계정 귀속과 SDK 결과', sideEffect: 'server', needsConfirm: false
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = { createIntent: createIntent };
})(typeof window !== 'undefined' ? window : globalThis);
