// 負責管理與渲染「章節管理」頁面邏輯

window.renderChapters = function () {
  const container = document.getElementById("chapters-container");
  const addBtn = document.getElementById("add-chapter-btn");
  if (!container || !addBtn) return;

  // 綁定新增按鈕事件 (使用 cloneNode 避免重複綁定)
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener("click", addNewChapter);

  container.innerHTML = "";

  // 確認資料結構安全
  if (!window.projectData.chapters) window.projectData.chapters = [];

  if (window.projectData.chapters.length === 0) {
    container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500 bg-white">
          目前尚未建立任何章節，點擊上方「+ 新增章節」開始。
      </div>
    `;
    return;
  }

  window.projectData.chapters.forEach((chapter, index) => {
    const chapterEl = document.createElement("div");
    chapterEl.className =
      "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition";

    // 章節標題區塊 (點擊此區塊進行摺疊/展開)
    const headerEl = document.createElement("div");
    headerEl.className =
      "flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition";
    headerEl.addEventListener("click", (e) => {
      // 確保點擊輸入框或按鈕時，不會觸發摺疊事件
      if (e.target.closest("input") || e.target.closest("button")) return;
      chapter.isExpanded = !chapter.isExpanded;
      window.renderChapters();
    });

    // 展開圖示與標題輸入框
    const iconSvg = chapter.isExpanded
      ? `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`
      : `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;

    headerEl.innerHTML = `
      <div class="flex items-center space-x-3 w-full">
        <span>${iconSvg}</span>
        <input type="text" value="${chapter.name}" placeholder="輸入章節名稱..." 
               class="flex-1 font-bold text-lg text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 transition">
      </div>
      <button class="delete-btn text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 transition ml-4" title="刪除此章節">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    // 綁定輸入事件與刪除事件
    headerEl
      .querySelector("input")
      .addEventListener("input", (e) => (chapter.name = e.target.value));
    headerEl.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`確定要刪除「${chapter.name}」嗎？`)) {
        window.projectData.chapters.splice(index, 1);
        window.renderChapters();
      }
    });
    chapterEl.appendChild(headerEl);

    // 展開的內容區域
    if (chapter.isExpanded) {
      if (!window.projectData.scenes) window.projectData.scenes = [];
      const chapterScenes = window.projectData.scenes.filter(
        (s) => s.chapterId === chapter.id,
      );

      let scenesHtml = "";
      if (chapterScenes.length === 0) {
        scenesHtml = `<div class="text-gray-500 italic p-4 text-center border border-dashed border-gray-300 rounded">目前此章節沒有場景。</div>`;
      } else {
        scenesHtml = `<div class="space-y-2">`;
        chapterScenes.forEach((scene, sIdx) => {
          scenesHtml += `
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
              <span class="font-bold text-gray-700">${scene.name} <span class="text-xs text-gray-400 font-mono font-normal ml-2 cursor-pointer hover:text-blue-500 transition select-none" onclick="window.copyId(event, '${scene.id}')" title="點擊複製 ID">(${scene.id})</span></span>
              <div class="flex items-center space-x-1">
                <button class="edit-scene-btn p-1 text-blue-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded shadow-sm border border-transparent hover:border-blue-200 transition" data-id="${scene.id}" title="編輯此場景">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button class="move-up-btn p-1 text-gray-400 hover:text-blue-500 ${sIdx === 0 ? "opacity-30 cursor-not-allowed" : ""}" data-id="${scene.id}" ${sIdx === 0 ? "disabled" : 'title="往上移"'}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                </button>
                <button class="move-down-btn p-1 text-gray-400 hover:text-blue-500 ${sIdx === chapterScenes.length - 1 ? "opacity-30 cursor-not-allowed" : ""}" data-id="${scene.id}" ${sIdx === chapterScenes.length - 1 ? "disabled" : 'title="往下移"'}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
              </div>
            </div>
          `;
        });
        scenesHtml += `</div>`;
      }

      const defaultCover =
        window.projectData.projectInfo &&
        window.projectData.projectInfo.defaultBgUrl
          ? window.projectData.projectInfo.defaultBgUrl
          : "https://via.placeholder.com/600x200?text=No+Cover+Image";

      const contentEl = document.createElement("div");
      contentEl.className =
        "p-5 border-t border-gray-200 bg-white text-sm space-y-4";
      contentEl.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <p class="text-gray-500">章節系統 ID：<span class="font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-500 transition select-none" onclick="window.copyId(event, '${chapter.id}')" title="點擊複製 ID">${chapter.id}</span></p>
          <button class="add-scene-to-chapter-btn bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1 rounded text-sm font-bold transition shadow-sm">+ 新增場景至此章節</button>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h4 class="text-md font-bold text-gray-700 border-b pb-2">章節專屬畫面設定</h4>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-1/3">
              <img src="${chapter.coverUrl || defaultCover}" class="w-full h-32 object-cover rounded border border-gray-300 shadow-sm" alt="章節封面預覽" onerror="this.src='https://via.placeholder.com/600x200?text=No+Cover+Image'">
              <p class="text-xs text-gray-400 mt-1 text-center">畫面預覽</p>
            </div>
            <div class="w-full sm:w-2/3 space-y-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">章節背景圖網址 (URL)</label>
                <input type="text" class="cover-input w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://..." value="${chapter.coverUrl || ""}">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">章節背景音樂網址 (BGM URL，選填)</label>
                <div class="flex space-x-2">
                  <input type="text" class="bgm-input flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="https://... (如 mp3)" value="${chapter.bgmUrl || ""}">
                  <button class="bgm-test-btn bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded text-sm font-bold transition whitespace-nowrap">▶ 試聽</button>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-gray-700">章節開場描述 (選填)</label>
                  <div class="flex space-x-1.5 scale-90 origin-right">
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition" data-tag="b" title="粗體 (Bold)">B</button>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition italic" data-tag="i" title="斜體 (Italic)">I</button>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold text-gray-700 transition underline" data-tag="u" title="底線 (Underline)">U</button>
                    <div class="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-red-500" data-tag="span" data-style="color:#ef4444" title="紅色文字">紅</button>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-yellow-500" data-tag="span" data-style="color:#eab308" title="黃色文字">黃</button>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-emerald-500" data-tag="span" data-style="color:#10b981" title="綠色文字">綠</button>
                    <button type="button" class="format-btn px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-bold transition text-blue-500" data-tag="span" data-style="color:#3b82f6" title="藍色文字">藍</button>
                  </div>
                </div>
                <textarea class="desc-input w-full border border-gray-300 rounded-md shadow-sm p-2 h-64 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none custom-scrollbar" placeholder="輸入此章節的開場引言...">${chapter.description || ""}</textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <h4 class="text-sm font-bold text-gray-700 mb-2">章節內場景：</h4>
          ${scenesHtml}
        </div>
      `;

      contentEl
        .querySelector(".cover-input")
        .addEventListener("change", (e) => {
          chapter.coverUrl = e.target.value;
          window.renderChapters();
        });

      contentEl.querySelector(".bgm-input").addEventListener("change", (e) => {
        chapter.bgmUrl = e.target.value;
      });

      contentEl
        .querySelector(".bgm-test-btn")
        .addEventListener("click", (e) => {
          const url = contentEl.querySelector(".bgm-input").value;
          window.toggleAudioPreview(url, e.target);
        });

      contentEl.querySelector(".desc-input").addEventListener("input", (e) => {
        chapter.description = e.target.value;
      });

      // 綁定格式快捷工具列
      contentEl.querySelectorAll(".format-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const tag = e.currentTarget.getAttribute("data-tag");
          const style = e.currentTarget.getAttribute("data-style");
          const textEl = contentEl.querySelector(".desc-input");
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
          chapter.description = newText;

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
        .querySelector(".add-scene-to-chapter-btn")
        .addEventListener("click", () => {
          if (!window.projectData.scenes) window.projectData.scenes = [];
          window.projectData.scenes.push({
            id: "scene_" + Date.now(),
            name: "新場景",
            chapterId: chapter.id,
            text: "",
            options: [],
            isExpanded: true,
          });
          window.renderChapters();
        });

      contentEl.querySelectorAll(".edit-scene-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const sceneId = e.currentTarget.getAttribute("data-id");
          if (typeof window.editSceneFromChapter === "function") {
            window.editSceneFromChapter(sceneId);
          }
        });
      });

      contentEl.querySelectorAll(".move-up-btn").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", (e) => {
          const sceneId = e.currentTarget.getAttribute("data-id");
          moveSceneInChapter(sceneId, -1, chapter.id);
        });
      });

      contentEl.querySelectorAll(".move-down-btn").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", (e) => {
          const sceneId = e.currentTarget.getAttribute("data-id");
          moveSceneInChapter(sceneId, 1, chapter.id);
        });
      });

      chapterEl.appendChild(contentEl);
    }
    container.appendChild(chapterEl);
  });
};

function addNewChapter() {
  window.projectData.chapters.push({
    id: "chapter_" + Date.now(),
    name: "新章節",
    coverUrl: "",
    bgmUrl: "",
    description: "",
    isExpanded: true,
  });
  window.renderChapters();
}

function moveSceneInChapter(sceneId, direction, chapterId) {
  const scenes = window.projectData.scenes;
  if (!scenes) return;

  const chapterScenes = scenes.filter((s) => s.chapterId === chapterId);
  const indexInChapter = chapterScenes.findIndex((s) => s.id === sceneId);

  if (indexInChapter === -1) return;

  const targetIndexInChapter = indexInChapter + direction;
  if (targetIndexInChapter < 0 || targetIndexInChapter >= chapterScenes.length)
    return;

  const scene1 = chapterScenes[indexInChapter];
  const scene2 = chapterScenes[targetIndexInChapter];

  const indexInMain1 = scenes.findIndex((s) => s.id === scene1.id);
  const indexInMain2 = scenes.findIndex((s) => s.id === scene2.id);

  const temp = scenes[indexInMain1];
  scenes[indexInMain1] = scenes[indexInMain2];
  scenes[indexInMain2] = temp;

  window.renderChapters();
}

window.editSceneFromChapter = function (sceneId) {
  const scene = window.projectData.scenes.find((s) => s.id === sceneId);
  if (scene) scene.isExpanded = true;

  if (window.switchTab) window.switchTab("場景編輯");

  setTimeout(() => {
    const sceneEl = document.getElementById(sceneId);
    if (sceneEl) {
      sceneEl.scrollIntoView({ behavior: "smooth", block: "center" });
      sceneEl.classList.add("ring-2", "ring-blue-500");
      setTimeout(
        () => sceneEl.classList.remove("ring-2", "ring-blue-500"),
        2000,
      );
    }
  }, 100);
};
