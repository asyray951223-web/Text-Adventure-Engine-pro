// 負責管理與渲染「時間系統」頁面邏輯

window.renderTime = function () {
  const container = document.getElementById("time-container");
  if (!container) return;

  if (!window.projectData.timeSettings) {
    window.projectData.timeSettings = {
      enabled: false,
      startDay: 1,
      startHour: 8,
      startMinute: 0,
      dayNames: "",
      hoursPerDay: 24,
      hideClock: false,
      jumpOnDayChange: false,
      dayChangeSceneId: "",
    };
  }
  const t = window.projectData.timeSettings;

  let sceneOptions = `<option value="">-- 請選擇跳轉場景 --</option>`;
  if (window.projectData.scenes) {
    window.projectData.scenes.forEach((s) => {
      const selected = s.id === t.dayChangeSceneId ? "selected" : "";
      sceneOptions += `<option value="${s.id}" ${selected}>${s.name}</option>`;
    });
  }

  container.innerHTML = `
    <div class="bg-white border border-gray-300 rounded-lg shadow-sm p-6 space-y-4">
      <label class="flex items-center cursor-pointer mb-2">
        <input type="checkbox" id="time-enabled-chk" class="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 mr-2" ${t.enabled ? "checked" : ""}>
        <span class="font-bold text-gray-800 text-lg">啟用時間系統</span>
      </label>
      
      <div class="space-y-4 ${t.enabled ? "block" : "hidden"}" id="time-settings-panel">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">初始天數</label>
            <input type="number" id="time-start-day" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.startDay}" min="1">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">初始小時</label>
            <input type="number" id="time-start-hour" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.startHour}" min="0">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">初始分鐘</label>
            <input type="number" id="time-start-minute" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.startMinute}" min="0" max="59">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">每日總時數 (預設 24)</label>
            <input type="number" id="time-hours-per-day" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.hoursPerDay || 24}" min="1">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">自訂日期名稱 (以逗號分隔，選填)</label>
          <input type="text" id="time-day-names" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="例如：星期一, 星期二, 星期三..." value="${t.dayNames || ""}">
        </div>
        <label class="flex items-center cursor-pointer mt-4">
          <input type="checkbox" id="time-hide-clock-chk" class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${t.hideClock ? "checked" : ""}>
          <span class="font-bold text-gray-700 text-sm">僅顯示日期名稱，隱藏詳細時間 (時:分)</span>
        </label>
        <div class="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
          <label class="flex items-center cursor-pointer mb-2">
            <input type="checkbox" id="time-jump-chk" class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${t.jumpOnDayChange ? "checked" : ""}>
            <span class="font-bold text-gray-700 text-sm">當日期變更時，自動跳轉至特定場景 (例如：進入睡覺結算畫面)</span>
          </label>
          <div class="${t.jumpOnDayChange ? "block" : "hidden"} mt-2">
            <select id="time-jump-scene" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
              ${sceneOptions}
            </select>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2">啟用後，玩家介面上方將會顯示目前的時間。您可以在場景選項、道具或觸發器中設定推進時間（例如流逝 60 分鐘）。<br>同時在選項與 NPC 等地方也會解鎖「限制時段」條件 (例如限定 22:00 ~ 05:00 出現)。</p>
      </div>
    </div>
  `;

  document
    .getElementById("time-enabled-chk")
    .addEventListener("change", (e) => {
      t.enabled = e.target.checked;
      window.renderTime();
    });
  const sd = document.getElementById("time-start-day");
  if (sd)
    sd.addEventListener(
      "input",
      (e) => (t.startDay = parseInt(e.target.value, 10) || 1),
    );
  const sh = document.getElementById("time-start-hour");
  if (sh)
    sh.addEventListener(
      "input",
      (e) => (t.startHour = parseInt(e.target.value, 10) || 0),
    );
  const sm = document.getElementById("time-start-minute");
  if (sm)
    sm.addEventListener(
      "input",
      (e) => (t.startMinute = parseInt(e.target.value, 10) || 0),
    );

  const hp = document.getElementById("time-hours-per-day");
  if (hp)
    hp.addEventListener(
      "input",
      (e) => (t.hoursPerDay = parseInt(e.target.value, 10) || 24),
    );

  const dn = document.getElementById("time-day-names");
  if (dn) dn.addEventListener("input", (e) => (t.dayNames = e.target.value));

  const hc = document.getElementById("time-hide-clock-chk");
  if (hc)
    hc.addEventListener("change", (e) => (t.hideClock = e.target.checked));

  const jumpChk = document.getElementById("time-jump-chk");
  if (jumpChk)
    jumpChk.addEventListener("change", (e) => {
      t.jumpOnDayChange = e.target.checked;
      window.renderTime();
    });

  const jumpScene = document.getElementById("time-jump-scene");
  if (jumpScene)
    jumpScene.addEventListener("change", (e) => {
      t.dayChangeSceneId = e.target.value;
    });
};
