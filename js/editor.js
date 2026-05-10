document.addEventListener("DOMContentLoaded", () => {
  let navButtons = document.querySelectorAll(".nav-btn");
  const mainTitle = document.querySelector("main header h2");
  const mainContent = document.querySelector("main section");

  const saveBtn = document.getElementById("save-project-btn");
  const lastSaveTimeEl = document.getElementById("last-save-time");

  // 全域 ID 複製功能
  window.copyId = function (e, id) {
    if (e) e.stopPropagation(); // 防止觸發外層摺疊面板

    const el = e.currentTarget;
    const originalText = el.innerText;

    const successAction = () => {
      el.innerText = "已複製!";
      el.classList.add("text-emerald-500", "font-bold");
      setTimeout(() => {
        el.innerText = originalText;
        el.classList.remove("text-emerald-500", "font-bold");
      }, 1500);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(id)
        .then(successAction)
        .catch((err) => alert("複製失敗：" + err));
    } else {
      // 降級方案：支援本地 file:// 協議開啟時的複製
      const textArea = document.createElement("textarea");
      textArea.value = id;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        successAction();
      } catch (err) {
        alert("複製失敗：" + err);
      }
      document.body.removeChild(textArea);
    }
  };

  // 全域 BGM 預覽功能
  window.previewAudio = new Audio();
  window.previewAudio.loop = true;
  window.currentPreviewBtn = null;

  window.toggleAudioPreview = function (url, btn) {
    if (!url) {
      alert("請先輸入有效的音樂網址！");
      return;
    }
    if (window.currentPreviewBtn === btn && !window.previewAudio.paused) {
      window.previewAudio.pause();
      btn.innerHTML = "▶ 試聽";
      btn.classList.replace("bg-red-100", "bg-emerald-100");
      btn.classList.replace("text-red-700", "text-emerald-700");
      window.currentPreviewBtn = null;
    } else {
      if (window.currentPreviewBtn) {
        window.currentPreviewBtn.innerHTML = "▶ 試聽";
        window.currentPreviewBtn.classList.replace(
          "bg-red-100",
          "bg-emerald-100",
        );
        window.currentPreviewBtn.classList.replace(
          "text-red-700",
          "text-emerald-700",
        );
      }
      window.previewAudio.src = url;
      window.previewAudio
        .play()
        .then(() => {
          btn.innerHTML = "⏹ 停止";
          btn.classList.replace("bg-emerald-100", "bg-red-100");
          btn.classList.replace("text-emerald-700", "text-red-700");
          window.currentPreviewBtn = btn;
        })
        .catch((err) => {
          alert(
            "播放失敗，請確認網址是否有效且支援跨域播放。\\n錯誤訊息：" +
              err.message,
          );
        });
    }
  };

  // 1. 初始化或讀取核心資料結構 (JSON)
  window.projectData = JSON.parse(localStorage.getItem("textAdventureProject"));
  if (!window.projectData) {
    window.projectData = {
      projectInfo: {
        title: "",
        author: "",
        defaultBgUrl: "",
        defaultBgmUrl: "",
        description: "",
        lastSaved: "",
      },
      chapters: [],
      items: [],
      npcs: [],
      triggers: [],
      scenes: [],
      globalVariables: [], // 存放數值系統的全域變數
      achievements: [], // 存放成就系統
      dictionary: [], // 存放辭典系統
      shops: [], // 存放商店系統
      quizzes: [], // 存放測驗系統
      timeSettings: {
        enabled: false,
        startDay: 1,
        startHour: 8,
        startMinute: 0,
      },
    };
  }

  // 更新最後保存時間的顯示
  function updateLastSaveTime() {
    if (window.projectData.projectInfo.lastSaved) {
      lastSaveTimeEl.textContent = `最後保存時間: ${window.projectData.projectInfo.lastSaved}`;
    }
  }
  updateLastSaveTime();

  // 定義各個模組的內容模板 (改為函式以支援資料動態綁定)
  const templates = {
    基本資訊: (data) => `
            <div class="space-y-6 max-w-4xl mx-auto mt-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">遊戲名稱</label>
                    <input type="text" id="input-title" value="${data.projectInfo.title}" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="輸入您的遊戲名稱...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">作者</label>
                    <input type="text" id="input-author" value="${data.projectInfo.author}" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="您的名字...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">預設背景圖網址 (URL，選填)</label>
                    <input type="text" id="input-default-bg" value="${data.projectInfo.defaultBgUrl || ""}" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://...">
                    <p class="text-xs text-gray-500 mt-1">若場景或章節未設定專屬背景圖，將會預設顯示此圖片。</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">預設背景音樂網址 (BGM URL，選填)</label>
                    <div class="flex space-x-2">
                        <input type="text" id="input-default-bgm" value="${data.projectInfo.defaultBgmUrl || ""}" class="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://... (如 mp3)">
                        <button id="test-default-bgm-btn" class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-sm font-bold transition whitespace-nowrap">▶ 試聽</button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">若場景或章節未設定專屬音樂，將會預設播放此音樂。</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">遊戲簡介</label>
                    <textarea id="input-description" class="w-full border border-gray-300 rounded-md shadow-sm p-2 h-[500px] focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar" placeholder="描述一下這個冒險世界...">${data.projectInfo.description}</textarea>
                </div>
                <div class="pt-6 border-t border-gray-200 flex justify-between items-center">
                    <button id="export-json-btn" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded shadow transition flex items-center" title="將專案下載至電腦">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        匯出專案 (JSON)
                    </button>
                    <div>
                        <input type="file" id="import-json-input" accept=".json" class="hidden">
                        <button id="import-json-btn" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition flex items-center" title="從電腦載入專案檔案">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            載入專案 (JSON)
                        </button>
                    </div>
                </div>
            </div>
        `,
    場景編輯: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">編輯遊戲的核心場景、對話文本與選項智慧跳轉邏輯。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="scene-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋場景名稱、ID、內容或選項..." value="${window.sceneSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-scene-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-scene-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增場景</button>
                </div>
            </div>
            <div id="scenes-container" class="space-y-4">
                <!-- 場景列表由 scene.js 動態渲染 -->
            </div>
        `,
    章節管理: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">管理遊戲的各個章節段落，方便整理長篇劇情，並支援摺疊顯示。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="chapter-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋章節名稱、ID 或描述..." value="${window.chapterSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-chapter-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-chapter-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增章節</button>
                </div>
            </div>
            <div id="chapters-container" class="space-y-4">
                <!-- 章節列表由 chapter.js 動態渲染 -->
            </div>
        `,
    數值系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">管理遊戲內的全域變數與初始數值，例如體力、金錢等。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="variable-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋變數名稱、ID 或描述..." value="${window.variableSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-var-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-variable-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增變數</button>
                </div>
            </div>
            <div id="variables-container" class="space-y-4">
                <!-- 變數列表由 variables.js 動態渲染 -->
            </div>
        `,
    道具系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">設計遊戲中的道具，包含消耗品、永久道具與其觸發條件。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="item-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋道具名稱、ID 或描述..." value="${window.itemSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-item-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-item-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增道具</button>
                </div>
            </div>
            <div id="items-container" class="space-y-4">
                <!-- 道具列表由 item.js 動態渲染 -->
            </div>
        `,
    全域觸發器: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">設定條件達成時自動觸發的全域事件，作為遊戲的後台監控中心。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="trigger-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋觸發器名稱或 ID..." value="${window.triggerSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-trigger-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-trigger-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增觸發器</button>
                </div>
            </div>
            <div id="triggers-container" class="space-y-4">
                <!-- 觸發器列表由 trigger.js 動態渲染 -->
            </div>
        `,
    "NPC 角色": (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">建立遊戲中的角色，並管理專屬數值（如好感度、屬性）。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="npc-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋角色名稱、ID 或背景描述..." value="${window.npcSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-npc-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-npc-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增角色</button>
                </div>
            </div>
            <div id="npcs-container" class="space-y-4">
                <!-- NPC 列表由 npc.js 動態渲染 -->
            </div>
        `,
    成就系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">管理遊戲內的成就，激發玩家收集慾，可設定隱藏成就與解鎖條件。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="achievement-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋成就名稱、ID 或描述..." value="${window.achievementSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-achievement-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-achievement-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增成就</button>
                </div>
            </div>
            <div id="achievements-container" class="space-y-4">
                <!-- 成就列表由 achievement.js 動態渲染 -->
            </div>
        `,
    辭典系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">管理遊戲內的專有名詞或辭典，供玩家隨時查閱世界觀與設定。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="dictionary-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋辭條名稱、ID 或內容..." value="${window.dictionarySearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-dictionary-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-dictionary-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增辭條</button>
                </div>
            </div>
            <div id="dictionary-container" class="space-y-4">
                <!-- 辭典列表由 dictionary.js 動態渲染 -->
            </div>
        `,
    商店系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">建立遊戲內的商店，讓玩家可以消耗變數 (如金幣) 購買道具。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="shop-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋商店名稱、ID 或描述..." value="${window.shopSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-shop-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-shop-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增商店</button>
                </div>
            </div>
            <div id="shops-container" class="space-y-4">
                <!-- 商店列表由 shop.js 動態渲染 -->
            </div>
        `,
    測驗系統: (data) => `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div class="w-full md:w-auto flex-1">
                  <p class="text-gray-600 mb-3">建立遊戲內的測驗或密碼鎖，讓玩家輸入文字答案並觸發不同結果。</p>
                  <div class="relative max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="quiz-search-input" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="搜尋測驗名稱、ID 或題目..." value="${window.quizSearchQuery || ""}">
                  </div>
                </div>
                <div class="flex space-x-2 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
                  <button id="collapse-all-quiz-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">一鍵收合</button>
                  <button id="add-quiz-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow transition flex-1 md:flex-none">+ 新增測驗</button>
                </div>
            </div>
            <div id="quizzes-container" class="space-y-4">
                <!-- 測驗列表由 quiz.js 動態渲染 -->
            </div>
        `,
    時間系統: (data) => `
            <div class="flex justify-between items-center mb-6">
                <p class="text-gray-600">管理遊戲內的時間系統，讓您能夠設定初始時間，並在場景或事件中推進時間。</p>
            </div>
            <div id="time-container" class="space-y-4">
                <!-- 時間系統由 time.js 動態渲染 -->
            </div>
        `,
  };

  // 渲染指定模組頁面，並掛載對應的事件監聽
  function renderTab(tabName) {
    mainTitle.textContent = tabName;
    mainContent.innerHTML = templates[tabName]
      ? templates[tabName](window.projectData)
      : '<p class="text-gray-500 text-center mt-10">模組開發中...</p>';

    // 當渲染「基本資訊」時，綁定即時更新資料的事件
    if (tabName === "基本資訊") {
      document.getElementById("input-title").addEventListener("input", (e) => {
        window.projectData.projectInfo.title = e.target.value;
      });
      document.getElementById("input-author").addEventListener("input", (e) => {
        window.projectData.projectInfo.author = e.target.value;
      });
      document
        .getElementById("input-default-bg")
        .addEventListener("input", (e) => {
          window.projectData.projectInfo.defaultBgUrl = e.target.value;
        });
      document
        .getElementById("input-default-bgm")
        .addEventListener("input", (e) => {
          window.projectData.projectInfo.defaultBgmUrl = e.target.value;
        });
      document
        .getElementById("test-default-bgm-btn")
        .addEventListener("click", (e) => {
          const url = document.getElementById("input-default-bgm").value;
          window.toggleAudioPreview(url, e.target);
        });
      document
        .getElementById("input-description")
        .addEventListener("input", (e) => {
          window.projectData.projectInfo.description = e.target.value;
        });

      // 匯出 JSON 功能
      document
        .getElementById("export-json-btn")
        .addEventListener("click", () => {
          const dataStr = JSON.stringify(window.projectData, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            (window.projectData.projectInfo.title || "文字冒險遊戲專案") +
            ".json";
          a.click();
          URL.revokeObjectURL(url);
        });

      // 載入 JSON 功能
      const importInput = document.getElementById("import-json-input");
      document
        .getElementById("import-json-btn")
        .addEventListener("click", () => {
          importInput.click();
        });

      importInput.addEventListener("change", (e) => {
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
              window.projectData = importedData;
              localStorage.setItem(
                "textAdventureProject",
                JSON.stringify(window.projectData),
              );

              let projects =
                JSON.parse(localStorage.getItem("textAdventureProjectsList")) ||
                [];
              const idx = projects.findIndex(
                (p) => p.projectId === window.projectData.projectId,
              );
              if (idx !== -1) projects[idx] = window.projectData;
              else projects.push(window.projectData);
              localStorage.setItem(
                "textAdventureProjectsList",
                JSON.stringify(projects),
              );

              alert("專案載入成功！");
              window.location.reload(); // 重新載入頁面以套用所有設定
            } else {
              alert("無效的專案檔案！");
            }
          } catch (err) {
            alert("載入失敗，檔案格式錯誤或已損壞：" + err);
          }
        };
        reader.readAsText(file);
      });
    } else if (tabName === "場景編輯") {
      if (typeof window.renderScenes === "function") {
        window.renderScenes();
      }
      const searchInput = document.getElementById("scene-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.sceneSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderScenes === "function") {
            window.renderScenes();
          }
        });
      }
    } else if (tabName === "章節管理") {
      if (typeof window.renderChapters === "function") {
        window.renderChapters();
      }
      const searchInput = document.getElementById("chapter-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.chapterSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderChapters === "function") {
            window.renderChapters();
          }
        });
      }
    } else if (tabName === "數值系統") {
      if (typeof window.renderVariables === "function") {
        window.renderVariables();
      }
      const searchInput = document.getElementById("variable-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.variableSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderVariables === "function") {
            window.renderVariables();
          }
        });
      }
    } else if (tabName === "道具系統") {
      if (typeof window.renderItems === "function") {
        window.renderItems();
      }
      const searchInput = document.getElementById("item-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.itemSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderItems === "function") {
            window.renderItems();
          }
        });
      }
    } else if (tabName === "全域觸發器") {
      if (typeof window.renderTriggers === "function") {
        window.renderTriggers();
      }
      const searchInput = document.getElementById("trigger-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.triggerSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderTriggers === "function") {
            window.renderTriggers();
          }
        });
      }
    } else if (tabName === "NPC 角色") {
      if (typeof window.renderNpcs === "function") {
        window.renderNpcs();
      }
      const searchInput = document.getElementById("npc-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.npcSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderNpcs === "function") {
            window.renderNpcs();
          }
        });
      }
    } else if (tabName === "成就系統") {
      if (typeof window.renderAchievements === "function") {
        window.renderAchievements();
      }
      const searchInput = document.getElementById("achievement-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.achievementSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderAchievements === "function") {
            window.renderAchievements();
          }
        });
      }
    } else if (tabName === "辭典系統") {
      if (typeof window.renderDictionary === "function") {
        window.renderDictionary();
      }
      const searchInput = document.getElementById("dictionary-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.dictionarySearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderDictionary === "function") {
            window.renderDictionary();
          }
        });
      }
    } else if (tabName === "商店系統") {
      if (typeof window.renderShops === "function") {
        window.renderShops();
      }
      const searchInput = document.getElementById("shop-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.shopSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderShops === "function") {
            window.renderShops();
          }
        });
      }
    } else if (tabName === "測驗系統") {
      if (typeof window.renderQuizzes === "function") {
        window.renderQuizzes();
      }
      const searchInput = document.getElementById("quiz-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          window.quizSearchQuery = e.target.value.trim().toLowerCase();
          if (typeof window.renderQuizzes === "function") {
            window.renderQuizzes();
          }
        });
      }
    } else if (tabName === "時間系統") {
      if (typeof window.renderTime === "function") {
        window.renderTime();
      }
    }
  }

  // 動態新增「辭典系統」的導覽按鈕 (若 HTML 尚未包含)
  const navContainer = document.querySelector("aside nav");
  if (
    navContainer &&
    !Array.from(navButtons).some((b) => b.textContent.trim() === "辭典系統")
  ) {
    const dictNavBtn = document.createElement("button");
    dictNavBtn.className =
      "nav-btn w-full text-left px-4 py-3 rounded-lg text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition flex items-center";
    dictNavBtn.innerHTML = `<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> 辭典系統`;
    navContainer.appendChild(dictNavBtn);
    // 更新 navButtons NodeList
    navButtons = document.querySelectorAll(".nav-btn");
  }

  // 預設載入「基本資訊」
  renderTab("基本資訊");

  // 檢查是否從測試模式要求跳轉編輯特定場景
  const jumpToScene = localStorage.getItem("textAdventureJumpToScene");
  if (jumpToScene) {
    localStorage.removeItem("textAdventureJumpToScene");
    setTimeout(() => {
      if (typeof window.editSceneFromChapter === "function") {
        window.editSceneFromChapter(jumpToScene);
      }
    }, 100);
  }

  // 提供給其他模組呼叫的標籤切換函式
  window.switchTab = function (tabName) {
    const targetBtn = Array.from(document.querySelectorAll(".nav-btn")).find(
      (b) => b.textContent.trim() === tabName,
    );
    if (targetBtn) targetBtn.click();
  };

  navButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // 切換分頁時清除搜尋狀態
      const currentTab = this.textContent.trim();
      if (currentTab !== "場景編輯") window.sceneSearchQuery = "";
      if (currentTab !== "成就系統") window.achievementSearchQuery = "";
      if (currentTab !== "辭典系統") window.dictionarySearchQuery = "";
      if (currentTab !== "商店系統") window.shopSearchQuery = "";
      if (currentTab !== "數值系統") window.variableSearchQuery = "";
      if (currentTab !== "道具系統") window.itemSearchQuery = "";
      if (currentTab !== "測驗系統") window.quizSearchQuery = "";
      if (currentTab !== "全域觸發器") window.triggerSearchQuery = "";
      if (currentTab !== "NPC 角色") window.npcSearchQuery = "";
      if (currentTab !== "章節管理") window.chapterSearchQuery = "";

      // 切換分頁時自動停止音樂
      if (window.previewAudio && !window.previewAudio.paused) {
        window.previewAudio.pause();
        if (window.currentPreviewBtn) {
          window.currentPreviewBtn.innerHTML = "▶ 試聽";
          window.currentPreviewBtn.classList.replace(
            "bg-red-100",
            "bg-emerald-100",
          );
          window.currentPreviewBtn.classList.replace(
            "text-red-700",
            "text-emerald-700",
          );
          window.currentPreviewBtn = null;
        }
      }

      navButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const tabName = this.textContent.trim();
      renderTab(tabName);
    });
  });

  // 共用的儲存專案邏輯 (silent = true 時不跳出 alert 彈窗)
  window.saveProject = function (silent = false) {
    const now = new Date();
    window.projectData.projectInfo.lastSaved = now.toLocaleString("zh-TW");
    if (!window.projectData.projectId) {
      window.projectData.projectId = "proj_" + Date.now();
    }
    localStorage.setItem(
      "textAdventureProject",
      JSON.stringify(window.projectData),
    );

    // 同步到專案庫
    let projects =
      JSON.parse(localStorage.getItem("textAdventureProjectsList")) || [];
    const idx = projects.findIndex(
      (p) => p.projectId === window.projectData.projectId,
    );
    if (idx !== -1) projects[idx] = window.projectData;
    else projects.push(window.projectData);
    localStorage.setItem("textAdventureProjectsList", JSON.stringify(projects));

    updateLastSaveTime();
    if (!silent) alert("專案已成功保存至本地！");
  };

  // 點擊儲存按鈕
  saveBtn.addEventListener("click", () => {
    window.saveProject(false);
  });

  // 測試遊戲與正式遊玩前自動保存
  const testGameLink = document.getElementById("test-game-link");
  if (testGameLink) {
    testGameLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.saveProject(true); // 靜默保存
      window.location.href = "test.html";
    });
  }

  const playGameLink = document.getElementById("play-game-link");
  if (playGameLink) {
    playGameLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.saveProject(true); // 靜默保存
      window.location.href = "player1.html";
    });
  }

  // 將「測試遊戲」與「正式遊玩」按鈕移到左側選單
  if (navContainer) {
    if (testGameLink && testGameLink.parentElement !== navContainer) {
      const divider = document.createElement("div");
      divider.className = "h-px bg-gray-800 my-4 mx-2";
      navContainer.appendChild(divider);

      testGameLink.className =
        "w-full text-left px-4 py-3 rounded-lg text-purple-400 font-bold hover:bg-gray-800 hover:text-purple-300 transition flex items-center mb-2 border border-purple-500/30 bg-purple-900/10";
      testGameLink.innerHTML = `<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg> 測試遊戲`;
      navContainer.appendChild(testGameLink);
    }
    if (playGameLink && playGameLink.parentElement !== navContainer) {
      playGameLink.className =
        "w-full text-left px-4 py-3 rounded-lg text-emerald-400 font-bold hover:bg-gray-800 hover:text-emerald-300 transition flex items-center border border-emerald-500/30 bg-emerald-900/10";
      playGameLink.innerHTML = `<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 正式遊玩`;
      navContainer.appendChild(playGameLink);
    }
  }

  // 自動保存機制：每 5 分鐘 (300000 毫秒) 在背景靜默存檔一次
  setInterval(
    () => {
      window.saveProject(true);
      console.log("系統已自動在背景保存專案進度");
    },
    5 * 60 * 1000,
  );
});
