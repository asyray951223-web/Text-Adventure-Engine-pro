// 負責管理與渲染「場景編輯」頁面邏輯

window.renderScenes = function () {
  const container = document.getElementById("scenes-container");
  const addBtn = document.getElementById("add-scene-btn");
  const collapseBtn = document.getElementById("collapse-all-scene-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", () => addNewScene(""));

  if (collapseBtn) {
    const newCollapseBtn = collapseBtn.cloneNode(true);
    collapseBtn.parentNode.replaceChild(newCollapseBtn, collapseBtn);
    newCollapseBtn.addEventListener("click", () => {
      if (window.projectData.scenes) {
        window.projectData.scenes.forEach((s) => (s.isExpanded = false));
        window.renderScenes();
      }
    });
  }

  // --- 批次匯入按鈕與 Modal ---
  let importBtn = document.getElementById("import-scenes-btn");
  if (!importBtn) {
    importBtn = document.createElement("button");
    importBtn.id = "import-scenes-btn";
    importBtn.className =
      "bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition ml-2 flex items-center whitespace-nowrap";
    importBtn.innerHTML = `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> 批次匯入 (Excel)`;
    newAddBtn.parentNode.insertBefore(importBtn, newAddBtn.nextSibling);

    // 移除舊的 Modal，避免切換分頁時重複注入導致 ID 衝突與事件綁定失效
    let existingModal = document.getElementById("scene-import-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "scene-import-modal";
    modal.className =
      "fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    modal.innerHTML = `
      <div class="bg-white w-11/12 max-w-4xl h-5/6 rounded-2xl border border-gray-300 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300 relative">
        <div class="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 class="text-2xl font-extrabold text-gray-800 flex items-center">
            <svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            批次匯入場景 (從 Excel 貼上)
          </h2>
          <button id="close-import-modal-btn" class="text-gray-400 hover:text-gray-600 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 flex flex-col space-y-4 bg-gray-50">
          <div class="text-sm text-gray-600 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p class="font-bold text-blue-800 mb-2">使用說明：</p>
            <ol class="list-decimal pl-5 space-y-1">
              <li>在 Excel 或 Google Sheets 中建立三個欄位：<strong>場景名稱</strong>、<strong>所屬章節 ID</strong> (選填)、<strong>場景文本</strong>。</li>
              <li>選取多行資料並複製 (Ctrl+C)。</li>
              <li>在下方文字框中貼上 (Ctrl+V)。</li>
              <li>點擊「開始匯入」，系統會自動為這些場景建立新的 ID 並加入專案中。</li>
            </ol>
            <p class="mt-2 text-xs text-blue-500 font-bold">※ 注意：為確保編輯器效能，批次匯入後的場景預設會是「收合」狀態。</p>
          </div>
          <textarea id="import-tsv-input" class="w-full flex-1 border border-gray-300 rounded-lg p-4 font-mono text-sm focus:ring-green-500 focus:border-green-500 whitespace-pre custom-scrollbar" placeholder="請在此貼上 Excel 複製的資料..."></textarea>
        </div>
        <div class="p-6 border-t border-gray-200 flex justify-end">
          <button id="do-import-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition">
            開始匯入
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector("#close-import-modal-btn");
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("opacity-100");
      modal.classList.add("opacity-0");
      setTimeout(() => {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
      }, 300);
    });

    const doImportBtn = modal.querySelector("#do-import-btn");
    doImportBtn.addEventListener("click", () => {
      const input = modal.querySelector("#import-tsv-input").value;
      if (!input.trim()) {
        alert("請先貼上資料！");
        return;
      }

      function parseTSV(tsv) {
        let rows = [];
        let cols = [];
        let currentVal = "";
        let inQuotes = false;

        for (let i = 0; i < tsv.length; i++) {
          let char = tsv[i];
          let nextChar = tsv[i + 1];

          if (inQuotes) {
            if (char === '"') {
              if (nextChar === '"') {
                currentVal += '"';
                i++;
              } else {
                inQuotes = false;
              }
            } else {
              currentVal += char;
            }
          } else {
            if (char === '"' && currentVal === "") {
              inQuotes = true;
            } else if (char === "\t") {
              cols.push(currentVal);
              currentVal = "";
            } else if (char === "\n") {
              cols.push(currentVal);
              rows.push(cols);
              cols = [];
              currentVal = "";
            } else if (char === "\r") {
              // skip
            } else {
              currentVal += char;
            }
          }
        }
        if (currentVal !== "" || cols.length > 0) {
          cols.push(currentVal);
          rows.push(cols);
        }
        return rows;
      }

      const rows = parseTSV(input);
      let importCount = 0;

      rows.forEach((cols) => {
        if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) return;

        let name = "新場景";
        let chapterId = "";
        let text = "";

        if (cols.length === 1) {
          text = cols[0].trim();
        } else if (cols.length === 2) {
          name = cols[0].trim() || "新場景";
          text = cols[1].trim();
        } else if (cols.length >= 3) {
          name = cols[0].trim() || "新場景";
          chapterId = cols[1].trim();
          text = cols.slice(2).join("\t").trim();
        }

        if (text || name !== "新場景") {
          window.projectData.scenes.push({
            id:
              "scene_" +
              Date.now() +
              "_" +
              Math.random().toString(36).substr(2, 5),
            name: name,
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
            text: text,
            options: [],
            isExpanded: false,
          });
          importCount++;
        }
      });

      if (importCount > 0) {
        alert(`已成功匯入 ${importCount} 個場景！`);
        modal.querySelector("#import-tsv-input").value = "";
        closeBtn.click();
        window.renderScenes();
      } else {
        alert("找不到有效的場景資料，請確認格式是否正確。");
      }
    });

    importBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
        modal.classList.add("opacity-100");
      }, 10);
    });
  }

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

  // 初始化批量選取的 Set
  window.selectedSceneIds = window.selectedSceneIds || new Set();
  // 清理已經不存在的 ID
  const allSceneIds = new Set(window.projectData.scenes.map((s) => s.id));
  for (let id of window.selectedSceneIds) {
    if (!allSceneIds.has(id)) window.selectedSceneIds.delete(id);
  }

  // --- 滑鼠框選 (Marquee Selection) 邏輯 ---
  if (!window.hasBoundSceneMarquee) {
    window.hasBoundSceneMarquee = true;
    let isSelecting = false;
    let selectionBox = null;
    let startX = 0;
    let startY = 0;
    let initialSelectedIds = new Set();

    document.addEventListener("mousedown", (e) => {
      const container = document.getElementById("scenes-container");
      if (!container || !container.contains(e.target)) return;

      // 必須是左鍵
      if (e.button !== 0) return;

      // 忽略互動元素
      const interactiveTags = [
        "INPUT",
        "BUTTON",
        "SELECT",
        "TEXTAREA",
        "A",
        "LABEL",
      ];
      if (interactiveTags.includes(e.target.tagName)) return;
      if (e.target.closest(".cursor-pointer, #scene-batch-bar")) return;

      isSelecting = true;
      startX = e.pageX;
      startY = e.pageY;

      // 如果沒有按住 Ctrl / Shift，則清除目前的選擇 (點擊空白處取消全選)
      if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
        window.selectedSceneIds.clear();
        container
          .querySelectorAll(".scene-select-chk")
          .forEach((chk) => (chk.checked = false));
      }
      initialSelectedIds = new Set(window.selectedSceneIds);

      selectionBox = document.createElement("div");
      selectionBox.className =
        "absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50 rounded-sm";
      selectionBox.style.left = startX + "px";
      selectionBox.style.top = startY + "px";
      selectionBox.style.width = "0px";
      selectionBox.style.height = "0px";
      document.body.appendChild(selectionBox);

      e.preventDefault(); // 防止文字反白
    });

    document.addEventListener("mousemove", (e) => {
      if (!isSelecting || !selectionBox) return;

      const container = document.getElementById("scenes-container");
      if (!container) return;

      const currentX = e.pageX;
      const currentY = e.pageY;

      selectionBox.style.left = Math.min(startX, currentX) + "px";
      selectionBox.style.top = Math.min(startY, currentY) + "px";
      selectionBox.style.width = Math.abs(currentX - startX) + "px";
      selectionBox.style.height = Math.abs(currentY - startY) + "px";

      const selectionRect = selectionBox.getBoundingClientRect();

      container.querySelectorAll(".scene-select-chk").forEach((chk) => {
        const sceneEl = chk.closest(".bg-white.border"); // 找到場景容器卡片
        if (!sceneEl) return;
        const sceneRect = sceneEl.getBoundingClientRect();

        const isIntersecting = !(
          selectionRect.right < sceneRect.left ||
          selectionRect.left > sceneRect.right ||
          selectionRect.bottom < sceneRect.top ||
          selectionRect.top > sceneRect.bottom
        );

        const sceneId = chk.getAttribute("data-id");
        if (isIntersecting) {
          window.selectedSceneIds.add(sceneId);
          chk.checked = true;
        } else {
          if (!initialSelectedIds.has(sceneId)) {
            window.selectedSceneIds.delete(sceneId);
            chk.checked = false;
          } else {
            window.selectedSceneIds.add(sceneId);
            chk.checked = true;
          }
        }
      });

      // 即時更新浮動工具列
      const bar = document.getElementById("scene-batch-bar");
      const count = document.getElementById("batch-count");
      if (bar && count) {
        if (window.selectedSceneIds.size > 0) {
          bar.classList.remove("hidden");
          bar.classList.add("flex");
          count.textContent = window.selectedSceneIds.size;
        } else {
          bar.classList.add("hidden");
          bar.classList.remove("flex");
        }
      }
    });

    document.addEventListener("mouseup", () => {
      if (isSelecting) {
        isSelecting = false;
        if (selectionBox) {
          selectionBox.remove();
          selectionBox = null;
        }
      }
    });
  }

  // 準備章節的下拉選單選項
  let chapterOptions = `<option value="">-- 不指定章節 --</option>`;
  window.projectData.chapters.forEach((ch) => {
    chapterOptions += `<option value="${ch.id}">${ch.name}</option>`;
  });

  // 建立批量操作浮動工具列
  const batchBar = document.createElement("div");
  batchBar.id = "scene-batch-bar";
  batchBar.className =
    "bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 items-center justify-between shadow-sm sticky top-2 z-40 transition-all " +
    (window.selectedSceneIds.size > 0 ? "flex" : "hidden");
  batchBar.innerHTML = `
    <div class="flex items-center space-x-4">
      <span class="font-bold text-blue-800">已選取 <span id="batch-count">${window.selectedSceneIds.size}</span> 個場景</span>
      <button id="batch-select-all-btn" class="text-sm text-blue-600 hover:text-blue-800 underline font-bold transition">全選本頁</button>
      <button id="batch-deselect-btn" class="text-sm text-gray-500 hover:text-gray-700 underline font-bold transition">取消全選</button>
    </div>
    <div class="flex items-center space-x-3">
      <select id="batch-move-select" class="border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 bg-white">
        ${chapterOptions}
      </select>
      <button id="batch-move-btn" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm transition">移動</button>
      <div class="w-px h-6 bg-blue-200 mx-1"></div>
      <button id="batch-delete-btn" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm transition flex items-center">
         <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> 批量刪除
      </button>
    </div>
  `;
  container.appendChild(batchBar);

  // 綁定批量操作事件
  batchBar
    .querySelector("#batch-select-all-btn")
    .addEventListener("click", () => {
      document
        .querySelectorAll(".scene-select-chk")
        .forEach((chk) =>
          window.selectedSceneIds.add(chk.getAttribute("data-id")),
        );
      window.renderScenes();
    });
  batchBar
    .querySelector("#batch-deselect-btn")
    .addEventListener("click", () => {
      window.selectedSceneIds.clear();
      window.renderScenes();
    });
  batchBar.querySelector("#batch-move-btn").addEventListener("click", () => {
    const sel = document.getElementById("batch-move-select").value;
    window.projectData.scenes.forEach((s) => {
      if (window.selectedSceneIds.has(s.id)) s.chapterId = sel;
    });
    window.selectedSceneIds.clear();
    window.renderScenes();
  });
  batchBar.querySelector("#batch-delete-btn").addEventListener("click", () => {
    if (
      confirm(
        `確定要刪除選取的 ${window.selectedSceneIds.size} 個場景嗎？\n此操作無法復原！`,
      )
    ) {
      const clearedCount = cleanupInvalidSceneJumps(window.selectedSceneIds);
      if (clearedCount > 0) {
        alert(
          `已自動清除 ${clearedCount} 個指向這些被刪除場景的無效跳轉設定。`,
        );
      }
      window.projectData.scenes = window.projectData.scenes.filter(
        (s) => !window.selectedSceneIds.has(s.id),
      );
      window.selectedSceneIds.clear();
      window.renderScenes();
    }
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

      const needsWarning =
        (!scene.options || scene.options.length === 0) && !scene.isEnding;
      const hasEmptyTargetOption =
        scene.options &&
        scene.options.length > 0 &&
        scene.options.some((opt) => !opt.targetSceneId);

      let sceneAlertIconSvg = "";
      if (hasEmptyTargetOption) {
        sceneAlertIconSvg = `<svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="錯誤：有選項未設定跳轉目標"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      } else if (needsWarning) {
        sceneAlertIconSvg = `<svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="警告：此場景缺乏跳轉選項且未標記為結局"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
      }

      headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <input type="checkbox" class="scene-select-chk w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer flex-shrink-0" data-id="${scene.id}" ${window.selectedSceneIds.has(scene.id) ? "checked" : ""}>
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${scene.id}" onclick="window.copyId(event, '${scene.id}')">${scene.id}</span>
        ${sceneAlertIconSvg}
        <input type="text" value="${scene.name}" placeholder="輸入場景名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
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
        .querySelector('input[type="text"]')
        .addEventListener("input", (e) => (scene.name = e.target.value));

      // Checkbox 勾選邏輯
      headerEl
        .querySelector(".scene-select-chk")
        .addEventListener("change", (e) => {
          if (e.target.checked) window.selectedSceneIds.add(scene.id);
          else window.selectedSceneIds.delete(scene.id);

          const bar = document.getElementById("scene-batch-bar");
          const count = document.getElementById("batch-count");
          if (bar && count) {
            if (window.selectedSceneIds.size > 0) {
              bar.classList.remove("hidden");
              bar.classList.add("flex");
              count.textContent = window.selectedSceneIds.size;
            } else {
              bar.classList.add("hidden");
              bar.classList.remove("flex");
            }
          }
        });

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
          const clearedCount = cleanupInvalidSceneJumps(new Set([scene.id]));
          if (clearedCount > 0) {
            alert(
              `已自動清除 ${clearedCount} 個指向此被刪除場景的無效跳轉設定。`,
            );
          }
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
          if (!scene.isEnding) {
            optionsHtml = `
              <div class="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200 flex items-start mb-3 shadow-sm">
                <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span><strong>注意：</strong>此場景目前沒有任何選項，且未標記為「結局」。<br>當玩家到達此處時，系統會自動產生「繼續」按鈕強制跳轉至清單中的下一個場景。若此處是死路或劇情最後一幕，建議勾選上方的「標記為結局場景」。</span>
              </div>
            `;
          } else {
            optionsHtml = `<div class="text-sm text-gray-400 italic bg-gray-50 p-3 rounded border border-dashed border-gray-300 text-center mb-3">這是一個結局場景，到達此處後遊戲將自動結束，不需設定選項。</div>`;
          }
        } else {
          const hasEmptyTargetOption = scene.options.some(
            (opt) => !opt.targetSceneId,
          );
          if (hasEmptyTargetOption) {
            optionsHtml += `
              <div class="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200 flex items-start mb-3 shadow-sm">
                <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span><strong>錯誤：</strong>有選項未設定跳轉目標！玩家點擊該選項後將停留在原地。請務必為下方紅框標示的選項指定目標場景。</span>
              </div>
            `;
          }

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

            const optBoxClass = !opt.targetSceneId
              ? "bg-red-50/50 border-red-400 hover:border-red-500 shadow-sm"
              : "bg-gray-50 border-gray-200 hover:border-blue-300";

            optionsHtml += `
            <div class="flex flex-col space-y-2 p-3 rounded border transition ${optBoxClass}">
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
              <img src="${displayBgUrl}" class="w-full h-32 object-cover rounded border border-gray-300 shadow-sm" alt="場景背景預覽" onerror="this.onerror=null; this.src='https://via.placeholder.com/600x200?text=No+Background+Image'">
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
              <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
              <button type="button" class="format-btn px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-bold transition text-blue-700" data-tag="span" data-class="inline-block bg-gray-800 text-blue-300 px-2 py-0.5 rounded font-bold border border-gray-600 shadow-sm mr-1" title="隊友/主角標籤 (藍)">友</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-xs font-bold transition text-red-700" data-tag="span" data-class="inline-block bg-gray-800 text-red-400 px-2 py-0.5 rounded font-bold border border-gray-600 shadow-sm mr-1" title="敵人標籤 (紅)">敵</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition text-emerald-700" data-tag="span" data-class="inline-block bg-gray-800 text-emerald-400 px-2 py-0.5 rounded font-bold border border-gray-600 shadow-sm mr-1" title="NPC/中立標籤 (綠)">中</button>
              <button type="button" class="format-btn px-2 py-0.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded text-xs font-bold transition text-yellow-700" data-tag="span" data-class="inline-block bg-gray-800 text-yellow-400 px-2 py-0.5 rounded font-bold border border-gray-600 shadow-sm mr-1" title="特殊標籤 (黃)">特</button>
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
            const cls = e.currentTarget.getAttribute("data-class");
            const start = textEl.selectionStart;
            const end = textEl.selectionEnd;
            const text = textEl.value;
            const selectedText = text.substring(start, end);

            let insertion = "";
            let cursorOffset = 0;
            if (tag === "span" && style) {
              insertion = `<span style="${style}">${selectedText}</span>`;
              cursorOffset = `<span style="${style}">`.length;
            } else if (tag === "span" && cls) {
              insertion = `<span class="${cls}">${selectedText}</span>`;
              cursorOffset = `<span class="${cls}">`.length;
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
            window.renderScenes();
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

function cleanupInvalidSceneJumps(deletedSceneIds) {
  if (!deletedSceneIds || deletedSceneIds.size === 0) return 0;
  let clearedCount = 0;

  if (window.projectData.scenes) {
    window.projectData.scenes.forEach((scene) => {
      if (deletedSceneIds.has(scene.timeOutSceneId)) {
        scene.timeOutSceneId = "";
        clearedCount++;
      }
      if (scene.options) {
        scene.options.forEach((opt) => {
          if (deletedSceneIds.has(opt.targetSceneId)) {
            opt.targetSceneId = "";
            clearedCount++;
          }
        });
      }
    });
  }

  if (window.projectData.items) {
    window.projectData.items.forEach((item) => {
      if (deletedSceneIds.has(item.targetSceneId)) {
        item.targetSceneId = "";
        clearedCount++;
      }
    });
  }

  if (window.projectData.triggers) {
    window.projectData.triggers.forEach((trigger) => {
      if (deletedSceneIds.has(trigger.targetSceneId)) {
        trigger.targetSceneId = "";
        clearedCount++;
      }
    });
  }

  if (window.projectData.quizzes) {
    window.projectData.quizzes.forEach((quiz) => {
      if (deletedSceneIds.has(quiz.successSceneId)) {
        quiz.successSceneId = "";
        clearedCount++;
      }
      if (deletedSceneIds.has(quiz.failureSceneId)) {
        quiz.failureSceneId = "";
        clearedCount++;
      }
    });
  }

  if (
    window.projectData.timeSettings &&
    deletedSceneIds.has(window.projectData.timeSettings.dayChangeSceneId)
  ) {
    window.projectData.timeSettings.dayChangeSceneId = "";
    clearedCount++;
  }

  return clearedCount;
}
