// js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userId");
  const button = document.getElementById("loginBtn");

  // ページ読み込み時、保存済みIDがあれば入力欄にセット
  const savedId = getUserId();
  if (savedId) {
    input.value = savedId;
  }

  // ログインボタン押下時に保存
  button.addEventListener("click", () => {
    const id = input.value.trim();
    if (!id) {
      alert("User IDを入力してください");
      return;
    }
    setUserId(id);
    // alert(`${id} で登録しました！`);
    window.location.href = "pages/capture.html";
  });
});
