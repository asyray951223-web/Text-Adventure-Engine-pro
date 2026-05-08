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
      testBgmPlayer.volume = 0.5; // 測試模式預設 50%
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
          <li class="flex justify-between border-b border-gray-800 pb-1 cursor-pointer hover:bg-gray-800/80 transition px-1 -mx-1 rounded" onclick="window.setDebugVar('${v.id}')" title="點擊修改數值">
            <span>${v.name}:</span>
            <span class="${valColor} font-mono font-bold">${val}</span>
          </li>
        `;
      });
    } else {
      debugVariablesList.innerHTML = `<li class="text-gray-500 italic text-center py-2">尚未設定全域變數</li>`;
    }

    debugItemsList.innerHTML = "";
    const ownedItems = Object.entries(gameState.items).filter(
      ([id, qty]) => qty > 0,
    );
    if (ownedItems.length > 0) {
      ownedItems.forEach(([itemId, qty]) => {
        const itemData = projectData.items.find((i) => i.id === itemId);
        if (itemData) {
          debugItemsList.innerHTML += `
            <li class="flex justify-between border-b border-gray-800 pb-1 cursor-pointer hover:bg-gray-800/80 transition px-1 -mx-1 rounded" onclick="window.setDebugItem('${itemId}')" title="點擊修改數量">
              <span class="truncate mr-2">${itemData.name}:</span>
              <span class="text-yellow-400 font-mono font-bold">x${qty}</span>
            </li>
          `;
        }
      });
    } else {
      debugItemsList.innerHTML = `<li class="text-gray-500 italic text-center py-2">尚未持有道具</li>`;
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

    // 處理背景音樂
    let bgmToPlay = scene.bgmUrl;
    if (!bgmToPlay) {
      const chapter = projectData.chapters.find(
        (c) => c.id === scene.chapterId,
      );
      if (chapter && chapter.bgmUrl) {
        bgmToPlay = chapter.bgmUrl;
      }
    }
    playBgm(bgmToPlay);

    // 處理背景圖片 (優先抓取場景設定，再抓取章節設定)
    if (scene.bgUrl) {
      testBg.style.backgroundImage = `url('${scene.bgUrl}')`;
      testBg.style.opacity = "0.7";
    } else {
      if (scene.chapterId && projectData.chapters) {
        const chapter = projectData.chapters.find(
          (c) => c.id === scene.chapterId,
        );
        if (chapter && chapter.coverUrl) {
          testBg.style.backgroundImage = `url('${chapter.coverUrl}')`;
          testBg.style.opacity = "0.7";
        }
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
      validOptions.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className =
          "bg-blue-900/80 hover:bg-blue-700 text-white px-4 py-2 rounded border border-blue-500 text-sm transition shadow-md";
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
    } else {
      const idx = projectData.scenes.findIndex((s) => s.id === scene.id);
      if (idx !== -1 && idx < projectData.scenes.length - 1) {
        const btn = document.createElement("button");
        btn.className =
          "bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-500 text-sm transition shadow-md";
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
      alert(`[測試模式] 觸發開啟商店：${targetId.replace("__SHOP__", "")}`);
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

  // 初始化畫面
  populateSceneDropdown();
  renderDebugPanels();
  if (projectData.scenes && projectData.scenes.length > 0)
    renderScene(projectData.scenes[0].id);
});
