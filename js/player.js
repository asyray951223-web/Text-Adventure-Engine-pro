// 遊戲遊玩核心引擎 (Player Engine)

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
        100% { width: 120px; height: 120px; opacity: 0; border: 1px solid currentColor; background: transparent; box-shadow: 0 0 20px currentColor; }
      }
    `;
    document.head.appendChild(rippleStyle);

    document.addEventListener("mousedown", (e) => {
      const ripple = document.createElement("div");
      ripple.className = "click-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      // 根據主題設定水波紋顏色 (中國風：古典暗金，科幻大廳：霓虹冰藍)
      if (document.body.classList.contains("bg-[#120f0d]")) {
        ripple.style.color = "rgba(205, 168, 124, 0.6)";
      } else {
        ripple.style.color = "rgba(96, 165, 250, 0.6)";
      }
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // 動態注入玩家介面的自訂捲軸 (Scrollbar) 樣式，符合遊戲的深色質感
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
        background: rgba(96, 165, 250, 0.8); /* 懸停時變為藍色發光感 */
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(75, 85, 99, 0.8) transparent;
      }
    `;
    document.head.appendChild(scrollbarStyle);
  }

  // 動態注入額外的轉場動畫 Keyframes
  if (!document.getElementById("extra-transitions-style")) {
    const style = document.createElement("style");
    style.id = "extra-transitions-style";
    style.innerHTML = `
      @keyframes sceneFadeIn { from { opacity: 0; filter: brightness(0); } to { opacity: 1; filter: brightness(1); } }
      @keyframes sceneSlideLeft { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes sceneSlideRight { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes sceneZoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes sceneFlash { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(2) contrast(1.5); opacity: 0.8; } }
      @keyframes sceneBlurIn { from { filter: blur(20px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
      @keyframes sceneSlideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes sceneSlideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes sceneSpinIn { from { transform: rotate(-180deg) scale(0.5); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // DOM 元素綁定
  const dialogueBox = document.getElementById("dialogue-box");
  const nameTag = document.getElementById("dialogue-name");
  const dialogueAvatar = document.getElementById("dialogue-avatar");
  const textContainer = document.getElementById("dialogue-text");
  const optionsContainer = document.querySelector(".z-30");
  const topBarVars = document.getElementById("top-bar-vars");
  const bgLayer =
    document.getElementById("bg-layer") || document.querySelector(".bg-cover");

  // 定時炸彈計時器
  const dialogueTimerContainer = document.getElementById(
    "dialogue-timer-container",
  );
  const dialogueTimerBar = document.getElementById("dialogue-timer-bar");
  let sceneTimerInterval = null;
  let sceneTimerTimeout = null;

  function clearSceneTimer() {
    if (sceneTimerInterval) clearInterval(sceneTimerInterval);
    if (sceneTimerTimeout) clearTimeout(sceneTimerTimeout);
    if (dialogueTimerContainer) {
      dialogueTimerContainer.classList.add("hidden");
      dialogueTimerContainer.classList.remove(
        "shadow-[0_0_15px_rgba(239,68,68,0.6)]",
      );
    }
  }

  function startSceneTimer(scene) {
    if (!scene.timeLimit || scene.timeLimit <= 0) return;
    if (dialogueTimerContainer) {
      dialogueTimerContainer.classList.remove("hidden");
      dialogueTimerContainer.classList.add(
        "shadow-[0_0_15px_rgba(239,68,68,0.6)]",
      );
      if (dialogueTimerBar) dialogueTimerBar.style.width = "100%";
    }
    const durationMs = scene.timeLimit * 1000;
    const startTime = Date.now();
    sceneTimerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentage = Math.max(
        0,
        ((durationMs - elapsed) / durationMs) * 100,
      );
      if (dialogueTimerBar) dialogueTimerBar.style.width = `${percentage}%`;
    }, 16);
    sceneTimerTimeout = setTimeout(() => {
      clearSceneTimer();
      handleJump(scene.timeOutSceneId, scene.id);
    }, durationMs);
  }

  // 為對話文本與選項區塊動態加上自訂捲軸樣式，避免文本或選項過多時出現預設捲軸
  if (textContainer) textContainer.classList.add("custom-scrollbar");
  if (optionsContainer) optionsContainer.classList.add("custom-scrollbar");

  const inventoryBtn = document.getElementById("inventory-btn");
  const inventoryModal = document.getElementById("inventory-modal");
  const closeInventoryBtn = document.getElementById("close-inventory-btn");
  const inventoryContainer = document.getElementById("inventory-container");
  const achievementPopupContainer = document.getElementById(
    "achievement-popup-container",
  );

  // 建立辭典按鈕與 Modal (動態注入)
  let dictionaryBtn = document.getElementById("dictionary-btn");
  let dictionaryModal = document.getElementById("dictionary-modal");
  let dictionaryContainer = document.getElementById("dictionary-container");
  let closeDictionaryBtn = document.getElementById("close-dictionary-btn");

  if (!dictionaryBtn) {
    dictionaryBtn = document.createElement("button");
    dictionaryBtn.id = "dictionary-btn";
    dictionaryBtn.className =
      "fixed bottom-6 left-6 z-40 flex items-center justify-center bg-black/60 hover:bg-blue-900/80 text-white p-3 rounded-full border border-gray-600 hover:border-blue-400 shadow-lg backdrop-blur-sm transition-all duration-300";
    dictionaryBtn.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`;
    dictionaryBtn.title = "辭典";
    document.body.appendChild(dictionaryBtn);
  }

  if (!dictionaryModal && document.body) {
    dictionaryModal = document.createElement("div");
    dictionaryModal.id = "dictionary-modal";
    dictionaryModal.className =
      "fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    dictionaryModal.innerHTML = `
      <div id="dictionary-panel" class="bg-gray-900 w-11/12 max-w-4xl h-5/6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300">
        <div class="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 class="text-2xl font-extrabold text-white flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            辭典與世界觀
          </h2>
          <button id="close-dictionary-btn" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div id="dictionary-container" class="flex-1 flex flex-col p-6 overflow-hidden">
        </div>
      </div>
    `;
    document.body.appendChild(dictionaryModal);
    dictionaryContainer = document.getElementById("dictionary-container");
    closeDictionaryBtn = document.getElementById("close-dictionary-btn");
  }

  // 建立商店 Modal (動態注入)
  let shopModal = document.getElementById("shop-modal");
  let shopContainer = document.getElementById("shop-container");
  let closeShopBtn = document.getElementById("close-shop-btn");
  let shopTitle = document.getElementById("shop-title");
  let shopDesc = document.getElementById("shop-desc");
  let shopTabBuy = document.getElementById("shop-tab-buy");
  let shopTabSell = document.getElementById("shop-tab-sell");
  let currentShopMode = "buy";

  if (!shopModal && document.body) {
    shopModal = document.createElement("div");
    shopModal.id = "shop-modal";
    shopModal.className =
      "fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    shopModal.innerHTML = `
      <div id="shop-panel" class="bg-gray-900 w-11/12 max-w-4xl h-5/6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300">
        <div class="flex justify-between items-center p-6 border-b border-gray-800">
          <div>
            <h2 id="shop-title" class="text-2xl font-extrabold text-white flex items-center">
              <svg class="w-6 h-6 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              商店
            </h2>
            <p id="shop-desc" class="text-sm text-gray-400 mt-1"></p>
          </div>
          <button id="close-shop-btn" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="flex space-x-4 px-6 pt-4 border-b border-gray-800">
          <button id="shop-tab-buy" class="text-yellow-400 font-bold px-4 py-2 border-b-2 border-yellow-500 transition">購買商品</button>
          <button id="shop-tab-sell" class="text-gray-400 font-bold px-4 py-2 border-b-2 border-transparent hover:text-yellow-300 transition">販賣道具</button>
        </div>
        <div id="shop-container" class="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
        </div>
      </div>
    `;
    document.body.appendChild(shopModal);
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

  let currentOpenShopId = null;

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
            if (good.price > 0)
              showVariablePopup(good.costVariableId, -good.price);
            gameState.items[good.itemId] =
              (gameState.items[good.itemId] || 0) + 1;
            if (currentStock !== "infinite") {
              gameState.shopStocks[stockKey] -= 1;
            }
            updateTopBar();
            showItemPopup(itemData, 1);
            renderShopItems();
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
        shopContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">您背包中目前沒有可以販賣的道具。</div>`;
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
          if (itemData.sellPrice > 0)
            showVariablePopup(itemData.sellVariableId, itemData.sellPrice);
          updateTopBar();
          showToast(`售出了 ${itemData.name}`);
          renderShopItems();
        });
        shopContainer.appendChild(card);
      });
    }
  }

  function openShop(shopId) {
    const shop = (projectData.shops || []).find((s) => s.id === shopId);
    if (!shop) return;
    currentOpenShopId = shopId;
    currentShopMode = "buy"; // 開啟時預設重置為購買分頁
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
  }

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

  // 建立測驗 Modal (動態注入)
  let quizModal = document.getElementById("quiz-modal");
  let quizQuestion = document.getElementById("quiz-question");
  let quizInput = document.getElementById("quiz-input");
  let quizSubmitBtn = document.getElementById("quiz-submit-btn");
  let closeQuizBtn = document.getElementById("close-quiz-btn");
  let currentOpenQuizId = null;

  if (!quizModal && document.body) {
    quizModal = document.createElement("div");
    quizModal.id = "quiz-modal";
    quizModal.className =
      "fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    quizModal.innerHTML = `
      <div id="quiz-panel" class="bg-gray-900 w-11/12 max-w-md rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300 p-6 relative">
        <button id="close-quiz-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center">
          <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M4 6h16v12H4z"></path></svg>
          測驗
        </h2>
        <p id="quiz-question" class="text-gray-300 mb-6 text-sm leading-relaxed whitespace-pre-wrap"></p>
        <input type="text" id="quiz-input" class="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-3 mb-6 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="請輸入答案...">
        <button id="quiz-submit-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition shadow-md">
          送出答案
        </button>
      </div>
    `;
    document.body.appendChild(quizModal);
    quizQuestion = document.getElementById("quiz-question");
    quizInput = document.getElementById("quiz-input");
    quizSubmitBtn = document.getElementById("quiz-submit-btn");
    closeQuizBtn = document.getElementById("close-quiz-btn");
  }

  function openQuiz(quizId) {
    const quiz = (projectData.quizzes || []).find((q) => q.id === quizId);
    if (!quiz) return;
    currentOpenQuizId = quizId;
    quizQuestion.textContent = quiz.question || "請輸入答案：";
    quizInput.value = "";

    quizModal.classList.remove("hidden");
    quizModal.classList.add("flex");
    setTimeout(() => {
      quizModal.classList.remove("opacity-0");
      quizModal.classList.add("opacity-100");
      const panel = document.getElementById("quiz-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
      quizInput.focus();
    }, 10);
  }

  function closeQuiz() {
    quizModal.classList.remove("opacity-100");
    quizModal.classList.add("opacity-0");
    const panel = document.getElementById("quiz-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    setTimeout(() => {
      quizModal.classList.remove("flex");
      quizModal.classList.add("hidden");
      currentOpenQuizId = null;
    }, 300);
  }

  if (closeQuizBtn) closeQuizBtn.addEventListener("click", closeQuiz);
  if (quizModal) {
    quizModal.addEventListener("click", (e) => {
      if (e.target === quizModal) closeQuiz();
    });
  }

  function submitQuiz() {
    if (!currentOpenQuizId) return;
    const quiz = (projectData.quizzes || []).find(
      (q) => q.id === currentOpenQuizId,
    );
    if (!quiz) return;

    const userInput = quizInput.value.trim().toLowerCase();
    const validAnswers = (quiz.answers || "")
      .split(",")
      .map((s) => s.trim().toLowerCase());

    closeQuiz();

    if (validAnswers.includes(userInput)) {
      showToast("答對了！");
      if (quiz.successSceneId) {
        handleJump(quiz.successSceneId, gameState.currentSceneId);
      }
    } else {
      showToast("答案不正確...");
      if (quiz.failureSceneId) {
        handleJump(quiz.failureSceneId, gameState.currentSceneId);
      }
    }
  }

  if (quizSubmitBtn) quizSubmitBtn.addEventListener("click", submitQuiz);
  if (quizInput) {
    quizInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitQuiz();
      }
    });
  }

  // 建立變數說明 Modal (動態注入)
  let varInfoModal = document.getElementById("var-info-modal");
  let varInfoTitle = null;
  let varInfoDesc = null;

  if (!varInfoModal && document.body) {
    varInfoModal = document.createElement("div");
    varInfoModal.id = "var-info-modal";
    varInfoModal.className =
      "fixed inset-0 z-[110] hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    varInfoModal.innerHTML = `
      <div id="var-info-panel" class="bg-gray-900 w-11/12 max-w-sm rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300 relative p-6">
        <button id="close-var-info-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 id="var-info-title" class="text-2xl font-bold text-blue-400 mb-4 flex items-center pr-10"></h2>
        <p id="var-info-desc" class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"></p>
      </div>
    `;
    document.body.appendChild(varInfoModal);
    varInfoTitle = document.getElementById("var-info-title");
    varInfoDesc = document.getElementById("var-info-desc");

    document
      .getElementById("close-var-info-btn")
      .addEventListener("click", closeVarInfo);
    varInfoModal.addEventListener("click", (e) => {
      if (e.target === varInfoModal) closeVarInfo();
    });
  }

  window.showVarInfo = function (name, desc) {
    if (!varInfoModal) return;
    varInfoTitle.innerHTML = `<svg class="w-6 h-6 mr-2 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="truncate">${name}</span>`;
    varInfoDesc.textContent = desc;

    varInfoModal.classList.remove("hidden");
    varInfoModal.classList.add("flex");
    setTimeout(() => {
      varInfoModal.classList.remove("opacity-0");
      varInfoModal.classList.add("opacity-100");
      const panel = document.getElementById("var-info-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
    }, 10);
  };

  function closeVarInfo() {
    if (!varInfoModal) return;
    varInfoModal.classList.remove("opacity-100");
    varInfoModal.classList.add("opacity-0");
    const panel = document.getElementById("var-info-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    setTimeout(() => {
      varInfoModal.classList.remove("flex");
      varInfoModal.classList.add("hidden");
    }, 300);
  }

  // 建立歷史紀錄 Modal (動態注入)
  let logModal = document.getElementById("log-modal");
  let logContainer = null;
  let closeLogBtn = null;
  const openLogBtn = document.getElementById("open-log-btn");

  if (!logModal && document.body) {
    logModal = document.createElement("div");
    logModal.id = "log-modal";
    logModal.className =
      "fixed inset-0 z-[100] hidden items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300";
    logModal.innerHTML = `
      <div id="log-panel" class="bg-gray-900 w-11/12 max-w-3xl h-[80vh] rounded-2xl border border-gray-700 shadow-2xl flex flex-col transform scale-95 translate-y-8 transition-all duration-300 relative">
        <div class="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-800 rounded-t-2xl">
          <h2 class="text-2xl font-extrabold text-white flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            歷史對話紀錄
          </h2>
          <button id="close-log-btn" class="text-gray-400 hover:text-white transition p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div id="log-container" class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
        </div>
      </div>
    `;
    document.body.appendChild(logModal);
    logContainer = document.getElementById("log-container");
    closeLogBtn = document.getElementById("close-log-btn");
  }

  function renderLog() {
    if (!logContainer) return;
    if (!gameState.dialogueLog || gameState.dialogueLog.length === 0) {
      logContainer.innerHTML = `<div class="text-center text-gray-500 italic py-10">尚無任何對話紀錄...</div>`;
      return;
    }
    logContainer.innerHTML = gameState.dialogueLog
      .map(
        (entry) => `
      <div class="border-b border-gray-700/50 pb-3">
        <span class="text-blue-400 font-bold text-sm mr-2">${entry.name}</span>
        <p class="text-gray-300 mt-1 leading-relaxed">${entry.text}</p>
      </div>
    `,
      )
      .join("");

    // 自動滾動到底部最新紀錄
    setTimeout(() => {
      logContainer.scrollTop = logContainer.scrollHeight;
    }, 10);
  }

  function openLog() {
    renderLog();
    logModal.classList.remove("hidden");
    logModal.classList.add("flex");
    setTimeout(() => {
      logModal.classList.remove("opacity-0");
      logModal.classList.add("opacity-100");
      const panel = document.getElementById("log-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
    }, 10);
  }

  function closeLog() {
    logModal.classList.remove("opacity-100");
    logModal.classList.add("opacity-0");
    const panel = document.getElementById("log-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    setTimeout(() => {
      logModal.classList.remove("flex");
      logModal.classList.add("hidden");
    }, 300);
  }

  if (openLogBtn) openLogBtn.addEventListener("click", openLog);
  if (closeLogBtn) closeLogBtn.addEventListener("click", closeLog);
  if (logModal) {
    logModal.addEventListener("click", (e) => {
      if (e.target === logModal) closeLog();
    });
  }

  const saveMenuBtn = document.getElementById("save-menu-btn");
  const saveModal = document.getElementById("save-modal");
  const closeSaveBtn = document.getElementById("close-save-btn");
  const saveSlotsContainer = document.getElementById("save-slots-container");
  const quicksaveToast = document.getElementById("quicksave-toast");

  // 設定 Modal DOM 綁定
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const textSpeedRange = document.getElementById("text-speed-range");
  const speedDisplay = document.getElementById("speed-display");
  const volumeRange = document.getElementById("volume-range");
  const typingVolumeRange = document.getElementById("typing-volume-range");
  const toggleUiBtn = document.getElementById("toggle-ui-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const bgmPlayer = document.getElementById("bgm-player");
  const sceneSprite = document.getElementById("scene-sprite");
  const cgVideo = document.getElementById("scene-cg-video");

  // 1. 載入專案與存檔資料
  const projectData = JSON.parse(localStorage.getItem("textAdventureProject"));
  if (!projectData || !projectData.scenes || projectData.scenes.length === 0) {
    alert("找不到遊戲專案或場景資料，請先在編輯器建立專案並新增場景！");
    window.location.href = "index.html";
    return;
  }

  // 遊戲即時狀態 (GameState)
  let gameState = {
    currentSceneId: "",
    chapterId: "",
    variables: {},
    items: {},
    visitedScenes: [],
    notifiedDictionary: [],
    shopStocks: {},
    time: { day: 1, hour: 8, minute: 0 },
    dialogueLog: [], // 歷史對話紀錄
  };

  let slotIndex =
    parseInt(localStorage.getItem("currentPlayerSaveSlot"), 10) || 0;
  let saves = JSON.parse(localStorage.getItem("textAdventurePlayerSaves"));

  // 存檔升級遷移 (舊版 3 個槽位擴充為 5 個槽位，保留 0 和 1 為系統自動與快速存檔)
  if (saves && saves.length === 3) {
    saves = [null, null, ...saves];
    localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(saves));
    if (slotIndex >= 0 && slotIndex <= 2) {
      slotIndex += 2;
      localStorage.setItem("currentPlayerSaveSlot", slotIndex);
    }
  } else if (!saves) {
    saves = [];
  }
  while (saves.length < 5) saves.push(null);

  if (saves[slotIndex] && saves[slotIndex].gameState) {
    // 載入舊存檔進度
    gameState = saves[slotIndex].gameState;
    if (!gameState.notifiedDictionary) gameState.notifiedDictionary = [];
    if (!gameState.shopStocks) gameState.shopStocks = {};
    if (!gameState.time) gameState.time = { day: 1, hour: 8, minute: 0 };
    if (!gameState.dialogueLog) gameState.dialogueLog = [];
  } else {
    // 新遊戲初始化
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
    gameState.currentSceneId = projectData.scenes[0].id;
    gameState.chapterId = ""; // 設定為空，讓第一個場景觸發章節畫面
  }

  // 初始化時靜默檢查一次辭典解鎖 (避免載入舊存檔時突然跳出一堆通知)
  checkDictionaryUnlocks(true);

  // 讀取全域解鎖紀錄 (成就與結局跨存檔共用)
  let globalUnlocks = JSON.parse(
    localStorage.getItem("textAdventureGlobalUnlocks"),
  ) || { achievements: [], endings: [] };

  // 讀取與套用遊戲設定 (儲存於不同的 localStorage，全存檔共用)
  let gameSettings = JSON.parse(localStorage.getItem("textAdventureSettings"));
  // 向下相容舊版設定 (轉換舊有以毫秒為單位的數值)
  if (
    gameSettings &&
    gameSettings.textSpeed !== undefined &&
    !gameSettings.version
  ) {
    if (gameSettings.textSpeed < 50 && gameSettings.textSpeed > 0)
      gameSettings.textSpeed = 100 - gameSettings.textSpeed;
    gameSettings.version = 2;
  } else if (!gameSettings) {
    gameSettings = { textSpeed: 70, volume: 50, typingVolume: 50, version: 2 };
  }
  // 向下相容：若舊存檔尚未包含打字音量，給予預設值
  if (gameSettings.typingVolume === undefined) {
    gameSettings.typingVolume = 50;
  }

  if (textSpeedRange) textSpeedRange.value = gameSettings.textSpeed;
  if (volumeRange) volumeRange.value = gameSettings.volume;
  if (typingVolumeRange) typingVolumeRange.value = gameSettings.typingVolume;
  if (bgmPlayer) bgmPlayer.volume = gameSettings.volume / 100;
  if (cgVideo) cgVideo.volume = gameSettings.volume / 100;

  function updateSpeedDisplay() {
    if (!speedDisplay) return;
    if (parseInt(gameSettings.textSpeed, 10) === 100)
      speedDisplay.textContent = "即時顯示";
    else speedDisplay.textContent = gameSettings.textSpeed;
  }
  updateSpeedDisplay();

  function saveSettings() {
    gameSettings.textSpeed = parseInt(textSpeedRange.value, 10);
    gameSettings.volume = parseInt(volumeRange.value, 10);
    gameSettings.typingVolume = parseInt(typingVolumeRange.value, 10);
    localStorage.setItem("textAdventureSettings", JSON.stringify(gameSettings));
    updateSpeedDisplay();
    if (bgmPlayer) bgmPlayer.volume = gameSettings.volume / 100;
    if (cgVideo) cgVideo.volume = gameSettings.volume / 100;
  }
  if (textSpeedRange) textSpeedRange.addEventListener("input", saveSettings);
  if (volumeRange) volumeRange.addEventListener("input", saveSettings);
  if (typingVolumeRange)
    typingVolumeRange.addEventListener("input", saveSettings);

  let isTyping = false;
  let typeTimer = null;
  let currentText = "";
  let charIndex = 0;
  let currentCharElements = [];

  // BGM 播放邏輯
  let currentBgmUrl = "";
  function playBgm(url) {
    if (!bgmPlayer) return;
    if (!url) {
      bgmPlayer.pause();
      currentBgmUrl = "";
      return;
    }
    if (url !== currentBgmUrl) {
      currentBgmUrl = url;
      bgmPlayer.src = url;
      bgmPlayer.volume = gameSettings.volume / 100;
      bgmPlayer.play().catch((e) => console.warn("等待玩家互動以播放背景音樂"));
    }
  }

  // 文字語音 Beep 系統 (使用 Web Audio API 動態生成復古音效)
  let audioCtx = null;
  function playTextBeep() {
    if (gameSettings.typingVolume === 0) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine"; // 正弦波最為柔和清脆
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // 600Hz 頻率

      // 音量與極短促的淡出設定 (防止爆音)
      const baseVolume = (gameSettings.typingVolume / 100) * 0.05;
      gainNode.gain.setValueAtTime(baseVolume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.04,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      console.warn("打字音效播放失敗", e);
    }
  }

  // 處理瀏覽器自動播放限制 (點擊畫面任意處會觸發播放)
  document.body.addEventListener(
    "click",
    () => {
      if (bgmPlayer && bgmPlayer.paused && currentBgmUrl) {
        bgmPlayer.play().catch((e) => console.warn("播放音樂失敗", e));
      }
    },
    { once: true },
  );

  // 2. 儲存遊戲進度
  function saveGameToSlot(targetSlotIndex) {
    let savesList =
      JSON.parse(localStorage.getItem("textAdventurePlayerSaves")) || [];
    while (savesList.length < 5) savesList.push(null);
    const currentScene = projectData.scenes.find(
      (s) => s.id === gameState.currentSceneId,
    );
    savesList[targetSlotIndex] = {
      time: new Date().toLocaleString("zh-TW"),
      sceneName: currentScene ? currentScene.name : "未知進度",
      gameState: JSON.parse(JSON.stringify(gameState)), // 進行深拷貝
    };
    localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(savesList));
  }

  function autoSave() {
    saveGameToSlot(0); // 0 號槽位保留為自動存檔
  }

  function showToast(msg) {
    if (!quicksaveToast) return;
    quicksaveToast.textContent = msg;
    quicksaveToast.classList.remove("opacity-0");
    setTimeout(() => {
      quicksaveToast.classList.add("opacity-0");
    }, 2000);
  }

  function renderSaveSlots() {
    if (!saveSlotsContainer) return;
    let savesList =
      JSON.parse(localStorage.getItem("textAdventurePlayerSaves")) || [];
    while (savesList.length < 5) savesList.push(null);

    saveSlotsContainer.innerHTML = savesList
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
          let overwriteBtn = isReserved
            ? ""
            : `<button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition shadow-sm" onclick="window.doManualSave(${index})">覆蓋存檔</button>`;
          return `
          <div class="bg-gray-800 border border-gray-600 rounded-lg p-4 flex justify-between items-center hover:border-blue-500 transition">
            <div>
              <h3 class="text-lg font-bold ${titleColor}">${slotName}: ${save.sceneName || "進度紀錄"}</h3>
              <p class="text-sm text-gray-400">儲存時間: ${save.time}</p>
            </div>
            <div class="flex space-x-2">
              <button class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition shadow-sm" onclick="window.doManualLoad(${index})">讀取進度</button>
              ${overwriteBtn}
            </div>
          </div>
        `;
        } else {
          let saveBtn = isReserved
            ? `<button class="px-4 py-2 bg-gray-700 text-gray-500 rounded font-bold cursor-not-allowed" disabled>系統保留</button>`
            : `<button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition shadow-sm" onclick="window.doManualSave(${index})">儲存進度</button>`;
          return `
          <div class="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-4 flex justify-between items-center hover:border-blue-500 transition">
            <div>
              <h3 class="text-lg font-bold text-gray-500">${slotName}: 空</h3>
            </div>
            ${saveBtn}
          </div>
        `;
        }
      })
      .join("");
  }

  window.doManualSave = function (targetSlotIndex) {
    if (confirm(`確定要將進度儲存到 槽位 ${targetSlotIndex + 1} 嗎？`)) {
      saveGameToSlot(targetSlotIndex);
      // 更新當前操作的槽位，讓接下來的自動存檔寫入新位置
      localStorage.setItem("currentPlayerSaveSlot", targetSlotIndex);
      slotIndex = targetSlotIndex;
      closeSaveMenu();
      showToast("進度已儲存！");
    }
  };

  window.doManualLoad = function (targetSlotIndex) {
    if (
      confirm(
        `確定要讀取 槽位 ${targetSlotIndex + 1} 的進度嗎？\n(目前未保存的進度將會遺失)`,
      )
    ) {
      localStorage.setItem("currentPlayerSaveSlot", targetSlotIndex);
      window.location.reload();
    }
  };

  function openSaveMenu() {
    renderSaveSlots();
    saveModal.classList.remove("hidden");
    saveModal.classList.add("flex");
    setTimeout(() => {
      saveModal.classList.remove("opacity-0");
      saveModal.classList.add("opacity-100");
    }, 10);
  }

  function closeSaveMenu() {
    saveModal.classList.remove("opacity-100");
    saveModal.classList.add("opacity-0");
    setTimeout(() => {
      saveModal.classList.remove("flex");
      saveModal.classList.add("hidden");
    }, 300);
  }

  if (saveMenuBtn) saveMenuBtn.addEventListener("click", openSaveMenu);
  if (closeSaveBtn) closeSaveBtn.addEventListener("click", closeSaveMenu);
  if (saveModal) {
    saveModal.addEventListener("click", (e) => {
      if (e.target === saveModal) closeSaveMenu();
    });
  }

  // 儲存全域解鎖紀錄
  function saveGlobalUnlocks() {
    localStorage.setItem(
      "textAdventureGlobalUnlocks",
      JSON.stringify(globalUnlocks),
    );
  }

  // 3. 更新頂部變數狀態列
  function updateTopBar() {
    if (!projectData.globalVariables || !topBarVars) return;

    // 判斷當前出場的 NPC
    let currentNpcId = null;
    const currentScene = projectData.scenes.find(
      (s) => s.id === gameState.currentSceneId,
    );
    if (currentScene && currentScene.npcId) {
      const npc = projectData.npcs.find((n) => n.id === currentScene.npcId);
      if (npc && (!npc.enableCondition || checkConditions(npc.conditions))) {
        currentNpcId = npc.id;
      }
    }

    // 收集所有被綁定的 NPC 專屬變數 ID
    const boundVarIds = new Set();
    if (projectData.npcs) {
      projectData.npcs.forEach((n) => {
        if (n.boundVariableId) boundVarIds.add(n.boundVariableId);
      });
    }

    topBarVars.innerHTML = "";

    // 渲染時間
    if (
      projectData.timeSettings &&
      projectData.timeSettings.enabled &&
      gameState.time
    ) {
      const hh = (gameState.time.hour || 0).toString().padStart(2, "0");
      const mm = (gameState.time.minute || 0).toString().padStart(2, "0");
      topBarVars.innerHTML += `
        <div class="bg-black/60 text-white px-4 py-2 rounded border border-gray-600 shadow-sm backdrop-blur-sm transition-all duration-300 flex items-center">
          <svg class="w-4 h-4 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="text-blue-200 font-bold mr-2">第 ${gameState.time.day || 1} 天</span>
          <span class="font-mono text-blue-100">${hh}:${mm}</span>
        </div>
      `;
    }

    projectData.globalVariables.forEach((v) => {
      const isNpcVar = boundVarIds.has(v.id);
      // 若是 NPC 專屬數值，且當前場景的 NPC 不是該變數的主人，則隱藏不渲染
      if (isNpcVar) {
        const currentNpc = projectData.npcs.find((n) => n.id === currentNpcId);
        if (!currentNpc || currentNpc.boundVariableId !== v.id) return;
      }

      const val = gameState.variables[v.id] || 0;

      let colorClass = "text-blue-300";
      if (
        v.name.toUpperCase().includes("HP") ||
        v.name.includes("血") ||
        v.name.includes("命")
      )
        colorClass = "text-red-400";
      else if (v.name.includes("金") || v.name.toUpperCase().includes("GOLD"))
        colorClass = "text-yellow-400";
      else if (isNpcVar) colorClass = "text-pink-400"; // NPC 專屬數值給予粉紅色

      const desc = v.description
        ? v.description
            .replace(/"/g, "&quot;")
            .replace(/'/g, "\\'")
            .replace(/\n/g, "\\n")
        : "無特別說明";
      const safeName = v.name.replace(/"/g, "&quot;").replace(/'/g, "\\'");

      topBarVars.innerHTML += `
        <div class="bg-black/60 text-white px-4 py-2 rounded border border-gray-600 shadow-sm backdrop-blur-sm transition-all duration-300 cursor-pointer hover:border-gray-400" onclick="window.showVarInfo('${safeName}', '${desc}')" title="點擊查看數值說明">
          <span class="${colorClass} font-bold mr-1">${v.name}</span> <span class="font-mono">${val}</span>
        </div>
      `;
    });
  }

  // 4. 條件判定與全域觸發器解析
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
    // 驗證數值變數
    if (conditions.variables) {
      for (const [varId, cond] of Object.entries(conditions.variables)) {
        const currentVal = gameState.variables[varId] || 0;
        if (!evaluateCondition(cond.op, currentVal, cond.val)) return false;
      }
    }
    // 驗證持有道具
    if (conditions.items) {
      for (const [itemId, cond] of Object.entries(conditions.items)) {
        const currentQty = gameState.items[itemId] || 0;
        if (!evaluateCondition(cond.op, currentQty, cond.val)) return false;
      }
    }
    // 驗證章節進度
    if (conditions.chapter) {
      const currentChapIdx = projectData.chapters.findIndex(
        (c) => c.id === gameState.chapterId,
      );
      const targetChapIdx = projectData.chapters.findIndex(
        (c) => c.id === conditions.chapter,
      );
      if (currentChapIdx < targetChapIdx && currentChapIdx !== -1) return false;
    }
    // 驗證時間進度
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
    if (varId && varVal !== "") {
      gameState.variables[varId] =
        (gameState.variables[varId] || 0) + Number(varVal);
      showVariablePopup(varId, Number(varVal));
    }
    if (targetItemId && itemAction) {
      const currentQty = gameState.items[targetItemId] || 0;
      const changeQty = Number(itemVal) || 1;
      if (itemAction === "give") {
        gameState.items[targetItemId] = currentQty + changeQty;
        const itemData = projectData.items.find((i) => i.id === targetItemId);
        if (itemData) showItemPopup(itemData, changeQty);
      } else if (itemAction === "take") {
        gameState.items[targetItemId] = Math.max(0, currentQty - changeQty);
      }
    }
    if (passTime) {
      advanceTime(Number(passTime));
    }
  }

  function checkGlobalTriggers() {
    if (!projectData.triggers) return false;
    for (const trigger of projectData.triggers) {
      if (checkConditions(trigger.conditions)) {
        // 防止無限死循環觸發，如果已經抵達目標場景就不再執行
        if (
          trigger.targetSceneId &&
          trigger.targetSceneId === gameState.currentSceneId
        ) {
          continue;
        }

        // 套用全域觸發器的複合效果
        applyEffects(
          trigger.variableId,
          trigger.variableVal,
          trigger.targetItemId,
          trigger.itemAction,
          trigger.itemVal,
          trigger.passTime,
        );

        if (trigger.targetSceneId) {
          handleJump(trigger.targetSceneId, gameState.currentSceneId, true);
          return true; // 成功觸發並跳轉
        }
      }
    }
    return false;
  }

  // 檢查成就解鎖
  function checkAchievements() {
    if (!projectData.achievements) return;
    projectData.achievements.forEach((ach) => {
      if (!globalUnlocks.achievements.includes(ach.id)) {
        if (checkConditions(ach.conditions)) {
          globalUnlocks.achievements.push(ach.id);
          saveGlobalUnlocks();
          showAchievementPopup(ach);
        }
      }
    });
  }

  function showAchievementPopup(achievement) {
    if (!achievementPopupContainer) return;
    const popup = document.createElement("div");
    popup.className =
      "bg-gray-900 border-l-4 border-yellow-500 rounded shadow-xl p-4 flex items-center gap-4 text-white transform transition-all duration-500 translate-x-full opacity-0";
    const icon =
      achievement.iconUrl || "https://via.placeholder.com/150?text=Achieved";
    popup.innerHTML = `
        <img src="${icon}" class="w-12 h-12 object-cover rounded border border-gray-700">
        <div>
            <p class="text-xs text-yellow-500 font-bold mb-1">成就解鎖！</p>
            <p class="text-sm font-bold truncate max-w-[200px]">${achievement.name}</p>
        </div>
    `;
    achievementPopupContainer.appendChild(popup);
    requestAnimationFrame(() =>
      popup.classList.remove("translate-x-full", "opacity-0"),
    );
    setTimeout(() => {
      popup.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }

  // 檢查辭典解鎖
  function checkDictionaryUnlocks(isInitialLoad = false) {
    if (!projectData.dictionary) return;
    projectData.dictionary.forEach((term) => {
      if (!gameState.notifiedDictionary.includes(term.id)) {
        if (!term.enableCondition || checkConditions(term.conditions)) {
          gameState.notifiedDictionary.push(term.id);
          // 只有非初始載入、且有條件解鎖時，才顯示通知
          if (!isInitialLoad && term.enableCondition) {
            showDictionaryPopup(term);
          }
        }
      }
    });
  }

  function showDictionaryPopup(term) {
    if (!achievementPopupContainer) return;
    const popup = document.createElement("div");
    popup.className =
      "bg-gray-900 border-l-4 border-blue-500 rounded shadow-xl p-4 flex items-center gap-4 text-white transform transition-all duration-500 translate-x-full opacity-0";
    popup.innerHTML = `
        <div class="w-12 h-12 bg-gray-800 border border-gray-700 rounded flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-xs text-blue-400 font-bold mb-1">新辭條解鎖！</p>
            <p class="text-sm font-bold truncate text-gray-100">${term.term}</p>
        </div>
    `;
    achievementPopupContainer.appendChild(popup);
    requestAnimationFrame(() =>
      popup.classList.remove("translate-x-full", "opacity-0"),
    );
    setTimeout(() => {
      popup.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }

  function showItemPopup(item, qty) {
    if (!achievementPopupContainer) return;
    const popup = document.createElement("div");
    popup.className =
      "bg-gray-900 border-l-4 border-emerald-500 rounded shadow-xl p-4 flex items-center gap-4 text-white transform transition-all duration-500 translate-x-full opacity-0";
    popup.innerHTML = `
        <div class="w-12 h-12 bg-gray-800 border border-gray-700 rounded flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
            <span class="text-2xl">${item.type === "consumable" ? "🧪" : "🗝️"}</span>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-xs text-emerald-400 font-bold mb-1">獲得道具</p>
            <p class="text-sm font-bold truncate text-gray-100">${item.name} x${qty}</p>
        </div>
    `;
    achievementPopupContainer.appendChild(popup);
    requestAnimationFrame(() =>
      popup.classList.remove("translate-x-full", "opacity-0"),
    );
    setTimeout(() => {
      popup.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => popup.remove(), 500);
    }, 3000);
  }

  function showVariablePopup(varId, changeVal) {
    if (!changeVal || changeVal === 0) return;
    const varData = (projectData.globalVariables || []).find(
      (v) => v.id === varId,
    );
    if (!varData) return;

    let variablePopupContainer = document.getElementById(
      "variable-popup-container",
    );
    if (!variablePopupContainer) {
      variablePopupContainer = document.createElement("div");
      variablePopupContainer.id = "variable-popup-container";
      variablePopupContainer.className =
        "absolute top-20 left-4 z-[70] flex flex-col gap-3 pointer-events-none overflow-visible";
      const gameContainer =
        document.getElementById("game-container") || document.body;
      gameContainer.appendChild(variablePopupContainer);
    }

    const popup = document.createElement("div");
    const isPositive = changeVal > 0;
    const sign = isPositive ? "+" : "";
    const baseBorder = isPositive ? "border-emerald-500" : "border-red-500";
    const textColor = isPositive ? "text-emerald-400" : "text-red-400";
    const titleText = isPositive ? "數值增加" : "數值減少";
    const iconSvg = isPositive
      ? `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`
      : `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>`;

    popup.className = `bg-gray-900 border-l-4 ${baseBorder} rounded shadow-xl p-4 flex items-center gap-4 text-white transform transition-all duration-500 -translate-x-full opacity-0`;
    popup.innerHTML = `
      <div class="w-12 h-12 bg-gray-800 border border-gray-700 rounded flex items-center justify-center ${textColor} flex-shrink-0 shadow-inner">
          ${iconSvg}
      </div>
      <div class="flex-1 min-w-0 pr-2">
          <p class="text-xs ${textColor} font-bold mb-1">${titleText}</p>
          <p class="text-sm font-bold truncate text-gray-100">${varData.name} ${sign}${changeVal}</p>
      </div>
    `;

    variablePopupContainer.appendChild(popup);
    requestAnimationFrame(() =>
      popup.classList.remove("-translate-x-full", "opacity-0"),
    );
    setTimeout(() => {
      popup.classList.add("-translate-x-full", "opacity-0");
      setTimeout(() => popup.remove(), 500);
    }, 3000);
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

  // 5. 智慧跳轉與選項渲染
  function handleJump(targetId, currentId, fromTrigger = false) {
    if (!targetId) return;

    clearSceneTimer();

    if (targetId.startsWith("__SHOP__")) {
      const shopId = targetId.replace("__SHOP__", "");
      openShop(shopId);
      return; // 開啟商店時不進行場景跳轉
    }

    if (targetId.startsWith("__QUIZ__")) {
      const quizId = targetId.replace("__QUIZ__", "");
      openQuiz(quizId);
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

  function renderOptions(scene) {
    optionsContainer.innerHTML = "";

    // 重新開始遊戲的共用邏輯：清除當前存檔槽位並重新整理畫面
    const handleRestart = () => {
      if (confirm("確定要重新開始遊戲嗎？當前的進度將會被清除。")) {
        const slotIdx = localStorage.getItem("currentPlayerSaveSlot") || 0;
        const saves = JSON.parse(
          localStorage.getItem("textAdventurePlayerSaves"),
        ) || [null, null, null];
        saves[slotIdx] = null;
        localStorage.setItem("textAdventurePlayerSaves", JSON.stringify(saves));
        window.location.reload();
      }
    };

    // 若標記為結局，顯示特殊的黃金結局按鈕
    if (scene.isEnding) {
      // 解鎖結局並寫入全域紀錄
      if (
        scene.endingName &&
        !globalUnlocks.endings.includes(scene.endingName)
      ) {
        globalUnlocks.endings.push(scene.endingName);
        saveGlobalUnlocks();
      }

      const btnLobby = document.createElement("button");
      btnLobby.className =
        "vn-option pointer-events-auto w-2/3 max-w-lg bg-yellow-900/90 hover:bg-yellow-700 text-white py-4 px-6 rounded-xl border-2 border-yellow-500 text-lg font-bold transition shadow-[0_0_20px_rgba(234,179,8,0.5)] whitespace-normal break-words leading-relaxed";
      btnLobby.innerHTML = `<div class="flex items-center justify-center"><svg class="w-6 h-6 mr-2 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>達成結局：${scene.endingName || "未知結局"}</div><span class="block text-sm font-normal text-yellow-200 mt-2">點擊返回大廳</span>`;
      btnLobby.onclick = () => {
        window.location.href = "index.html";
      };
      optionsContainer.appendChild(btnLobby);

      const btnRestart = document.createElement("button");
      btnRestart.className =
        "vn-option pointer-events-auto w-2/3 max-w-lg bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded border-2 border-gray-500 text-md font-bold transition shadow-lg mt-2 whitespace-normal break-words leading-relaxed";
      btnRestart.innerHTML = `<div class="flex items-center justify-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>重新開始遊戲</div>`;
      btnRestart.onclick = handleRestart;
      optionsContainer.appendChild(btnRestart);

      if (!uiHidden) {
        optionsContainer.classList.remove("hidden");
      }
      return;
    }

    // 篩選出符合「隱藏選項出現條件」的選項
    const validOptions = (scene.options || []).filter(
      (opt) => !opt.enableCondition || checkConditions(opt.conditions),
    );

    if (validOptions.length === 0) {
      const idx = projectData.scenes.findIndex((s) => s.id === scene.id);
      if (idx !== -1 && idx < projectData.scenes.length - 1) {
        // 防呆處理：沒有選項時提供自動推進
        const btn = document.createElement("button");
        btn.className =
          "vn-option system-next-btn pointer-events-auto w-2/3 max-w-lg bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded border-2 border-gray-500 text-lg transition shadow-lg whitespace-normal break-words leading-relaxed";
        btn.textContent = "繼續";
        btn.onclick = () => {
          handleJump(projectData.scenes[idx + 1].id, scene.id);
        };
        optionsContainer.appendChild(btn);
      } else {
        // 遊戲內容已結束 (死路或未設定結局標籤的最後一幕)
        const btnLobby = document.createElement("button");
        btnLobby.className =
          "vn-option pointer-events-auto w-2/3 max-w-lg bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded border-2 border-gray-500 text-lg transition shadow-lg whitespace-normal break-words leading-relaxed";
        btnLobby.textContent = "返回大廳";
        btnLobby.onclick = () => {
          window.location.href = "index.html";
        };
        optionsContainer.appendChild(btnLobby);

        const btnRestart = document.createElement("button");
        btnRestart.className =
          "vn-option pointer-events-auto w-2/3 max-w-lg bg-red-900/80 hover:bg-red-700 text-white py-3 px-6 rounded border-2 border-red-500 text-lg transition shadow-lg mt-2 whitespace-normal break-words leading-relaxed";
        btnRestart.innerHTML = `<div class="flex items-center justify-center"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>重新開始</div>`;
        btnRestart.onclick = handleRestart;
        optionsContainer.appendChild(btnRestart);
      }
    } else {
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
            "vn-option pointer-events-auto w-2/3 max-w-lg bg-black/80 hover:bg-blue-900/90 text-white py-3 px-6 rounded border-2 border-blue-800 hover:border-blue-400 text-lg transition shadow-lg whitespace-normal break-words leading-relaxed";
          btn.textContent = opt.text || "繼續";
          btn.onclick = () => {
            const prob =
              opt.effectProbability !== undefined ? opt.effectProbability : 100;
            if (Math.random() * 100 < prob) {
              applyEffects(
                opt.variableId,
                opt.variableVal,
                opt.itemId,
                opt.itemAction,
                opt.itemVal,
                opt.passTime,
              );
            }
            handleJump(opt.targetSceneId, scene.id);
          };
          optionsContainer.appendChild(btn);
        });

        // 如果選項超過一頁，則渲染分頁按鈕
        if (totalPages > 1) {
          const paginationEl = document.createElement("div");
          paginationEl.className =
            "flex justify-end items-center mt-2 gap-3 pointer-events-auto w-2/3 max-w-lg";

          const pageInfo = document.createElement("span");
          pageInfo.className =
            "text-white/50 font-bold font-mono text-sm tracking-widest drop-shadow-md select-none mr-2";
          pageInfo.textContent = `${page} / ${totalPages}`;

          const prevBtn = document.createElement("button");
          prevBtn.className = `w-10 h-10 flex items-center justify-center rounded-lg transition shadow-md border-2 ${page === 1 ? "bg-black/40 text-gray-600 border-gray-800 cursor-not-allowed" : "bg-black/80 text-blue-300 hover:text-white border-gray-500 hover:border-blue-400 hover:bg-blue-900/90"}`;
          prevBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`;
          prevBtn.disabled = page === 1;
          prevBtn.onclick = () => {
            if (page > 1) drawPage(page - 1);
          };

          const nextBtn = document.createElement("button");
          nextBtn.className = `w-10 h-10 flex items-center justify-center rounded-lg transition shadow-md border-2 ${page === totalPages ? "bg-black/40 text-gray-600 border-gray-800 cursor-not-allowed" : "bg-black/80 text-blue-300 hover:text-white border-gray-500 hover:border-blue-400 hover:bg-blue-900/90"}`;
          nextBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
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

      // 初始渲染第一頁
      drawPage(1);
    }

    if (!uiHidden) {
      optionsContainer.classList.remove("hidden");
    }

    startSceneTimer(scene);
  }

  // 6. 場景渲染與打字機效果
  const chapterScreen = document.getElementById("chapter-screen");
  const chapterScreenTitle = document.getElementById("chapter-screen-title");
  const chapterScreenDesc = document.getElementById("chapter-screen-desc");

  function showChapterScreen(chapter, callback) {
    const defaultBgUrl =
      projectData.projectInfo && projectData.projectInfo.defaultBgUrl
        ? projectData.projectInfo.defaultBgUrl.trim()
        : "";
    const chapterCoverUrl = chapter.coverUrl ? chapter.coverUrl.trim() : "";

    if (chapterCoverUrl) {
      chapterScreen.style.backgroundImage = `url("${chapterCoverUrl.replace(/"/g, '\\"')}")`;
    } else if (defaultBgUrl) {
      chapterScreen.style.backgroundImage = `url("${defaultBgUrl.replace(/"/g, '\\"')}")`;
    } else {
      chapterScreen.style.backgroundImage = "none";
    }
    chapterScreenTitle.textContent = chapter.name || "";
    chapterScreenDesc.innerHTML = chapter.description
      ? chapter.description.replace(/\n/g, "<br>")
      : "";

    chapterScreen.classList.remove("opacity-0", "pointer-events-none");
    chapterScreen.classList.add("opacity-100", "pointer-events-auto");

    const hideScreen = () => {
      chapterScreen.classList.remove("opacity-100", "pointer-events-auto");
      chapterScreen.classList.add("opacity-0", "pointer-events-none");
      chapterScreen.removeEventListener("click", hideScreen);
      setTimeout(callback, 800); // 等待淡出動畫結束
    };

    chapterScreen.addEventListener("click", hideScreen);
  }

  function typeWriter(scene) {
    if (parseInt(gameSettings.textSpeed, 10) === 100) {
      currentCharElements.forEach((el) => {
        el.classList.remove("opacity-0", "ink-animate");
      });
      charIndex = currentCharElements.length;
      isTyping = false;
      renderOptions(scene);
      dialogueBox.style.pointerEvents = "none";
      return;
    }

    if (charIndex < currentCharElements.length) {
      const el = currentCharElements[charIndex];
      el.classList.remove("opacity-0");
      el.classList.add("ink-animate");

      const char = el.textContent;
      // 播放打字機復古音效 (略過空白與常見標點符號，讓聲音節奏更自然)
      if (char.trim() !== "" && !/[.,!?;:，。！？；：、…]/.test(char)) {
        playTextBeep();
      }

      charIndex++;

      const speedVal = parseInt(gameSettings.textSpeed, 10);
      // 使用非線性(三次方)映射，讓最慢(0)為 3000ms(3秒)，並在高速區提供更細膩的滑桿控制
      const delay = 3000 * Math.pow((100 - speedVal) / 100, 3);
      typeTimer = setTimeout(() => typeWriter(scene), delay); // 打字速度控制
    } else {
      isTyping = false;
      renderOptions(scene);
      dialogueBox.style.pointerEvents = "none"; // 打完字禁止再點擊對話框 (逼迫玩家點擊選項)
    }
  }

  function renderScene(sceneId) {
    const scene = projectData.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      console.error("找不到場景", sceneId);
      return;
    }

    clearSceneTimer();

    // 立即隱藏選項與禁用對話框點擊，防止在過場動畫 (如章節淡出) 期間被誤觸或被鍵盤重複觸發
    if (optionsContainer) {
      optionsContainer.classList.add("hidden");
      optionsContainer.innerHTML = "";
    }
    if (dialogueBox) dialogueBox.style.pointerEvents = "none";

    const previousChapterId = gameState.chapterId;
    gameState.currentSceneId = sceneId;

    let isChapterChanged = false;
    let targetChapter = null;

    if (scene.chapterId && scene.chapterId !== previousChapterId) {
      gameState.chapterId = scene.chapterId;
      isChapterChanged = true;
      targetChapter = projectData.chapters.find(
        (c) => c.id === scene.chapterId,
      );
    }

    autoSave(); // 自動存檔寫入 0 號槽位，避免覆蓋玩家的手動存檔
    updateTopBar();

    // 最優先檢查全域觸發器 (例如跳到這個場景的瞬間 HP < 0 就強制轉死)
    if (checkGlobalTriggers()) return;

    // 檢查成就解鎖
    checkAchievements();
    checkDictionaryUnlocks();

    const proceedWithScene = () => {
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

      // 更新背景圖片 (優先抓取場景設定，最後預設背景)
      const sceneBgUrl = scene.bgUrl ? scene.bgUrl.trim() : "";
      if (sceneBgUrl) {
        bgLayer.style.backgroundImage = `url("${sceneBgUrl.replace(/"/g, '\\"')}")`;
      } else {
        const defaultBgUrl =
          projectData.projectInfo && projectData.projectInfo.defaultBgUrl
            ? projectData.projectInfo.defaultBgUrl.trim()
            : "";

        if (defaultBgUrl) {
          bgLayer.style.backgroundImage = `url("${defaultBgUrl.replace(/"/g, '\\"')}")`;
        } else {
          bgLayer.style.backgroundImage = "none";
        }
      }

      // 處理轉場動畫 (針對背景圖)
      const transitionType = scene.transition || "fade";
      bgLayer.style.animation = "none";
      void bgLayer.offsetWidth; // 觸發重繪 (Reflow) 以重置動畫
      if (transitionType === "fade")
        bgLayer.style.animation = "sceneFadeIn 0.8s ease-in-out forwards";
      else if (transitionType === "slide-left")
        bgLayer.style.animation = "sceneSlideLeft 0.6s ease-out forwards";
      else if (transitionType === "slide-right")
        bgLayer.style.animation = "sceneSlideRight 0.6s ease-out forwards";
      else if (transitionType === "zoom-in")
        bgLayer.style.animation = "sceneZoomIn 0.8s ease-out forwards";
      else if (transitionType === "blur-in")
        bgLayer.style.animation = "sceneBlurIn 0.8s ease-out forwards";
      else if (transitionType === "slide-up")
        bgLayer.style.animation = "sceneSlideUp 0.6s ease-out forwards";
      else if (transitionType === "slide-down")
        bgLayer.style.animation = "sceneSlideDown 0.6s ease-out forwards";
      else if (transitionType === "spin-in")
        bgLayer.style.animation = "sceneSpinIn 0.8s ease-out forwards";
      else if (transitionType === "flash")
        bgLayer.style.animation = "sceneFlash 0.6s ease-in-out forwards";

      // 處理事件 CG 影片
      if (cgVideo) {
        if (scene.cgVideoUrl) {
          const isNewCg = cgVideo.getAttribute("src") !== scene.cgVideoUrl;
          if (isNewCg) {
            cgVideo.setAttribute("src", scene.cgVideoUrl);
          }
          cgVideo.volume = gameSettings.volume / 100;
          cgVideo.classList.remove("hidden");
          cgVideo.play().catch((e) => console.warn("CG 影片播放失敗", e));
          setTimeout(() => {
            cgVideo.classList.remove("opacity-0");
            cgVideo.classList.add("opacity-100");
          }, 10);

          // 當新影片播放時，自動隱藏介面讓玩家能看清楚全螢幕畫面
          if (isNewCg && typeof toggleUI === "function" && !uiHidden) {
            toggleUI();
          }
        } else {
          cgVideo.classList.remove("opacity-100");
          cgVideo.classList.add("opacity-0");
          setTimeout(() => {
            if (cgVideo.classList.contains("opacity-0")) {
              cgVideo.classList.add("hidden");
              cgVideo.pause();
              cgVideo.removeAttribute("src");
            }
          }, 500);
        }
      }

      // 處理角色立繪
      if (sceneSprite) {
        if (scene.spriteUrl) {
          sceneSprite.src = scene.spriteUrl;
          sceneSprite.classList.remove("hidden");
          setTimeout(() => {
            sceneSprite.classList.remove("opacity-0");
            sceneSprite.classList.add("opacity-100");
          }, 10);
        } else {
          sceneSprite.classList.remove("opacity-100");
          sceneSprite.classList.add("opacity-0");
          setTimeout(() => {
            if (sceneSprite.classList.contains("opacity-0")) {
              sceneSprite.classList.add("hidden");
            }
          }, 500);
        }
      }

      // 處理 NPC 出現條件與對話標籤
      let speakerName = "旁白";
      if (dialogueAvatar) {
        dialogueAvatar.classList.add("hidden");
        dialogueAvatar.removeAttribute("src");
      }
      if (scene.npcId) {
        const npc = projectData.npcs.find((n) => n.id === scene.npcId);
        if (npc) {
          if (npc.enableCondition && !checkConditions(npc.conditions)) {
            if (scene.skipIfNpcMissing) {
              // 自動跳過場景：找第一個可點擊的選項執行
              const validOpt = (scene.options || []).find(
                (o) => !o.enableCondition || checkConditions(o.conditions),
              );
              if (validOpt) {
                const prob =
                  validOpt.effectProbability !== undefined
                    ? validOpt.effectProbability
                    : 100;
                if (Math.random() * 100 < prob) {
                  applyEffects(
                    validOpt.variableId,
                    validOpt.variableVal,
                    validOpt.itemId,
                    validOpt.itemAction,
                    validOpt.itemVal,
                    validOpt.passTime,
                  );
                }
                handleJump(validOpt.targetSceneId, scene.id);
              } else {
                // 若無選項，循預設邏輯往下跳
                const idx = projectData.scenes.findIndex(
                  (s) => s.id === scene.id,
                );
                if (idx !== -1 && idx < projectData.scenes.length - 1)
                  handleJump(projectData.scenes[idx + 1].id, scene.id);
              }
              return;
            }
          } else {
            speakerName = npc.name;
            if (dialogueAvatar && npc.avatarUrl) {
              dialogueAvatar.src = npc.avatarUrl;
              dialogueAvatar.classList.remove("hidden");
            }
            if (npc.boundVariableId) {
              const val = gameState.variables[npc.boundVariableId] || 0;
              const varInfo = projectData.globalVariables.find(
                (v) => v.id === npc.boundVariableId,
              );
              if (varInfo)
                speakerName += ` <span class="text-xs font-normal text-gray-300 ml-2">(${varInfo.name}: ${val})</span>`;
            }
          }
        }
      }
      nameTag.innerHTML = speakerName;

      // 重置對話框 UI 並播放打字機
      optionsContainer.classList.add("hidden");
      dialogueBox.style.pointerEvents = "auto";
      currentText = scene.text ? scene.text.replace(/\n/g, "<br>") : "...";

      // --- 新增至歷史對話紀錄 ---
      if (!gameState.dialogueLog) gameState.dialogueLog = [];
      // 避免因為載入存檔或重繪導致重複寫入相同的最後一句
      if (
        !gameState.dialogueLog.length ||
        gameState.dialogueLog[gameState.dialogueLog.length - 1].text !==
          currentText
      ) {
        gameState.dialogueLog.push({ name: speakerName, text: currentText });
        // 限制保留最新的 100 筆紀錄，避免記憶體或效能溢出
        if (gameState.dialogueLog.length > 100) gameState.dialogueLog.shift();
      }

      textContainer.innerHTML = currentText;

      // 轉換所有文本節點為獨立的 span 以利打字機與水墨動畫 (完美避開並保護 HTML 標籤)
      function wrapTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          const fragment = document.createDocumentFragment();
          for (const char of text) {
            const span = document.createElement("span");
            span.className = "vn-char opacity-0";
            span.textContent = char;
            fragment.appendChild(span);
          }
          node.parentNode.replaceChild(fragment, node);
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName !== "BR"
        ) {
          Array.from(node.childNodes).forEach(wrapTextNodes);
        }
      }
      wrapTextNodes(textContainer);

      currentCharElements = textContainer.querySelectorAll(".vn-char");
      charIndex = 0;
      textContainer.scrollTop = 0; // 進入新場景時重置捲軸位置
      isTyping = true;

      if (typeTimer) clearTimeout(typeTimer);
      typeWriter(scene);
    };

    if (isChapterChanged && targetChapter) {
      showChapterScreen(targetChapter, proceedWithScene);
    } else {
      proceedWithScene();
    }
  }

  function skipTyping() {
    if (isTyping) {
      clearTimeout(typeTimer);
      currentCharElements.forEach((el) => {
        el.classList.remove("opacity-0", "ink-animate");
      });
      isTyping = false;
      const scene = projectData.scenes.find(
        (s) => s.id === gameState.currentSceneId,
      );
      renderOptions(scene);
      dialogueBox.style.pointerEvents = "none";
    }
  }

  dialogueBox.addEventListener("click", skipTyping);

  // 7. 物品欄邏輯
  function renderInventory() {
    if (!inventoryContainer) return;
    inventoryContainer.innerHTML = "";

    const ownedItems = Object.entries(gameState.items).filter(
      ([id, qty]) => qty > 0,
    );

    if (ownedItems.length === 0) {
      inventoryContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic">您的背包空空如也...</div>`;
      return;
    }

    ownedItems.forEach(([itemId, qty]) => {
      const itemData = projectData.items.find((i) => i.id === itemId);
      if (!itemData) return;

      const itemCard = document.createElement("div");
      itemCard.className =
        "bg-gray-800 border border-gray-700 p-5 rounded-xl flex flex-col justify-between hover:border-blue-400 transition shadow-lg relative group";

      const typeBadge =
        itemData.type === "consumable"
          ? `<span class="text-xs bg-orange-900/50 text-orange-400 px-2.5 py-1 rounded-full border border-orange-700/50 shadow-sm whitespace-nowrap">消耗品</span>`
          : `<span class="text-xs bg-purple-900/50 text-purple-400 px-2.5 py-1 rounded-full border border-purple-700/50 shadow-sm whitespace-nowrap">永久道具</span>`;

      // 檢查是否可使用 (檢查 enableCondition 與 conditions)
      const consumeQty =
        itemData.consumeAmount !== undefined ? itemData.consumeAmount : 1;
      const hasEnough =
        itemData.type === "consumable" ? qty >= consumeQty : true;
      const meetsCondition =
        !itemData.enableCondition || checkConditions(itemData.conditions);
      const canUse = meetsCondition && hasEnough;

      itemCard.innerHTML = `
        <div class="flex items-start space-x-4 mb-5">
          <div class="w-14 h-14 bg-gray-900 border border-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-blue-400 transition">
            <span class="text-2xl">${itemData.type === "consumable" ? "🧪" : "🗝️"}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start gap-2 mb-1">
              <h3 class="text-lg font-bold text-white truncate">${itemData.name}</h3>
              ${typeBadge}
            </div>
            <div class="text-sm font-mono text-blue-300 font-bold bg-blue-900/30 px-2 py-0.5 rounded inline-block mb-2 shadow-sm">擁有量/次數: ${qty}</div>
            <p class="text-sm text-gray-400 leading-relaxed line-clamp-3" title="${itemData.description || "無說明"}">${itemData.description || "無說明"}</p>
          </div>
        </div>
        <button class="use-item-btn w-full py-2.5 rounded-lg font-bold transition text-md shadow-md flex items-center justify-center space-x-2 ${canUse ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white" : "bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"}" ${canUse ? "" : "disabled"}>
          ${canUse ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>使用道具</span>' : !hasEnough ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <span>數量不足</span>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <span>未達使用條件</span>'}
        </button>
      `;

      if (canUse) {
        itemCard
          .querySelector(".use-item-btn")
          .addEventListener("click", () => {
            // 執行使用邏輯：若是消耗品則扣除設定數量
            if (itemData.type === "consumable") {
              gameState.items[itemId] = Math.max(
                0,
                gameState.items[itemId] - consumeQty,
              );
            }

            const prob =
              itemData.effectProbability !== undefined
                ? itemData.effectProbability
                : 100;
            const isSuccess = Math.random() * 100 < prob;

            if (isSuccess) {
              applyEffects(
                itemData.variableId,
                itemData.variableVal,
                itemData.targetItemId,
                itemData.itemAction,
                itemData.itemVal,
                itemData.passTime,
              );
            } else {
              showToast(`使用 ${itemData.name}，但似乎沒有發揮效果...`);
            }

            // 關閉背包面板
            closeInventory();
            checkAchievements(); // 使用道具後也可能觸發成就
            checkDictionaryUnlocks(); // 使用道具後也可能解鎖辭條

            // 檢查全域觸發
            if (!checkGlobalTriggers()) {
              if (itemData.targetSceneId && isSuccess) {
                handleJump(
                  itemData.targetSceneId,
                  gameState.currentSceneId,
                  true,
                );
              } else {
                // 若未設定跳轉場景，重新渲染當前場景以更新介面上的數值與條件式選項
                renderScene(gameState.currentSceneId);
              }
            }
          });
      }
      inventoryContainer.appendChild(itemCard);
    });
  }

  function openInventory() {
    renderInventory();
    inventoryModal.classList.remove("hidden");
    inventoryModal.classList.add("block");
    if (inventoryBtn) {
      inventoryBtn.classList.add("opacity-0", "pointer-events-none");
    }
    setTimeout(() => {
      inventoryModal.classList.remove("opacity-0");
      inventoryModal.classList.add("opacity-100");
      const panel = document.getElementById("inventory-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
    }, 10);
  }

  function closeInventory() {
    inventoryModal.classList.remove("opacity-100");
    inventoryModal.classList.add("opacity-0");
    const panel = document.getElementById("inventory-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    if (inventoryBtn) {
      inventoryBtn.classList.remove("opacity-0", "pointer-events-none");
    }
    setTimeout(() => {
      inventoryModal.classList.remove("block");
      inventoryModal.classList.add("hidden");
    }, 300);
  }

  if (inventoryBtn) inventoryBtn.addEventListener("click", openInventory);
  if (closeInventoryBtn)
    closeInventoryBtn.addEventListener("click", closeInventory);

  // 點擊 Modal 外部黑底關閉面板
  if (inventoryModal) {
    inventoryModal.addEventListener("click", (e) => {
      if (e.target === inventoryModal) closeInventory();
    });
  }

  // 辭典邏輯
  let currentDictPage = 1;
  const dictItemsPerPage = 4;

  function renderDictionary() {
    if (!dictionaryContainer) return;
    dictionaryContainer.innerHTML = "";

    const dictData = projectData.dictionary || [];
    const unlockedTerms = dictData.filter((term) => {
      if (!term.enableCondition) return true;
      if (
        gameState.notifiedDictionary &&
        gameState.notifiedDictionary.includes(term.id)
      )
        return true;
      return checkConditions(term.conditions);
    });

    if (unlockedTerms.length === 0) {
      dictionaryContainer.innerHTML = `<div class="flex items-center justify-center flex-1 text-center text-gray-500 italic">目前尚未解鎖任何辭條...</div>`;
      return;
    }

    const totalPages = Math.ceil(unlockedTerms.length / dictItemsPerPage);
    if (currentDictPage > totalPages) currentDictPage = totalPages;
    if (currentDictPage < 1) currentDictPage = 1;

    const startIndex = (currentDictPage - 1) * dictItemsPerPage;
    const pageTerms = unlockedTerms.slice(
      startIndex,
      startIndex + dictItemsPerPage,
    );

    const cardsContainer = document.createElement("div");
    cardsContainer.className =
      "grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-6 flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar pb-2";

    pageTerms.forEach((term) => {
      const termCard = document.createElement("div");
      termCard.className =
        "bg-gray-800 border border-gray-700 p-5 rounded-xl flex flex-col hover:border-blue-400 transition shadow-lg h-full min-h-[250px] md:min-h-0 overflow-hidden";
      termCard.innerHTML = `
        <h3 class="text-lg font-bold text-white mb-2 pb-2 border-b border-gray-700 text-blue-300 flex-shrink-0">${term.term}</h3>
        <div class="overflow-y-auto custom-scrollbar pr-2 flex-1">
          <p class="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">${term.description || "無說明"}</p>
        </div>
      `;
      cardsContainer.appendChild(termCard);
    });

    dictionaryContainer.appendChild(cardsContainer);

    if (totalPages > 1) {
      const paginationEl = document.createElement("div");
      paginationEl.className =
        "flex justify-center items-center space-x-6 mt-4 pt-4 border-t border-gray-800 flex-shrink-0";

      const prevBtn = document.createElement("button");
      prevBtn.className = `px-4 py-2 rounded-lg font-bold transition ${currentDictPage === 1 ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-blue-900/50 text-blue-300 hover:bg-blue-800 border border-blue-700"}`;
      prevBtn.innerHTML = "上一頁";
      prevBtn.disabled = currentDictPage === 1;
      prevBtn.onclick = () => {
        if (currentDictPage > 1) {
          currentDictPage--;
          renderDictionary();
        }
      };

      const pageInfo = document.createElement("span");
      pageInfo.className = "text-gray-400 text-sm font-mono font-bold";
      pageInfo.innerHTML = `${currentDictPage} / ${totalPages}`;

      const nextBtn = document.createElement("button");
      nextBtn.className = `px-4 py-2 rounded-lg font-bold transition ${currentDictPage === totalPages ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-blue-900/50 text-blue-300 hover:bg-blue-800 border border-blue-700"}`;
      nextBtn.innerHTML = "下一頁";
      nextBtn.disabled = currentDictPage === totalPages;
      nextBtn.onclick = () => {
        if (currentDictPage < totalPages) {
          currentDictPage++;
          renderDictionary();
        }
      };

      paginationEl.appendChild(prevBtn);
      paginationEl.appendChild(pageInfo);
      paginationEl.appendChild(nextBtn);
      dictionaryContainer.appendChild(paginationEl);
    }
  }

  function openDictionary() {
    currentDictPage = 1;
    renderDictionary();
    dictionaryModal.classList.remove("hidden");
    dictionaryModal.classList.add("flex");
    if (dictionaryBtn)
      dictionaryBtn.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      dictionaryModal.classList.remove("opacity-0");
      dictionaryModal.classList.add("opacity-100");
      const panel = document.getElementById("dictionary-panel");
      if (panel) {
        panel.classList.remove("translate-y-8", "scale-95");
        panel.classList.add("translate-y-0", "scale-100");
      }
    }, 10);
  }

  function closeDictionary() {
    dictionaryModal.classList.remove("opacity-100");
    dictionaryModal.classList.add("opacity-0");
    const panel = document.getElementById("dictionary-panel");
    if (panel) {
      panel.classList.remove("translate-y-0", "scale-100");
      panel.classList.add("translate-y-8", "scale-95");
    }
    if (dictionaryBtn)
      dictionaryBtn.classList.remove("opacity-0", "pointer-events-none");
    setTimeout(() => {
      dictionaryModal.classList.remove("flex");
      dictionaryModal.classList.add("hidden");
    }, 300);
  }

  if (dictionaryBtn) dictionaryBtn.addEventListener("click", openDictionary);
  if (closeDictionaryBtn)
    closeDictionaryBtn.addEventListener("click", closeDictionary);
  if (dictionaryModal) {
    dictionaryModal.addEventListener("click", (e) => {
      if (e.target === dictionaryModal) closeDictionary();
    });
  }

  // 8. 設定面板邏輯
  function openSettings() {
    settingsModal.classList.remove("hidden");
    settingsModal.classList.add("flex");
    setTimeout(() => {
      settingsModal.classList.remove("opacity-0");
      settingsModal.classList.add("opacity-100");
    }, 10);
  }

  function closeSettings() {
    settingsModal.classList.remove("opacity-100");
    settingsModal.classList.add("opacity-0");
    setTimeout(() => {
      settingsModal.classList.remove("flex");
      settingsModal.classList.add("hidden");
    }, 300);
  }

  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (closeSettingsBtn)
    closeSettingsBtn.addEventListener("click", closeSettings);
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) closeSettings();
    });
  }

  // 9. 全螢幕切換邏輯
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`無法切換為全螢幕模式: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const span = fullscreenBtn.querySelector("span");
      if (span) {
        span.textContent = document.fullscreenElement ? "退出全螢幕" : "全螢幕";
      }
    });
  }

  // 漢堡選單邏輯 (手機版)
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const topActionMenu = document.getElementById("top-action-menu");
  if (mobileMenuBtn && topActionMenu) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      topActionMenu.classList.toggle("hidden");
      topActionMenu.classList.toggle("flex");
    });

    // 點擊選單以外的地方自動收起 (手機版)
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth < 768 &&
        !topActionMenu.classList.contains("hidden")
      ) {
        if (
          !topActionMenu.contains(e.target) &&
          !mobileMenuBtn.contains(e.target)
        ) {
          topActionMenu.classList.add("hidden");
          topActionMenu.classList.remove("flex");
        }
      }
    });

    // 點擊選單內的按鈕後自動收起
    topActionMenu.addEventListener("click", (e) => {
      if (window.innerWidth < 768 && e.target.closest("button, a")) {
        topActionMenu.classList.add("hidden");
        topActionMenu.classList.remove("flex");
      }
    });
  }

  // 10. 隱藏介面功能
  let uiHidden = false;
  const uiElementsToToggle = [
    topBarVars,
    dialogueBox,
    optionsContainer,
    inventoryBtn,
    dictionaryBtn,
    topActionMenu,
    mobileMenuBtn,
  ];

  function toggleUI() {
    uiHidden = !uiHidden;
    uiElementsToToggle.forEach((el) => {
      if (el) {
        if (el === optionsContainer) {
          if (uiHidden) {
            el.classList.add("hidden");
          } else if (!isTyping && el.children.length > 0) {
            el.classList.remove("hidden");
          }
        } else {
          el.classList.toggle("hidden", uiHidden);
        }
      }
    });
    if (toggleUiBtn) {
      const span = toggleUiBtn.querySelector("span");
      if (span) {
        span.textContent = uiHidden ? "顯示介面" : "隱藏介面";
      }
    }
  }

  if (toggleUiBtn) toggleUiBtn.addEventListener("click", toggleUI);

  // 點擊背景可切換介面顯示或推進對話
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.addEventListener("click", (e) => {
      // 忽略按鈕與輸入框的點擊
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest("a")
      )
        return;

      if (uiHidden) {
        toggleUI(); // 介面隱藏時，點擊恢復顯示
      } else {
        // 介面顯示時，點擊背景推進對話
        if (isTyping) {
          skipTyping();
        } else if (
          optionsContainer &&
          !optionsContainer.classList.contains("hidden")
        ) {
          // 只允許系統產生的「繼續」按鈕透過點擊背景推進，若為玩家自訂的單一選項則必須確實點擊
          const systemNextBtn = optionsContainer.querySelector(
            "button.system-next-btn",
          );
          if (systemNextBtn) systemNextBtn.click();
        }
      }
    });
  }

  // 11. 快捷鍵功能 (空白鍵 / Enter)
  document.addEventListener("keydown", (e) => {
    // 如果有開啟面板或焦點在輸入框，不觸發快捷鍵
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (settingsModal && !settingsModal.classList.contains("hidden")) return;
    if (inventoryModal && !inventoryModal.classList.contains("hidden")) return;
    if (saveModal && !saveModal.classList.contains("hidden")) return;

    // 快速存檔 (F5)
    if (e.key === "F5") {
      e.preventDefault();
      saveGameToSlot(1); // 1號槽位保留為快速存檔
      showToast("快速存檔成功 (F5)");
      return;
    }

    // 快速讀檔 (F9)
    if (e.key === "F9") {
      e.preventDefault();
      const savesList =
        JSON.parse(localStorage.getItem("textAdventurePlayerSaves")) || [];
      if (!savesList[1]) {
        alert("目前沒有快速存檔可以讀取！");
        return;
      }
      if (confirm("確定要讀取快速存檔 (F5) 嗎？\n(目前未保存的進度將會遺失)")) {
        localStorage.setItem("currentPlayerSaveSlot", 1);
        window.location.reload();
      }
      return;
    }

    // 快速讀檔 (F9)
    if (e.key === "F9") {
      e.preventDefault();
      if (confirm("確定要讀取快速存檔嗎？將會遺失目前未保存的進度。")) {
        window.location.reload();
      }
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); // 防止空白鍵向下捲動網頁

      // 若在章節過場畫面，按下快捷鍵繼續
      if (chapterScreen && chapterScreen.classList.contains("opacity-100")) {
        chapterScreen.click();
        return;
      }

      if (isTyping) {
        skipTyping();
      } else {
        // 若為系統自動產生的繼續按鈕，則自動點擊推進
        if (
          optionsContainer &&
          !optionsContainer.classList.contains("hidden")
        ) {
          const systemNextBtn = optionsContainer.querySelector(
            "button.system-next-btn",
          );
          if (systemNextBtn) systemNextBtn.click();
        }
      }
    }
  });

  // 遊戲啟動點：渲染起始場景
  renderScene(gameState.currentSceneId);
});
