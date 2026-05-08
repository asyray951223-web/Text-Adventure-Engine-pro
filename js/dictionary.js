// 負責管理與渲染「辭典系統」頁面邏輯

window.renderDictionary = function () {
  const container = document.getElementById("dictionary-container");
  const addBtn = document.getElementById("add-dictionary-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewDictionary);

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.dictionary) window.projectData.dictionary = [];

  if (window.projectData.dictionary.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何辭條，點擊上方「+ 新增辭條」開始。
      </div>
    `;
    return;
  }

  window.projectData.dictionary.forEach((entry, index) => {
    const entryEl = document.createElement("div");
    entryEl.className =
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
      entry.isExpanded = !entry.isExpanded;
      window.renderDictionary();
    });

    const iconSvg = entry.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <span class="text-sm font-mono text-gray-400 w-24 truncate cursor-pointer hover:text-blue-500 transition select-none" title="點擊複製 ID: ${entry.id}" onclick="window.copyId(event, '${entry.id}')">${entry.id}</span>
        <input type="text" value="${entry.term}" placeholder="輸入辭條名稱..." 
               class="flex-1 font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此辭條">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (entry.term = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除辭條「${entry.term}」嗎？`)) {
        window.projectData.dictionary.splice(index, 1);
        window.renderDictionary();
      }
    });
    entryEl.appendChild(headerEl);

    if (entry.isExpanded) {
      const contentEl = document.createElement("div");
      contentEl.className = "p-5 border-t border-gray-200 bg-white space-y-4";

      if (!entry.conditions) {
        entry.conditions = { variables: {}, items: {} };
      }

      // 準備變數的勾選清單
      let varConditionsHtml = "";
      if (
        window.projectData.globalVariables &&
        window.projectData.globalVariables.length > 0
      ) {
        window.projectData.globalVariables.forEach((v) => {
          const isChecked = entry.conditions.variables[v.id] !== undefined;
          const op = isChecked ? entry.conditions.variables[v.id].op : ">=";
          const val = isChecked ? entry.conditions.variables[v.id].val : "";
          varConditionsHtml += `
            <div class="flex items-center space-x-2 bg-white p-2 rounded border ${isChecked ? "border-blue-400 shadow-sm" : "border-gray-200"} transition">
                <label class="flex items-center space-x-2 cursor-pointer w-1/3 min-w-[80px]">
                    <input type="checkbox" class="cond-var-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500" data-id="${v.id}" ${isChecked ? "checked" : ""}>
                    <span class="text-sm font-bold ${isChecked ? "text-blue-700" : "text-gray-600"} truncate" title="${v.name}">${v.name}</span>
                </label>
                <div class="flex items-center space-x-1 flex-1 transition-opacity duration-200" style="opacity: ${isChecked ? "1" : "0.3"}; pointer-events: ${isChecked ? "auto" : "none"};">
                    <select class="cond-var-op border border-gray-300 rounded p-1 text-sm w-12 focus:ring-blue-500" data-id="${v.id}">
                        <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                        <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                        <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                        <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                        <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                        <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
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
          const itemCond = entry.conditions.items[i.id];
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
                    <select class="cond-item-op border border-gray-300 rounded p-1 text-sm w-12 focus:ring-blue-500" data-id="${i.id}">
                        <option value=">=" ${op === ">=" ? "selected" : ""}>&ge;</option>
                        <option value="<=" ${op === "<=" ? "selected" : ""}>&le;</option>
                        <option value="==" ${op === "==" ? "selected" : ""}>==</option>
                        <option value="!=" ${op === "!=" ? "selected" : ""}>!=</option>
                        <option value=">" ${op === ">" ? "selected" : ""}>&gt;</option>
                        <option value="<" ${op === "<" ? "selected" : ""}>&lt;</option>
                    </select>
                    <input type="number" class="cond-item-val border border-gray-300 rounded p-1 w-full max-w-[80px] text-sm focus:ring-blue-500" placeholder="數量" value="${val}" data-id="${i.id}" min="1">
                </div>
            </div>
          `;
        });
      } else {
        itemConditionsHtml = `<p class="text-sm text-gray-400 italic">尚未建立任何道具</p>`;
      }

      // 準備進度的勾選清單
      const hasChapterCond = !!entry.conditions.chapter;
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
          const selected = entry.conditions.chapter === ch.id ? "selected" : "";
          chapterConditionsHtml += `<option value="${ch.id}" ${selected}>${ch.name}</option>`;
        });
      } else {
        chapterConditionsHtml += `<option value="">-- 尚未建立章節 --</option>`;
      }
      chapterConditionsHtml += `</select></div></div>`;

      contentEl.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium text-gray-700">辭條說明</label>
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
          <textarea class="desc-text w-full border border-gray-300 rounded-md shadow-sm p-3 h-48 focus:ring-blue-500 focus:border-blue-500 resize-none custom-scrollbar leading-relaxed text-sm" placeholder="輸入辭條的詳細解釋...">${entry.description || ""}</textarea>
        </div>
        <div class="mt-4 bg-gray-50 border border-gray-200 rounded-lg">
            <label class="flex items-center cursor-pointer p-2 bg-gray-100 rounded hover:bg-gray-200 transition m-0 border border-gray-200">
              <input type="checkbox" class="entry-enable-cond-chk h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${entry.enableCondition ? "checked" : ""}>
              <span class="font-bold text-gray-700">解鎖條件 (若未勾選則預設一開始就自動解鎖)</span>
            </label>
            <div class="p-4 space-y-3 ${entry.enableCondition ? "block" : "hidden"}">
                <p class="text-xs text-gray-500 mb-2">當玩家滿足以下條件時，辭典才會顯示此辭條。</p>
                <div class="space-y-2">
                    <span class="text-xs font-bold text-gray-500">進度條件：</span>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${chapterConditionsHtml}</div>
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
            </div>
        </div>
      `;

      contentEl.querySelector(".desc-text").addEventListener("input", (e) => {
        entry.description = e.target.value;
      });

      // 綁定富文本快捷工具列
      contentEl.querySelectorAll(".format-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const tag = e.currentTarget.getAttribute("data-tag");
          const style = e.currentTarget.getAttribute("data-style");
          const textEl = contentEl.querySelector(".desc-text");
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
          entry.description = newText;

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

      contentEl
        .querySelector(".entry-enable-cond-chk")
        .addEventListener("change", (e) => {
          entry.enableCondition = e.target.checked;
          window.renderDictionary();
        });

      if (entry.enableCondition) {
        contentEl
          .querySelector(".cond-chapter-chk")
          .addEventListener("change", (e) => {
            if (e.target.checked) {
              entry.conditions.chapter =
                window.projectData.chapters &&
                window.projectData.chapters.length > 0
                  ? window.projectData.chapters[0].id
                  : "";
            } else {
              delete entry.conditions.chapter;
            }
            window.renderDictionary();
          });

        contentEl
          .querySelector(".cond-chapter-sel")
          .addEventListener("change", (e) => {
            entry.conditions.chapter = e.target.value;
          });

        contentEl.querySelectorAll(".cond-var-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            if (e.target.checked) {
              entry.conditions.variables[id] = { op: ">=", val: 0 };
            } else {
              delete entry.conditions.variables[id];
            }
            window.renderDictionary();
          });
        });

        contentEl.querySelectorAll(".cond-var-op").forEach((sel) => {
          sel.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            if (entry.conditions.variables[id]) {
              entry.conditions.variables[id].op = e.target.value;
            }
          });
        });

        contentEl.querySelectorAll(".cond-var-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const id = e.target.getAttribute("data-id");
            if (entry.conditions.variables[id]) {
              const val = parseInt(e.target.value, 10);
              entry.conditions.variables[id].val = isNaN(val) ? "" : val;
            }
          });
        });

        contentEl.querySelectorAll(".cond-item-chk").forEach((chk) => {
          chk.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            if (e.target.checked) {
              entry.conditions.items[id] = { op: ">=", val: 1 };
            } else {
              delete entry.conditions.items[id];
            }
            window.renderDictionary();
          });
        });

        contentEl.querySelectorAll(".cond-item-op").forEach((sel) => {
          sel.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            if (entry.conditions.items[id]) {
              entry.conditions.items[id].op = e.target.value;
            }
          });
        });

        contentEl.querySelectorAll(".cond-item-val").forEach((input) => {
          input.addEventListener("input", (e) => {
            const id = e.target.getAttribute("data-id");
            if (entry.conditions.items[id]) {
              const val = parseInt(e.target.value, 10);
              entry.conditions.items[id].val = isNaN(val) ? 1 : val;
            }
          });
        });
      }

      entryEl.appendChild(contentEl);
    }
    container.appendChild(entryEl);
  });
};

function addNewDictionary() {
  if (!window.projectData.dictionary) window.projectData.dictionary = [];
  window.projectData.dictionary.push({
    id: "dict_" + Date.now(),
    term: "新辭條",
    description: "",
    enableCondition: false,
    conditions: { variables: {}, items: {} },
    isExpanded: true,
  });
  window.renderDictionary();
}
