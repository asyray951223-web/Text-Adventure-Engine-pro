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

  const query = window.variableSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.globalVariables.forEach((variable, index) => {
    if (query) {
      const textToSearch = [variable.name, variable.id, variable.description]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }

    hasRenderedAny = true;

    const varEl = document.createElement("div");
    varEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    // 標題區塊
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
      variable.isExpanded = !variable.isExpanded;
      window.renderVariables();
    });

    const iconSvg = variable.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${variable.id}" onclick="window.copyId(event, '${variable.id}')">${variable.id}</span>
        <input type="text" value="${variable.name}" placeholder="輸入變數名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此變數">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (variable.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除變數「${variable.name || "未命名"}」嗎？`)) {
        window.projectData.globalVariables.splice(index, 1);
        window.renderVariables();
      }
    });
    varEl.appendChild(headerEl);

    if (variable.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      if (!variable.conditions) {
        variable.conditions = { variables: {}, items: {} };
      }
      if (!variable.conditions.variables) variable.conditions.variables = {};
      if (!variable.conditions.items) variable.conditions.items = {};

      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        const otherVars = window.projectData.globalVariables.filter(
          (v) => v.id !== variable.id,
        );
        if (otherVars.length > 0) {
          otherVars.forEach((v) => {
            const isChecked = variable.conditions.variables[v.id] !== undefined;
            const op = isChecked
              ? variable.conditions.variables[v.id].op
              : ">=";
            const val = isChecked
              ? variable.conditions.variables[v.id].val
              : "";
            varConditionsHtml += `
              <div class="flex items-center space-x-2 bg-white p-2 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                  <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                      <input type="checkbox" class="cond-var-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" data-id="${v.id}" ${isChecked ? "checked" : ""}>
                      <span class="text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${v.name}">${v.name}</span>
                  </label>
                  <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                      <select class="cond-var-op border border-gray-300 rounded p-1 text-sm w-12 focus:ring-blue-500" data-id="${v.id}">
                          <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                          <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                          <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                          <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                          <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                          <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                      </select>
                      <input type="number" class="cond-var-val border border-gray-300 rounded p-1 w-full max-w-[80px] text-sm focus:ring-blue-500" placeholder="數值" value="${val}" data-id="${v.id}">
                  </div>
              </div>
            `;
          });
        } else {
          varConditionsHtml = `<p class="text-sm text-gray-400 italic">無其他變數可設定</p>`;
        }
      } else {
        varConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何變數</p>`;
      }

      let itemConditionsHtml = "";
      if (window.projectData.items && window.projectData.items.length > 0) {
        window.projectData.items.forEach((i) => {
          const itemCond = variable.conditions.items[i.id];
          const isChecked = itemCond !== undefined && itemCond !== false;
          const op = isChecked && itemCond.op ? itemCond.op : ">=";
          const val =
            isChecked && itemCond.val !== undefined ? itemCond.val : 1;
          itemConditionsHtml += `
            <div class="flex items-center space-x-2 bg-white p-2 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                    <input type="checkbox" class="cond-item-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" data-id="${i.id}" ${isChecked ? "checked" : ""}>
                    <span class="text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${i.name}">${i.name}</span>
                </label>
                <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                    <select class="cond-item-op border border-gray-300 rounded p-1 text-sm w-12 focus:ring-blue-500" data-id="${i.id}">
                        <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                        <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                        <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                        <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                        <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                        <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                    </select>
                    <input type="number" class="cond-item-val border border-gray-300 rounded p-1 w-full max-w-[80px] text-sm focus:ring-blue-500" placeholder="數量" value="${val}" data-id="${i.id}" min="1">
                </div>
            </div>
          `;
        });
      } else {
        itemConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何道具</p>`;
      }

      let timeConditionHtml = "";
      const hasTimeCond = !!variable.conditions.time;
      const startH = hasTimeCond ? variable.conditions.time.minHour : 0;
      const endH = hasTimeCond ? variable.conditions.time.maxHour : 23;
      timeConditionHtml = `
        <div class="flex items-center space-x-2 bg-white p-2 rounded border ${hasTimeCond ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
            <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                <input type="checkbox" class="cond-time-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" ${hasTimeCond ? "checked" : ""}>
                <span class="text-sm font-bold ${hasTimeCond ? "text-blue-700" : "text-gray-600"} truncate">限制時段</span>
            </label>
            <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${hasTimeCond ? "1" : "0.3"}; pointer-events: ${hasTimeCond ? "auto" : "none"};">
                <input type="number" class="cond-time-min border border-gray-300 rounded p-1 w-full max-w-[50px] text-sm focus:ring-blue-500" value="${startH}" min="0" max="23">
                <span class="text-sm text-gray-500">~</span>
                <input type="number" class="cond-time-max border border-gray-300 rounded p-1 w-full max-w-[50px] text-sm focus:ring-blue-500" value="${endH}" min="0" max="23">
            </div>
        </div>
      `;

      const hasChapterCond = !!variable.conditions.chapter;
      let chapterConditionsHtml = `
        <div class="flex items-center space-x-2 bg-white p-2 rounded border ${hasChapterCond ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
            <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[150px]">
                <input type="checkbox" class="cond-chapter-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" ${hasChapterCond ? "checked" : ""}>
                <span class="text-sm font-bold ${hasChapterCond ? "text-blue-700" : "text-gray-600"} truncate">到達章節 (含之後)</span>
            </label>
            <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${hasChapterCond ? "1" : "0.3"}; pointer-events: ${hasChapterCond ? "auto" : "none"};">
                <select class="cond-chapter-sel border border-gray-300 rounded p-1 text-sm w-full focus:ring-blue-500">
      `;
      if (
        window.projectData.chapters &&
        window.projectData.chapters.length > 0
      ) {
        window.projectData.chapters.forEach((ch) => {
          const selected =
            variable.conditions.chapter === ch.id ? "selected" : "";
          chapterConditionsHtml += `<option value="${ch.id}" ${selected}>${ch.name}</option>`;
        });
      } else {
        chapterConditionsHtml += `<option value="">-- 尚未建立章節 --</option>`;
      }
      chapterConditionsHtml += `
                </select>
            </div>
        </div>
      `;

      contentEl.innerHTML = `
        <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div class="w-full md:w-1/3">
            <label class="block text-sm font-medium text-gray-700 mb-1">初始數值</label>
            <input type="number" class="value-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" value="${variable.value !== undefined ? variable.value : 0}">
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">說明備註</label>
            <input type="text" class="desc-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="用途說明..." value="${variable.description || ""}">
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
          <div class="text-sm bg-gray-50 border border-gray-200 rounded-lg">
            <label class="flex items-center cursor-pointer p-3 bg-gray-100 rounded-t-lg hover:bg-gray-200 transition m-0 border-b border-gray-200">
              <input type="checkbox" class="var-enable-cond-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${variable.enableCondition ? "checked" : ""}>
              <span class="font-bold text-gray-700">顯示條件 (設定數值在頂部狀態列顯示的門檻)</span>
            </label>
            <div class="p-4 space-y-3 ${variable.enableCondition ? "block" : "hidden"}">
              <div class="space-y-2">
                <span class="text-xs font-bold text-gray-500">進度條件：</span>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  ${chapterConditionsHtml}
                </div>
              </div>
              <div class="space-y-2 mt-3 pt-3 border-t border-gray-200">
                <span class="text-xs font-bold text-gray-500">數值條件：</span>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  ${varConditionsHtml}
                </div>
              </div>
              <div class="space-y-2 mt-3 pt-3 border-t border-gray-200">
                <span class="text-xs font-bold text-gray-500">持有道具條件：</span>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  ${itemConditionsHtml}
                </div>
              </div>
              <div class="space-y-2 mt-3 pt-3 border-t border-gray-200">
                <span class="text-xs font-bold text-gray-500">時間條件：</span>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  ${timeConditionHtml}
                </div>
              </div>
            </div>
          </div>
          <div class="text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start">
            <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-sm">提示：若未啟用顯示條件，該變數預設會一直顯示在畫面上方的狀態列中。啟用條件後，只有當玩家滿足條件時才會顯示（隱藏期間數值的運算不受影響）。</p>
          </div>
        </div>
      `;

      contentEl.querySelector(".value-input").addEventListener("input", (e) => {
        variable.value = parseFloat(e.target.value) || 0;
      });
      contentEl.querySelector(".desc-input").addEventListener("input", (e) => {
        variable.description = e.target.value;
      });

      contentEl
        .querySelector(".var-enable-cond-chk")
        .addEventListener("change", (e) => {
          variable.enableCondition = e.target.checked;
          window.renderVariables();
        });

      contentEl
        .querySelector(".cond-chapter-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            variable.conditions.chapter =
              window.projectData.chapters &&
              window.projectData.chapters.length > 0
                ? window.projectData.chapters[0].id
                : "";
          } else {
            delete variable.conditions.chapter;
          }
          window.renderVariables();
        });
      contentEl
        .querySelector(".cond-chapter-sel")
        .addEventListener("change", (e) => {
          variable.conditions.chapter = e.target.value;
        });

      contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            variable.conditions.variables[id] = { op: ">=", val: 0 };
          } else {
            delete variable.conditions.variables[id];
          }
          window.renderVariables();
        });
      });
      contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (variable.conditions.variables[id]) {
            variable.conditions.variables[id].op = e.target.value;
          }
        });
      });
      contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (variable.conditions.variables[id]) {
            const val = parseInt(e.target.value, 10);
            variable.conditions.variables[id].val = isNaN(val) ? "" : val;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            variable.conditions.items[id] = { op: ">=", val: 1 };
          } else {
            delete variable.conditions.items[id];
          }
          window.renderVariables();
        });
      });
      contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (variable.conditions.items[id]) {
            variable.conditions.items[id].op = e.target.value;
          }
        });
      });
      contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (variable.conditions.items[id]) {
            const val = parseInt(e.target.value, 10);
            variable.conditions.items[id].val = isNaN(val) ? 1 : val;
          }
        });
      });

      contentEl
        .querySelector(".cond-time-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            variable.conditions.time = { minHour: 0, maxHour: 23 };
          } else {
            delete variable.conditions.time;
          }
          window.renderVariables();
        });
      contentEl
        .querySelector(".cond-time-min")
        .addEventListener("input", (e) => {
          if (variable.conditions.time)
            variable.conditions.time.minHour =
              parseInt(e.target.value, 10) || 0;
        });
      contentEl
        .querySelector(".cond-time-max")
        .addEventListener("input", (e) => {
          if (variable.conditions.time)
            variable.conditions.time.maxHour =
              parseInt(e.target.value, 10) || 0;
        });

      varEl.appendChild(contentEl);
    }

    container.appendChild(varEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML += `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的變數。
      </div>
    `;
  }
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
    enableCondition: false,
    conditions: { variables: {}, items: {} },
    isExpanded: true,
  });
  window.renderVariables();
}
