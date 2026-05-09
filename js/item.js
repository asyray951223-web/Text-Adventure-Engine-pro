// 負責管理與渲染「道具系統」頁面邏輯

window.renderItems = function () {
  if (!document.getElementById("rainbow-style")) {
    const style = document.createElement("style");
    style.id = "rainbow-style";
    style.innerHTML = `
      @property --bg-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
      @keyframes rainbow-bg-spin { 0% { --bg-angle: 0deg; } 100% { --bg-angle: 360deg; } }
      @keyframes rainbow-text-anim { 0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.6)) hue-rotate(0deg); } 50% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.9)) hue-rotate(180deg); } }
      @keyframes rainbow-border-anim { 0% { background-position: 0% 0%, 0px 0px, 0% 0%; } 100% { background-position: 0% 0%, -100px -100px, 0% 0%; } }
      @keyframes rainbow-border-pulse { 0%, 100% { box-shadow: 0 0 15px rgba(255,105,180,0.5), inset 0 0 10px rgba(0,255,255,0.3); } 50% { box-shadow: 0 0 25px rgba(255,105,180,0.9), inset 0 0 15px rgba(0,255,255,0.6); } }
      @keyframes gold-shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      @keyframes red-pulse { 0%, 100% { box-shadow: 0 0 10px rgba(220,38,38,0.5), inset 0 0 8px rgba(220,38,38,0.3); border-color: rgba(220,38,38,0.5); } 50% { box-shadow: 0 0 20px rgba(248,113,113,0.9), inset 0 0 15px rgba(248,113,113,0.6); border-color: rgba(248,113,113,1); } }
      .rainbow-border-editor { background: linear-gradient(#ffffff, #ffffff) padding-box, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='90' cy='15' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='2s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='50' cy='50' r='1' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='80' cy='80' r='2' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='2.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='20' cy='85' r='1' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.1;0.8;0.1' dur='1.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='60' cy='90' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.3;1;0.3' dur='1.2s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") border-box, conic-gradient(from var(--bg-angle), #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #ff2400) border-box !important; border: 3px solid transparent !important; background-size: 100% 100%, 100px 100px, 100% 100% !important; animation: rainbow-border-anim 4s linear infinite, rainbow-border-pulse 3s ease-in-out infinite, rainbow-bg-spin 4s linear infinite; }
      .rainbow-border-dark { background: linear-gradient(#1f2937, #1f2937) padding-box, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='1.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='90' cy='15' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='2s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='50' cy='50' r='1' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0;1;0' dur='1s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='80' cy='80' r='2' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.2;1;0.2' dur='2.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='20' cy='85' r='1' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.1;0.8;0.1' dur='1.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3Ccircle cx='60' cy='90' r='1.5' fill='%23fff'%3E%3Canimate attributeName='opacity' values='0.3;1;0.3' dur='1.2s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E") border-box, conic-gradient(from var(--bg-angle), #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #ff2400) border-box !important; border: 2px solid transparent !important; background-size: 100% 100%, 100px 100px, 100% 100% !important; animation: rainbow-border-anim 4s linear infinite, rainbow-border-pulse 3s ease-in-out infinite, rainbow-bg-spin 4s linear infinite; }
      @keyframes rainbow-text-bg-anim { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      .rainbow-text { background-image: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #ff2400) !important; -webkit-background-clip: text !important; color: transparent !important; background-size: 300% 300% !important; animation: rainbow-text-anim 3s ease-in-out infinite, rainbow-text-bg-anim 4s linear infinite; }
      .gold-border-editor { background: linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(60deg, #b45309, #fef08a, #ca8a04, #fef08a, #b45309) border-box !important; border: 3px solid transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .gold-border-dark { background: linear-gradient(#1f2937, #1f2937) padding-box, linear-gradient(60deg, #b45309, #fef08a, #ca8a04, #fef08a, #b45309) border-box !important; border: 2px solid transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .gold-text { background-image: linear-gradient(60deg, #ca8a04, #fef08a, #ca8a04, #fef08a, #ca8a04) !important; -webkit-background-clip: text !important; color: transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .red-border-editor { border: 2px solid #dc2626 !important; animation: red-pulse 1.5s ease-in-out infinite; }
      .red-border-dark { border: 2px solid #ef4444 !important; animation: red-pulse 1.5s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }

  const container = document.getElementById("items-container");
  const addBtn = document.getElementById("add-item-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewItem);

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.items) window.projectData.items = [];

  if (window.projectData.items.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何道具，點擊上方「+ 新增道具」開始。
      </div>
    `;
    return;
  }

  const query = window.itemSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.items.forEach((item, index) => {
    if (query) {
      const textToSearch = [item.name, item.id, item.description]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }

    hasRenderedAny = true;

    const itemEl = document.createElement("div");
    itemEl.className = `bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition ${item.rarity === "rainbow" ? "rainbow-border-editor shadow-[0_0_15px_rgba(255,0,255,0.3)]" : item.rarity === "gold" ? "gold-border-editor shadow-[0_0_15px_rgba(250,204,21,0.4)]" : item.rarity === "red" ? "red-border-editor shadow-[0_0_15px_rgba(220,38,38,0.4)]" : ""}`;

    // 道具標題區塊 (點擊此區塊進行摺疊/展開)
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
      item.isExpanded = !item.isExpanded;
      window.renderItems();
    });

    // 展開圖示與動態類型標籤
    const iconSvg = item.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    const typeBadge =
      item.type === "consumable"
        ? `<span class="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded ml-2 whitespace-nowrap font-bold">消耗品</span>`
        : `<span class="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded ml-2 whitespace-nowrap font-bold">永久道具</span>`;

    const colorMap = {
      gray: "text-gray-500",
      white: "text-gray-800",
      green: "text-emerald-600 drop-shadow-[0_0_2px_rgba(5,150,105,0.4)]",
      blue: "text-blue-600 drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]",
      indigo: "text-indigo-600 drop-shadow-[0_0_5px_rgba(79,70,229,0.5)]",
      purple: "text-purple-600 drop-shadow-[0_0_6px_rgba(147,51,234,0.6)]",
      orange:
        "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] brightness-110",
      red: "text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.9)] animate-pulse",
      gold: "gold-text drop-shadow-[0_0_12px_rgba(255,215,0,1)]",
      rainbow: "rainbow-text drop-shadow-[0_0_5px_rgba(0,0,0,0.3)]",
    };
    const titleColor = colorMap[item.rarity] || "text-gray-800";

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${item.id}" onclick="window.copyId(event, '${item.id}')">${item.id}</span>
        <input type="text" value="${item.name}" placeholder="輸入道具名稱..." 
               class="flex-1 font-bold text-lg ${titleColor} bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition">
        ${typeBadge}
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此道具">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (item.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除道具「${item.name}」嗎？`)) {
        window.projectData.items.splice(index, 1);
        window.renderItems();
      }
    });
    itemEl.appendChild(headerEl);

    if (item.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      // 初始化或轉移舊的條件資料結構
      if (!item.conditions) {
        item.conditions = { variables: {}, items: {} };
        // 向下相容轉移舊的單一條件
        if (
          item.conditionVar &&
          item.conditionVal !== undefined &&
          item.conditionVal !== ""
        ) {
          item.conditions.variables[item.conditionVar] = {
            op: item.conditionOp || ">=",
            val: item.conditionVal,
          };
        }
      }
      if (!item.conditions.variables) item.conditions.variables = {};
      if (!item.conditions.items) item.conditions.items = {};

      // 向下相容：將舊版純布林值的道具條件升級為包含數量與運算符的物件
      if (item.conditions.items) {
        Object.keys(item.conditions.items).forEach((k) => {
          if (item.conditions.items[k] === true) {
            item.conditions.items[k] = { op: ">=", val: 1 };
          }
        });
      }

      if (item.enableCondition === undefined) {
        item.enableCondition =
          Object.keys(item.conditions.variables).length > 0 ||
          Object.keys(item.conditions.items).length > 0 ||
          !!item.conditions.chapter;
      }

      // 準備變數的勾選清單
      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        window.projectData.globalVariables.forEach((v) => {
          const isChecked = item.conditions.variables[v.id] !== undefined;
          const op = isChecked ? item.conditions.variables[v.id].op : ">=";
          const val = isChecked ? item.conditions.variables[v.id].val : "";

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
        const otherItems = window.projectData.items.filter(
          (i) => i.id !== item.id,
        );
        if (otherItems.length > 0) {
          otherItems.forEach((i) => {
            const itemCond = item.conditions.items[i.id];
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
          itemConditionsHtml = `<p class="text-sm text-gray-400 italic">無其他道具可設定</p>`;
        }
      } else {
        itemConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何道具</p>`;
      }

      let timeConditionHtml = "";
      const hasTimeCond = !!item.conditions.time;
      const startH = hasTimeCond ? item.conditions.time.minHour : 0;
      const endH = hasTimeCond ? item.conditions.time.maxHour : 23;
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
      const hasChapterCond = !!item.conditions.chapter;
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
          const selected = item.conditions.chapter === ch.id ? "selected" : "";
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

      let sceneOptions = `<option value="">-- 不觸發場景傳送 --</option>`;

      sceneOptions += `<optgroup label="動態跳轉模式">`;
      sceneOptions += `<option value="__PREVIOUS__" ${item.targetSceneId === "__PREVIOUS__" ? "selected" : ""}>🔙 返回上一個停留場景</option>`;
      sceneOptions += `<option value="__UP__" ${item.targetSceneId === "__UP__" ? "selected" : ""}>⬆️ 跳轉至清單上方的場景</option>`;
      sceneOptions += `<option value="__DOWN__" ${item.targetSceneId === "__DOWN__" ? "selected" : ""}>⬇️ 跳轉至清單下方的場景</option>`;
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="指定特定場景">`;
      if (window.projectData.scenes) {
        window.projectData.scenes.forEach((s) => {
          const selected = s.id === item.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${s.id}" ${selected}>${s.name}</option>`;
        });
      }
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="指定特定章節 (跳至該章開場)">`;
      if (window.projectData.chapters) {
        window.projectData.chapters.forEach((ch) => {
          const selected = ch.id === item.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${ch.id}" ${selected}>${ch.name}</option>`;
        });
      }
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="開啟商店">`;
      (window.projectData.shops || []).forEach((sh) => {
        const val = `__SHOP__${sh.id}`;
        const selected = val === item.targetSceneId ? "selected" : "";
        sceneOptions += `<option value="${val}" ${selected}>🛒 商店：${sh.name}</option>`;
      });
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="開啟測驗">`;
      (window.projectData.quizzes || []).forEach((q) => {
        const val = `__QUIZ__${q.id}`;
        const selected = val === item.targetSceneId ? "selected" : "";
        sceneOptions += `<option value="${val}" ${selected}>📝 測驗：${q.name}</option>`;
      });
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="隨機跳轉 (Random)">`;
      if (window.projectData.chapters) {
        window.projectData.chapters.forEach((ch) => {
          const val = "__RANDOM_IN_CHAP__" + ch.id;
          const selected = val === item.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${val}" ${selected}>🎲 隨機章節內：${ch.name}</option>`;
        });
      }
      sceneOptions += `<option value="__RANDOM_ALL__" ${item.targetSceneId === "__RANDOM_ALL__" ? "selected" : ""}>🎲 隨機全域：所有場景</option>`;
      sceneOptions += `</optgroup>`;

      let variableOptions = `<option value="">-- 不變動數值 --</option>`;
      if (window.projectData.globalVariables) {
        window.projectData.globalVariables.forEach((v) => {
          const selected = v.id === item.variableId ? "selected" : "";
          variableOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
        });
      }

      let itemOptions = `<option value="">-- 不變動道具 --</option>`;
      if (window.projectData.items) {
        window.projectData.items.forEach((i) => {
          if (i.id === item.id) return; // 避免給予或扣除自己
          const selected = i.id === item.targetItemId ? "selected" : "";
          itemOptions += `<option value="${i.id}" ${selected}>${i.name}</option>`;
        });
      }

      let sellVarOptions = `<option value="">-- 選擇貨幣變數 --</option>`;
      if (window.projectData.globalVariables) {
        window.projectData.globalVariables.forEach((v) => {
          const selected = v.id === item.sellVariableId ? "selected" : "";
          sellVarOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
        });
      }

      contentEl.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-2">
          <div class="flex items-center space-x-4">
            <label class="block text-sm font-medium text-gray-700 whitespace-nowrap">道具類型</label>
            <select class="type-select w-full max-w-xs border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="consumable" ${
                item.type === "consumable" ? "selected" : ""
              }>消耗品 (使用後扣除數量)</option>
              <option value="permanent" ${
                item.type === "permanent" ? "selected" : ""
              }>永久道具 (可重複使用)</option>
            </select>
          </div>
          <div class="flex items-center space-x-2 ${item.type === "consumable" ? "flex" : "hidden"}">
            <label class="block text-sm font-medium text-gray-700 whitespace-nowrap ml-2">每次使用消耗數量:</label>
            <input type="number" class="consume-amount-input w-20 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" value="${item.consumeAmount !== undefined ? item.consumeAmount : 1}" min="1">
          </div>
          <div class="flex items-center space-x-2 ml-4">
            <label class="block text-sm font-medium text-gray-700 whitespace-nowrap">稀有度/顏色</label>
            <select class="rarity-select w-full max-w-xs border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="gray" ${item.rarity === "gray" ? "selected" : ""}>殘破 (灰)</option>
              <option value="white" ${item.rarity === "white" || !item.rarity ? "selected" : ""}>一般 (白)</option>
              <option value="green" ${item.rarity === "green" ? "selected" : ""}>優秀 (綠)</option>
              <option value="blue" ${item.rarity === "blue" ? "selected" : ""}>精良 (藍)</option>
              <option value="indigo" ${item.rarity === "indigo" ? "selected" : ""}>卓越 (靛)</option>
              <option value="purple" ${item.rarity === "purple" ? "selected" : ""}>史詩 (紫)</option>
              <option value="orange" ${item.rarity === "orange" ? "selected" : ""}>傳說 (橘)</option>
              <option value="red" ${item.rarity === "red" ? "selected" : ""}>神話 (紅)</option>
              <option value="gold" ${item.rarity === "gold" ? "selected" : ""}>究極 (金)</option>
              <option value="rainbow" ${item.rarity === "rainbow" ? "selected" : ""}>永恆 (虹)</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">道具說明</label>
          <textarea class="desc-text w-full border border-gray-300 rounded-md shadow-sm p-2 h-[350px] focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar" placeholder="輸入道具的文字描述...">${
            item.description || ""
          }</textarea>
        </div>
        <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
          <h4 class="text-sm font-bold text-gray-700">商店販賣設定</h4>
          <div class="text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" class="item-can-sell-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${item.canSell ? "checked" : ""}>
              <span class="font-bold text-gray-700">允許玩家在商店將此道具換成變數 (金幣)</span>
            </label>
            <div class="item-sell-settings items-center space-x-2 mt-3 pt-3 border-t border-gray-200 ${item.canSell ? "flex" : "hidden"}">
              <span class="text-gray-500 font-bold whitespace-nowrap">販賣可獲得:</span>
              <select class="item-sell-var-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                ${sellVarOptions}
              </select>
              <input type="number" class="item-sell-price border border-gray-300 rounded shadow-sm p-1.5 w-24 focus:ring-blue-500 focus:border-blue-500" placeholder="價格" value="${item.sellPrice !== undefined ? item.sellPrice : 0}" min="0">
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
          <h4 class="text-sm font-bold text-gray-700">主動使用設定</h4>
          
          <div class="text-sm bg-gray-50 border border-gray-200 rounded-lg">
            <label class="flex items-center cursor-pointer p-3 bg-gray-100 rounded-t-lg hover:bg-gray-200 transition m-0 border-b border-gray-200">
              <input type="checkbox" class="item-enable-cond-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${item.enableCondition ? "checked" : ""}>
              <span class="font-bold text-gray-700">使用前提條件 (設定使用門檻)</span>
            </label>
            <div class="p-4 space-y-3 ${item.enableCondition ? "block" : "hidden"}">
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
          
          <div class="flex flex-col space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label class="block text-xs font-bold text-gray-700">使用複合效果</label>
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">改變數值:</span>
                <select class="item-var-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${variableOptions}
                </select>
                <input type="number" class="item-var-val border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="+/-" value="${item.variableVal !== undefined ? item.variableVal : ""}" title="請輸入增減數值">
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">獲得/失去道具:</span>
                <select class="item-action border border-gray-300 rounded shadow-sm p-1.5 w-20 focus:ring-blue-500 focus:border-blue-500">
                  <option value="" ${!item.itemAction ? "selected" : ""}>無</option>
                  <option value="give" ${item.itemAction === "give" ? "selected" : ""}>獲得</option>
                  <option value="take" ${item.itemAction === "take" ? "selected" : ""}>失去</option>
                </select>
                <select class="item-target-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${itemOptions}
                </select>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">場景傳送:</span>
                <select class="item-scene-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${sceneOptions}
                </select>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm mt-2">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">推進時間:</span>
                <input type="number" class="item-pass-time border border-gray-300 rounded shadow-sm p-1.5 w-20 focus:ring-blue-500 focus:border-blue-500" placeholder="分鐘" value="${item.passTime !== undefined ? item.passTime : ""}" title="請輸入流逝的分鐘數">
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm mt-2 pt-2 border-t border-blue-200">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-purple-600 font-bold whitespace-nowrap">效果觸發機率:</span>
                <input type="number" class="item-effect-prob border border-purple-300 rounded shadow-sm p-1.5 w-20 focus:ring-purple-500 focus:border-purple-500" placeholder="100" value="${item.effectProbability !== undefined ? item.effectProbability : 100}" title="設定道具複合效果的觸發機率 (0-100)%" min="0" max="100">
                <span class="text-purple-600 font-bold">%</span>
                <span class="text-gray-500 ml-2 italic">（機率判定不影響消耗品的扣除）</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // 切換類型時重新渲染以更新標籤顏色
      contentEl
        .querySelector(".type-select")
        .addEventListener("change", (e) => {
          item.type = e.target.value;
          window.renderItems();
        });

      contentEl
        .querySelector(".rarity-select")
        .addEventListener("change", (e) => {
          item.rarity = e.target.value;
          window.renderItems();
        });

      const consumeAmountInput = contentEl.querySelector(
        ".consume-amount-input",
      );
      if (consumeAmountInput) {
        consumeAmountInput.addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          item.consumeAmount = isNaN(val) ? 1 : Math.max(1, val);
        });
      }

      contentEl.querySelector(".desc-text").addEventListener("input", (e) => {
        item.description = e.target.value;
      });

      contentEl
        .querySelector(".cond-time-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            item.conditions.time = { minHour: 0, maxHour: 23 };
          } else {
            delete item.conditions.time;
          }
          window.renderItems();
        });
      contentEl
        .querySelector(".cond-time-min")
        .addEventListener("input", (e) => {
          if (item.conditions.time)
            item.conditions.time.minHour = parseInt(e.target.value, 10) || 0;
        });
      contentEl
        .querySelector(".cond-time-max")
        .addEventListener("input", (e) => {
          if (item.conditions.time)
            item.conditions.time.maxHour = parseInt(e.target.value, 10) || 0;
        });

      contentEl
        .querySelector(".item-pass-time")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          item.passTime = isNaN(val) ? "" : val;
        });

      contentEl
        .querySelector(".item-effect-prob")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          item.effectProbability = isNaN(val)
            ? 100
            : Math.max(0, Math.min(100, val));
        });

      contentEl
        .querySelector(".item-can-sell-chk")
        .addEventListener("change", (e) => {
          item.canSell = e.target.checked;
          window.renderItems();
        });

      contentEl
        .querySelector(".item-sell-var-id")
        .addEventListener("change", (e) => {
          item.sellVariableId = e.target.value;
        });

      contentEl
        .querySelector(".item-sell-price")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          item.sellPrice = isNaN(val) ? 0 : val;
        });

      contentEl
        .querySelector(".item-enable-cond-chk")
        .addEventListener("change", (e) => {
          item.enableCondition = e.target.checked;
          window.renderItems();
        });

      contentEl
        .querySelector(".cond-chapter-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            item.conditions.chapter =
              window.projectData.chapters &&
              window.projectData.chapters.length > 0
                ? window.projectData.chapters[0].id
                : "";
          } else {
            delete item.conditions.chapter;
          }
          window.renderItems();
        });

      contentEl
        .querySelector(".cond-chapter-sel")
        .addEventListener("change", (e) => {
          item.conditions.chapter = e.target.value;
        });

      contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            item.conditions.variables[id] = { op: ">=", val: 0 };
          } else {
            delete item.conditions.variables[id];
          }
          window.renderItems();
        });
      });

      contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (item.conditions.variables[id]) {
            item.conditions.variables[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (item.conditions.variables[id]) {
            const val = parseInt(e.target.value, 10);
            item.conditions.variables[id].val = isNaN(val) ? "" : val;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            item.conditions.items[id] = { op: ">=", val: 1 };
          } else {
            delete item.conditions.items[id];
          }
          window.renderItems();
        });
      });

      contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (item.conditions.items[id]) {
            item.conditions.items[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (item.conditions.items[id]) {
            const val = parseInt(e.target.value, 10);
            item.conditions.items[id].val = isNaN(val) ? 1 : val;
          }
        });
      });

      contentEl
        .querySelector(".item-var-id")
        .addEventListener("change", (e) => {
          item.variableId = e.target.value;
        });

      contentEl
        .querySelector(".item-var-val")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          item.variableVal = isNaN(val) ? "" : val;
        });

      contentEl
        .querySelector(".item-action")
        .addEventListener("change", (e) => {
          item.itemAction = e.target.value;
        });

      contentEl
        .querySelector(".item-target-id")
        .addEventListener("change", (e) => {
          item.targetItemId = e.target.value;
        });

      contentEl
        .querySelector(".item-scene-id")
        .addEventListener("change", (e) => {
          item.targetSceneId = e.target.value;
        });

      itemEl.appendChild(contentEl);
    }
    container.appendChild(itemEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML = `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的道具。
      </div>
    `;
  }
};

function addNewItem() {
  window.projectData.items.push({
    id: "item_" + Date.now(),
    name: "新道具",
    type: "consumable",
    consumeAmount: 1,
    rarity: "white",
    description: "",
    canSell: false,
    sellVariableId: "",
    sellPrice: 0,
    enableCondition: false,
    conditions: { variables: {}, items: {} },
    variableId: "",
    variableVal: "",
    itemAction: "",
    targetItemId: "",
    passTime: "",
    effectProbability: 100,
    targetSceneId: "",
    isExpanded: true,
  });
  window.renderItems();
}
