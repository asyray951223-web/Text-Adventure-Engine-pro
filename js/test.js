// 負責管理測試模式 (test.html) 的邏輯與除錯功能

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
      ripple.style.color = "rgba(52, 211, 153, 0.6)"; // 測試模式預設翠綠色
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  const projectData = JSON.parse(localStorage.getItem("textAdventureProject"));

  if (!projectData) {
    alert("未找到專案資料，請先在編輯器中建立專案並保存！");
    window.location.href = "editor.html";
    return;
  }

  // 動態注入額外的轉場動畫 Keyframes
  if (!document.getElementById("extra-transitions-style")) {
    const style = document.createElement("style");
    style.id = "extra-transitions-style";
    style.innerHTML = `
      @keyframes sceneBlurIn { from { filter: blur(20px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
      @keyframes sceneSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes sceneSlideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes sceneSpinIn { from { transform: rotate(-180deg) scale(0.5); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // DOM 元素綁定
  const debugSceneSelect = document.getElementById("debug-scene-select");
  const forceJumpBtn = document.getElementById("force-jump-btn");
  const debugVariablesList = document.getElementById("debug-variables-list");
  const debugItemsList = document.getElementById("debug-items-list");
  const testBgmPlayer = document.getElementById("test-bgm-player");

  const testBg = document.getElementById("test-bg");
  const testSceneSprite = document.getElementById("test-scene-sprite");
  const testCgVideo = document.getElementById("test-scene-cg-video");
  const dialogueName = document.getElementById("test-dialogue-name");
  const dialogueAvatar = document.getElementById("test-dialogue-avatar");
  const dialogueText = document.getElementById("test-dialogue-text");
  const optionsContainer = document.getElementById("test-options-container");

  // 設定面板元素
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const volumeRange = document.getElementById("volume-range");

  // 定時炸彈計時器
  const testTimerContainer = document.getElementById(
    "test-dialogue-timer-container",
  );
  const testTimerBar = document.getElementById("test-dialogue-timer-bar");
  let sceneTimerInterval = null;
  let sceneTimerTimeout = null;

  function clearSceneTimer() {
    if (sceneTimerInterval) clearInterval(sceneTimerInterval);
    if (sceneTimerTimeout) clearTimeout(sceneTimerTimeout);
    if (testTimerContainer) {
      testTimerContainer.classList.add("hidden");
    }
  }

  function startSceneTimer(scene) {
    if (!scene.timeLimit || scene.timeLimit <= 0) return;
    if (testTimerContainer) {
      testTimerContainer.classList.remove("hidden");
      if (testTimerBar) testTimerBar.style.width = "100%";
    }
    const durationMs = scene.timeLimit * 1000;
    const startTime = Date.now();
    sceneTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentage = Math.max(
        0,
        ((durationMs - elapsed) / durationMs) * 100,
      );
      if (testTimerBar) testTimerBar.style.width = `${percentage}%`;
    }, 16);
    sceneTimerTimeout = setTimeout(() => {
      clearSceneTimer();
      console.warn(`[定時炸彈] 時間到！自動跳轉至：${scene.timeOutSceneId}`);
      handleJump(scene.timeOutSceneId, scene.id);
    }, durationMs);
  }

  // 遊戲即時狀態
  let gameState = {
    currentSceneId: "",
    chapterId: "",
    variables: {},
    items: {},
    visitedScenes: [],
    shopStocks: {},
    time: { day: 1, hour: 8, minute: 0 },
  };

  // 1. 初始化變數狀態
  if (projectData.globalVariables) {
    projectData.globalVariables.forEach((v) => {
      gameState.variables[v.id] = Number(v.value) || 0;
    });
  }
  if (projectData.timeSettings && projectData.timeSettings.enabled) {
    gameState.time = {
      day: projectData.timeSettings.startDay || 1,
      hour: projectData.timeSettings.startHour || 0,
      minute: projectData.timeSettings.startMinute || 0,
    };
  }

  // 讀取全域設定 (與正式遊玩模式共用)
  let gameSettings = JSON.parse(
    localStorage.getItem("textAdventureSettings"),
  ) || { textSpeed: 70, volume: 50, typingVolume: 50, version: 2 };
  if (volumeRange) volumeRange.value = gameSettings.volume;

  function saveSettings() {
    gameSettings.volume = parseInt(volumeRange.value, 10);
    localStorage.setItem("textAdventureSettings", JSON.stringify(gameSettings));
    if (testBgmPlayer) testBgmPlayer.volume = gameSettings.volume / 100;
    if (testCgVideo) testCgVideo.volume = gameSettings.volume / 100;
  }

  if (volumeRange) volumeRange.addEventListener("input", saveSettings);

  window.openSettings = function () {
    settingsModal.classList.remove("hidden");
    settingsModal.classList.add("flex");
    setTimeout(() => {
      settingsModal.classList.remove("opacity-0");
      settingsModal.classList.add("opacity-100");
    }, 10);
  };

  function closeSettings() {
    settingsModal.classList.remove("opacity-100");
    settingsModal.classList.add("opacity-0");
    setTimeout(() => {
      settingsModal.classList.remove("flex");
      settingsModal.classList.add("hidden");
    }, 300);
  }

  if (closeSettingsBtn)
    closeSettingsBtn.addEventListener("click", closeSettings);
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) closeSettings();
    });
  }

  if (testBgmPlayer) testBgmPlayer.volume = gameSettings.volume / 100;
  if (testCgVideo) testCgVideo.volume = gameSettings.volume / 100;

  // --- 商店系統 (動態注入) ---
  let shopModal = document.getElementById("shop-modal");
  let shopContainer = null;
  let closeShopBtn = null;
  let shopTitle = null;
  let shopDesc = null;
  let shopTabBuy = null;
  let shopTabSell = null;
  let currentShopMode = "buy";
  let currentOpenShopId = null;

  const gameContainer = document.getElementById("game-container");
  if (!shopModal && gameContainer) {
    shopModal = document.createElement("div");
    shopModal.id = "shop-modal";
    shopModal.className =
      "absolute inset-0 z-[100] hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    shopModal.innerHTML = `
      <div id="shop-panel" class="bg-gray-900 w-11/12 max-w-4xl h-5/6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300 relative">
        <div class="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-800 rounded-t-2xl">
          <div>
            <h2 id="shop-title" class="text-2xl font-extrabold text-white flex items-center">
              <svg class="w-6 h-6 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              商店 (測試模式)
            </h2>
            <p id="shop-desc" class="text-sm text-gray-400 mt-1"></p>
          </div>
          <button id="close-shop-btn" class="text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="flex space-x-4 px-6 pt-4 border-b border-gray-800 bg-gray-900">
          <button id="shop-tab-buy" class="text-yellow-400 font-bold px-4 py-2 border-b-2 border-yellow-500 transition">購買商品</button>
          <button id="shop-tab-sell" class="text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-yellow-300 transition">販賣道具</button>
        </div>
        <div id="shop-container" class="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 content-start bg-gray-900 rounded-b-2xl">
        </div>
      </div>
    `;
    gameContainer.appendChild(shopModal);
    shopContainer = document.getElementById("shop-container");
    closeShopBtn = document.getElementById("close-shop-btn");
    shopTitle = document.getElementById("shop-title");
    shopDesc = document.getElementById("shop-desc");
    shopTabBuy = document.getElementById("shop-tab-buy");
    shopTabSell = document.getElementById("shop-tab-sell");

    shopTabBuy.addEventListener("click", () => {
      currentShopMode = "buy";
      shopTabBuy.className =
        "text-yellow-400 font-bold px-4 py-2 border-b-2 border-yellow-500 transition";
      shopTabSell.className =
        "text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-yellow-300 transition";
      renderShopItems();
    });

    shopTabSell.addEventListener("click", () => {
      currentShopMode = "sell";
      shopTabSell.className =
        "text-yellow-400 font-bold px-4 py-2 border-b-2 border-yellow-500 transition";
      shopTabBuy.className =
        "text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-yellow-300 transition";
      renderShopItems();
    });
  }

  function renderShopItems() {
    const shop = (projectData.shops || []).find(
      (s) => s.id === currentOpenShopId,
    );
    if (!shop) return;

    shopContainer.innerHTML = "";

    if (currentShopMode === "buy") {
      if (!shop.goods || shop.goods.length === 0) {
        shopContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">目前沒有販售任何商品。</div>`;
        return;
      }

      shop.goods.forEach((good, index) => {
        const itemData = projectData.items.find((i) => i.id === good.itemId);
        const varData = projectData.globalVariables.find(
          (v) => v.id === good.costVariableId,
        );

        if (!itemData || !varData) return;

        const stockKey = shop.id + "_" + index;
        if (
          gameState.shopStocks[stockKey] === undefined &&
          good.stock !== "" &&
          good.stock !== undefined
        ) {
          gameState.shopStocks[stockKey] = good.stock;
        }
        const currentStock =
          good.stock !== "" && good.stock !== undefined
            ? gameState.shopStocks[stockKey]
            : "infinite";
        const isSoldOut = currentStock !== "infinite" && currentStock <= 0;

        const playerVarVal = gameState.variables[good.costVariableId] || 0;
        const canAfford = playerVarVal >= good.price && !isSoldOut;

        const stockBadge =
          currentStock === "infinite"
            ? ""
            : `<span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600 whitespace-nowrap">剩餘: ${currentStock}</span>`;
        const typeBadge =
          itemData.type === "consumable"
            ? `<span class="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded-full border border-orange-700/50 whitespace-nowrap">消耗品</span>`
            : `<span class="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-700/50 whitespace-nowrap">永久道具</span>`;

        const card = document.createElement("div");
        card.className =
          "bg-gray-800 border border-gray-700 p-4 rounded-xl flex flex-col justify-between hover:border-yellow-500 transition shadow-lg";

        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-bold text-white truncate flex-1 pr-2">${itemData.name}</h3>
              <div class="flex space-x-1 items-center flex-shrink-0">
                ${stockBadge}
                ${typeBadge}
              </div>
            </div>
            <p class="text-sm text-gray-400 line-clamp-2 mb-3 h-10" title="${itemData.description || ""}">${itemData.description || "無說明"}</p>
          </div>
          <div class="flex justify-between items-center border-t border-gray-700 pt-3">
            <div class="flex items-center text-yellow-400 font-bold">
              <span class="mr-1 text-sm text-gray-400">${varData.name}:</span>
              ${good.price}
            </div>
            <button class="buy-btn px-4 py-1.5 rounded-lg font-bold transition text-sm shadow-md ${canAfford ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"}" ${canAfford ? "" : "disabled"}>
              ${isSoldOut ? "已售完" : "購買"}
            </button>
          </div>
        `;

        if (canAfford) {
          card.querySelector(".buy-btn").addEventListener("click", () => {
            gameState.variables[good.costVariableId] -= good.price;
            gameState.items[good.itemId] =
              (gameState.items[good.itemId] || 0) + 1;
            if (currentStock !== "infinite") {
              gameState.shopStocks[stockKey] -= 1;
            }
            renderDebugPanels(); // 更新左側除錯面板
            renderShopItems(); // 重新整理商店介面
          });
        }
        shopContainer.appendChild(card);
      });
    } else if (currentShopMode === "sell") {
      const ownedItems = Object.entries(gameState.items).filter(
        ([id, qty]) => qty > 0,
      );
      const sellableItems = ownedItems.filter(([id, qty]) => {
        const itemData = projectData.items.find((i) => i.id === id);
        return itemData && itemData.canSell;
      });

      if (sellableItems.length === 0) {
        shopContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">您持有之道具目前皆不可販賣。</div>`;
        return;
      }

      sellableItems.forEach(([itemId, qty]) => {
        const itemData = projectData.items.find((i) => i.id === itemId);
        const varData = projectData.globalVariables.find(
          (v) => v.id === itemData.sellVariableId,
        );
        if (!itemData || !varData) return;

        const typeBadge =
          itemData.type === "consumable"
            ? `<span class="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded-full border border-orange-700/50 whitespace-nowrap">消耗品</span>`
            : `<span class="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-700/50 whitespace-nowrap">永久道具</span>`;

        const card = document.createElement("div");
        card.className =
          "bg-gray-800 border border-gray-700 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500 transition shadow-lg";

        card.innerHTML = `
          <div>
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-bold text-white truncate flex-1 pr-2">${itemData.name}</h3>
              <div class="flex space-x-1 items-center flex-shrink-0">
                <span class="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50 whitespace-nowrap">持有: ${qty}</span>
                ${typeBadge}
              </div>
            </div>
            <p class="text-sm text-gray-400 line-clamp-2 mb-3 h-10" title="${itemData.description || ""}">${itemData.description || "無說明"}</p>
          </div>
          <div class="flex justify-between items-center border-t border-gray-700 pt-3">
            <div class="flex items-center text-emerald-400 font-bold">
              <span class="mr-1 text-sm text-gray-400">售出可得:</span>
              ${varData.name} +${itemData.sellPrice || 0}
            </div>
            <button class="sell-btn px-4 py-1.5 rounded-lg font-bold transition text-sm shadow-md bg-emerald-600 hover:bg-emerald-500 text-white">
              販賣
            </button>
          </div>
        `;

        card.querySelector(".sell-btn").addEventListener("click", () => {
          gameState.items[itemId] -= 1;
          gameState.variables[itemData.sellVariableId] =
            (gameState.variables[itemData.sellVariableId] || 0) +
            (itemData.sellPrice || 0);
          renderDebugPanels(); // 更新左側除錯面板
          renderShopItems(); // 重新整理商店介面
        });
        shopContainer.appendChild(card);
      });
    }
  }

  window.openShop = function (shopId) {
    const shop = (projectData.shops || []).find((s) => s.id === shopId);
    if (!shop) {
      alert("找不到商店資料！");
      return;
    }
    currentOpenShopId = shopId;
    currentShopMode = "buy";
    if (shopTabBuy && shopTabSell) {
      shopTabBuy.className =
        "text-yellow-400 font-bold px-4 py-2 border-b-2 border-yellow-500 transition";
      shopTabSell.className =
        "text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-yellow-300 transition";
    }

    shopTitle.innerHTML = `<svg class="w-6 h-6 mr-2 text-yellow-400 inline mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>${shop.name}`;
    shopDesc.textContent = shop.description || "";
    renderShopItems();

    shopModal.classList.remove("hidden");
    shopModal.classList.add("flex");
    setTimeout(() => {
      shopModal.classList.remove("opacity-0");
      shopModal.classList.add("opacity-100");
      const panel = document.getElementById("shop-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
    }, 10);
  };

  function closeShop() {
    shopModal.classList.remove("opacity-100");
    shopModal.classList.add("opacity-0");
    const panel = document.getElementById("shop-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    setTimeout(() => {
      shopModal.classList.remove("flex");
      shopModal.classList.add("hidden");
      currentOpenShopId = null;
    }, 300);
  }

  if (closeShopBtn) closeShopBtn.addEventListener("click", closeShop);
  if (shopModal) {
    shopModal.addEventListener("click", (e) => {
      if (e.target === shopModal) closeShop();
    });
  }

  // BGM 播放邏輯
  let currentBgmUrl = "";
  function playBgm(url) {
    if (!testBgmPlayer) return;
    if (!url) {
      testBgmPlayer.pause();
      currentBgmUrl = "";
      return;
    }
    if (url !== currentBgmUrl) {
      currentBgmUrl = url;
      testBgmPlayer.src = url;
      testBgmPlayer.volume = gameSettings.volume / 100;
      testBgmPlayer.play().catch((e) => console.warn("等待互動以播放音樂"));
    }
  }

  document.body.addEventListener(
    "click",
    () => {
      if (testBgmPlayer && testBgmPlayer.paused && currentBgmUrl) {
        testBgmPlayer.play().catch((e) => console.warn("播放音樂失敗", e));
      }
    },
    { once: true },
  );

  // 2. 渲染左側變數與道具監控面板
  function renderDebugPanels() {
    debugVariablesList.innerHTML = "";

    if (
      projectData.timeSettings &&
      projectData.timeSettings.enabled &&
      gameState.time
    ) {
      const hh = (gameState.time.hour || 0).toString().padStart(2, "0");
      const mm = (gameState.time.minute || 0).toString().padStart(2, "0");
      debugVariablesList.innerHTML += `
        <li class="flex justify-between border-b border-gray-800 pb-1 cursor-pointer hover:bg-gray-800/80 transition px-1 -mx-1 rounded" onclick="window.setDebugTime()" title="點擊修改時間">
          <span>系統時間:</span>
          <span class="text-blue-300 font-mono font-bold">D${gameState.time.day || 1} ${hh}:${mm}</span>
        </li>
      `;
    }

    if (projectData.globalVariables && projectData.globalVariables.length > 0) {
      projectData.globalVariables.forEach((v) => {
        const val = gameState.variables[v.id] || 0;
        let valColor = "text-blue-300";
        if (val < 0) valColor = "text-red-400";
        else if (val > 0) valColor = "text-emerald-300";

        debugVariablesList.innerHTML += `
          <li class="flex justify-between items-center border-b border-gray-800 pb-1 hover:bg-gray-800/80 transition px-1 -mx-1 rounded">
            <span class="truncate pr-2 cursor-pointer hover:text-white flex-1" onclick="window.setDebugVar('${v.id}')" title="點擊輸入指定數值">${v.name}:</span>
            <div class="flex items-center space-x-1.5">
              <button onclick="window.adjDebugVar('${v.id}', -1)" class="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-red-900/80 text-gray-400 hover:text-red-300 rounded border border-gray-700 hover:border-red-500 transition">-</button>
              <span class="${valColor} font-mono font-bold min-w-[1.5rem] text-center cursor-pointer hover:underline" onclick="window.setDebugVar('${v.id}')" title="點擊輸入指定數值">${val}</span>
              <button onclick="window.adjDebugVar('${v.id}', 1)" class="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-emerald-900/80 text-gray-400 hover:text-emerald-300 rounded border border-gray-700 hover:border-emerald-500 transition">+</button>
            </div>
          </li>
        `;
      });
    } else {
      debugVariablesList.innerHTML = `<li class="text-gray-500 italic text-center py-2">尚未設定全域變數</li>`;
    }

    debugItemsList.innerHTML = "";
    const allItems = projectData.items || [];
    if (allItems.length > 0) {
      allItems.forEach((itemData) => {
        const qty = gameState.items[itemData.id] || 0;
        const opacityClass = qty > 0 ? "opacity-100" : "opacity-50";
        debugItemsList.innerHTML += `
          <li class="flex justify-between items-center border-b border-gray-800 pb-1 hover:bg-gray-800/80 transition px-1 -mx-1 rounded ${opacityClass}">
            <span class="truncate pr-2 cursor-pointer hover:text-white flex-1" onclick="window.setDebugItem('${itemData.id}')" title="點擊輸入指定數量">${itemData.name}:</span>
            <div class="flex items-center space-x-1.5">
              <button onclick="window.adjDebugItem('${itemData.id}', -1)" class="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-red-900/80 text-gray-400 hover:text-red-300 rounded border border-gray-700 hover:border-red-500 transition">-</button>
              <span class="text-yellow-400 font-mono font-bold min-w-[1.5rem] text-center cursor-pointer hover:underline" onclick="window.setDebugItem('${itemData.id}')" title="點擊輸入指定數量">x${qty}</span>
              <button onclick="window.adjDebugItem('${itemData.id}', 1)" class="w-5 h-5 flex items-center justify-center bg-gray-800 hover:bg-emerald-900/80 text-gray-400 hover:text-emerald-300 rounded border border-gray-700 hover:border-emerald-500 transition">+</button>
            </div>
          </li>
        `;
      });
    } else {
      debugItemsList.innerHTML = `<li class="text-gray-500 italic text-center py-2">尚未建立道具</li>`;
    }
  }

  // 全域除錯修改函式
  window.setDebugTime = function () {
    const newTime = prompt(
      "請輸入新的時間 (格式 HH:MM，例如 14:30):",
      `${(gameState.time.hour || 0).toString().padStart(2, "0")}:${(gameState.time.minute || 0).toString().padStart(2, "0")}`,
    );
    if (newTime && newTime.includes(":")) {
      const parts = newTime.split(":");
      gameState.time.hour = parseInt(parts[0], 10) || 0;
      gameState.time.minute = parseInt(parts[1], 10) || 0;
      renderDebugPanels();
      renderScene(gameState.currentSceneId); // 重新渲染場景以更新條件選項
    }
  };

  window.setDebugVar = function (varId) {
    const v = projectData.globalVariables.find((x) => x.id === varId);
    if (!v) return;
    const newVal = prompt(
      `請輸入 [${v.name}] 的新數值:`,
      gameState.variables[varId] || 0,
    );
    if (newVal !== null && newVal !== "") {
      gameState.variables[varId] = Number(newVal);
      renderDebugPanels();
      if (!checkGlobalTriggers()) renderScene(gameState.currentSceneId); // 驗證並重繪
    }
  };

  window.adjDebugVar = function (varId, delta) {
    gameState.variables[varId] = (gameState.variables[varId] || 0) + delta;
    renderDebugPanels();
    if (!checkGlobalTriggers()) renderScene(gameState.currentSceneId);
  };

  window.setDebugItem = function (itemId) {
    const itemData = projectData.items.find((x) => x.id === itemId);
    if (!itemData) return;
    const newVal = prompt(
      `請輸入 [${itemData.name}] 的持有數量 (輸入 0 則移除):`,
      gameState.items[itemId] || 0,
    );
    if (newVal !== null && newVal !== "") {
      gameState.items[itemId] = Math.max(0, Number(newVal));
      renderDebugPanels();
      if (!checkGlobalTriggers()) renderScene(gameState.currentSceneId);
    }
  };

  window.adjDebugItem = function (itemId, delta) {
    gameState.items[itemId] = Math.max(
      0,
      (gameState.items[itemId] || 0) + delta,
    );
    renderDebugPanels();
    if (!checkGlobalTriggers()) renderScene(gameState.currentSceneId);
  };

  window.editCurrentScene = function () {
    localStorage.setItem("textAdventureJumpToScene", gameState.currentSceneId);
    window.location.href = "editor.html";
  };

  // 3. 填入強制跳轉的下拉選單
  function populateSceneDropdown() {
    debugSceneSelect.innerHTML = "";
    if (!projectData.scenes || projectData.scenes.length === 0) {
      debugSceneSelect.innerHTML = `<option value="">-- 無可用場景 --</option>`;
      forceJumpBtn.disabled = true;
      return;
    }

    projectData.scenes.forEach((scene) => {
      debugSceneSelect.innerHTML += `<option value="${scene.id}">${scene.name} (${scene.id})</option>`;
    });
  }

  // 4. 條件判定與觸發器
  function evaluateCondition(op, currentVal, targetVal) {
    currentVal = Number(currentVal) || 0;
    targetVal = Number(targetVal) || 0;
    switch (op) {
      case ">=":
        return currentVal >= targetVal;
      case "<=":
        return currentVal <= targetVal;
      case "==":
        return currentVal === targetVal;
      case "!=":
        return currentVal !== targetVal;
      case ">":
        return currentVal > targetVal;
      case "<":
        return currentVal < targetVal;
      default:
        return true;
    }
  }

  function checkConditions(conditions) {
    if (!conditions) return true;
    if (conditions.variables) {
      for (const [varId, cond] of Object.entries(conditions.variables)) {
        const currentVal = gameState.variables[varId] || 0;
        if (!evaluateCondition(cond.op, currentVal, cond.val)) return false;
      }
    }
    if (conditions.items) {
      for (const [itemId, cond] of Object.entries(conditions.items)) {
        const currentQty = gameState.items[itemId] || 0;
        if (!evaluateCondition(cond.op, currentQty, cond.val)) return false;
      }
    }
    if (conditions.chapter) {
      const currentChapIdx = projectData.chapters.findIndex(
        (c) => c.id === gameState.chapterId,
      );
      const targetChapIdx = projectData.chapters.findIndex(
        (c) => c.id === conditions.chapter,
      );
      if (currentChapIdx < targetChapIdx && currentChapIdx !== -1) return false;
    }
    if (
      conditions.time &&
      projectData.timeSettings &&
      projectData.timeSettings.enabled &&
      gameState.time
    ) {
      const curHour = gameState.time.hour || 0;
      const minH = conditions.time.minHour;
      const maxH = conditions.time.maxHour;
      if (minH <= maxH) {
        if (curHour < minH || curHour > maxH) return false;
      } else {
        if (curHour > maxH && curHour < minH) return false;
      }
    }
    return true;
  }

  function advanceTime(minutes) {
    if (
      !projectData.timeSettings ||
      !projectData.timeSettings.enabled ||
      !minutes
    )
      return;
    let m = (gameState.time.minute || 0) + minutes;
    let h = (gameState.time.hour || 0) + Math.floor(m / 60);
    gameState.time.minute = m % 60;
    gameState.time.day = (gameState.time.day || 1) + Math.floor(h / 24);
    gameState.time.hour = h % 24;
  }

  function applyEffects(
    varId,
    varVal,
    targetItemId,
    itemAction,
    itemVal,
    passTime,
  ) {
    let changed = false;
    if (varId && varVal !== "") {
      gameState.variables[varId] =
        (gameState.variables[varId] || 0) + Number(varVal);
      changed = true;
    }
    if (targetItemId && itemAction) {
      const currentQty = gameState.items[targetItemId] || 0;
      const changeQty = Number(itemVal) || 1;
      if (itemAction === "give") {
        gameState.items[targetItemId] = currentQty + changeQty;
      } else if (itemAction === "take") {
        gameState.items[targetItemId] = Math.max(0, currentQty - changeQty);
      }
      changed = true;
    }
    if (passTime) {
      advanceTime(Number(passTime));
      changed = true;
    }
    if (changed) renderDebugPanels();
  }

  function checkGlobalTriggers() {
    if (!projectData.triggers) return false;
    for (const trigger of projectData.triggers) {
      if (checkConditions(trigger.conditions)) {
        if (
          trigger.targetSceneId &&
          trigger.targetSceneId === gameState.currentSceneId
        ) {
          continue;
        }
        applyEffects(
          trigger.variableId,
          trigger.variableVal,
          trigger.targetItemId,
          trigger.itemAction,
          trigger.itemVal,
          trigger.passTime,
        );
        if (trigger.targetSceneId) {
          console.warn(`[觸發器] 觸發了全域事件：${trigger.name}`);
          handleJump(trigger.targetSceneId, gameState.currentSceneId, true);
          return true;
        }
      }
    }
    return false;
  }

  // 權重隨機抽取場景
  function getWeightedRandomScene(scenesArray) {
    let totalWeight = 0;
    const validScenes = [];
    scenesArray.forEach((s) => {
      const weight = s.randomWeight !== undefined ? Number(s.randomWeight) : 1;
      if (weight > 0) {
        totalWeight += weight;
        validScenes.push({ scene: s, weight });
      }
    });
    if (totalWeight <= 0 || validScenes.length === 0) {
      if (scenesArray.length > 0)
        return scenesArray[Math.floor(Math.random() * scenesArray.length)].id;
      return null;
    }
    let random = Math.random() * totalWeight;
    for (let i = 0; i < validScenes.length; i++) {
      random -= validScenes[i].weight;
      if (random <= 0) return validScenes[i].scene.id;
    }
    return validScenes[validScenes.length - 1].scene.id;
  }

  // 5. 渲染指定場景畫面
  function renderScene(sceneId) {
    if (!projectData.scenes) return;
    const scene = projectData.scenes.find((s) => s.id === sceneId);

    if (!scene) {
      dialogueName.textContent = "系統警告";
      dialogueText.innerHTML = `<span class="text-red-400">找不到場景 ID: ${sceneId}</span>`;
      optionsContainer.innerHTML = "";
      return;
    }

    clearSceneTimer();

    const previousChapterId = gameState.chapterId;
    gameState.currentSceneId = sceneId;
    if (scene.chapterId && scene.chapterId !== previousChapterId) {
      gameState.chapterId = scene.chapterId;
    }

    // 同步更新左側除錯面板的選單位置
    debugSceneSelect.value = scene.id;

    if (checkGlobalTriggers()) return;

    // 處理背景音樂 (優先抓取場景設定，再抓取章節設定，最後預設背景音樂)
    let bgmToPlay = scene.bgmUrl;
    if (!bgmToPlay) {
      const chapter = projectData.chapters
        ? projectData.chapters.find((c) => c.id === scene.chapterId)
        : null;
      if (chapter && chapter.bgmUrl) {
        bgmToPlay = chapter.bgmUrl;
      } else if (
        projectData.projectInfo &&
        projectData.projectInfo.defaultBgmUrl
      ) {
        bgmToPlay = projectData.projectInfo.defaultBgmUrl;
      }
    }
    playBgm(bgmToPlay);

    // 處理背景圖片 (優先抓取場景設定，再抓取章節設定，最後預設背景)
    if (scene.bgUrl) {
      testBg.style.backgroundImage = `url('${scene.bgUrl}')`;
      testBg.style.opacity = "0.7";
    } else {
      const chapter = projectData.chapters
        ? projectData.chapters.find((c) => c.id === scene.chapterId)
        : null;
      if (chapter && chapter.coverUrl) {
        testBg.style.backgroundImage = `url('${chapter.coverUrl}')`;
        testBg.style.opacity = "0.7";
      } else if (
        projectData.projectInfo &&
        projectData.projectInfo.defaultBgUrl
      ) {
        testBg.style.backgroundImage = `url('${projectData.projectInfo.defaultBgUrl}')`;
        testBg.style.opacity = "0.7";
      } else {
        testBg.style.backgroundImage = "none";
      }
    }

    // 處理轉場動畫 (針對背景圖)
    const transitionType = scene.transition || "fade";
    testBg.style.animation = "none";
    void testBg.offsetWidth; // 觸發重繪
    if (transitionType === "fade")
      testBg.style.animation = "sceneFadeIn 0.8s ease-in-out forwards";
    else if (transitionType === "slide-left")
      testBg.style.animation = "sceneSlideLeft 0.6s ease-out forwards";
    else if (transitionType === "slide-right")
      testBg.style.animation = "sceneSlideRight 0.6s ease-out forwards";
    else if (transitionType === "zoom-in")
      testBg.style.animation = "sceneZoomIn 0.8s ease-out forwards";
    else if (transitionType === "blur-in")
      testBg.style.animation = "sceneBlurIn 0.8s ease-out forwards";
    else if (transitionType === "slide-up")
      testBg.style.animation = "sceneSlideUp 0.6s ease-out forwards";
    else if (transitionType === "slide-down")
      testBg.style.animation = "sceneSlideDown 0.6s ease-out forwards";
    else if (transitionType === "spin-in")
      testBg.style.animation = "sceneSpinIn 0.8s ease-out forwards";
    else if (transitionType === "flash")
      testBg.style.animation = "sceneFlash 0.6s ease-in-out forwards";

    // 處理事件 CG 影片
    if (testCgVideo) {
      if (scene.cgVideoUrl) {
        if (testCgVideo.src !== scene.cgVideoUrl) {
          testCgVideo.src = scene.cgVideoUrl;
        }
        testCgVideo.volume = gameSettings.volume / 100;
        // 測試模式直接播放，並給予淡入效果
        testCgVideo.classList.remove("hidden");
        testCgVideo.play().catch((e) => console.warn("CG 影片播放失敗", e));
        setTimeout(() => {
          testCgVideo.classList.remove("opacity-0");
          testCgVideo.classList.add("opacity-100");
        }, 10);
      } else {
        testCgVideo.classList.remove("opacity-100");
        testCgVideo.classList.add("opacity-0");
        setTimeout(() => {
          if (testCgVideo.classList.contains("opacity-0")) {
            testCgVideo.classList.add("hidden");
            testCgVideo.pause();
            testCgVideo.src = "";
          }
        }, 500);
      }
    }

    // 處理角色立繪
    if (testSceneSprite) {
      if (scene.spriteUrl) {
        testSceneSprite.src = scene.spriteUrl;
        testSceneSprite.classList.remove("hidden");
        setTimeout(() => {
          testSceneSprite.classList.remove("opacity-0");
          testSceneSprite.classList.add("opacity-100");
        }, 10);
      } else {
        testSceneSprite.classList.remove("opacity-100");
        testSceneSprite.classList.add("opacity-0");
        setTimeout(() => {
          if (testSceneSprite.classList.contains("opacity-0")) {
            testSceneSprite.classList.add("hidden");
          }
        }, 500);
      }
    }

    // 處理 NPC 名稱與頭像
    if (dialogueAvatar) {
      dialogueAvatar.classList.add("hidden");
      dialogueAvatar.src = "";
    }
    if (scene.npcId && projectData.npcs) {
      const npc = projectData.npcs.find((n) => n.id === scene.npcId);
      if (npc) {
        if (npc.enableCondition && !checkConditions(npc.conditions)) {
          if (scene.skipIfNpcMissing) {
            const validOpt = (scene.options || []).find(
              (o) => !o.enableCondition || checkConditions(o.conditions),
            );
            if (validOpt) {
              applyEffects(
                validOpt.variableId,
                validOpt.variableVal,
                validOpt.itemId,
                validOpt.itemAction,
                validOpt.itemVal,
                validOpt.passTime,
              );
              handleJump(validOpt.targetSceneId, scene.id);
            } else {
              const idx = projectData.scenes.findIndex(
                (s) => s.id === scene.id,
              );
              if (idx !== -1 && idx < projectData.scenes.length - 1)
                handleJump(projectData.scenes[idx + 1].id, scene.id);
            }
            return;
          }
        } else {
          dialogueName.textContent = npc.name;
          dialogueName.classList.remove("hidden");
          if (npc.avatarUrl && dialogueAvatar) {
            dialogueAvatar.src = npc.avatarUrl;
            dialogueAvatar.classList.remove("hidden");
          }
        }
      }
    } else {
      dialogueName.textContent = "旁白";
    }

    // 處理文字文本 (支援換行)
    dialogueText.innerHTML = scene.text
      ? scene.text.replace(/\n/g, "<br>")
      : "...";
    dialogueText.scrollTop = 0; // 確保過長的文本載入時維持在最上方

    // 處理選項
    optionsContainer.innerHTML = "";

    if (scene.isEnding) {
      const btn = document.createElement("button");
      btn.className =
        "bg-yellow-900/80 hover:bg-yellow-700 text-white px-4 py-2 rounded border border-yellow-500 text-sm transition shadow-md";
      btn.textContent = `🌟 結局：${scene.endingName || "未知結局"}`;
      optionsContainer.appendChild(btn);
      return;
    }

    const validOptions = (scene.options || []).filter(
      (opt) => !opt.enableCondition || checkConditions(opt.conditions),
    );

    if (validOptions.length > 0) {
      const optionsPerPage = 4;
      const totalPages = Math.ceil(validOptions.length / optionsPerPage);

      function drawPage(page) {
        optionsContainer.innerHTML = "";
        const startIdx = (page - 1) * optionsPerPage;
        const pageOptions = validOptions.slice(
          startIdx,
          startIdx + optionsPerPage,
        );

        pageOptions.forEach((opt) => {
          const btn = document.createElement("button");
          btn.className =
            "bg-blue-900/80 hover:bg-blue-700 text-white px-4 py-2 rounded border border-blue-500 text-sm transition shadow-md whitespace-normal break-words leading-relaxed text-left w-full";
          btn.textContent = opt.text || "繼續";

          btn.addEventListener("click", () => {
            applyEffects(
              opt.variableId,
              opt.variableVal,
              opt.itemId,
              opt.itemAction,
              opt.itemVal,
              opt.passTime,
            );
            handleJump(opt.targetSceneId, scene.id);
          });

          optionsContainer.appendChild(btn);
        });

        if (totalPages > 1) {
          const paginationEl = document.createElement("div");
          paginationEl.className =
            "flex justify-end items-center mt-2 gap-3 w-full";

          const pageInfo = document.createElement("span");
          pageInfo.className =
            "text-gray-400 font-bold font-mono text-xs select-none mr-2";
          pageInfo.textContent = `${page} / ${totalPages}`;

          const prevBtn = document.createElement("button");
          prevBtn.className = `w-8 h-8 flex items-center justify-center rounded transition shadow-md border ${page === 1 ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed" : "bg-blue-900/80 text-blue-300 hover:text-white border-blue-500 hover:bg-blue-700"}`;
          prevBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`;
          prevBtn.disabled = page === 1;
          prevBtn.onclick = () => {
            if (page > 1) drawPage(page - 1);
          };

          const nextBtn = document.createElement("button");
          nextBtn.className = `w-8 h-8 flex items-center justify-center rounded transition shadow-md border ${page === totalPages ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed" : "bg-blue-900/80 text-blue-300 hover:text-white border-blue-500 hover:bg-blue-700"}`;
          nextBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
          nextBtn.disabled = page === totalPages;
          nextBtn.onclick = () => {
            if (page < totalPages) drawPage(page + 1);
          };

          paginationEl.appendChild(pageInfo);
          paginationEl.appendChild(prevBtn);
          paginationEl.appendChild(nextBtn);
          optionsContainer.appendChild(paginationEl);
        }
      }

      drawPage(1);
    } else {
      const idx = projectData.scenes.findIndex((s) => s.id === scene.id);
      if (idx !== -1 && idx < projectData.scenes.length - 1) {
        const btn = document.createElement("button");
        btn.className =
          "bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-500 text-sm transition shadow-md whitespace-normal break-words leading-relaxed w-full";
        btn.textContent = "繼續";
        btn.onclick = () =>
          handleJump(projectData.scenes[idx + 1].id, scene.id);
        optionsContainer.appendChild(btn);
      } else {
        dialogueText.innerHTML += `<br><br><span class="text-gray-400 italic">（此處沒有後續選項，劇情結束）</span>`;
      }
    }

    startSceneTimer(scene);
  }

  function handleJump(targetId, currentId, fromTrigger = false) {
    if (!targetId) return;

    clearSceneTimer();

    if (targetId.startsWith("__SHOP__")) {
      const shopId = targetId.replace("__SHOP__", "");
      window.openShop(shopId);
      return;
    }

    if (targetId.startsWith("__QUIZ__")) {
      const quizId = targetId.replace("__QUIZ__", "");
      const quiz = (projectData.quizzes || []).find((q) => q.id === quizId);
      if (quiz) {
        const userInput = prompt(
          `[測試模式] 測驗：${quiz.name}\n${quiz.question}`,
        );
        if (userInput !== null) {
          const validAnswers = (quiz.answers || "")
            .split(",")
            .map((s) => s.trim().toLowerCase());
          if (validAnswers.includes(userInput.trim().toLowerCase())) {
            alert("答對了！");
            if (quiz.successSceneId) handleJump(quiz.successSceneId, currentId);
          } else {
            alert("答錯了！");
            if (quiz.failureSceneId) handleJump(quiz.failureSceneId, currentId);
          }
        }
      }
      return;
    }

    if (targetId === "__PREVIOUS__") {
      targetId = gameState.visitedScenes.pop() || gameState.currentSceneId;
    } else {
      if (!fromTrigger) gameState.visitedScenes.push(currentId);
      if (targetId === "__UP__" || targetId === "__DOWN__") {
        const idx = projectData.scenes.findIndex((s) => s.id === currentId);
        if (targetId === "__UP__" && idx > 0)
          targetId = projectData.scenes[idx - 1].id;
        else if (targetId === "__DOWN__" && idx < projectData.scenes.length - 1)
          targetId = projectData.scenes[idx + 1].id;
        else targetId = currentId;
      } else if (targetId.startsWith("__RANDOM_IN_CHAP__")) {
        const targetChapId = targetId.replace("__RANDOM_IN_CHAP__", "");
        const chapScenes = projectData.scenes.filter(
          (s) => s.chapterId === targetChapId,
        );
        if (chapScenes.length > 0) {
          targetId = getWeightedRandomScene(chapScenes) || currentId;
        } else {
          targetId = currentId;
        }
      } else if (targetId === "__RANDOM_ALL__") {
        if (projectData.scenes && projectData.scenes.length > 0) {
          targetId = getWeightedRandomScene(projectData.scenes) || currentId;
        } else {
          targetId = currentId;
        }
      } else if (targetId.startsWith("chapter_")) {
        const chapScenes = projectData.scenes.filter(
          (s) => s.chapterId === targetId,
        );
        if (chapScenes.length > 0) targetId = chapScenes[0].id;
        else targetId = currentId;
      }
    }
    renderScene(targetId);
  }

  // 事件監聽：強制跳轉按鈕
  forceJumpBtn.addEventListener("click", () =>
    renderScene(debugSceneSelect.value),
  );

  // 6. 快捷鍵功能 (空白鍵 / Enter 快速推進測試)
  document.addEventListener("keydown", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT"
    )
      return;

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (optionsContainer && optionsContainer.children.length > 0) {
        const firstBtn = optionsContainer.querySelector("button");
        if (firstBtn && !firstBtn.disabled) {
          firstBtn.click();
        }
      }
    }
  });

  // 初始化畫面
  populateSceneDropdown();
  renderDebugPanels();
  if (projectData.scenes && projectData.scenes.length > 0)
    renderScene(projectData.scenes[0].id);
});
