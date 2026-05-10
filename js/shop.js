// 負責管理與渲染「商店系統」頁面邏輯

window.renderShops = function () {
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
      .rainbow-text { background-image: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #ff2400) !important; -webkit-background-clip: text !important; color: transparent !important; background-size: 300% 300% !important; animation: rainbow-text-anim 3s ease-in-out infinite, rainbow-text-bg-anim 4s linear infinite; }
      .gold-border-editor { background: linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(60deg, #b45309, #fef08a, #ca8a04, #fef08a, #b45309) border-box !important; border: 3px solid transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .gold-border-dark { background: linear-gradient(#1f2937, #1f2937) padding-box, linear-gradient(60deg, #b45309, #fef08a, #ca8a04, #fef08a, #b45309) border-box !important; border: 2px solid transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .gold-text { background-image: linear-gradient(60deg, #ca8a04, #fef08a, #ca8a04, #fef08a, #ca8a04) !important; -webkit-background-clip: text !important; color: transparent !important; background-size: 200% 200% !important; animation: gold-shine 2s linear infinite; }
      .red-border-editor { border: 2px solid #dc2626 !important; animation: red-pulse 1.5s ease-in-out infinite; }
      .red-border-dark { border: 2px solid #ef4444 !important; animation: red-pulse 1.5s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }

  const container = document.getElementById("shops-container");
  const addBtn = document.getElementById("add-shop-btn");
  const collapseBtn = document.getElementById("collapse-all-shop-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewShop);

  if (collapseBtn) {
    const newCollapseBtn = collapseBtn.cloneNode(true);
    collapseBtn.parentNode.replaceChild(newCollapseBtn, collapseBtn);
    newCollapseBtn.addEventListener("click", () => {
      if (window.projectData.shops) {
        window.projectData.shops.forEach((s) => (s.isExpanded = false));
        window.renderShops();
      }
    });
  }

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.shops) window.projectData.shops = [];

  if (window.projectData.shops.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何商店，點擊上方「+ 新增商店」開始。
      </div>
    `;
    return;
  }

  const query = window.shopSearchQuery || "";
  let hasRenderedAny = false;

  window.projectData.shops.forEach((shop, index) => {
    if (query) {
      const textToSearch = [shop.name, shop.id, shop.description]
        .join(" ")
        .toLowerCase();
      if (!textToSearch.includes(query)) return;
    }

    hasRenderedAny = true;

    const shopEl = document.createElement("div");
    shopEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    // 標題區塊
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
      shop.isExpanded = !shop.isExpanded;
      window.renderShops();
    });

    const iconSvg = shop.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${shop.id}" onclick="window.copyId(event, '${shop.id}')">${shop.id}</span>
        <input type="text" value="${shop.name}" placeholder="輸入商店名稱..." 
               class="w-full max-w-[500px] font-bold text-lg text-gray-800 bg-transparent border border-transparent hover:bg-white hover:border-gray-300 hover:shadow-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none rounded px-2 py-1 transition-all cursor-text">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此商店">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (shop.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除商店「${shop.name}」嗎？`)) {
        window.projectData.shops.splice(index, 1);
        window.renderShops();
      }
    });
    shopEl.appendChild(headerEl);

    if (shop.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      let goodsHtml = "";
      if (!shop.goods) shop.goods = [];
      if (shop.goods.length === 0) {
        goodsHtml = `<div class="text-sm text-gray-400 italic p-3 bg-gray-50 border border-dashed border-gray-300 rounded text-center">目前沒有販售任何商品。</div>`;
      } else {
        shop.goods.forEach((good, gIdx) => {
          let itemOptions = `<option value="">-- 選擇商品道具 --</option>`;
          if (window.projectData.items) {
            window.projectData.items.forEach((i) => {
              const selected = i.id === good.itemId ? "selected" : "";
              itemOptions += `<option value="${i.id}" ${selected}>${i.name}</option>`;
            });
          }

          let varOptions = `<option value="">-- 選擇貨幣變數 --</option>`;
          if (window.projectData.globalVariables) {
            window.projectData.globalVariables.forEach((v) => {
              const selected = v.id === good.costVariableId ? "selected" : "";
              varOptions += `<option value="${v.id}" ${selected}>${v.name}</option>`;
            });
          }

          goodsHtml += `
            <div class="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 bg-gray-50 p-3 rounded border border-gray-200 transition hover:border-blue-300">
              <select class="good-item-id flex-1 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" data-idx="${gIdx}">
                ${itemOptions}
              </select>
              <div class="flex items-center">
                <span class="text-gray-500 text-sm font-bold md:ml-2 mr-2">價格:</span>
                <input type="number" class="good-price w-20 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" value="${good.price || 0}" data-idx="${gIdx}" min="0">
                <select class="good-var-id w-32 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 ml-2" data-idx="${gIdx}">
                  ${varOptions}
                </select>
                <span class="text-gray-500 text-sm font-bold ml-2 mr-1">庫存:</span>
                <input type="number" class="good-stock w-16 border border-gray-300 rounded shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="無限" value="${good.stock !== undefined ? good.stock : ""}" data-idx="${gIdx}" min="1" title="留空表示無限庫存">
                <button class="good-del-btn text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-2" data-idx="${gIdx}" title="刪除商品">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          `;
        });
      }

      contentEl.innerHTML = `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">商店描述 (選填，將顯示在商店介面上方)</label>
          <textarea class="shop-desc w-full border border-gray-300 rounded-md shadow-sm p-2 h-20 focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar text-sm" placeholder="例如：歡迎來到神祕商人的店舖...">${shop.description || ""}</textarea>
        </div>
        <div class="border-t border-gray-200 pt-4">
          <div class="flex justify-between items-center mb-3">
            <label class="block text-sm font-medium text-gray-700">販售商品列表</label>
            <button class="add-good-btn bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1 rounded text-sm font-bold transition shadow-sm">+ 新增商品</button>
          </div>
          <div class="space-y-2">
            ${goodsHtml}
          </div>
        </div>
      `;

      contentEl.querySelector(".shop-desc").addEventListener("input", (e) => {
        shop.description = e.target.value;
      });

      contentEl.querySelectorAll(".good-item-id").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const idx = e.target.getAttribute("data-idx");
          shop.goods[idx].itemId = e.target.value;
        });
      });

      contentEl.querySelectorAll(".good-price").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          const idx = e.target.getAttribute("data-idx");
          shop.goods[idx].price = parseInt(e.target.value, 10) || 0;
        });
      });

      contentEl.querySelectorAll(".good-var-id").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const idx = e.target.getAttribute("data-idx");
          shop.goods[idx].costVariableId = e.target.value;
        });
      });

      contentEl.querySelectorAll(".good-stock").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          const idx = e.target.getAttribute("data-idx");
          const val = parseInt(e.target.value, 10);
          shop.goods[idx].stock = isNaN(val) ? "" : val;
        });
      });

      contentEl.querySelectorAll(".good-del-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const idx = e.currentTarget.getAttribute("data-idx");
          shop.goods.splice(idx, 1);
          window.renderShops();
        });
      });

      contentEl.querySelector(".add-good-btn").addEventListener("click", () => {
        shop.goods.push({
          itemId: "",
          costVariableId: "",
          price: 0,
          stock: "",
        });
        window.renderShops();
      });

      shopEl.appendChild(contentEl);
    }
    container.appendChild(shopEl);
  });

  if (query && !hasRenderedAny) {
    container.innerHTML = `
      <div class="text-gray-500 italic p-10 text-center border border-dashed border-gray-300 rounded-xl bg-white">
          找不到符合「${query}」的商店。
      </div>
    `;
  }
};

function addNewShop() {
  if (!window.projectData.shops) window.projectData.shops = [];
  window.projectData.shops.push({
    id: "shop_" + Date.now(),
    name: "新商店",
    description: "",
    goods: [],
    isExpanded: true,
  });
  window.renderShops();
}
