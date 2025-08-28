// js/core.js

// 許容: 英数・ハイフン・アンダースコア、3〜32文字
const USER_ID_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const USER_ID_KEY = "user_id";

// 保存
function setUserId(id) {
  if (!USER_ID_PATTERN.test(id)) {
    throw new Error("IDは英数・-・_で3〜32文字にしてください。");
  }
  localStorage.setItem(USER_ID_KEY, id);
}

// 取得
function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

// 削除
function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

// グローバルに露出（他JSから使いやすくする）
window.UserCore = {
  setUserId,
  getUserId,
  clearUserId,
  USER_ID_PATTERN,
};
