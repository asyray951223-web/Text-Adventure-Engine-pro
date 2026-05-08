document.addEventListener("DOMContentLoaded", () => {
  // 專案管理邏輯
  const projectModal = document.getElementById("project-modal");
  const loadSaveBtn = document.getElementById("load-save-btn");
  const closeProjectModalBtn = document.getElementById(
    "close-project-modal-btn",
  );
  const newProjectBtnMain = document.getElementById("new-project-btn-main");
  const lobbyImportBtn = document.getElementById("lobby-import-btn");
  const lobbyImportJson = document.getElementById("lobby-import-json");

  // 取得多份專案清單，並為舊版專案進行自動移轉
  function getProjectsList() {
    let list =
      JSON.parse(localStorage.getItem("textAdventureProjectsList")) || [];
    const standalone = JSON.parse(localStorage.getItem("textAdventureProject"));

    if (standalone && standalone.projectInfo) {
      if (!standalone.projectId) {
        standalone.projectId = "proj_" + Date.now();
        localStorage.setItem(
          "textAdventureProject",
          JSON.stringify(standalone),
        );
      }
      const exists = list.some((p) => p.projectId === standalone.projectId);
      if (!exists) {
        list.push(standalone);
        localStorage.setItem("textAdventureProjectsList", JSON.stringify(list));
      }
    }
    return list;
  }

  function renderProjectsList() {
    const list = getProjectsList();
    const container = document.getElementById("project-list-container");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = `<p class="text-gray-400 italic text-center py-4">目前沒有任何專案</p>`;
      return;
    }

    list.forEach((project) => {
      const title = project.projectInfo.title || "未命名專案";
      const lastSaved = project.projectInfo.lastSaved || "無紀錄";
      const projId = project.projectId;

      container.innerHTML += `
            <div class="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-blue-500 transition shadow-sm">
              <div>
                <p class="font-bold text-blue-300 text-lg">${title}</p>
                <p class="text-xs text-gray-500 mt-1">最後保存：${lastSaved}</p>
              </div>
              <div class="flex space-x-2">
                <button onclick="window.editProject('${projId}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold transition shadow-sm">編輯</button>
                <button onclick="window.exportProject('${projId}')" class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-bold transition border border-gray-600 shadow-sm">匯出</button>
                <button onclick="window.deleteProject('${projId}')" class="bg-red-900/80 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition border border-red-800 shadow-sm">刪除</button>
              </div>
            </div>
          `;
    });
  }

  newProjectBtnMain.addEventListener("click", () => {
    if (localStorage.getItem("textAdventureProject")) {
      if (
        !confirm(
          "建立新專案將會覆蓋當前編輯器中的暫存狀態（不會影響已保存的專案庫）。\n確定要開始新專案嗎？",
        )
      )
        return;
    }
    localStorage.removeItem("textAdventureProject");
    window.location.href = "editor.html";
  });

  loadSaveBtn.addEventListener("click", () => {
    renderProjectsList();
    projectModal.classList.remove("opacity-0", "pointer-events-none");
    projectModal.firstElementChild.classList.remove(
      "scale-95",
      "translate-y-4",
    );
  });

  closeProjectModalBtn.addEventListener("click", () => {
    projectModal.classList.add("opacity-0", "pointer-events-none");
    projectModal.firstElementChild.classList.add("scale-95", "translate-y-4");
  });

  window.editProject = function (projId) {
    const list = getProjectsList();
    const project = list.find((p) => p.projectId === projId);
    if (project) {
      localStorage.setItem("textAdventureProject", JSON.stringify(project));
      window.location.href = "editor.html";
    }
  };

  window.exportProject = function (projId) {
    const list = getProjectsList();
    const project = list.find((p) => p.projectId === projId);
    if (!project) return;
    const title = project.projectInfo.title || "文字冒險遊戲專案";
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  window.deleteProject = function (projId) {
    if (confirm("確定要刪除本地的暫存專案嗎？此操作無法還原！")) {
      let list = getProjectsList();
      list = list.filter((p) => p.projectId !== projId);
      localStorage.setItem("textAdventureProjectsList", JSON.stringify(list));

      const current = JSON.parse(localStorage.getItem("textAdventureProject"));
      if (current && current.projectId === projId) {
        localStorage.removeItem("textAdventureProject");
      }
      renderProjectsList();
    }
  };

  lobbyImportBtn.addEventListener("click", () => {
    lobbyImportJson.click();
  });

  lobbyImportJson.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.projectInfo) {
          if (!importedData.projectId) {
            importedData.projectId = "proj_" + Date.now();
          }
          localStorage.setItem(
            "textAdventureProject",
            JSON.stringify(importedData),
          );

          let list = getProjectsList();
          const idx = list.findIndex(
            (p) => p.projectId === importedData.projectId,
          );
          if (idx !== -1) list[idx] = importedData;
          else list.push(importedData);
          localStorage.setItem(
            "textAdventureProjectsList",
            JSON.stringify(list),
          );

          alert("專案載入成功！即將進入編輯器...");
          window.location.href = "editor.html";
        } else {
          alert("無效的專案檔案！");
        }
      } catch (err) {
        alert("載入失敗，檔案格式錯誤或已損壞：" + err);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input 以便重複載入同一檔案
  });

  // 遊玩存檔管理邏輯
  const playModal = document.getElementById("save-slots-modal");
  const closePlayModalBtn = document.getElementById("close-modal-btn");
  const slotsContainer = document.getElementById("slots-container");
  const openPlayModalBtn = document.getElementById("open-play-modal-btn");
  const playImportBtn = document.getElementById("play-import-btn");
  const playImportJson = document.getElementById("play-import-json");
  const currentPlayProjectName = document.getElementById(
    "current-play-project-name",
  );
  const currentPlayProjectDesc = document.getElementById(
    "current-play-project-desc",
  );

  function updateCurrentPlayProjectName() {
    const saveData = localStorage.getItem("textAdventureProject");
    if (saveData) {
      try {
        const project = JSON.parse(saveData);
        currentPlayProjectName.textContent =
          project.projectInfo.title || "未命名遊戲";
        if (project.projectInfo.description) {
          currentPlayProjectDesc.textContent = project.projectInfo.description;
        } else {
          currentPlayProjectDesc.textContent = "此遊戲無提供簡介。";
        }
        currentPlayProjectDesc.classList.remove("hidden");
      } catch (e) {
        currentPlayProjectName.textContent = "檔案損壞";
        currentPlayProjectDesc.classList.add("hidden");
      }
    } else {
      currentPlayProjectName.textContent = "尚未載入任何遊戲";
      currentPlayProjectDesc.classList.add("hidden");
    }
  }

  function renderSlots() {
    let saves = JSON.parse(localStorage.getItem("textAdventurePlayerSaves"));
    // 存檔升級遷移 (舊版 3 個槽位擴充為 5 個槽位，保留 0 和 1 為系統自動與快速存檔)
    if (saves && saves.length === 3) {
      saves = [null, null, ...saves];
      localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(saves));
    } else if (!saves) {
      saves = [];
    }
    while (saves.length < 5) saves.push(null);

    slotsContainer.innerHTML = saves
      .map((save, index) => {
        let slotName =
          index === 0
            ? "自動存檔"
            : index === 1
              ? "快速存檔 (F5)"
              : `槽位 ${index - 1}`;
        let titleColor =
          index === 0
            ? "text-emerald-400"
            : index === 1
              ? "text-blue-400"
              : "text-white";
        let isReserved = index === 0 || index === 1;

        if (save) {
          return `
              <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 flex justify-between items-center hover:border-emerald-500 transition shadow-sm">
                <div>
                  <h3 class="text-lg font-bold ${titleColor}">${slotName}: ${save.sceneName || "進度紀錄"}</h3>
                  <p class="text-sm text-gray-400">儲存時間: ${save.time}</p>
                </div>
                <div class="flex space-x-2">
                  <button class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition" onclick="loadPlaySave(${index})">讀取</button>
                  <button class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition" onclick="deletePlaySave(${index})">刪除</button>
                </div>
              </div>
            `;
        } else {
          let newGameBtn = isReserved
            ? `<button class="px-4 py-2 bg-gray-700 text-gray-500 rounded font-bold cursor-not-allowed" disabled>系統保留</button>`
            : `<button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition" onclick="startNewGame(${index})">新遊戲</button>`;
          return `
              <div class="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-4 flex justify-between items-center hover:border-gray-500 transition">
                <div>
                  <h3 class="text-lg font-bold text-gray-500">${slotName}: 空</h3>
                </div>
                ${newGameBtn}
              </div>
            `;
        }
      })
      .join("");
  }

  openPlayModalBtn.addEventListener("click", () => {
    updateCurrentPlayProjectName();
    renderSlots();
    playModal.classList.remove("opacity-0", "pointer-events-none");
    playModal.firstElementChild.classList.remove("scale-95", "translate-y-4");
  });

  playImportBtn.addEventListener("click", () => {
    playImportJson.click();
  });

  playImportJson.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.projectInfo) {
          localStorage.setItem(
            "textAdventureProject",
            JSON.stringify(importedData),
          );
          if (
            confirm(
              "是否同時清空舊遊戲的存檔槽位與成就紀錄？\n(若載入的是同一個遊戲的更新版可選取消，若是全新遊戲建議選確定)",
            )
          ) {
            localStorage.removeItem("textAdventurePlayerSaves");
            localStorage.removeItem("textAdventureGlobalUnlocks");
          }
          updateCurrentPlayProjectName();
          renderSlots();
          alert("遊戲載入成功！請選擇槽位開始遊玩。");
        } else {
          alert("無效的遊戲檔案！");
        }
      } catch (err) {
        alert("載入失敗，檔案格式錯誤或已損壞：" + err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  closePlayModalBtn.addEventListener("click", () => {
    playModal.classList.add("opacity-0", "pointer-events-none");
    playModal.firstElementChild.classList.add("scale-95", "translate-y-4");
  });

  window.startNewGame = function (slotIndex) {
    if (!localStorage.getItem("textAdventureProject")) {
      alert("請先載入遊戲專案！");
      return;
    }
    localStorage.setItem("currentPlayerSaveSlot", slotIndex);
    // 清除該槽位舊資料以確保是全新開始
    let saves =
      JSON.parse(localStorage.getItem("textAdventurePlayerSaves")) || [];
    while (saves.length < 5) saves.push(null);
    saves[slotIndex] = null;
    localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(saves));
    const theme = document.getElementById("ui-theme-select")
      ? document.getElementById("ui-theme-select").value
      : "player1.html";
    window.location.href = theme;
  };

  window.loadPlaySave = function (slotIndex) {
    if (!localStorage.getItem("textAdventureProject")) {
      alert("請先載入遊戲專案！");
      return;
    }
    localStorage.setItem("currentPlayerSaveSlot", slotIndex);
    const theme = document.getElementById("ui-theme-select")
      ? document.getElementById("ui-theme-select").value
      : "player1.html";
    window.location.href = theme;
  };

  window.deletePlaySave = function (slotIndex) {
    if (confirm("確定要刪除這個存檔嗎？")) {
      let saves =
        JSON.parse(localStorage.getItem("textAdventurePlayerSaves")) || [];
      while (saves.length < 5) saves.push(null);
      saves[slotIndex] = null;
      localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(saves));
      renderSlots();
    }
  };

  // 畫廊管理邏輯
  const galleryModal = document.getElementById("gallery-modal");
  const openGalleryBtn = document.getElementById("open-gallery-btn");
  const closeGalleryBtn = document.getElementById("close-gallery-btn");
  const tabEndingsBtn = document.getElementById("tab-endings-btn");
  const tabAchievementsBtn = document.getElementById("tab-achievements-btn");
  const endingsContainer = document.getElementById("gallery-endings-container");
  const achievementsContainer = document.getElementById(
    "gallery-achievements-container",
  );

  function renderGallery() {
    const project =
      JSON.parse(localStorage.getItem("textAdventureProject")) || {};
    const unlocks = JSON.parse(
      localStorage.getItem("textAdventureGlobalUnlocks"),
    ) || { achievements: [], endings: [] };

    // 渲染結局
    const allEndings = new Set();
    if (project.scenes) {
      project.scenes.forEach((s) => {
        if (s.isEnding && s.endingName) allEndings.add(s.endingName);
      });
    }
    endingsContainer.innerHTML = "";
    if (allEndings.size === 0) {
      endingsContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">專案中尚未設定任何結局。</div>`;
    } else {
      Array.from(allEndings).forEach((endingName, i) => {
        const isUnlocked = unlocks.endings.includes(endingName);
        const iconSvg = isUnlocked
          ? '<svg class="w-8 h-8 text-yellow-500 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>'
          : '<svg class="w-8 h-8 text-gray-600 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>';
        endingsContainer.innerHTML += `
              <div class="p-4 rounded-lg border ${isUnlocked ? "bg-yellow-900/30 border-yellow-600/50" : "bg-gray-800/50 border-gray-700 border-dashed"} flex items-center space-x-4">
                <div>${iconSvg}</div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Ending No.${i + 1}</div>
                  <div class="${isUnlocked ? "text-white font-bold text-lg" : "text-gray-500 font-bold"}">${isUnlocked ? endingName : "??? (尚未解鎖)"}</div>
                </div>
              </div>
            `;
      });
    }

    // 渲染成就
    achievementsContainer.innerHTML = "";
    if (!project.achievements || project.achievements.length === 0) {
      achievementsContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">專案中尚未設定任何成就。</div>`;
    } else {
      project.achievements.forEach((ach) => {
        const isUnlocked = unlocks.achievements.includes(ach.id);
        const showHidden = ach.isHidden && !isUnlocked;
        const icon =
          isUnlocked || !ach.isHidden
            ? ach.iconUrl || "https://via.placeholder.com/150?text=Icon"
            : "https://via.placeholder.com/150/333333/666666?text=?";

        achievementsContainer.innerHTML += `
              <div class="p-4 rounded-lg border ${isUnlocked ? "bg-purple-900/30 border-purple-500/50" : "bg-gray-800 border-gray-700"} flex items-center space-x-4 transition">
                <img src="${icon}" class="w-14 h-14 object-cover rounded border ${isUnlocked ? "border-purple-400" : "border-gray-600 grayscale opacity-50"}">
                <div class="flex-1">
                  <div class="text-sm font-bold ${isUnlocked ? "text-purple-300" : "text-gray-400"}">${showHidden ? "隱藏成就" : ach.name}</div>
                  <div class="text-xs ${isUnlocked ? "text-gray-300" : "text-gray-600"} mt-1 line-clamp-2">${isUnlocked ? ach.description || "無說明" : showHidden ? "??????????" : ach.description || "無說明"}</div>
                </div>
              </div>
            `;
      });
    }
  }

  openGalleryBtn.addEventListener("click", () => {
    renderGallery();
    galleryModal.classList.remove("opacity-0", "pointer-events-none");
    galleryModal.firstElementChild.classList.remove(
      "scale-95",
      "translate-y-4",
    );
  });
  closeGalleryBtn.addEventListener("click", () => {
    galleryModal.classList.add("opacity-0", "pointer-events-none");
    galleryModal.firstElementChild.classList.add("scale-95", "translate-y-4");
  });
  tabEndingsBtn.addEventListener("click", () => {
    tabEndingsBtn.className =
      "text-purple-400 font-bold px-4 py-2 border-b-2 border-purple-500 transition";
    tabAchievementsBtn.className =
      "text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-purple-300 transition";
    endingsContainer.classList.remove("hidden");
    endingsContainer.classList.add("grid");
    achievementsContainer.classList.add("hidden");
    achievementsContainer.classList.remove("grid");
  });
  tabAchievementsBtn.addEventListener("click", () => {
    tabAchievementsBtn.className =
      "text-purple-400 font-bold px-4 py-2 border-b-2 border-purple-500 transition";
    tabEndingsBtn.className =
      "text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-purple-300 transition";
    achievementsContainer.classList.remove("hidden");
    achievementsContainer.classList.add("grid");
    endingsContainer.classList.add("hidden");
    endingsContainer.classList.remove("grid");
  });

  // 說明 Modal 邏輯
  const editorHelpModal = document.getElementById("editor-help-modal");
  const openEditorHelpBtn = document.getElementById("open-editor-help-btn");
  const closeEditorHelpBtn = document.getElementById("close-editor-help-btn");
  const playerHelpModal = document.getElementById("player-help-modal");
  const openPlayerHelpBtn = document.getElementById("open-player-help-btn");
  const closePlayerHelpBtn = document.getElementById("close-player-help-btn");

  openEditorHelpBtn.addEventListener("click", () => {
    editorHelpModal.classList.remove("opacity-0", "pointer-events-none");
    editorHelpModal.firstElementChild.classList.remove(
      "scale-95",
      "translate-y-4",
    );
  });
  closeEditorHelpBtn.addEventListener("click", () => {
    editorHelpModal.classList.add("opacity-0", "pointer-events-none");
    editorHelpModal.firstElementChild.classList.add(
      "scale-95",
      "translate-y-4",
    );
  });
  openPlayerHelpBtn.addEventListener("click", () => {
    playerHelpModal.classList.remove("opacity-0", "pointer-events-none");
    playerHelpModal.firstElementChild.classList.remove(
      "scale-95",
      "translate-y-4",
    );
  });
  closePlayerHelpBtn.addEventListener("click", () => {
    playerHelpModal.classList.add("opacity-0", "pointer-events-none");
    playerHelpModal.firstElementChild.classList.add(
      "scale-95",
      "translate-y-4",
    );
  });
});
