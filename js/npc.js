// 負責管理與渲染「NPC 角色」頁面邏輯

window.renderNpcs = function () {
  const container = document.getElementById("npcs-container");
  const addBtn = document.getElementById("add-npc-btn");
  const collapseBtn = document.getElementById("collapse-all-npc-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewNpc);

  if (collapseBtn) {
    const newCollapseBtn = collapseBtn.cloneNode(true);
    collapseBtn.parentNode.replaceChild(newCollapseBtn, collapseBtn);
    newCollapseBtn.addEventListener("click", () => {
      if (window.projectData.npcs) {
        window.projectData.npcs.forEach((n) => (n.isExpanded = false));
        window.renderNpcs();
      }
    });
  }

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.npcs) window.projectData.npcs = [];

  if (window.projectData.npcs.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何 NPC 角色，點擊上方「+ 新增角色」開始。
      </div>
    `;
    return;
  }

  const query = window.npcSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.npcs.forEach((npc, index) => {
    if (query) {
      const textToSearch = [npc.name, npc.id, npc.description]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }
    hasRenderedAny = true;

    const npcEl = document.createElement("div");
    npcEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    // 標題區塊 (點擊此區塊進行摺疊/展開)
    const headerEl = document.createElement("div");
    headerEl.className =
      "flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition";
    headerEl.addEventListener("click", (e) => {
      if (e.target.closest("input") || e.target.closest("button")) return;
      npc.isExpanded = !npc.isExpanded;
      window.renderNpcs();
    });

    const iconSvg = npc.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${npc.id}" onclick="window.copyId(event, '${npc.id}')">${npc.id}</span>
        <input type="text" value="${npc.name}" placeholder="輸入角色名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此角色">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (npc.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除角色「${npc.name}」嗎？`)) {
        window.projectData.npcs.splice(index, 1);
        window.renderNpcs();
      }
    });
    npcEl.appendChild(headerEl);

    if (npc.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-5";

      // 無提供圖片時的預設佔位圖
      const defaultAvatar = "https://via.placeholder.com/150?text=No+Image";

      // 初始化或轉移舊的條件資料結構
      if (!npc.conditions) {
        npc.conditions = { variables: {}, items: {} };
      }
      if (!npc.conditions.variables) npc.conditions.variables = {};
      if (!npc.conditions.items) npc.conditions.items = {};
      if (npc.enableCondition === undefined) {
        npc.enableCondition = false;
      }

      // 準備變數的勾選清單
      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        window.projectData.globalVariables.forEach((v) => {
          const isChecked = npc.conditions.variables[v.id] !== undefined;
          const op = isChecked ? npc.conditions.variables[v.id].op : ">=";
          const val = isChecked ? npc.conditions.variables[v.id].val : "";

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
        varConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何變數</p>`;
      }

      // 準備道具的勾選清單
      let itemConditionsHtml = "";
      if (window.projectData.items && window.projectData.items.length > 0) {
        window.projectData.items.forEach((i) => {
          const itemCond = npc.conditions.items[i.id];
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
      const hasTimeCond = !!npc.conditions.time;
      const startH = hasTimeCond ? npc.conditions.time.minHour : 0;
      const endH = hasTimeCond ? npc.conditions.time.maxHour : 23;
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

      // 準備進度的勾選清單
      const hasChapterCond = !!npc.conditions.chapter;
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
          const selected = npc.conditions.chapter === ch.id ? "selected" : "";
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

      let variableOptions = `<option value="">-- 無綁定數值 --</option>`;
      if (window.projectData.globalVariables) {
        window.projectData.globalVariables.forEach((v) => {
          const selected = v.id === npc.boundVariableId ? "selected" : "";
          variableOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
        });
      }

      contentEl.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
          <div class="flex flex-col items-center justify-center sm:w-32 flex-shrink-0">
            <img src="${npc.avatarUrl || defaultAvatar}" class="w-24 h-24 object-cover rounded-full border-4 border-gray-100 shadow-md" alt="頭像預覽" onerror="this.src='${defaultAvatar}'">
            <span class="text-xs text-gray-400 mt-2">頭像預覽</span>
          </div>
          <div class="flex-1 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">頭像圖片網址 (URL)</label>
              <input type="text" class="avatar-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." value="${npc.avatarUrl || ""}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">綁定全域變數 (如好感度、怒氣值)</label>
              <select class="bound-var-select w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                ${variableOptions}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">角色簡介 / 背景設定</label>
          <textarea class="desc-text w-full border border-gray-300 rounded-md shadow-sm p-2 h-[350px] focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar" placeholder="輸入關於這個角色的背景描述...">${npc.description || ""}</textarea>
        </div>
        <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
          <div class="text-sm bg-gray-50 border border-gray-200 rounded-lg">
            <label class="flex items-center cursor-pointer p-3 bg-gray-100 rounded-t-lg hover:bg-gray-200 transition m-0 border-b border-gray-200">
              <input type="checkbox" class="npc-enable-cond-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${npc.enableCondition ? "checked" : ""}>
              <span class="font-bold text-gray-700">出現條件 (設定角色登場門檻)</span>
            </label>
            <div class="p-4 space-y-3 ${npc.enableCondition ? "block" : "hidden"}">
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
            <p class="text-sm">提示：當您開啟出現條件，且玩家未達標準時，即使在「場景編輯」中將該 NPC 駐紮於場景，對話也會自動轉為「旁白」或觸發特殊處理。</p>
          </div>
        </div>
      `;

      // 圖片網址變更時，觸發重新渲染以更新預覽圖
      contentEl
        .querySelector(".avatar-input")
        .addEventListener("change", (e) => {
          npc.avatarUrl = e.target.value;
          window.renderNpcs();
        });

      contentEl
        .querySelector(".bound-var-select")
        .addEventListener("change", (e) => {
          npc.boundVariableId = e.target.value;
        });

      contentEl.querySelector(".desc-text").addEventListener("input", (e) => {
        npc.description = e.target.value;
      });

      contentEl
        .querySelector(".npc-enable-cond-chk")
        .addEventListener("change", (e) => {
          npc.enableCondition = e.target.checked;
          window.renderNpcs();
        });

      contentEl
        .querySelector(".cond-chapter-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            npc.conditions.chapter =
              window.projectData.chapters &&
              window.projectData.chapters.length > 0
                ? window.projectData.chapters[0].id
                : "";
          } else {
            delete npc.conditions.chapter;
          }
          window.renderNpcs();
        });

      contentEl
        .querySelector(".cond-chapter-sel")
        .addEventListener("change", (e) => {
          npc.conditions.chapter = e.target.value;
        });

      contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            npc.conditions.variables[id] = { op: ">=", val: 0 };
          } else {
            delete npc.conditions.variables[id];
          }
          window.renderNpcs();
        });
      });

      contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (npc.conditions.variables[id]) {
            npc.conditions.variables[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (npc.conditions.variables[id]) {
            const val = parseInt(e.target.value, 10);
            npc.conditions.variables[id].val = isNaN(val) ? "" : val;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            npc.conditions.items[id] = { op: ">=", val: 1 };
          } else {
            delete npc.conditions.items[id];
          }
          window.renderNpcs();
        });
      });

      contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (npc.conditions.items[id]) {
            npc.conditions.items[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (npc.conditions.items[id]) {
            const val = parseInt(e.target.value, 10);
            npc.conditions.items[id].val = isNaN(val) ? 1 : val;
          }
        });
      });

      contentEl
        .querySelector(".cond-time-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            npc.conditions.time = { minHour: 0, maxHour: 23 };
          } else {
            delete npc.conditions.time;
          }
          window.renderNpcs();
        });
      contentEl
        .querySelector(".cond-time-min")
        .addEventListener("input", (e) => {
          if (npc.conditions.time)
            npc.conditions.time.minHour = parseInt(e.target.value, 10) || 0;
        });
      contentEl
        .querySelector(".cond-time-max")
        .addEventListener("input", (e) => {
          if (npc.conditions.time)
            npc.conditions.time.maxHour = parseInt(e.target.value, 10) || 0;
        });

      npcEl.appendChild(contentEl);
    }
    container.appendChild(npcEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML += `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white mt-4">
          找不到符合「${query}」的 NPC 角色。
      </div>
    `;
  }
};

function addNewNpc() {
  window.projectData.npcs.push({
    id: "npc_" + Date.now(),
    name: "新角色",
    avatarUrl: "",
    boundVariableId: "",
    description: "",
    enableCondition: false,
    conditions: { variables: {}, items: {} },
    isExpanded: true,
  });
  window.renderNpcs();
}
