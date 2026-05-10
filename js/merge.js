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

  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const selectFilesBtn = document.getElementById("select-files-btn");
  const clearFilesBtn = document.getElementById("clear-files-btn");
  const fileListContainer = document.getElementById("file-list");
  const emptyState = document.getElementById("empty-state");
  const executeMergeBtn = document.getElementById("execute-merge-btn");

  let projectFiles = [];

  // 綁定檔案選擇
  selectFilesBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
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
  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (file.name.endsWith(".json")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.projectInfo) {
              projectFiles.push({
                id:
                  "file_" +
                  Date.now() +
                  Math.random().toString(36).substr(2, 9),
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
        };
        reader.readAsText(file);
      }
    });
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
  function mergeProjects() {
    if (projectFiles.length === 0) return null;

    const conflicts = []; // 儲存衝突紀錄
    let conflictChapterId = null;

    function getConflictChapterId(mergedData) {
      if (!conflictChapterId) {
        conflictChapterId = "chapter_conflict_" + Date.now();
        mergedData.chapters.push({
          id: conflictChapterId,
          name: "⚠️ 衝突保留區 (合併產出)",
          coverUrl: "",
          bgmUrl: "",
          description:
            "此章節包含了合併時發生 ID 衝突而保留的備份場景。這些場景已被重新分配 ID，且原有的選項跳轉可能已失效，請自行確認與修正。",
          isExpanded: false,
        });
      }
      return conflictChapterId;
    }

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
    function mergeArrays(baseArray, newArray, typeName, fileName, mergedData) {
      const existingIds = new Set(baseArray.map((item) => item.id));
      newArray.forEach((item) => {
        if (!existingIds.has(item.id)) {
          baseArray.push(item);
          existingIds.add(item.id);
        } else {
          // 處理 ID 衝突：修改 ID 並保留
          const newId =
            item.id + "_conflict_" + Math.random().toString(36).substr(2, 5);
          const oldName = item.name || item.term || item.question || "未命名";
          const newName = oldName + " (衝突備份)";

          conflicts.push({
            type: typeName,
            id: item.id,
            newId: newId,
            name: newName,
            source: fileName,
          });

          const conflictItem = JSON.parse(JSON.stringify(item));
          conflictItem.id = newId;

          if (conflictItem.name !== undefined) conflictItem.name = newName;
          else if (conflictItem.term !== undefined) conflictItem.term = newName;
          else if (conflictItem.question !== undefined)
            conflictItem.question = newName;

          // 若為場景，將其集中放入衝突保留區章節
          if (typeName === "場景") {
            conflictItem.chapterId = getConflictChapterId(mergedData);
          }

          baseArray.push(conflictItem);
          existingIds.add(newId);
        }
      });
    }

    // 3. 遍歷其餘所有的上傳專案，將其陣列內容追加至基底專案中
    for (let i = 1; i < projectFiles.length; i++) {
      const currentData = projectFiles[i].data;
      const fileName = projectFiles[i].name;
      arrayKeys.forEach((k) => {
        if (currentData[k] && Array.isArray(currentData[k])) {
          mergeArrays(
            mergedData[k],
            currentData[k],
            typeNames[k],
            fileName,
            mergedData,
          );
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

  // 執行合併並檢視報告
  executeMergeBtn.addEventListener("click", () => {
    const result = mergeProjects();
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
        .map(
          (c) =>
            `<li>[${c.type}] <strong class="text-red-200">${c.name}</strong> <span class="text-xs text-red-400/70">(原 ID: ${c.id} &rarr; 新 ID: ${c.newId})</span> - 來自 <span class="italic text-red-200">${c.source}</span></li>`,
        )
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

  document
    .getElementById("report-download-btn")
    .addEventListener("click", () => {
      const mergedData = window.currentMergedData;
      if (!mergedData) return;

      const dataStr = JSON.stringify(mergedData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mergedData.projectInfo.title + ".json";
      a.click();
      URL.revokeObjectURL(url);
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
