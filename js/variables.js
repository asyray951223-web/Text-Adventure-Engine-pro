// 負責管理與渲染「數值系統」頁面邏輯

window.renderVariables = function () {
  const container = document.getElementById("variables-container");
  const addBtn = document.getElementById("add-variable-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewVariable);

  container.innerHTML = "";

  // 轉換或確認資料結構 (確保為陣列)
  if (
    !window.projectData.globalVariables ||
    !Array.isArray(window.projectData.globalVariables)
  ) {
    window.projectData.globalVariables = [];
  }

  if (window.projectData.globalVariables.length === 0) {
    container.innerHTML = `
      <div class="text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start mb-4">
        <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p class="text-sm">提示：您可以在這裡建立所有數值。若是「NPC 專屬數值 (如好感度)」，請前往「NPC 角色」頁面綁定，遊玩時該數值將自動隱藏，直到 NPC 登場時才會顯示！</p>
      </div>
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何全域變數，點擊上方「+ 新增變數」開始。
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start mb-4">
      <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <p class="text-sm">提示：您可以在這裡建立所有數值。若是「NPC 專屬數值 (如好感度)」，請前往「NPC 角色」頁面綁定，遊玩時該數值將自動隱藏，直到 NPC 登場時才會顯示！</p>
    </div>
  `;

  window.projectData.globalVariables.forEach((variable, index) => {
    const varEl = document.createElement("div");
    varEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex items-start justify-between transition hover:border-blue-300";

    varEl.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 flex-1">
        <div class="flex flex-col w-full md:w-1/3">
          <label class="text-xs text-gray-500 mb-1 font-bold flex items-center">變數名稱 (ID) <span class="ml-2 font-mono text-gray-400 font-normal text-[10px] cursor-pointer hover:text-blue-500 transition select-none" onclick="window.copyId(event, '${variable.id}')" title="點擊複製系統 ID">${variable.id}</span></label>
          <input type="text" class="name-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm" placeholder="例如: HP, Gold" value="${variable.name || ""}">
        </div>
        <div class="flex flex-col w-full md:w-1/4">
          <label class="text-xs text-gray-500 mb-1 font-bold">初始數值</label>
          <input type="number" class="value-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" value="${variable.value !== undefined ? variable.value : 0}">
        </div>
        <div class="flex flex-col w-full md:flex-1">
          <label class="text-xs text-gray-500 mb-1 font-bold">說明備註</label>
          <input type="text" class="desc-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="用途說明..." value="${variable.description || ""}">
        </div>
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-2 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4 mt-5" title="刪除此變數">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    varEl
      .querySelector(".name-input")
      .addEventListener("input", (e) => (variable.name = e.target.value));
    varEl
      .querySelector(".value-input")
      .addEventListener(
        "input",
        (e) => (variable.value = parseFloat(e.target.value) || 0),
      );
    varEl
      .querySelector(".desc-input")
      .addEventListener(
        "input",
        (e) => (variable.description = e.target.value),
      );

    varEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除變數「${variable.name || "未命名"}」嗎？`)) {
        window.projectData.globalVariables.splice(index, 1);
        window.renderVariables();
      }
    });

    container.appendChild(varEl);
  });
};

function addNewVariable() {
  if (
    !window.projectData.globalVariables ||
    !Array.isArray(window.projectData.globalVariables)
  )
    window.projectData.globalVariables = [];
  window.projectData.globalVariables.push({
    id: "var_" + Date.now(),
    name: "新變數",
    value: 0,
    description: "",
  });
  window.renderVariables();
}
