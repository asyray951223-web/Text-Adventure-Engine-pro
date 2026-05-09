// 負責管理與渲染「場景編輯」頁面邏輯

window.renderScenes = function () {
  const container = document.getElementById("scenes-container");
  const addBtn = document.getElementById("add-scene-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", () => addNewScene(""));

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.scenes) window.projectData.scenes = [];
  if (!window.projectData.chapters) window.projectData.chapters = [];

  if (
    window.projectData.scenes.length === 0 &&
    window.projectData.chapters.length === 0
  ) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何場景，點擊上方「+ 新增場景」開始。
      </div>
    `;
    return;
  }

  // 準備章節的下拉選單選項
  let chapterOptions = `<option value="">-- 不指定章節 --</option>`;
  window.projectData.chapters.forEach((ch) => {
    chapterOptions += `<option value="${ch.id}">${ch.name}</option>`;
  });

  // 建立章節群組
  const groupedScenes = [
    ...window.projectData.chapters.map((ch) => ({
      id: ch.id,
      name: ch.name,
      scenes: [],
    })),
    { id: "", name: "未歸類場景", scenes: [] },
  ];

  const chapterMap = {};
  groupedScenes.forEach((g) => (chapterMap[g.id] = g));

  const query = window.sceneSearchQuery || "";

  // 將場景分類至對應的章節群組中
  window.projectData.scenes.forEach((scene) => {
    let match = true;
    if (query) {
      const textToSearch = [
        scene.name,
        scene.id,
        scene.text,
        ...(scene.options || []).map((o) => o.text),
        scene.endingName,
      ]
        .join(" ")
        .toLowerCase();
      match = textToSearch.includes(query);
    }

    if (match) {
      if (chapterMap[scene.chapterId]) {
        chapterMap[scene.chapterId].scenes.push(scene);
      } else {
        chapterMap[""].scenes.push(scene); // 若原章節已被刪除，歸類至未歸類
      }
    }
  });

  let hasRenderedAny = false;

  groupedScenes.forEach((group) => {
    // 搜尋模式下，若群組內無符合場景則隱藏
    if (query && group.scenes.length === 0) return;

    // 如果是「未歸類」且裡面沒有場景，同時存在其他章節，則隱藏不顯示
    if (
      group.id === "" &&
      group.scenes.length === 0 &&
      window.projectData.chapters.length > 0
    )
      return;

    hasRenderedAny = true;

    const groupContainer = document.createElement("div");
    groupContainer.className =
      "mb-8 bg-gray-50/50 p-5 rounded-xl border border-gray-200 shadow-inner";

    const groupTitle = document.createElement("div");
    groupTitle.className =
      "flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-300";
    groupTitle.innerHTML = `
      <h3 class="text-xl font-extrabold text-gray-700 flex items-center">
        <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        ${group.name}
      </h3>
      <button class="add-scene-group-btn bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-1 rounded text-sm font-bold shadow-sm transition">+ 新增場景至此章節</button>
    `;

    groupTitle
      .querySelector(".add-scene-group-btn")
      .addEventListener("click", () => {
        addNewScene(group.id);
      });
    groupContainer.appendChild(groupTitle);

    const sceneList = document.createElement("div");
    sceneList.className = "space-y-4";

    if (group.scenes.length === 0) {
      sceneList.innerHTML = `<div class="text-sm text-gray-400 italic p-4 bg-white border border-dashed border-gray-300 rounded-lg text-center">目前此章節沒有任何場景。</div>`;
    }

    group.scenes.forEach((scene, sIdx) => {
      const sceneEl = document.createElement("div");
      sceneEl.id = scene.id;
      sceneEl.className =
        "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

      // 場景標題區塊 (點擊此區塊進行摺疊/展開)
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
        scene.isExpanded = !scene.isExpanded;
        window.renderScenes();
      });

      // 展開圖示與標題輸入框
      const iconSvg = scene.isExpanded
        ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
        : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

      const isFirst = sIdx === 0 || !!query;
      const isLast = sIdx === group.scenes.length - 1 || !!query;

      headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${scene.id}" onclick="window.copyId(event, '${scene.id}')">${scene.id}</span>
        <input type="text" value="${scene.name}" placeholder="輸入場景名稱..." 
               class="flex-1 font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition">
      </div>
      <div class="flex items-center space-x-2 ml-4">
        <button class="move-up-btn p-1 text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50 rounded shadow-sm border border-transparent hover:border-blue-200 transition ${isFirst ? "opacity-30 cursor-not-allowed" : ""}" ${isFirst ? "disabled" : 'title="往上移"'}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
        </button>
        <button class="move-down-btn p-1 text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50 rounded shadow-sm border border-transparent hover:border-blue-200 transition ${isLast ? "opacity-30 cursor-not-allowed" : ""}" ${isLast ? "disabled" : 'title="往下移"'}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <button class="copy-btn text-blue-500 hover:text-blue-700 p-1 bg-white hover:bg-blue-50 rounded shadow-sm border border-transparent hover:border-blue-200 transition" title="複製此場景">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
        <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition" title="刪除此場景">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

      headerEl
        .querySelector("input")
        .addEventListener("input", (e) => (scene.name = e.target.value));

      const moveUpBtn = headerEl.querySelector(".move-up-btn");
      if (moveUpBtn && !moveUpBtn.disabled) {
        moveUpBtn.addEventListener("click", () =>
          moveSceneOrder(scene.id, -1, scene.chapterId),
        );
      }

      const moveDownBtn = headerEl.querySelector(".move-down-btn");
      if (moveDownBtn && !moveDownBtn.disabled) {
        moveDownBtn.addEventListener("click", () =>
          moveSceneOrder(scene.id, 1, scene.chapterId),
        );
      }

      headerEl
        .querySelector(".copy-btn")
        .addEventListener("click", () => duplicateScene(scene.id));

      headerEl.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm(`確定要刪除「${scene.name}」嗎？`)) {
          const realIndex = window.projectData.scenes.findIndex(
            (s) => s.id === scene.id,
          );
          if (realIndex > -1) {
            window.projectData.scenes.splice(realIndex, 1);
            window.renderScenes();
          }
        }
      });
      sceneEl.appendChild(headerEl);

      if (scene.isExpanded) {
        if (!scene.options) scene.options = [];

        let optionsHtml = "";
        if (scene.options.length === 0) {
          optionsHtml = `<div class="text-sm text-gray-400 italic bg-gray-50 p-3 rounded border border-dashed border-gray-300 text-center">目前沒有任何選項，玩家將無法從此場景進行選擇跳轉。</div>`;
        } else {
          scene.options.forEach((opt, optIndex) => {
            if (!opt.conditions) {
              opt.conditions = { variables: {}, items: {} };
            }
            if (!opt.conditions.variables) opt.conditions.variables = {};
            if (!opt.conditions.items) opt.conditions.items = {};
            if (opt.enableCondition === undefined) {
              opt.enableCondition =
                Object.keys(opt.conditions.variables).length > 0 ||
                Object.keys(opt.conditions.items).length > 0;
            }

            let varConditionsHtml = "";
            if (
              window.projectData.globalVariables &&
              window.projectData.globalVariables.length > 0
            ) {
              window.projectData.globalVariables.forEach((v) => {
                const isChecked = opt.conditions.variables[v.id] !== undefined;
                const op = isChecked ? opt.conditions.variables[v.id].op : ">=";
                const val = isChecked ? opt.conditions.variables[v.id].val : "";

                varConditionsHtml += `
                  <div class="flex items-center space-x-2 bg-gray-50 p-1.5 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                      <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[60px]">
                          <input type="checkbox" class="opt-cond-var-chk h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500" data-idx="${optIndex}" data-id="${v.id}" ${isChecked ? "checked" : ""}>
                          <span class="text-xs font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${v.name}">${v.name}</span>
                      </label>
                      <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                          <select class="opt-cond-var-op border border-gray-300 rounded p-1 text-xs w-10 focus:ring-blue-500" data-idx="${optIndex}" data-id="${v.id}">
                              <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                              <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                              <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                              <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                              <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                              <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                          </select>
                          <input type="number" class="opt-cond-var-val border border-gray-300 rounded p-1 w-full max-w-[60px] text-xs focus:ring-blue-500" placeholder="數值" value="${val}" data-idx="${optIndex}" data-id="${v.id}">
                      </div>
                  </div>
                `;
              });
            } else {
              varConditionsHtml = `<p class="text-xs text-gray-400 italic">尚未建立任何變數</p>`;
            }

            let itemConditionsHtml = "";
            if (
              window.projectData.items &&
              window.projectData.items.length > 0
            ) {
              window.projectData.items.forEach((i) => {
                const itemCond = opt.conditions.items[i.id];
                const isChecked = itemCond !== undefined && itemCond !== false;
                const op = isChecked && itemCond.op ? itemCond.op : ">=";
                const val =
                  isChecked && itemCond.val !== undefined ? itemCond.val : 1;

                itemConditionsHtml += `
                  <div class="flex items-center space-x-2 bg-gray-50 p-1.5 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                      <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[60px]">
                          <input type="checkbox" class="opt-cond-item-chk h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500" data-idx="${optIndex}" data-id="${i.id}" ${isChecked ? "checked" : ""}>
                          <span class="text-xs font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${i.name}">${i.name}</span>
                      </label>
                      <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                          <select class="opt-cond-item-op border border-gray-300 rounded p-1 text-xs w-10 focus:ring-blue-500" data-idx="${optIndex}" data-id="${i.id}">
                              <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                              <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                              <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                              <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                              <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                              <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                          </select>
                          <input type="number" class="opt-cond-item-val border border-gray-300 rounded p-1 w-full max-w-[60px] text-xs focus:ring-blue-500" placeholder="數量" value="${val}" data-idx="${optIndex}" data-id="${i.id}" min="1">
                      </div>
                  </div>
                `;
              });
            } else {
              itemConditionsHtml = `<p class="text-xs text-gray-400 italic">尚未建立任何道具</p>`;
            }

            let timeConditionHtml = "";
            const hasTimeCond = !!opt.conditions.time;
            const startH = hasTimeCond ? opt.conditions.time.minHour : 0;
            const endH = hasTimeCond ? opt.conditions.time.maxHour : 23;
            timeConditionHtml = `
              <div class="flex items-center space-x-2 bg-gray-50 p-1.5 rounded border ${hasTimeCond ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                  <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                      <input type="checkbox" class="opt-cond-time-chk h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500" data-idx="${optIndex}" ${hasTimeCond ? "checked" : ""}>
                      <span class="text-xs font-bold ${hasTimeCond ? "text-blue-700" : "text-gray-600"} truncate">限制時段</span>
                  </label>
                  <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${hasTimeCond ? "1" : "0.3"}; pointer-events: ${hasTimeCond ? "auto" : "none"};">
                      <input type="number" class="opt-cond-time-min border border-gray-300 rounded p-1 w-full max-w-[50px] text-xs focus:ring-blue-500" value="${startH}" data-idx="${optIndex}" min="0" max="23">
                      <span class="text-xs text-gray-500">~</span>
                      <input type="number" class="opt-cond-time-max border border-gray-300 rounded p-1 w-full max-w-[50px] text-xs focus:ring-blue-500" value="${endH}" data-idx="${optIndex}" min="0" max="23">
                  </div>
              </div>
            `;

            let currentTargetOptions = `<option value="">-- 請選擇目標場景 --</option>`;

            currentTargetOptions += `<optgroup label="動態跳轉模式">`;
            currentTargetOptions += `<option value="__PREVIOUS__" ${opt.targetSceneId === "__PREVIOUS__" ? "selected" : ""}>🔙 返回上一個停留場景</option>`;
            currentTargetOptions += `<option value="__UP__" ${opt.targetSceneId === "__UP__" ? "selected" : ""}>⬆️ 跳轉至清單上方的場景</option>`;
            currentTargetOptions += `<option value="__DOWN__" ${opt.targetSceneId === "__DOWN__" ? "selected" : ""}>⬇️ 跳轉至清單下方的場景</option>`;
            currentTargetOptions += `</optgroup>`;

            currentTargetOptions += `<optgroup label="指定特定場景">`;
            window.projectData.scenes.forEach((s) => {
              const selected = s.id === opt.targetSceneId ? "selected" : "";
              currentTargetOptions += `<option value="${s.id}" ${selected}>${s.name} (${s.id})</option>`;
            });
            currentTargetOptions += `</optgroup>`;

            currentTargetOptions += `<optgroup label="指定特定章節 (跳至該章開場)">`;
            window.projectData.chapters.forEach((ch) => {
              const selected = ch.id === opt.targetSceneId ? "selected" : "";
              currentTargetOptions += `<option value="${ch.id}" ${selected}>${ch.name} (${ch.id})</option>`;
            });
            currentTargetOptions += `</optgroup>`;

            currentTargetOptions += `<optgroup label="開啟商店">`;
            (window.projectData.shops || []).forEach((sh) => {
              const val = `__SHOP__${sh.id}`;
              const selected = val === opt.targetSceneId ? "selected" : "";
              currentTargetOptions += `<option value="${val}" ${selected}>🛒 商店：${sh.name}</option>`;
            });
            currentTargetOptions += `</optgroup>`;

            currentTargetOptions += `<optgroup label="開啟測驗">`;
            (window.projectData.quizzes || []).forEach((q) => {
              const val = `__QUIZ__${q.id}`;
              const selected = val === opt.targetSceneId ? "selected" : "";
              currentTargetOptions += `<option value="${val}" ${selected}>📝 測驗：${q.name}</option>`;
            });
            currentTargetOptions += `</optgroup>`;

            currentTargetOptions += `<optgroup label="隨機跳轉 (Random)">`;
            window.projectData.chapters.forEach((ch) => {
              const val = `__RANDOM_IN_CHAP__${ch.id}`;
              const selected = val === opt.targetSceneId ? "selected" : "";
              currentTargetOptions += `<option value="${val}" ${selected}>🎲 隨機章節內：${ch.name}</option>`;
            });
            currentTargetOptions += `<option value="__RANDOM_ALL__" ${opt.targetSceneId === "__RANDOM_ALL__" ? "selected" : ""}>🎲 隨機全域：所有場景</option>`;
            currentTargetOptions += `</optgroup>`;

            let variableOptions = `<option value="">-- 不變動數值 --</option>`;
            (window.projectData.globalVariables || []).forEach((v) => {
              const selected = v.id === opt.variableId ? "selected" : "";
              variableOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
            });

            let itemOptions = `<option value="">-- 不變動道具 --</option>`;
            (window.projectData.items || []).forEach((i) => {
              const selected = i.id === opt.itemId ? "selected" : "";
              itemOptions += `<option value="${i.id}" ${selected}>${i.name}</option>`;
            });

            optionsHtml += `
            <div class="flex flex-col space-y-2 bg-gray-50 p-3 rounded border border-gray-200 transition hover:border-blue-300">
              <div class="flex items-center space-x-2">
                <input type="text" class="opt-text w-3/5 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="選項文字 (例如: 進入山洞)" value="${opt.text || ""}" data-idx="${optIndex}">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                <select class="opt-target w-2/5 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" data-idx="${optIndex}">
                  ${currentTargetOptions}
                </select>
                <button class="opt-del text-red-500 hover:text-red-700 p-1 flex-shrink-0" data-idx="${optIndex}" title="刪除選項">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>

              <div class="text-xs bg-white border border-gray-200 rounded">
                <label class="flex items-center cursor-pointer p-2 bg-gray-100 rounded-t hover:bg-gray-200 transition m-0">
                  <input type="checkbox" class="opt-enable-cond-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" data-idx="${optIndex}" ${opt.enableCondition ? "checked" : ""}>
                  <span class="font-bold text-gray-600">隱藏選項 (設定出現條件)</span>
                </label>
                <div class="p-2 space-y-2 ${opt.enableCondition ? "block" : "hidden"}">
                  <div class="space-y-1">
                    <span class="text-gray-500 font-bold">數值條件：</span>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      ${varConditionsHtml}
                    </div>
                  </div>
                  <div class="space-y-1 pt-2 border-t border-gray-100">
                    <span class="text-gray-500 font-bold">持有道具條件：</span>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      ${itemConditionsHtml}
                    </div>
                  </div>
                  <div class="space-y-1 pt-2 border-t border-gray-100">
                    <span class="text-gray-500 font-bold">時間條件：</span>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      ${timeConditionHtml}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 text-xs border-t border-gray-200 pt-2">
                <span class="text-gray-500 font-bold whitespace-nowrap">數值:</span>
                <select class="opt-var-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500" data-idx="${optIndex}">
                    ${variableOptions}
                </select>
                <input type="number" class="opt-var-val border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="+/-" value="${opt.variableVal !== undefined ? opt.variableVal : ""}" data-idx="${optIndex}" title="請輸入增減數值">
                
                <span class="text-gray-500 font-bold whitespace-nowrap ml-2">道具:</span>
                <select class="opt-item-action border border-gray-300 rounded shadow-sm p-1.5 w-20 focus:ring-blue-500 focus:border-blue-500" data-idx="${optIndex}">
                    <option value="" ${!opt.itemAction ? "selected" : ""}>無</option>
                    <option value="give" ${opt.itemAction === "give" ? "selected" : ""}>給予</option>
                    <option value="take" ${opt.itemAction === "take" ? "selected" : ""}>扣除</option>
                </select>
                <select class="opt-item-id border border-gray-300 rounded shadow-sm p-1.5 flex-1 focus:ring-blue-500 focus:border-blue-500" data-idx="${optIndex}">
                    ${itemOptions}
                </select>
                <input type="number" class="opt-item-val border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="數量" value="${opt.itemVal !== undefined ? opt.itemVal : 1}" data-idx="${optIndex}" title="請輸入道具數量" min="1">
                <span class="text-gray-500 font-bold whitespace-nowrap ml-2">推進時間:</span>
                <input type="number" class="opt-pass-time border border-gray-300 rounded shadow-sm p-1.5 w-16 focus:ring-blue-500 focus:border-blue-500" placeholder="分" value="${opt.passTime !== undefined ? opt.passTime : ""}" data-idx="${optIndex}" title="流逝分鐘數">
              </div>
              <div class="flex items-center space-x-2 text-xs border-t border-gray-200 pt-2 mt-2">
                <span class="text-purple-600 font-bold whitespace-nowrap">效果觸發機率:</span>
                <input type="number" class="opt-effect-prob border border-purple-300 rounded shadow-sm p-1.5 w-16 focus:ring-purple-500 focus:border-purple-500" placeholder="100" value="${opt.effectProbability !== undefined ? opt.effectProbability : 100}" data-idx="${optIndex}" title="設定道具、數值與時間推進的觸發機率 (0-100)%" min="0" max="100">
                <span class="text-purple-600 font-bold">%</span>
                <span class="text-gray-400 ml-2 italic">（機率判定僅影響數值與道具增減，不影響場景跳轉）</span>
              </div>
            </div>
          `;
          });
        }

        const defaultBgUrl =
          window.projectData.projectInfo &&
          window.projectData.projectInfo.defaultBgUrl
            ? window.projectData.projectInfo.defaultBgUrl.trim()
            : "";
        const sceneBgUrl = scene.bgUrl ? scene.bgUrl.trim() : "";
        const displayBgUrl =
          sceneBgUrl ||
          defaultBgUrl ||
          "https://via.placeholder.com/600x200?text=No+Background+Image";

        const contentEl = document.createElement("div");
        contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

        let npcOptions = `<option value="">-- 無駐紮 NPC (旁白/系統) --</option>`;
        if (window.projectData.npcs) {
          window.projectData.npcs.forEach((n) => {
            const selected = n.id === scene.npcId ? "selected" : "";
            npcOptions += `<option value="${n.id}" ${selected}>${n.name}</option>`;
          });
        }

        let timeOutOptionsHtml = `<option value="">-- 請選擇超時目標場景 --</option>`;
        timeOutOptionsHtml += `<optgroup label="動態跳轉模式">`;
        timeOutOptionsHtml += `<option value="__PREVIOUS__" ${scene.timeOutSceneId === "__PREVIOUS__" ? "selected" : ""}>🔙 返回上一個停留場景</option>`;
        timeOutOptionsHtml += `<option value="__UP__" ${scene.timeOutSceneId === "__UP__" ? "selected" : ""}>⬆️ 跳轉至清單上方的場景</option>`;
        timeOutOptionsHtml += `<option value="__DOWN__" ${scene.timeOutSceneId === "__DOWN__" ? "selected" : ""}>⬇️ 跳轉至清單下方的場景</option>`;
        timeOutOptionsHtml += `</optgroup>`;
        timeOutOptionsHtml += `<optgroup label="指定特定場景">`;
        window.projectData.scenes.forEach((s) => {
          const selected = s.id === scene.timeOutSceneId ? "selected" : "";
          timeOutOptionsHtml += `<option value="${s.id}" ${selected}>${s.name} (${s.id})</option>`;
        });
        timeOutOptionsHtml += `</optgroup>`;
        timeOutOptionsHtml += `<optgroup label="指定特定章節 (跳至該章開場)">`;
        window.projectData.chapters.forEach((ch) => {
          const selected = ch.id === scene.timeOutSceneId ? "selected" : "";
          timeOutOptionsHtml += `<option value="${ch.id}" ${selected}>${ch.name} (${ch.id})</option>`;
        });
        timeOutOptionsHtml += `</optgroup>`;
        timeOutOptionsHtml += `<optgroup label="隨機跳轉 (Random)">`;
        window.projectData.chapters.forEach((ch) => {
          const val = "__RANDOM_IN_CHAP__" + ch.id;
          const selected = val === scene.timeOutSceneId ? "selected" : "";
          timeOutOptionsHtml += `<option value="${val}" ${selected}>🎲 隨機章節內：${ch.name}</option>`;
        });
        timeOutOptionsHtml += `<option value="__RANDOM_ALL__" ${scene.timeOutSceneId === "__RANDOM_ALL__" ? "selected" : ""}>🎲 隨機全域：所有場景</option>`;
        timeOutOptionsHtml += `</optgroup>`;

        contentEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center space-x-4">
            <label class="block text-sm font-medium text-gray-700 whitespace-nowrap">所屬章節</label>
            <select class="chapter-select w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
              ${chapterOptions}
            </select>
          </div>
          <div class="flex flex-col space-y-2">
            <div class="flex items-center space-x-4">
              <label class="block text-sm font-medium text-gray-700 whitespace-nowrap">駐紮 NPC</label>
              <select class="npc-select w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
                ${npcOptions}
              </select>
            </div>
            <label class="flex items-center cursor-pointer ml-14">
              <input type="checkbox" class="npc-skip-chk h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500 mr-2" ${scene.skipIfNpcMissing ? "checked" : ""}>
              <span class="text-xs font-bold text-gray-500 hover:text-gray-700 transition">若駐紮 NPC 條件未達標，則自動跳過此場景</span>
            </label>
          </div>
        </div>
        
        <div class="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 class="text-md font-bold text-gray-700 border-b pb-2 mb-4">場景畫面與音樂設定</h4>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-1/3">
              <img src="${displayBgUrl}" class="w-full h-32 object-cover rounded border border-gray-300 shadow-sm" alt="場景背景預覽" onerror="this.src='https://via.placeholder.com/600x200?text=No+Background+Image'">
              <p class="text-xs text-gray-400 mt-1 text-center">背景畫面預覽</p>
            </div>
            <div class="w-full sm:w-2/3 space-y-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">場景專屬背景圖 (URL，選填，留空則自動套用預設圖)</label>
                <input type="text" class="scene-bg-url w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://..." value="${scene.bgUrl || ""}">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">場景專屬音樂 (BGM URL，選填，留空則套用章節或預設音)</label>
                <div class="flex space-x-2">
                  <input type="text" class="scene-bgm-url flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://... (如 mp3)" value="${scene.bgmUrl || ""}">
                  <button class="scene-bgm-test-btn bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-sm font-bold transition whitespace-nowrap">▶ 試聽</button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">進場轉場動畫</label>
                <select class="scene-transition w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                  <option value="fade" ${scene.transition === "fade" || !scene.transition ? "selected" : ""}>淡入淡出 (預設)</option>
                  <option value="none" ${scene.transition === "none" ? "selected" : ""}>無 (直接切換)</option>
                  <option value="slide-left" ${scene.transition === "slide-left" ? "selected" : ""}>從右側滑入 (向左移)</option>
                  <option value="slide-right" ${scene.transition === "slide-right" ? "selected" : ""}>從左側滑入 (向右移)</option>
                  <option value="slide-up" ${scene.transition === "slide-up" ? "selected" : ""}>從下方滑入 (向上移)</option>
                  <option value="slide-down" ${scene.transition === "slide-down" ? "selected" : ""}>從上方滑入 (向下移)</option>
                  <option value="zoom-in" ${scene.transition === "zoom-in" ? "selected" : ""}>放大淡入</option>
                  <option value="blur-in" ${scene.transition === "blur-in" ? "selected" : ""}>模糊淡入 (夢境/回憶)</option>
                  <option value="spin-in" ${scene.transition === "spin-in" ? "selected" : ""}>旋轉放大 (傳送/魔法)</option>
                  <option value="flash" ${scene.transition === "flash" ? "selected" : ""}>閃白震動 (適合受擊/驚嚇)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1" title="當使用「隨機跳轉」功能時，此場景被抽中的機率。預設為 1，數字越大機率越高，設為 0 則不會被抽中。">隨機抽取權重 (機率)</label>
          <input type="number" class="scene-weight w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="1" value="${scene.randomWeight !== undefined ? scene.randomWeight : 1}" min="0">
        </div>
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <label class="flex items-center cursor-pointer mb-2">
            <input type="checkbox" class="scene-timer-chk h-4 w-4 text-red-600 rounded focus:ring-red-500 mr-2" ${scene.timeLimit > 0 ? "checked" : ""}>
            <span class="font-bold text-red-800">啟用限時選項 (定時炸彈/倒數計時)</span>
          </label>
          <div class="${scene.timeLimit > 0 ? "block" : "hidden"} pl-6 space-y-3">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-700">限時秒數：</span>
              <input type="number" class="scene-time-limit w-20 border border-red-300 rounded shadow-sm p-1.5 focus:ring-red-500 focus:border-red-500 text-sm" placeholder="秒" value="${scene.timeLimit || ""}" min="1">
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-700 w-[70px] whitespace-nowrap">超時跳轉：</span>
              <select class="scene-timeout-target flex-1 border border-red-300 rounded shadow-sm p-1.5 focus:ring-red-500 focus:border-red-500 text-sm">
                ${timeOutOptionsHtml}
              </select>
            </div>
            <p class="text-xs text-red-600 mt-1">當打字動畫結束並顯示選項時開始倒數。若玩家未在時限內做出選擇，將強制跳轉。</p>
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">場景角色立繪 (Sprite URL，選填)</label>
          <input type="text" class="scene-sprite-url w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://..." value="${scene.spriteUrl || ""}">
          <p class="text-xs text-gray-500 mt-1">立繪將顯示在對話框上方、背景圖之前。</p>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">全螢幕事件 CG (影片或 YouTube URL，選填)</label>
          <input type="text" class="scene-cg-video-url w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="支援直連 mp4 或 YouTube 網址" value="${scene.cgVideoUrl || ""}">
          <p class="text-xs text-gray-500 mt-1">進入場景時將自動循環播放並覆蓋背景，支援 YouTube 影片嵌入。</p>
        </div>
        <div class="mt-4">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium text-gray-700">場景文本 / 對話內容</label>
            <div class="flex space-x-1.5">
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition" data-tag="b" title="粗體 (Bold)">B</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition italic" data-tag="i" title="斜體 (Italic)">I</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition underline" data-tag="u" title="底線 (Underline)">U</button>
              <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-red-500" data-tag="span" data-style="color:#ef4444" title="紅色文字">紅</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-yellow-500" data-tag="span" data-style="color:#eab308" title="黃色文字">黃</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-emerald-500" data-tag="span" data-style="color:#10b981" title="綠色文字">綠</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-blue-500" data-tag="span" data-style="color:#3b82f6" title="藍色文字">藍</button>
            </div>
          </div>
          <textarea class="scene-text w-full border border-gray-300 rounded-md shadow-sm p-3 h-96 focus:ring-blue-500 focus:border-blue-500 text-lg leading-relaxed resize-none custom-scrollbar" placeholder="輸入此場景的文字內容...">${scene.text || ""}</textarea>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 space-y-2">
          <label class="flex items-center cursor-pointer">
            <input type="checkbox" class="scene-is-ending-chk h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500 mr-2" ${scene.isEnding ? "checked" : ""}>
            <span class="font-bold text-yellow-800">標記為結局場景 (達成多結局收集)</span>
          </label>
          <div class="${scene.isEnding ? "block" : "hidden"} pl-6">
            <input type="text" class="scene-ending-name w-full border border-yellow-300 rounded shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm" placeholder="輸入結局名稱，例如：Bad End - 永眠於此" value="${scene.endingName || ""}">
            <p class="text-xs text-yellow-600 mt-1">當玩家到達此場景時，遊戲將會記錄此結局並停止推進。</p>
          </div>
        </div>
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div class="flex justify-between items-center mb-3">
            <label class="block text-sm font-medium text-gray-700">選項</label>
            <button class="add-opt-btn bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1 rounded text-sm font-bold transition shadow-sm">+ 新增選項</button>
          </div>
          <div class="space-y-2">
            ${optionsHtml}
          </div>
          <div class="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100 flex items-start">
            <svg class="w-4 h-4 text-blue-400 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>提示：您可以在選項中設定跳轉目標，並同時讓玩家在點擊該選項時獲得/扣除「數值」或「道具」，這是製作分支獎勵或消耗體力的好方法！</span>
          </div>
        </div>
      `;

        // 綁定「所屬章節」下拉選單
        const selectEl = contentEl.querySelector(".chapter-select");
        selectEl.value = scene.chapterId || "";
        selectEl.addEventListener("change", (e) => {
          scene.chapterId = e.target.value;
          window.renderScenes(); // 重新渲染以將場景移動到新的群組區塊
        });

        // 綁定「駐紮 NPC」下拉選單
        const npcSelectEl = contentEl.querySelector(".npc-select");
        if (npcSelectEl) {
          npcSelectEl.addEventListener("change", (e) => {
            scene.npcId = e.target.value;
          });
        }

        // 綁定「跳過場景」勾選框
        const npcSkipChkEl = contentEl.querySelector(".npc-skip-chk");
        if (npcSkipChkEl) {
          npcSkipChkEl.addEventListener("change", (e) => {
            scene.skipIfNpcMissing = e.target.checked;
          });
        }

        // 綁定「專屬背景圖」輸入框
        const bgUrlInput = contentEl.querySelector(".scene-bg-url");
        if (bgUrlInput) {
          bgUrlInput.addEventListener("change", (e) => {
            scene.bgUrl = e.target.value;
            window.renderScenes(); // 重新渲染以更新預覽圖片
          });
        }

        // 綁定「專屬背景音樂」輸入框
        const bgmUrlInput = contentEl.querySelector(".scene-bgm-url");
        if (bgmUrlInput) {
          bgmUrlInput.addEventListener("change", (e) => {
            scene.bgmUrl = e.target.value;
          });
        }

        // 綁定「專屬背景音樂預覽」按鈕
        const bgmTestBtn = contentEl.querySelector(".scene-bgm-test-btn");
        if (bgmTestBtn) {
          bgmTestBtn.addEventListener("click", (e) => {
            const url = bgmUrlInput ? bgmUrlInput.value : "";
            window.toggleAudioPreview(url, e.target);
          });
        }

        // 綁定「轉場動畫」下拉選單
        const transitionSelect = contentEl.querySelector(".scene-transition");
        if (transitionSelect) {
          transitionSelect.addEventListener("change", (e) => {
            scene.transition = e.target.value;
          });
        }

        // 綁定「隨機權重」輸入框
        const weightInput = contentEl.querySelector(".scene-weight");
        if (weightInput) {
          weightInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            scene.randomWeight = isNaN(val) ? 1 : val;
          });
        }

        const timerChk = contentEl.querySelector(".scene-timer-chk");
        if (timerChk) {
          timerChk.addEventListener("change", (e) => {
            if (e.target.checked) scene.timeLimit = scene.timeLimit || 5;
            else scene.timeLimit = 0;
            window.renderScenes();
          });
        }
        const timeLimitInput = contentEl.querySelector(".scene-time-limit");
        if (timeLimitInput) {
          timeLimitInput.addEventListener("input", (e) => {
            const val = parseInt(e.target.value, 10);
            scene.timeLimit = isNaN(val) ? 0 : val;
          });
        }
        const timeoutTargetSelect = contentEl.querySelector(
          ".scene-timeout-target",
        );
        if (timeoutTargetSelect) {
          timeoutTargetSelect.addEventListener("change", (e) => {
            scene.timeOutSceneId = e.target.value;
          });
        }

        // 綁定「角色立繪」輸入框
        const spriteUrlInput = contentEl.querySelector(".scene-sprite-url");
        if (spriteUrlInput) {
          spriteUrlInput.addEventListener("change", (e) => {
            scene.spriteUrl = e.target.value;
          });
        }

        // 綁定「事件 CG」輸入框
        const cgVideoUrlInput = contentEl.querySelector(".scene-cg-video-url");
        if (cgVideoUrlInput) {
          cgVideoUrlInput.addEventListener("change", (e) => {
            scene.cgVideoUrl = e.target.value;
          });
        }

        // 綁定「對話內容」文本框
        const textEl = contentEl.querySelector(".scene-text");
        textEl.addEventListener("input", (e) => {
          scene.text = e.target.value;
        });

        // 綁定格式快捷工具列
        contentEl.querySelectorAll(".format-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const tag = e.currentTarget.getAttribute("data-tag");
            const style = e.currentTarget.getAttribute("data-style");
            const start = textEl.selectionStart;
            const end = textEl.selectionEnd;
            const text = textEl.value;
            const selectedText = text.substring(start, end);

            let insertion = "";
            let cursorOffset = 0;
            if (tag === "span" && style) {
              insertion = `<span style="${style}">${selectedText}</span>`;
              cursorOffset = `<span style="${style}">`.length;
            } else {
              insertion = `<${tag}>${selectedText}</${tag}>`;
              cursorOffset = `<${tag}>`.length;
            }

            const newText =
              text.substring(0, start) + insertion + text.substring(end);
            textEl.value = newText;
            scene.text = newText;

            textEl.focus();
            if (selectedText.length === 0) {
              textEl.setSelectionRange(
                start + cursorOffset,
                start + cursorOffset,
              );
            } else {
              const newEnd = start + insertion.length;
              textEl.setSelectionRange(newEnd, newEnd);
            }
          });
        });

        // 綁定「結局場景」勾選框
        const isEndingChk = contentEl.querySelector(".scene-is-ending-chk");
        if (isEndingChk) {
          isEndingChk.addEventListener("change", (e) => {
            scene.isEnding = e.target.checked;
            window.renderScenes();
          });
        }

        // 綁定「結局名稱」輸入框
        const endingNameInput = contentEl.querySelector(".scene-ending-name");
        if (endingNameInput) {
          endingNameInput.addEventListener("input", (e) => {
            scene.endingName = e.target.value;
          });
        }

        // 綁定選項相關事件
        contentEl.querySelectorAll(".opt-text").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].text = e.target.value;
          });
        });

        contentEl.querySelectorAll(".opt-target").forEach((select) => {
          select.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].targetSceneId = e.target.value;
          });
        });

        contentEl.querySelectorAll(".opt-var-id").forEach((select) => {
          select.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].variableId = e.target.value;
          });
        });

        contentEl.querySelectorAll(".opt-var-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const val = parseInt(e.target.value, 10);
            scene.options[idx].variableVal = isNaN(val) ? "" : val;
          });
        });

        contentEl.querySelectorAll(".opt-item-action").forEach((select) => {
          select.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].itemAction = e.target.value;
          });
        });

        contentEl.querySelectorAll(".opt-item-id").forEach((select) => {
          select.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].itemId = e.target.value;
          });
        });

        contentEl.querySelectorAll(".opt-item-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const val = parseInt(e.target.value, 10);
            scene.options[idx].itemVal = isNaN(val) ? "" : val;
          });
        });

        contentEl.querySelectorAll(".opt-cond-var-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (e.target.checked) {
              scene.options[idx].conditions.variables[id] = {
                op: ">=",
                val: 0,
              };
            } else {
              delete scene.options[idx].conditions.variables[id];
            }
            window.renderScenes();
          });
        });

        contentEl.querySelectorAll(".opt-cond-var-op").forEach((sel) => {
          sel.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (scene.options[idx].conditions.variables[id]) {
              scene.options[idx].conditions.variables[id].op = e.target.value;
            }
          });
        });

        contentEl.querySelectorAll(".opt-cond-var-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (scene.options[idx].conditions.variables[id]) {
              const val = parseInt(e.target.value, 10);
              scene.options[idx].conditions.variables[id].val = isNaN(val)
                ? ""
                : val;
            }
          });
        });

        contentEl.querySelectorAll(".opt-cond-item-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (e.target.checked) {
              scene.options[idx].conditions.items[id] = { op: ">=", val: 1 };
            } else {
              delete scene.options[idx].conditions.items[id];
            }
            window.renderScenes();
          });
        });

        contentEl.querySelectorAll(".opt-cond-item-op").forEach((sel) => {
          sel.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (scene.options[idx].conditions.items[id]) {
              scene.options[idx].conditions.items[id].op = e.target.value;
            }
          });
        });

        contentEl.querySelectorAll(".opt-cond-item-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const id = e.target.getAttribute("data-id");
            if (scene.options[idx].conditions.items[id]) {
              const val = parseInt(e.target.value, 10);
              scene.options[idx].conditions.items[id].val = isNaN(val)
                ? 1
                : val;
            }
          });
        });

        contentEl.querySelectorAll(".opt-cond-time-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            if (e.target.checked) {
              scene.options[idx].conditions.time = { minHour: 0, maxHour: 23 };
            } else {
              delete scene.options[idx].conditions.time;
            }
            window.renderScenes();
          });
        });

        contentEl.querySelectorAll(".opt-cond-time-min").forEach((inp) => {
          inp.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            if (scene.options[idx].conditions.time)
              scene.options[idx].conditions.time.minHour =
                parseInt(e.target.value, 10) || 0;
          });
        });

        contentEl.querySelectorAll(".opt-cond-time-max").forEach((inp) => {
          inp.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            if (scene.options[idx].conditions.time)
              scene.options[idx].conditions.time.maxHour =
                parseInt(e.target.value, 10) || 0;
          });
        });

        contentEl.querySelectorAll(".opt-pass-time").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const val = parseInt(e.target.value, 10);
            scene.options[idx].passTime = isNaN(val) ? "" : val;
          });
        });

        contentEl.querySelectorAll(".opt-effect-prob").forEach((input) => {
          input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            const val = parseInt(e.target.value, 10);
            scene.options[idx].effectProbability = isNaN(val)
              ? 100
              : Math.max(0, Math.min(100, val));
          });
        });

        contentEl.querySelectorAll(".opt-enable-cond-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            scene.options[idx].enableCondition = e.target.checked;
            window.renderScenes();
          });
        });

        contentEl.querySelectorAll(".opt-del").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const idx = e.currentTarget.getAttribute("data-idx");
            scene.options.splice(idx, 1);
            window.renderScenes();
          });
        });

        contentEl
          .querySelector(".add-opt-btn")
          .addEventListener("click", () => {
            scene.options.push({
              text: "",
              targetSceneId: "",
              variableId: "",
              variableVal: "",
              itemAction: "",
              itemId: "",
              itemVal: 1,
              passTime: "",
              effectProbability: 100,
              enableCondition: false,
              conditions: { variables: {}, items: {} },
            });
            window.renderScenes();
          });

        sceneEl.appendChild(contentEl);
      }
      sceneList.appendChild(sceneEl);
    });

    groupContainer.appendChild(sceneList);
    container.appendChild(groupContainer);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML = `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的場景。
      </div>
    `;
  }
};

function addNewScene(chapterId = "") {
  window.projectData.scenes.push({
    id: "scene_" + Date.now(),
    name: "新場景",
    chapterId: chapterId,
    npcId: "",
    skipIfNpcMissing: false,
    bgUrl: "",
    bgmUrl: "",
    transition: "fade",
    spriteUrl: "",
    cgVideoUrl: "",
    isEnding: false,
    endingName: "",
    randomWeight: 1,
    timeLimit: 0,
    timeOutSceneId: "",
    text: "",
    options: [],
    isExpanded: true,
  });
  window.renderScenes();
}

function moveSceneOrder(sceneId, direction, chapterId) {
  const scenes = window.projectData.scenes;
  if (!scenes) return;

  // 取得同一章節群組的場景來計算相對位置
  const groupScenes = scenes.filter((s) => s.chapterId === chapterId);
  const indexInGroup = groupScenes.findIndex((s) => s.id === sceneId);

  if (indexInGroup === -1) return;

  const targetIndexInGroup = indexInGroup + direction;
  if (targetIndexInGroup < 0 || targetIndexInGroup >= groupScenes.length)
    return;

  const scene1 = groupScenes[indexInGroup];
  const scene2 = groupScenes[targetIndexInGroup];

  // 在全域陣列中實際交換
  const index1 = scenes.findIndex((s) => s.id === scene1.id);
  const index2 = scenes.findIndex((s) => s.id === scene2.id);

  const temp = scenes[index1];
  scenes[index1] = scenes[index2];
  scenes[index2] = temp;

  window.renderScenes();
}

function duplicateScene(sceneId) {
  const scenes = window.projectData.scenes;
  const index = scenes.findIndex((s) => s.id === sceneId);
  if (index === -1) return;

  const originalScene = scenes[index];
  const newScene = JSON.parse(JSON.stringify(originalScene)); // 深拷貝
  newScene.id = "scene_" + Date.now();
  newScene.name = originalScene.name + " (複製)";

  // 插入在原本的場景後方
  scenes.splice(index + 1, 0, newScene);
  window.renderScenes();
}
