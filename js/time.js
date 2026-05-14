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
      useYMD: false,
      startYear: 1,
      startMonth: 1,
      daysPerMonth: 30,
      monthsPerYear: 12,
      yearName: "年",
      monthName: "月",
      dayName: "日",
      bindYearVarId: "",
      bindMonthVarId: "",
      bindDayVarId: "",
    };
  }
  const t = window.projectData.timeSettings;

  if (t.useYMD === undefined) t.useYMD = false;
  if (t.startYear === undefined) t.startYear = 1;
  if (t.startMonth === undefined) t.startMonth = 1;
  if (t.daysPerMonth === undefined) t.daysPerMonth = 30;
  if (t.monthsPerYear === undefined) t.monthsPerYear = 12;
  if (t.yearName === undefined) t.yearName = "年";
  if (t.monthName === undefined) t.monthName = "月";
  if (t.dayName === undefined) t.dayName = "日";
  if (t.bindYearVarId === undefined) t.bindYearVarId = "";
  if (t.bindMonthVarId === undefined) t.bindMonthVarId = "";
  if (t.bindDayVarId === undefined) t.bindDayVarId = "";

  let varOptionsYear = `<option value="">-- 不綁定 --</option>`;
  let varOptionsMonth = `<option value="">-- 不綁定 --</option>`;
  let varOptionsDay = `<option value="">-- 不綁定 --</option>`;
  if (window.projectData.globalVariables) {
    window.projectData.globalVariables.forEach((v) => {
      varOptionsYear += `<option value="${v.id}" ${t.bindYearVarId === v.id ? "selected" : ""}>${v.name}</option>`;
      varOptionsMonth += `<option value="${v.id}" ${t.bindMonthVarId === v.id ? "selected" : ""}>${v.name}</option>`;
      varOptionsDay += `<option value="${v.id}" ${t.bindDayVarId === v.id ? "selected" : ""}>${v.name}</option>`;
    });
  }

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
        <div class="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
          <label class="flex items-center cursor-pointer mb-2">
            <input type="checkbox" id="time-use-ymd-chk" class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 mr-2" ${t.useYMD ? "checked" : ""}>
            <span class="font-bold text-gray-700 text-sm">啟用「年/月/日」曆法 (取代單純的第 X 天)</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 ${t.useYMD ? "block" : "hidden"}" id="ymd-settings-panel">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">初始年份</label>
              <input type="number" id="time-start-year" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.startYear}" min="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">初始月份</label>
              <input type="number" id="time-start-month" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.startMonth}" min="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">每月天數 (預設 30)</label>
              <input type="number" id="time-days-per-month" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.daysPerMonth}" min="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">每年月份數 (預設 12)</label>
              <input type="number" id="time-months-per-year" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.monthsPerYear}" min="1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">自訂年份名稱 (預設: 年)</label>
              <input type="text" id="time-year-name" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.yearName || "年"}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">自訂月份名稱 (預設: 月)</label>
              <input type="text" id="time-month-name" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.monthName || "月"}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">自訂日期名稱 (預設: 日)</label>
              <input type="text" id="time-day-name" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" value="${t.dayName || "日"}">
            </div>
          </div>
        </div>
        <div class="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
          <h4 class="font-bold text-gray-700 text-sm mb-2">時間變數綁定 (進階)</h4>
          <p class="text-xs text-gray-500 mb-3">將目前的時間數值自動同步至指定的全域變數，方便您在選項或觸發器中設定「特定月份/日期」的條件。</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">同步年份至變數</label>
              <select id="time-bind-year" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">${varOptionsYear}</select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">同步月份至變數</label>
              <select id="time-bind-month" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">${varOptionsMonth}</select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">同步日期至變數</label>
              <select id="time-bind-day" class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">${varOptionsDay}</select>
            </div>
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

  const ymdChk = document.getElementById("time-use-ymd-chk");
  if (ymdChk) {
    ymdChk.addEventListener("change", (e) => {
      t.useYMD = e.target.checked;
      window.renderTime();
    });
  }
  const sy = document.getElementById("time-start-year");
  if (sy)
    sy.addEventListener(
      "input",
      (e) => (t.startYear = parseInt(e.target.value, 10) || 1),
    );
  const smo = document.getElementById("time-start-month");
  if (smo)
    smo.addEventListener(
      "input",
      (e) => (t.startMonth = parseInt(e.target.value, 10) || 1),
    );
  const dpm = document.getElementById("time-days-per-month");
  if (dpm)
    dpm.addEventListener(
      "input",
      (e) => (t.daysPerMonth = parseInt(e.target.value, 10) || 30),
    );
  const mpy = document.getElementById("time-months-per-year");
  if (mpy)
    mpy.addEventListener(
      "input",
      (e) => (t.monthsPerYear = parseInt(e.target.value, 10) || 12),
    );
  const yn = document.getElementById("time-year-name");
  if (yn)
    yn.addEventListener("input", (e) => (t.yearName = e.target.value || "年"));
  const mn = document.getElementById("time-month-name");
  if (mn)
    mn.addEventListener("input", (e) => (t.monthName = e.target.value || "月"));
  const dnm = document.getElementById("time-day-name");
  if (dnm)
    dnm.addEventListener("input", (e) => (t.dayName = e.target.value || "日"));
  const by = document.getElementById("time-bind-year");
  if (by)
    by.addEventListener("change", (e) => (t.bindYearVarId = e.target.value));
  const bm = document.getElementById("time-bind-month");
  if (bm)
    bm.addEventListener("change", (e) => (t.bindMonthVarId = e.target.value));
  const bd = document.getElementById("time-bind-day");
  if (bd)
    bd.addEventListener("change", (e) => (t.bindDayVarId = e.target.value));
};
