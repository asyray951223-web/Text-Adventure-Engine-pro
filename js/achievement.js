// 負責管理與渲染「成就系統」頁面邏輯

window.renderAchievements = function () {
  const container = document.getElementById("achievements-container");
  const addBtn = document.getElementById("add-achievement-btn");
  const collapseBtn = document.getElementById("collapse-all-achievement-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewAchievement);

  if (collapseBtn) {
    const newCollapseBtn = collapseBtn.cloneNode(true);
    collapseBtn.parentNode.replaceChild(newCollapseBtn, collapseBtn);
    newCollapseBtn.addEventListener("click", () => {
      if (window.projectData.achievements) {
        window.projectData.achievements.forEach((a) => (a.isExpanded = false));
        window.renderAchievements();
      }
    });
  }

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.achievements) window.projectData.achievements = [];

  if (window.projectData.achievements.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何成就，點擊上方「+ 新增成就」開始。
      </div>
    `;
    return;
  }

  const query = window.achievementSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.achievements.forEach((achievement, index) => {
    if (query) {
      const textToSearch = [
        achievement.name,
        achievement.id,
        achievement.description,
      ]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }

    hasRenderedAny = true;

    const achievementEl = document.createElement("div");
    achievementEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    // 標題區塊 (點擊此區塊進行摺疊/展開)
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
      achievement.isExpanded = !achievement.isExpanded;
      window.renderAchievements();
    });

    const iconSvg = achievement.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    const hiddenBadge = achievement.isHidden
      ? `<span class="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded whitespace-nowrap font-bold">隱藏成就</span>`
      : `<span class="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded whitespace-nowrap font-bold">公開成就</span>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${achievement.id}" onclick="window.copyId(event, '${achievement.id}')">${achievement.id}</span>
        <input type="text" value="${achievement.name}" placeholder="輸入成就名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
      </div>
      <div class="flex items-center space-x-2 ml-4">
        ${hiddenBadge}
        <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition" title="刪除此成就">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (achievement.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除成就「${achievement.name}」嗎？`)) {
        window.projectData.achievements.splice(index, 1);
        window.renderAchievements();
      }
    });
    achievementEl.appendChild(headerEl);

    if (achievement.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      const defaultIcon = "https://via.placeholder.com/150?text=No+Icon";

      // 初始化或轉移舊的條件資料結構
      if (!achievement.conditions) {
        achievement.conditions = { variables: {}, items: {} };
      }
      if (!achievement.conditions.variables)
        achievement.conditions.variables = {};
      if (!achievement.conditions.items) achievement.conditions.items = {};

      // 準備變數的勾選清單
      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        window.projectData.globalVariables.forEach((v) => {
          const isChecked =
            achievement.conditions.variables[v.id] !== undefined;
          const op = isChecked
            ? achievement.conditions.variables[v.id].op
            : ">=";
          const val = isChecked
            ? achievement.conditions.variables[v.id].val
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
        varConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何變數</p>`;
      }

      // 準備道具的勾選清單
      let itemConditionsHtml = "";
      if (window.projectData.items && window.projectData.items.length > 0) {
        window.projectData.items.forEach((i) => {
          const itemCond = achievement.conditions.items[i.id];
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

      // 準備進度的勾選清單
      const hasChapterCond = !!achievement.conditions.chapter;
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
            achievement.conditions.chapter === ch.id ? "selected" : "";
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
        <div class="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
          <div class="flex flex-col items-center justify-center sm:w-32 flex-shrink-0">
            <img src="${achievement.iconUrl || defaultIcon}" class="w-20 h-20 object-cover rounded border-2 border-gray-200 shadow-sm" alt="成就圖示預覽" onerror="this.onerror=null; this.src='${defaultIcon}'">
            <span class="text-xs text-gray-400 mt-2">圖示預覽</span>
          </div>
          <div class="flex-1 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">圖示網址 (URL)</label>
              <div class="flex space-x-2">
                <input type="text" class="icon-input flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." value="${achievement.iconUrl || ""}">
                <button class="icon-upload-btn bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded text-sm font-bold transition whitespace-nowrap">上傳</button>
              </div>
            </div>
            <div class="flex items-center mt-2">
              <input type="checkbox" id="hidden-chk-${achievement.id}" class="hidden-chk h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" ${achievement.isHidden ? "checked" : ""}>
              <label for="hidden-chk-${achievement.id}" class="ml-2 block text-sm text-gray-900 font-bold">這是一個隱藏成就 (未解鎖前不顯示名稱與條件)</label>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">成就說明 (解鎖後顯示)</label>
          <textarea class="desc-text w-full border border-gray-300 rounded-md shadow-sm p-2 h-[350px] focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar" placeholder="輸入成就的描述或背景故事...">${achievement.description || ""}</textarea>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 mt-4">
          <label class="block text-sm font-bold text-gray-700 border-b border-gray-300 pb-2">解鎖條件 (請勾選需要的項目)</label>
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
        </div>
        <div class="text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start">
          <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-sm">提示：當遊戲系統偵測到玩家符合「解鎖條件」時，便會自動解鎖該成就，您可以利用全域變數或道具 ID 來撰寫條件。</p>
        </div>
      `;

      contentEl.querySelector(".icon-input").addEventListener("change", (e) => {
        achievement.iconUrl = e.target.value;
        window.renderAchievements();
      });

      contentEl
        .querySelector(".icon-upload-btn")
        .addEventListener("click", () => {
          window.promptImageUpload((base64) => {
            achievement.iconUrl = base64;
            window.renderAchievements();
          });
        });

      contentEl.querySelector(".hidden-chk").addEventListener("change", (e) => {
        achievement.isHidden = e.target.checked;
        window.renderAchievements();
      });

      contentEl.querySelector(".desc-text").addEventListener("input", (e) => {
        achievement.description = e.target.value;
      });

      contentEl
        .querySelector(".cond-chapter-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            achievement.conditions.chapter =
              window.projectData.chapters &&
              window.projectData.chapters.length > 0
                ? window.projectData.chapters[0].id
                : "";
          } else {
            delete achievement.conditions.chapter;
          }
          window.renderAchievements();
        });

      contentEl
        .querySelector(".cond-chapter-sel")
        .addEventListener("change", (e) => {
          achievement.conditions.chapter = e.target.value;
        });

      contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            achievement.conditions.variables[id] = { op: ">=", val: 0 };
          } else {
            delete achievement.conditions.variables[id];
          }
          window.renderAchievements();
        });
      });

      contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (achievement.conditions.variables[id]) {
            achievement.conditions.variables[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (achievement.conditions.variables[id]) {
            const val = parseInt(e.target.value, 10);
            achievement.conditions.variables[id].val = isNaN(val) ? "" : val;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            achievement.conditions.items[id] = { op: ">=", val: 1 };
          } else {
            delete achievement.conditions.items[id];
          }
          window.renderAchievements();
        });
      });

      contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (achievement.conditions.items[id]) {
            achievement.conditions.items[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (achievement.conditions.items[id]) {
            const val = parseInt(e.target.value, 10);
            achievement.conditions.items[id].val = isNaN(val) ? 1 : val;
          }
        });
      });

      achievementEl.appendChild(contentEl);
    }
    container.appendChild(achievementEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML = `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的成就。
      </div>
    `;
  }
};

function addNewAchievement() {
  window.projectData.achievements.push({
    id: "ach_" + Date.now(),
    name: "新成就",
    description: "",
    iconUrl: "",
    isHidden: false,
    conditions: { variables: {}, items: {} },
    isExpanded: true,
  });
  window.renderAchievements();
}
