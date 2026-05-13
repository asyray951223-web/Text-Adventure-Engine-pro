// 負責處理多個專案檔案的讀取、排序與資料陣列的合併機制

document.addEventListener("DOMContentLoaded", () => {
  // --- 全域點擊水波紋特效 ---
  if (!document.getElementById("ripple-style")) {
    const rippleStyle = document.createElement("style");
    rippleStyle.id = "ripple-style";
    rippleStyle.innerHTML = `
      .click-ripple {
        position: fixed;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: ripple-animation 0.6s ease-out forwards;
        z-index: 99999;
      }
      @keyframes ripple-animation {
        0% { width: 0px; height: 0px; opacity: 0.8; border: 2px solid currentColor; background: currentColor; box-shadow: 0 0 10px currentColor; }
        100% { width: 100px; height: 100px; opacity: 0; border: 2px solid currentColor; background: transparent; box-shadow: 0 0 20px currentColor; }
      }
    `;
    document.head.appendChild(rippleStyle);

    document.addEventListener("mousedown", (e) => {
      const ripple = document.createElement("div");
      ripple.className = "click-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      ripple.style.color = "rgba(249, 115, 22, 0.6)"; // 合併工具預設橘色
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // --- 動態注入自訂捲軸 (Scrollbar) 樣式 ---
  if (!document.getElementById("custom-scrollbar-style")) {
    const scrollbarStyle = document.createElement("style");
    scrollbarStyle.id = "custom-scrollbar-style";
    scrollbarStyle.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(17, 24, 39, 0.4); /* 極暗背景 */
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(75, 85, 99, 0.8); /* 捲軸本體 */
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(249, 115, 22, 0.8); /* 懸停時變為橘色發光感 */
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(75, 85, 99, 0.8) transparent;
      }
    `;
    document.head.appendChild(scrollbarStyle);
  }

  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const selectFilesBtn = document.getElementById("select-files-btn");
  const clearFilesBtn = document.getElementById("clear-files-btn");
  const fileListContainer = document.getElementById("file-list");
  const emptyState = document.getElementById("empty-state");
  const executeMergeBtn = document.getElementById("execute-merge-btn");
  const mergeSelectionModal = document.getElementById("merge-selection-modal");
  const closeSelectionBtn = document.getElementById("close-selection-btn");
  const confirmMergeBtn = document.getElementById("confirm-merge-btn");
  const mergeCategoriesContainer = document.getElementById(
    "merge-categories-container",
  );

  let projectFiles = [];

  // 綁定檔案選擇
  selectFilesBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    await handleFiles(e.target.files);
    e.target.value = "";
  });

  // 綁定清空清單
  clearFilesBtn.addEventListener("click", () => {
    if (confirm("確定要清空目前已選擇的所有專案檔案嗎？")) {
      projectFiles = [];
      renderFileList();
    }
  });

  // 拖曳上傳特效
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-orange-500", "bg-gray-800/80");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-orange-500", "bg-gray-800/80");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-orange-500", "bg-gray-800/80");
    handleFiles(e.dataTransfer.files);
  });

  // 輔助函式：檔案大小格式化
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // 讀取檔案
  async function handleFiles(files) {
    for (let file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(file);
          const jsonFileName = Object.keys(zipContent.files).find((name) =>
            name.endsWith("project.json"),
          );
          if (jsonFileName) {
            const jsonStr = await zipContent.file(jsonFileName).async("string");
            const data = JSON.parse(jsonStr);
            if (data.projectInfo) {
              projectFiles.push({
                id:
                  "file_" +
                  Date.now() +
                  Math.random().toString(36).substr(2, 9),
                name: file.name + " (ZIP解壓)",
                size: file.size,
                data: data,
              });
              renderFileList();
            } else {
              alert(
                `ZIP 檔案 ${file.name} 內的 JSON 不是有效的文字冒險專案格式。`,
              );
            }
          } else {
            alert(`檔案 ${file.name} 內找不到 project.json。`);
          }
        } catch (err) {
          alert(`檔案 ${file.name} ZIP 解析失敗。`);
        }
      } else if (file.name.toLowerCase().endsWith(".json")) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.projectInfo) {
            projectFiles.push({
              id:
                "file_" + Date.now() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              data: data,
            });
            renderFileList();
          } else {
            alert(`檔案 ${file.name} 不是有效的文字冒險專案格式。`);
          }
        } catch (err) {
          alert(`檔案 ${file.name} 讀取或解析失敗。`);
        }
      }
    }
  }

  // 渲染待合併清單
  function renderFileList() {
    fileListContainer.innerHTML = "";
    if (projectFiles.length === 0) {
      fileListContainer.appendChild(emptyState);
      executeMergeBtn.disabled = true;
      executeMergeBtn.classList.add("opacity-50", "cursor-not-allowed");
      clearFilesBtn.classList.add("hidden");
      clearFilesBtn.classList.remove("inline-flex");
      return;
    }

    clearFilesBtn.classList.remove("hidden");
    clearFilesBtn.classList.add("inline-flex");
    executeMergeBtn.disabled = false;
    executeMergeBtn.classList.remove("opacity-50", "cursor-not-allowed");

    projectFiles.forEach((fileObj, index) => {
      const el = document.createElement("div");
      el.className =
        "flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-sm";

      const badge =
        index === 0
          ? `<span class="bg-orange-900/50 text-orange-400 text-xs px-2 py-1 rounded border border-orange-700/50 ml-3 shadow-inner whitespace-nowrap">主專案基底</span>`
          : "";

      const sizeStr = fileObj.size ? formatBytes(fileObj.size) : "未知大小";

      el.innerHTML = `
        <div class="flex items-center flex-1 min-w-0">
          <div class="flex flex-col space-y-1 mr-4 shrink-0">
             <button class="move-up-btn text-gray-500 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed" ${index === 0 ? "disabled" : ""} title="往上移">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
             </button>
             <button class="move-down-btn text-gray-500 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed" ${index === projectFiles.length - 1 ? "disabled" : ""} title="往下移">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
             </button>
          </div>
          <div class="truncate">
            <h3 class="font-bold text-gray-200 text-lg flex items-center truncate pr-2">
              <span class="truncate">${fileObj.data.projectInfo.title || "未命名專案"}</span> ${badge}
            </h3>
            <p class="text-sm text-gray-400 truncate mt-1 flex items-center">
              來源檔案: ${fileObj.name} <span class="ml-2 pl-2 border-l border-gray-600 text-gray-500">${sizeStr}</span>
            </p>
          </div>
        </div>
        <button class="delete-btn text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 p-2 rounded transition ml-4 shrink-0 shadow-sm border border-gray-600" title="移除">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;

      el.querySelector(".delete-btn").addEventListener("click", () => {
        projectFiles = projectFiles.filter((f) => f.id !== fileObj.id);
        renderFileList();
      });

      const upBtn = el.querySelector(".move-up-btn");
      if (upBtn && index > 0) {
        upBtn.addEventListener("click", () => {
          const temp = projectFiles[index];
          projectFiles[index] = projectFiles[index - 1];
          projectFiles[index - 1] = temp;
          renderFileList();
        });
      }

      const downBtn = el.querySelector(".move-down-btn");
      if (downBtn && index < projectFiles.length - 1) {
        downBtn.addEventListener("click", () => {
          const temp = projectFiles[index];
          projectFiles[index] = projectFiles[index + 1];
          projectFiles[index + 1] = temp;
          renderFileList();
        });
      }

      fileListContainer.appendChild(el);
    });
  }

  // 合併邏輯機制
  function mergeProjects(selectedMergeIds) {
    if (projectFiles.length === 0) return null;

    const conflicts = []; // 儲存衝突紀錄

    // 1. 基底專案 (深拷貝，避免修改原始檔案資料)
    const mergedData = JSON.parse(JSON.stringify(projectFiles[0].data));

    // 保證存在核心陣列，以免後續操作報錯
    const arrayKeys = [
      "chapters",
      "items",
      "npcs",
      "triggers",
      "scenes",
      "globalVariables",
      "achievements",
      "dictionary",
      "shops",
      "quizzes",
    ];
    arrayKeys.forEach((k) => {
      if (!mergedData[k]) mergedData[k] = [];
    });

    const typeNames = {
      chapters: "章節",
      items: "道具",
      npcs: "角色",
      triggers: "觸發器",
      scenes: "場景",
      globalVariables: "變數",
      achievements: "成就",
      dictionary: "辭條",
      shops: "商店",
      quizzes: "測驗",
    };

    // 2. 輔助函式: 合併陣列並處理衝突 (重新命名與賦予新 ID)
    function mergeArrays(
      baseArray,
      newArray,
      typeName,
      fileName,
      idMapping,
      selectedIdsForCategory,
    ) {
      const existingIds = new Set(baseArray.map((item) => item.id));
      const addedItems = [];
      newArray.forEach((item) => {
        let finalItem = JSON.parse(JSON.stringify(item));

        if (existingIds.has(finalItem.id)) {
          if (
            selectedIdsForCategory &&
            selectedIdsForCategory.has(finalItem.id)
          ) {
            // 尋找主專案中的原始項目以比對名稱
            const baseItem = baseArray.find((i) => i.id === finalItem.id);
            const baseName = baseItem
              ? baseItem.name || baseItem.term || baseItem.question || "未命名"
              : "未命名";
            const newName =
              finalItem.name ||
              finalItem.term ||
              finalItem.question ||
              "未命名";

            let statusMsg = "已合併";
            if (baseName !== newName) {
              statusMsg = "已合併 (名稱不一致警告)";
            }

            // 合併模式：發生 ID 衝突時直接略過不加入，視為使用主專案的版本
            conflicts.push({
              type: typeName,
              id: finalItem.id,
              newId: finalItem.id,
              name: newName,
              baseName: baseName, // 記錄主專案原名供報告顯示
              source: fileName,
              status: statusMsg,
            });
            return; // 略過加入陣列
          } else {
            // 處理 ID 衝突：修改 ID 並保留
            const newId =
              finalItem.id +
              "_conflict_" +
              Math.random().toString(36).substr(2, 5);
            const oldName =
              finalItem.name ||
              finalItem.term ||
              finalItem.question ||
              "未命名";
            const newName = oldName + " (衝突備份)";

            conflicts.push({
              type: typeName,
              id: finalItem.id,
              newId: newId,
              name: newName,
              source: fileName,
              status: "已建立備份",
            });

            idMapping[finalItem.id] = newId;
            finalItem.id = newId;

            if (finalItem.name !== undefined) finalItem.name = newName;
            else if (finalItem.term !== undefined) finalItem.term = newName;
            else if (finalItem.question !== undefined)
              finalItem.question = newName;
          }
        }

        baseArray.push(finalItem);
        addedItems.push(finalItem);
        existingIds.add(finalItem.id);
      });
      return addedItems;
    }

    // 3. 遍歷其餘所有的上傳專案，將其陣列內容追加至基底專案中
    for (let i = 1; i < projectFiles.length; i++) {
      const currentData = projectFiles[i].data;
      const fileName = projectFiles[i].name;
      const idMapping = {}; // 針對單一專案的 ID 映射表，處理章節 ID 變更時場景可以對應
      const newlyAddedItems = [];

      arrayKeys.forEach((k) => {
        if (currentData[k] && Array.isArray(currentData[k])) {
          const added = mergeArrays(
            mergedData[k],
            currentData[k],
            typeNames[k],
            fileName,
            idMapping,
            selectedMergeIds ? selectedMergeIds[k] : null,
          );
          newlyAddedItems.push(...added);
        }
      });

      // 第二階段：修正由於 ID 衝突而需要更新的各種跳轉與關聯
      function getMappedId(originalId) {
        if (!originalId) return originalId;
        if (idMapping[originalId]) return idMapping[originalId];

        // 處理動態特殊前綴跳轉 (例如開啟商店或測驗)
        if (originalId.startsWith("__SHOP__")) {
          const sid = originalId.replace("__SHOP__", "");
          if (idMapping[sid]) return "__SHOP__" + idMapping[sid];
        }
        if (originalId.startsWith("__QUIZ__")) {
          const qid = originalId.replace("__QUIZ__", "");
          if (idMapping[qid]) return "__QUIZ__" + idMapping[qid];
        }
        if (originalId.startsWith("__RANDOM_IN_CHAP__")) {
          const cid = originalId.replace("__RANDOM_IN_CHAP__", "");
          if (idMapping[cid]) return "__RANDOM_IN_CHAP__" + idMapping[cid];
        }
        return originalId;
      }

      newlyAddedItems.forEach((item) => {
        // 修正基本單一 ID 跳轉與關聯
        if (item.chapterId) item.chapterId = getMappedId(item.chapterId);
        if (item.timeOutSceneId)
          item.timeOutSceneId = getMappedId(item.timeOutSceneId);
        if (item.targetSceneId)
          item.targetSceneId = getMappedId(item.targetSceneId);
        if (item.variableId) item.variableId = getMappedId(item.variableId);
        if (item.targetItemId)
          item.targetItemId = getMappedId(item.targetItemId);
        if (item.sellVariableId)
          item.sellVariableId = getMappedId(item.sellVariableId);
        if (item.boundVariableId)
          item.boundVariableId = getMappedId(item.boundVariableId);
        if (item.successSceneId)
          item.successSceneId = getMappedId(item.successSceneId);
        if (item.failureSceneId)
          item.failureSceneId = getMappedId(item.failureSceneId);

        // 修正場景選項
        if (item.options && Array.isArray(item.options)) {
          item.options.forEach((opt) => {
            if (opt.targetSceneId)
              opt.targetSceneId = getMappedId(opt.targetSceneId);
            if (opt.variableId) opt.variableId = getMappedId(opt.variableId);
            if (opt.itemId) opt.itemId = getMappedId(opt.itemId);
            if (opt.targetItemId)
              opt.targetItemId = getMappedId(opt.targetItemId);

            // 修正選項條件
            if (opt.conditions) {
              if (opt.conditions.variables) {
                Object.keys(opt.conditions.variables).forEach((vId) => {
                  if (idMapping[vId]) {
                    opt.conditions.variables[idMapping[vId]] =
                      opt.conditions.variables[vId];
                    delete opt.conditions.variables[vId];
                  }
                });
              }
              if (opt.conditions.items) {
                Object.keys(opt.conditions.items).forEach((iId) => {
                  if (idMapping[iId]) {
                    opt.conditions.items[idMapping[iId]] =
                      opt.conditions.items[iId];
                    delete opt.conditions.items[iId];
                  }
                });
              }
            }
          });
        }

        // 修正全域條件 (適用於場景, 道具, 觸發器, NPC, 成就, 辭典等)
        if (item.conditions) {
          if (item.conditions.variables) {
            Object.keys(item.conditions.variables).forEach((vId) => {
              if (idMapping[vId]) {
                item.conditions.variables[idMapping[vId]] =
                  item.conditions.variables[vId];
                delete item.conditions.variables[vId];
              }
            });
          }
          if (item.conditions.items) {
            Object.keys(item.conditions.items).forEach((iId) => {
              if (idMapping[iId]) {
                item.conditions.items[idMapping[iId]] =
                  item.conditions.items[iId];
                delete item.conditions.items[iId];
              }
            });
          }
          if (item.conditions.chapter) {
            item.conditions.chapter = getMappedId(item.conditions.chapter);
          }
        }

        // 修正商店內販售的商品 ID 與花費變數 ID
        if (item.goods && Array.isArray(item.goods)) {
          item.goods.forEach((good) => {
            if (good.itemId) good.itemId = getMappedId(good.itemId);
            if (good.costVariableId)
              good.costVariableId = getMappedId(good.costVariableId);
          });
        }
      });
    }

    // 4. 更新合併後的專案後設資訊
    mergedData.projectId = "proj_" + Date.now();
    mergedData.projectInfo.lastSaved = new Date().toLocaleString("zh-TW");

    // 檢查是否有重複的專案名稱，若有則自動遞增版本號
    let baseTitle =
      (mergedData.projectInfo.title || "未命名專案") + " (合併版)";
    let newTitle = baseTitle;
    let existingProjects =
      JSON.parse(localStorage.getItem("textAdventureProjectsList")) || [];
    let versionCounter = 1;
    while (
      existingProjects.some(
        (p) => p.projectInfo && p.projectInfo.title === newTitle,
      )
    ) {
      versionCounter++;
      newTitle = `${baseTitle} v${versionCounter}`;
    }
    mergedData.projectInfo.title = newTitle;

    return { data: mergedData, conflicts };
  }

  // 開啟選擇合併內容 Modal
  executeMergeBtn.addEventListener("click", () => {
    if (projectFiles.length < 2) {
      alert("請至少選擇兩個以上的專案檔案來進行合併！");
      return;
    }

    const sharedKeys = [
      "globalVariables",
      "items",
      "npcs",
      "dictionary",
      "achievements",
      "triggers",
      "shops",
      "quizzes",
    ];

    const typeNames = {
      globalVariables: "變數",
      items: "道具",
      npcs: "角色",
      triggers: "觸發器",
      achievements: "成就",
      dictionary: "辭條",
      shops: "商店",
      quizzes: "測驗",
    };

    const baseData = projectFiles[0].data;
    const conflictsMap = {};
    sharedKeys.forEach((k) => (conflictsMap[k] = new Map()));

    // 預先計算衝突項目
    for (let i = 1; i < projectFiles.length; i++) {
      const currentData = projectFiles[i].data;
      sharedKeys.forEach((k) => {
        if (!baseData[k]) baseData[k] = [];
        const baseIds = new Set(baseData[k].map((item) => item.id));

        if (currentData[k] && Array.isArray(currentData[k])) {
          currentData[k].forEach((item) => {
            if (baseIds.has(item.id)) {
              const baseItem = baseData[k].find((x) => x.id === item.id);
              const baseName = baseItem
                ? baseItem.name ||
                  baseItem.term ||
                  baseItem.question ||
                  "未命名"
                : "未命名";
              const newName =
                item.name || item.term || item.question || "未命名";

              if (!conflictsMap[k].has(item.id)) {
                conflictsMap[k].set(item.id, {
                  id: item.id,
                  baseName: baseName,
                  newName: newName,
                });
              }
            }
          });
        }
      });
    }

    let hasAnyConflict = false;
    mergeCategoriesContainer.innerHTML = sharedKeys
      .map((k) => {
        const conflicts = Array.from(conflictsMap[k].values());
        if (conflicts.length === 0) return "";
        hasAnyConflict = true;

        const itemsHtml = conflicts
          .map(
            (c) => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded transition border-b border-gray-700/50 last:border-0">
          <label class="flex items-center cursor-pointer text-sm w-full">
            <input type="checkbox" class="merge-item-chk w-4 h-4 text-orange-500 bg-gray-900 border-gray-600 rounded focus:ring-orange-500 mr-3 shrink-0" data-category="${k}" value="${c.id}" checked>
            <div class="flex flex-col flex-1 min-w-0 pr-2">
              <span class="text-gray-200 font-bold truncate">${c.newName} <span class="text-xs text-gray-500 ml-1 font-mono">(${c.id})</span></span>
              ${c.baseName !== c.newName ? `<span class="text-xs text-amber-500 mt-0.5 truncate">⚠️ 主專案原名為: ${c.baseName}</span>` : ""}
            </div>
          </label>
        </div>
      `,
          )
          .join("");

        return `
        <div class="col-span-full bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-shrink-0 shadow-sm">
          <div class="p-3 bg-gray-700/50 font-bold text-orange-400 flex justify-between items-center cursor-pointer hover:bg-gray-600 transition" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <span class="flex items-center"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg> ${typeNames[k]} (${conflicts.length} 個衝突)</span>
            <span class="text-xs text-gray-400 font-normal hover:text-white transition">點擊展開/收合</span>
          </div>
          <div class="p-2 space-y-1">
            ${itemsHtml}
          </div>
        </div>
      `;
      })
      .join("");

    if (!hasAnyConflict) {
      mergeCategoriesContainer.innerHTML = `<div class="col-span-full text-center text-gray-400 py-6">太棒了！目前的專案沒有發現任何共用元素的 ID 衝突。您可以直接點擊下方按鈕執行合併。</div>`;
    }

    mergeSelectionModal.classList.remove("hidden");
    mergeSelectionModal.classList.add("flex");
    setTimeout(() => {
      mergeSelectionModal.classList.remove("opacity-0");
      mergeSelectionModal.classList.add("opacity-100");
      document
        .getElementById("merge-selection-panel")
        .classList.remove("scale-95", "translate-y-4");
      document
        .getElementById("merge-selection-panel")
        .classList.add("scale-100", "translate-y-0");
    }, 10);
  });

  // 執行合併並檢視報告
  confirmMergeBtn.addEventListener("click", () => {
    const selectedMergeIds = {};
    const sharedKeys = [
      "globalVariables",
      "items",
      "npcs",
      "dictionary",
      "achievements",
      "triggers",
      "shops",
      "quizzes",
    ];
    sharedKeys.forEach((k) => (selectedMergeIds[k] = new Set()));

    document.querySelectorAll(".merge-item-chk:checked").forEach((chk) => {
      const category = chk.getAttribute("data-category");
      selectedMergeIds[category].add(chk.value);
    });

    closeSelectionBtn.click();

    const result = mergeProjects(selectedMergeIds);
    if (!result) return;

    const mergedData = result.data;
    const conflicts = result.conflicts;

    window.currentMergedData = mergedData;

    document.getElementById("report-file-count").textContent =
      projectFiles.length;
    document.getElementById("report-chapters").textContent =
      mergedData.chapters.length;
    document.getElementById("report-scenes").textContent =
      mergedData.scenes.length;
    document.getElementById("report-vars").textContent =
      mergedData.globalVariables.length;
    document.getElementById("report-items").textContent =
      mergedData.items.length;
    document.getElementById("report-npcs").textContent = mergedData.npcs.length;
    document.getElementById("report-triggers").textContent =
      mergedData.triggers.length;
    document.getElementById("report-achievements").textContent =
      mergedData.achievements.length;
    document.getElementById("report-dictionary").textContent =
      mergedData.dictionary.length;
    document.getElementById("report-shops").textContent =
      mergedData.shops.length;

    const conflictsContainer = document.getElementById(
      "report-conflicts-container",
    );
    const conflictsList = document.getElementById("report-conflicts-list");
    if (conflicts.length > 0) {
      conflictsContainer.classList.remove("hidden");
      conflictsList.innerHTML = conflicts
        .map((c) => {
          if (c.status === "已合併") {
            return `<li>[<span class="text-green-300">${c.type}</span>] <strong>${c.name}</strong> <span class="text-xs text-green-400/70">(ID: ${c.id} 發生衝突，已自動合併)</span> - 來自 <span class="italic text-green-200">${c.source}</span></li>`;
          } else if (c.status === "已合併 (名稱不一致警告)") {
            return `<li>[<span class="text-amber-300">${c.type}</span>] <strong>${c.name}</strong> <span class="text-xs text-amber-400/70">(ID: ${c.id} 發生衝突，已合併但名稱與主專案的「${c.baseName}」不同！)</span> - 來自 <span class="italic text-amber-200">${c.source}</span></li>`;
          } else {
            return `<li>[<span class="text-red-300">${c.type}</span>] <strong class="text-red-200">${c.name}</strong> <span class="text-xs text-red-400/70">(原 ID: ${c.id} &rarr; 新 ID: ${c.newId})</span> - 來自 <span class="italic text-red-200">${c.source}</span></li>`;
          }
        })
        .join("");
    } else {
      conflictsContainer.classList.add("hidden");
      conflictsList.innerHTML = "";
    }

    const modal = document.getElementById("report-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    setTimeout(() => {
      modal.classList.remove("opacity-0");
      modal.classList.add("opacity-100");
      document
        .getElementById("report-panel")
        .classList.remove("scale-95", "translate-y-4");
      document
        .getElementById("report-panel")
        .classList.add("scale-100", "translate-y-0");
    }, 10);
  });

  closeSelectionBtn.addEventListener("click", () => {
    mergeSelectionModal.classList.remove("opacity-100");
    mergeSelectionModal.classList.add("opacity-0");
    document
      .getElementById("merge-selection-panel")
      .classList.remove("scale-100", "translate-y-0");
    document
      .getElementById("merge-selection-panel")
      .classList.add("scale-95", "translate-y-4");
    setTimeout(() => {
      mergeSelectionModal.classList.remove("flex");
      mergeSelectionModal.classList.add("hidden");
    }, 300);
  });

  document
    .getElementById("report-download-btn")
    .addEventListener("click", () => {
      const mergedData = window.currentMergedData;
      if (!mergedData) return;

      const dataStr = JSON.stringify(mergedData, null, 2);
      const zip = new JSZip();
      const projectName = mergedData.projectInfo.title || "MergedProject";
      const folder = zip.folder(projectName);
      folder.file("project.json", dataStr);

      zip
        .generateAsync({ type: "blob", compression: "DEFLATE" })
        .then(function (content) {
          const url = URL.createObjectURL(content);
          const a = document.createElement("a");
          a.href = url;
          a.download = projectName + ".zip";
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch((err) => {
          console.error("ZIP 打包失敗：", err);
          alert("ZIP 打包失敗！");
        });
    });

  document.getElementById("report-edit-btn").addEventListener("click", () => {
    const mergedData = window.currentMergedData;
    if (!mergedData) return;

    try {
      // 存入當前編輯狀態
      localStorage.setItem("textAdventureProject", JSON.stringify(mergedData));

      // 更新保存至多專案清單庫
      let projects =
        JSON.parse(localStorage.getItem("textAdventureProjectsList")) || [];
      projects.push(mergedData);
      localStorage.setItem(
        "textAdventureProjectsList",
        JSON.stringify(projects),
      );

      alert("專案合併成功！即將進入編輯器...");
      window.location.href = "editor.html";
    } catch (e) {
      if (
        e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        alert(
          "⚠️ 合併失敗：合併後的專案資料過大，瀏覽器儲存空間已滿！\n請先使用「下載報告與 JSON」將專案下載至電腦，或回到大廳刪除舊專案騰出空間。",
        );
      } else {
        alert("⚠️ 合併存檔發生錯誤：" + e.message);
      }
    }
  });

  document.getElementById("close-report-btn").addEventListener("click", () => {
    const modal = document.getElementById("report-modal");
    modal.classList.remove("opacity-100");
    modal.classList.add("opacity-0");
    document
      .getElementById("report-panel")
      .classList.remove("scale-100", "translate-y-0");
    document
      .getElementById("report-panel")
      .classList.add("scale-95", "translate-y-4");
    setTimeout(() => {
      modal.classList.remove("flex");
      modal.classList.add("hidden");
    }, 300);
  });
});
