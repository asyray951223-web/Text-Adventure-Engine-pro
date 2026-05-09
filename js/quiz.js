// 負責管理與渲染「測驗系統」頁面邏輯

window.renderQuizzes = function () {
  const container = document.getElementById("quizzes-container");
  const addBtn = document.getElementById("add-quiz-btn");
  if (!container || !addBtn) return;

  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewQuiz);

  container.innerHTML = "";

  if (!window.projectData.quizzes) window.projectData.quizzes = [];

  if (window.projectData.quizzes.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何測驗，點擊上方「+ 新增測驗」開始。
      </div>
    `;
    return;
  }

  const query = window.quizSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.quizzes.forEach((quiz, index) => {
    if (query) {
      const textToSearch = [quiz.name, quiz.id, quiz.question, quiz.answers]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }

    hasRenderedAny = true;

    const quizEl = document.createElement("div");
    quizEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    const headerEl = document.createElement("div");
    headerEl.className =
      "flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition";
    headerEl.addEventListener("click", (e) => {
      if (
        e.target.closest("input") ||
        e.target.closest("button") ||
        e.target.closest("select")
      )
        return;
      quiz.isExpanded = !quiz.isExpanded;
      window.renderQuizzes();
    });

    const iconSvg = quiz.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${quiz.id}" onclick="window.copyId(event, '${quiz.id}')">${quiz.id}</span>
        <input type="text" value="${quiz.name}" placeholder="輸入測驗名稱..." 
               class="flex-1 font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此測驗">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (quiz.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除測驗「${quiz.name}」嗎？`)) {
        window.projectData.quizzes.splice(index, 1);
        window.renderQuizzes();
      }
    });
    quizEl.appendChild(headerEl);

    if (quiz.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      let successOptionsHtml = `<option value="">-- 留在原場景 / 無動作 --</option>`;
      if (window.projectData.scenes) {
        window.projectData.scenes.forEach((s) => {
          successOptionsHtml += `<option value="${s.id}" ${quiz.successSceneId === s.id ? "selected" : ""}>${s.name}</option>`;
        });
      }

      let failureOptionsHtml = `<option value="">-- 不跳轉 (可重試) --</option>`;
      if (window.projectData.scenes) {
        window.projectData.scenes.forEach((s) => {
          failureOptionsHtml += `<option value="${s.id}" ${quiz.failureSceneId === s.id ? "selected" : ""}>${s.name}</option>`;
        });
      }

      contentEl.innerHTML = `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">測驗提示文字 (顯示於輸入框上方)</label>
          <textarea class="quiz-question w-full border border-gray-300 rounded-md shadow-sm p-2 h-20 focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar text-sm" placeholder="例如：請輸入保險箱密碼...">${quiz.question || ""}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">正確答案 (若有多個可能答案，請用半角逗號 , 分隔。驗證時不分大小寫)</label>
          <input type="text" class="quiz-answers w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="例如：1234, 0000" value="${quiz.answers || ""}">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4 mt-4">
          <div>
            <label class="block text-sm font-bold text-emerald-600 mb-1">答對時跳轉至場景</label>
            <select class="quiz-success-scene border border-gray-300 rounded shadow-sm p-2 w-full focus:ring-emerald-500 focus:border-emerald-500 text-sm">
              ${successOptionsHtml}
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-red-600 mb-1">答錯時跳轉至場景 (留空則可無限重試)</label>
            <select class="quiz-failure-scene border border-gray-300 rounded shadow-sm p-2 w-full focus:ring-red-500 focus:border-red-500 text-sm">
              ${failureOptionsHtml}
            </select>
          </div>
        </div>
      `;

      contentEl
        .querySelector(".quiz-question")
        .addEventListener("input", (e) => (quiz.question = e.target.value));
      contentEl
        .querySelector(".quiz-answers")
        .addEventListener("input", (e) => (quiz.answers = e.target.value));
      contentEl
        .querySelector(".quiz-success-scene")
        .addEventListener(
          "change",
          (e) => (quiz.successSceneId = e.target.value),
        );
      contentEl
        .querySelector(".quiz-failure-scene")
        .addEventListener(
          "change",
          (e) => (quiz.failureSceneId = e.target.value),
        );

      quizEl.appendChild(contentEl);
    }
    container.appendChild(quizEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML = `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的測驗。
      </div>
    `;
  }
};

function addNewQuiz() {
  if (!window.projectData.quizzes) window.projectData.quizzes = [];
  window.projectData.quizzes.push({
    id: "quiz_" + Date.now(),
    name: "新測驗",
    question: "請輸入通關密碼：",
    answers: "",
    successSceneId: "",
    failureSceneId: "",
    isExpanded: true,
  });
  window.renderQuizzes();
}
