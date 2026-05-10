// 負責管理與渲染「全域觸發器」頁面邏輯

window.renderTriggers = function () {
  const container = document.getElementById("triggers-container");
  const addBtn = document.getElementById("add-trigger-btn");
  const collapseBtn = document.getElementById("collapse-all-trigger-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewTrigger);

  if (collapseBtn) {
    const newCollapseBtn = collapseBtn.cloneNode(true);
    collapseBtn.parentNode.replaceChild(newCollapseBtn, collapseBtn);
    newCollapseBtn.addEventListener("click", () => {
      if (window.projectData.triggers) {
        window.projectData.triggers.forEach((t) => (t.isExpanded = false));
        window.renderTriggers();
      }
    });
  }

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.triggers) window.projectData.triggers = [];

  if (window.projectData.triggers.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何觸發器，點擊上方「+ 新增觸發器」開始。
      </div>
    `;
    return;
  }

  const query = window.triggerSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.triggers.forEach((trigger, index) => {
    if (query) {
      const textToSearch = [trigger.name, trigger.id].join(" ").toLowerCase();
      if (!textToSearch.includes(query)) return;
    }
    hasRenderedAny = true;

    const triggerEl = document.createElement("div");
    triggerEl.className =
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
      trigger.isExpanded = !trigger.isExpanded;
      window.renderTriggers();
    });

    const iconSvg = trigger.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${trigger.id}" onclick="window.copyId(event, '${trigger.id}')">${trigger.id}</span>
        <input type="text" value="${trigger.name}" placeholder="輸入觸發器名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此觸發器">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (trigger.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除觸發器「${trigger.name}」嗎？`)) {
        window.projectData.triggers.splice(index, 1);
        window.renderTriggers();
      }
    });
    triggerEl.appendChild(headerEl);

    if (trigger.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      // 初始化或轉移舊的條件資料結構
      if (!trigger.conditions) {
        trigger.conditions = { variables: {}, items: {} };
      }
      if (!trigger.conditions.variables) trigger.conditions.variables = {};
      if (!trigger.conditions.items) trigger.conditions.items = {};

      // 向下相容：將舊版純布林值的道具條件升級為包含數量與運算符的物件
      if (trigger.conditions.items) {
        Object.keys(trigger.conditions.items).forEach((k) => {
          if (trigger.conditions.items[k] === true) {
            trigger.conditions.items[k] = { op: ">=", val: 1 };
          }
        });
      }

      // 準備變數的勾選清單
      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        window.projectData.globalVariables.forEach((v) => {
          const isChecked = trigger.conditions.variables[v.id] !== undefined;
          const op = isChecked ? trigger.conditions.variables[v.id].op : ">=";
          const val = isChecked ? trigger.conditions.variables[v.id].val : "";

          varConditionsHtml += `
            <div class="flex items-center space-x-2 bg-white p-2 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                    <input type="checkbox" class="cond-var-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" data-id="${v.id}" ${isChecked ? "checked" : ""}>
                    <span class="text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${v.name}">${v.name}</span>
                </label>
                <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                    <select class="cond-var-op border border-gray-300 rounded p-1 text-sm w-[75px] focus:ring-blue-500" data-id="${v.id}">
                        <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                        <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                        <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                        <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                        <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                        <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                        <option value="+>=" ${op === "+>=" ? "selected" : ""}>+&ge;(增)</option>
                        <option value="->=" ${op === "->=" ? "selected" : ""}>-&ge;(減)</option>
                        <option value="chg>=" ${op === "chg>=" ? "selected" : ""}>&Delta;&ge;(變)</option>
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
          const itemCond = trigger.conditions.items[i.id];
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
                    <select class="cond-item-op border border-gray-300 rounded p-1 text-sm w-[75px] focus:ring-blue-500" data-id="${i.id}">
                        <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                        <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                        <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                        <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                        <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                        <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                        <option value="+>=" ${op === "+>=" ? "selected" : ""}>+&ge;(增)</option>
                        <option value="->=" ${op === "->=" ? "selected" : ""}>-&ge;(減)</option>
                        <option value="chg>=" ${op === "chg>=" ? "selected" : ""}>&Delta;&ge;(變)</option>
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
      const hasTimeCond = !!trigger.conditions.time;
      const startH = hasTimeCond ? trigger.conditions.time.minHour : 0;
      const endH = hasTimeCond ? trigger.conditions.time.maxHour : 23;
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

      const hasTimePassed = trigger.conditions.timePassed !== undefined;
      const timePassedVal = hasTimePassed ? trigger.conditions.timePassed : 60;
      timeConditionHtml += `
        <div class="flex items-center space-x-2 bg-white p-2 rounded border ${hasTimePassed ? "border-blue-400 shadow-sm" : "border-gray-200"} transition mt-2">
            <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                <input type="checkbox" class="cond-time-passed-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" ${hasTimePassed ? "checked" : ""}>
                <span class="text-sm font-bold ${hasTimePassed ? "text-blue-700" : "text-gray-600"} truncate">累積經過時間</span>
            </label>
            <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${hasTimePassed ? "1" : "0.3"}; pointer-events: ${hasTimePassed ? "auto" : "none"};">
                <span class="text-sm font-bold text-gray-500">&ge;</span>
                <input type="number" class="cond-time-passed-val border border-gray-300 rounded p-1 w-full max-w-[80px] text-sm focus:ring-blue-500" value="${timePassedVal}" min="1">
                <span class="text-sm text-gray-500">分鐘</span>
            </div>
        </div>
      `;

      // 準備進度的勾選清單
      const hasChapterCond = !!trigger.conditions.chapter;
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
            trigger.conditions.chapter === ch.id ? "selected" : "";
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

      let sceneOptions = `<option value="">-- 請選擇觸發後跳轉的場景 --</option>`;

      sceneOptions += `<optgroup label="動態跳轉模式">`;
      sceneOptions += `<option value="__PREVIOUS__" ${trigger.targetSceneId === "__PREVIOUS__" ? "selected" : ""}>🔙 返回上一個停留場景</option>`;
      sceneOptions += `<option value="__UP__" ${trigger.targetSceneId === "__UP__" ? "selected" : ""}>⬆️ 跳轉至清單上方的場景</option>`;
      sceneOptions += `<option value="__DOWN__" ${trigger.targetSceneId === "__DOWN__" ? "selected" : ""}>⬇️ 跳轉至清單下方的場景</option>`;
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="指定特定場景">`;
      if (window.projectData.scenes) {
        window.projectData.scenes.forEach((s) => {
          const selected = s.id === trigger.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${s.id}" ${selected}>${s.name}</option>`;
        });
      }
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="指定特定章節 (跳至該章開場)">`;
      if (window.projectData.chapters) {
        window.projectData.chapters.forEach((ch) => {
          const selected = ch.id === trigger.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${ch.id}" ${selected}>${ch.name}</option>`;
        });
      }
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="開啟商店">`;
      (window.projectData.shops || []).forEach((sh) => {
        const val = `__SHOP__${sh.id}`;
        const selected = val === trigger.targetSceneId ? "selected" : "";
        sceneOptions += `<option value="${val}" ${selected}>🛒 商店：${sh.name}</option>`;
      });
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="開啟測驗">`;
      (window.projectData.quizzes || []).forEach((q) => {
        const val = `__QUIZ__${q.id}`;
        const selected = val === trigger.targetSceneId ? "selected" : "";
        sceneOptions += `<option value="${val}" ${selected}>📝 測驗：${q.name}</option>`;
      });
      sceneOptions += `</optgroup>`;

      sceneOptions += `<optgroup label="隨機跳轉 (Random)">`;
      if (window.projectData.chapters) {
        window.projectData.chapters.forEach((ch) => {
          const val = "__RANDOM_IN_CHAP__" + ch.id;
          const selected = val === trigger.targetSceneId ? "selected" : "";
          sceneOptions += `<option value="${val}" ${selected}>🎲 隨機章節內：${ch.name}</option>`;
        });
      }
      sceneOptions += `<option value="__RANDOM_ALL__" ${trigger.targetSceneId === "__RANDOM_ALL__" ? "selected" : ""}>🎲 隨機全域：所有場景</option>`;
      sceneOptions += `</optgroup>`;

      let variableOptions = `<option value="">-- 不變動數值 --</option>`;
      if (window.projectData.globalVariables) {
        window.projectData.globalVariables.forEach((v) => {
          const selected = v.id === trigger.variableId ? "selected" : "";
          variableOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
        });
      }

      let itemOptions = `<option value="">-- 不變動道具 --</option>`;
      if (window.projectData.items) {
        window.projectData.items.forEach((i) => {
          const selected = i.id === trigger.targetItemId ? "selected" : "";
          itemOptions += `<option value="${i.id}" ${selected}>${i.name}</option>`;
        });
      }

      contentEl.innerHTML = `
        <div class="border-t border-gray-200 pt-4 mt-4 space-y-4">
          
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-300 pb-2 gap-2">
              <label class="text-sm font-bold text-gray-700">狀態監控條件 (請勾選需要的項目)</label>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-blue-600">觸發模式：</span>
                <select class="trigger-mode border border-gray-300 rounded shadow-sm p-1 text-xs focus:ring-blue-500 font-bold bg-white text-gray-700">
                  <option value="continuous" ${trigger.mode === "continuous" || !trigger.mode ? "selected" : ""}>持續觸發 (只要條件達成，隨時觸發)</option>
                  <option value="on_change" ${trigger.mode === "on_change" ? "selected" : ""}>變動觸發 (條件由未達成變為達成時，觸發一次)</option>
                  <option value="once" ${trigger.mode === "once" ? "selected" : ""}>單次觸發 (遊戲全程僅觸發一次，觸發後永久失效)</option>
                </select>
              </div>
            </div>
            
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
          
          <div class="flex flex-col space-y-3 bg-red-50 p-4 rounded-lg border border-red-100 mt-4">
            <label class="block text-xs font-bold text-red-700">滿足條件時的強制介入 (複合效果)</label>
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">改變數值:</span>
                <select class="trigger-var-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${variableOptions}
                </select>
                <input type="number" class="trigger-var-val border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="+/-" value="${trigger.variableVal !== undefined ? trigger.variableVal : ""}" title="請輸入增減數值">
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">獲得/失去道具:</span>
                <select class="trigger-item-action border border-gray-300 rounded shadow-sm p-1.5 w-20 focus:ring-blue-500 focus:border-blue-500">
                  <option value="" ${!trigger.itemAction ? "selected" : ""}>無</option>
                  <option value="give" ${trigger.itemAction === "give" ? "selected" : ""}>獲得</option>
                  <option value="take" ${trigger.itemAction === "take" ? "selected" : ""}>失去</option>
                </select>
                <select class="trigger-item-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${itemOptions}
                </select>
                <input type="number" class="trigger-item-val border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="數量" value="${trigger.itemVal !== undefined ? trigger.itemVal : 1}" title="請輸入道具數量" min="1">
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">場景傳送:</span>
                <select class="trigger-scene-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500">
                  ${sceneOptions}
                </select>
              </div>
            </div>
            
            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm mt-2">
              <div class="flex items-center space-x-2 flex-1">
                <span class="text-gray-500 font-bold whitespace-nowrap">推進時間:</span>
                <input type="number" class="trigger-pass-time border border-gray-300 rounded shadow-sm p-1.5 w-20 focus:ring-blue-500 focus:border-blue-500" placeholder="分鐘" value="${trigger.passTime !== undefined ? trigger.passTime : ""}" title="請輸入流逝的分鐘數">
              </div>
            </div>
          </div>
        </div>
        <div class="text-gray-600 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start mt-4">
          <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-sm">提示：當玩家操作導致數值、時間或道具改變，並符合您勾選的「監控條件」與「觸發模式」時，系統將強制觸發複合效果與跳轉。非常適合用來處理「死亡結局」或是「狀態變動隱藏事件」。</p>
        </div>
      `;

      // 事件綁定 (條件監控)
      contentEl
        .querySelector(".trigger-mode")
        .addEventListener("change", (e) => {
          trigger.mode = e.target.value;
        });

      contentEl
        .querySelector(".cond-chapter-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            trigger.conditions.chapter =
              window.projectData.chapters &&
              window.projectData.chapters.length > 0
                ? window.projectData.chapters[0].id
                : "";
          } else {
            delete trigger.conditions.chapter;
          }
          window.renderTriggers();
        });

      contentEl
        .querySelector(".cond-chapter-sel")
        .addEventListener("change", (e) => {
          trigger.conditions.chapter = e.target.value;
        });

      contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            trigger.conditions.variables[id] = { op: ">=", val: 0 };
          } else {
            delete trigger.conditions.variables[id];
          }
          window.renderTriggers();
        });
      });

      contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (trigger.conditions.variables[id]) {
            trigger.conditions.variables[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (trigger.conditions.variables[id]) {
            const val = parseInt(e.target.value, 10);
            trigger.conditions.variables[id].val = isNaN(val) ? "" : val;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
        chk.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (e.target.checked) {
            trigger.conditions.items[id] = { op: ">=", val: 1 };
          } else {
            delete trigger.conditions.items[id];
          }
          window.renderTriggers();
        });
      });

      contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const id = e.target.getAttribute("data-id");
          if (trigger.conditions.items[id]) {
            trigger.conditions.items[id].op = e.target.value;
          }
        });
      });

      contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
        input.addEventListener("input", (e) => {
          const id = e.target.getAttribute("data-id");
          if (trigger.conditions.items[id]) {
            const val = parseInt(e.target.value, 10);
            trigger.conditions.items[id].val = isNaN(val) ? 1 : val;
          }
        });
      });

      contentEl
        .querySelector(".cond-time-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) {
            trigger.conditions.time = { minHour: 0, maxHour: 23 };
          } else {
            delete trigger.conditions.time;
          }
          window.renderTriggers();
        });
      contentEl
        .querySelector(".cond-time-min")
        .addEventListener("input", (e) => {
          if (trigger.conditions.time)
            trigger.conditions.time.minHour = parseInt(e.target.value, 10) || 0;
        });
      contentEl
        .querySelector(".cond-time-max")
        .addEventListener("input", (e) => {
          if (trigger.conditions.time)
            trigger.conditions.time.maxHour = parseInt(e.target.value, 10) || 0;
        });

      contentEl
        .querySelector(".cond-time-passed-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) trigger.conditions.timePassed = 60;
          else delete trigger.conditions.timePassed;
          window.renderTriggers();
        });
      contentEl
        .querySelector(".cond-time-passed-val")
        .addEventListener("input", (e) => {
          if (trigger.conditions.timePassed !== undefined)
            trigger.conditions.timePassed = parseInt(e.target.value, 10) || 1;
        });

      contentEl
        .querySelector(".trigger-pass-time")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          trigger.passTime = isNaN(val) ? "" : val;
        });

      // 事件綁定 (強制介入)
      contentEl
        .querySelector(".trigger-var-id")
        .addEventListener("change", (e) => {
          trigger.variableId = e.target.value;
        });

      contentEl
        .querySelector(".trigger-var-val")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          trigger.variableVal = isNaN(val) ? "" : val;
        });

      contentEl
        .querySelector(".trigger-item-action")
        .addEventListener("change", (e) => {
          trigger.itemAction = e.target.value;
        });

      contentEl
        .querySelector(".trigger-item-id")
        .addEventListener("change", (e) => {
          trigger.targetItemId = e.target.value;
        });

      contentEl
        .querySelector(".trigger-item-val")
        .addEventListener("input", (e) => {
          const val = parseInt(e.target.value, 10);
          trigger.itemVal = isNaN(val) ? "" : val;
        });

      contentEl
        .querySelector(".trigger-scene-id")
        .addEventListener("change", (e) => {
          trigger.targetSceneId = e.target.value;
        });

      triggerEl.appendChild(contentEl);
    }
    container.appendChild(triggerEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML += `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white mt-4">
          找不到符合「${query}」的觸發器。
      </div>
    `;
  }
};

function addNewTrigger() {
  window.projectData.triggers.push({
    id: "trigger_" + Date.now(),
    name: "新觸發器",
    mode: "on_change",
    conditions: { variables: {}, items: {} },
    variableId: "",
    variableVal: "",
    itemAction: "",
    targetItemId: "",
    itemVal: 1,
    passTime: "",
    targetSceneId: "",
    isExpanded: true,
  });
  window.renderTriggers();
}
