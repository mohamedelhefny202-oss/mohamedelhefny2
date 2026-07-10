/* ===========================================================
   جرد الكافيه اليومي - script.js
   يعمل بالكامل بدون Backend ويعتمد على LocalStorage
=========================================================== */

/* ---------- 1) بيانات المنتجات ---------- */
const PRODUCTS = [
  {
    id: "hot",
    title: "المشروبات الساخنة",
    icon: "☕",
    items: [
      { id: "h1", name: "قهوة" },
      { id: "h2", name: "قهوة بندق" },
      { id: "h3", name: "نسكافية" },
      { id: "h4", name: "نسكافية بلاك" },
      { id: "h5", name: "كابتشينو" },
      { id: "h6", name: "هوت شوكليت" },
      { id: "h7", name: "قرفة" },
      { id: "h8", name: "نعناع" },
      { id: "h9", name: "كركديه" },
      { id: "h10", name: "ينسون" },
      { id: "h11", name: "شاي" },
      { id: "h12", name: "شاي أخضر" }
    ]
  },
  {
    id: "cold",
    title: "المشروبات الباردة",
    icon: "🥤",
    items: [
      { id: "c1", name: "كانز" },
      { id: "c2", name: "فيروز" },
      { id: "c3", name: "بريل" },
      { id: "c4", name: "مياه صغيرة" },
      { id: "c5", name: "مياه كبيرة" },
      { id: "c6", name: "عصير مانجو" },
      { id: "c7", name: "عصير فراولة" },
      { id: "c8", name: "عصير برتقال" },
      { id: "c9", name: "عصير بطيخ" },
      { id: "c10", name: "عصير جوافة" },
      { id: "c11", name: "آيس شوكليت" },
      { id: "c12", name: "ميلك شيك" }
    ]
  },
  {
    id: "sweets",
    title: "الحلويات",
    icon: "🧇",
    items: [
      { id: "s1", name: "وافل" }
    ]
  }
];

const ALL_ITEMS = PRODUCTS.flatMap(cat => cat.items);
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const STORAGE_KEYS = {
  currentDay: "cafe_currentDay_v1",
  history: "cafe_history_v1"
};

/* ---------- 2) أدوات مساعدة للتاريخ ---------- */
function pad(n) { return n.toString().padStart(2, "0"); }

function formatDate(d) {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function getDayName(d) {
  return DAY_NAMES[d.getDay()];
}

function findItem(id) {
  return ALL_ITEMS.find(i => i.id === id);
}

/* ---------- 3) الحالة (State) ---------- */
let state = {
  currentDay: null, // { date, dayName, startedAt, items: {id: count} }
  history: []        // [{ id, date, dayName, items, total, uniqueCount, topProduct, savedAt }]
};

function createEmptyDay() {
  const now = new Date();
  const items = {};
  ALL_ITEMS.forEach(i => (items[i.id] = 0));
  return {
    date: formatDate(now),
    dayName: getDayName(now),
    startedAt: now.getTime(),
    items
  };
}

function loadState() {
  try {
    const savedDay = localStorage.getItem(STORAGE_KEYS.currentDay);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.history);

    state.currentDay = savedDay ? JSON.parse(savedDay) : createEmptyDay();
    state.history = savedHistory ? JSON.parse(savedHistory) : [];

    // تأكد أن كل المنتجات موجودة داخل اليوم الحالي (في حال أضيفت منتجات جديدة لاحقًا)
    ALL_ITEMS.forEach(i => {
      if (typeof state.currentDay.items[i.id] !== "number") {
        state.currentDay.items[i.id] = 0;
      }
    });
  } catch (e) {
    console.error("خطأ في تحميل البيانات، سيتم البدء من جديد", e);
    state.currentDay = createEmptyDay();
    state.history = [];
  }
  saveState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEYS.currentDay, JSON.stringify(state.currentDay));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
  } catch (e) {
    console.error("تعذر حفظ البيانات", e);
    showToast("⚠️ تعذر حفظ البيانات محليًا");
  }
}

/* ---------- 4) حسابات ---------- */
function calcTotals(itemsObj) {
  let total = 0;
  let uniqueCount = 0;
  let topProduct = null;

  ALL_ITEMS.forEach(i => {
    const count = itemsObj[i.id] || 0;
    if (count > 0) {
      total += count;
      uniqueCount += 1;
      if (!topProduct || count > topProduct.count) {
        topProduct = { id: i.id, name: i.name, count };
      }
    }
  });

  return { total, uniqueCount, topProduct };
}

/* ---------- 5) عرض المنتجات ---------- */
const productsContainer = document.getElementById("productsContainer");
const noResultsEl = document.getElementById("noResults");

function renderProducts(filter = "") {
  const term = filter.trim().toLowerCase();
  productsContainer.innerHTML = "";
  let anyVisible = false;

  PRODUCTS.forEach(category => {
    const filteredItems = category.items.filter(i =>
      i.name.toLowerCase().includes(term)
    );
    if (filteredItems.length === 0) return;

    anyVisible = true;

    const section = document.createElement("section");
    section.className = "category-section";

    const titleEl = document.createElement("h2");
    titleEl.className = "category-title";
    titleEl.innerHTML = `<span>${category.icon}</span> <span>${category.title}</span> <span class="category-count">${filteredItems.length} منتج</span>`;
    section.appendChild(titleEl);

    const grid = document.createElement("div");
    grid.className = "products-grid";

    filteredItems.forEach(item => {
      grid.appendChild(buildProductCard(item));
    });

    section.appendChild(grid);
    productsContainer.appendChild(section);
  });

  noResultsEl.classList.toggle("hidden", anyVisible);
}

function buildProductCard(item) {
  const count = state.currentDay.items[item.id] || 0;

  const card = document.createElement("div");
  card.className = "product-card" + (count > 0 ? " has-orders" : "");
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="product-name">${item.name}</div>
    <div class="product-controls">
      <button class="qty-btn minus" data-action="minus" data-id="${item.id}" ${count === 0 ? "disabled" : ""} aria-label="نقص">−</button>
      <span class="qty-value" data-qty="${item.id}">${count}</span>
      <button class="qty-btn plus" data-action="plus" data-id="${item.id}" aria-label="زيادة">+</button>
    </div>
    ${count > 0 ? `<button class="reset-single-btn" data-action="reset-one" data-id="${item.id}">تصفير</button>` : ""}
  `;
  return card;
}

/* تحديث كارد واحد فقط بدون إعادة رسم كل الصفحة (أداء أفضل) */
function updateCardUI(id) {
  const count = state.currentDay.items[id] || 0;
  const card = productsContainer.querySelector(`.product-card[data-id="${id}"]`);
  if (!card) return;

  card.classList.toggle("has-orders", count > 0);
  const qtyEl = card.querySelector(`[data-qty="${id}"]`);
  if (qtyEl) qtyEl.textContent = count;

  const minusBtn = card.querySelector('[data-action="minus"]');
  if (minusBtn) minusBtn.disabled = count === 0;

  let resetBtn = card.querySelector('[data-action="reset-one"]');
  if (count > 0 && !resetBtn) {
    resetBtn = document.createElement("button");
    resetBtn.className = "reset-single-btn";
    resetBtn.dataset.action = "reset-one";
    resetBtn.dataset.id = id;
    resetBtn.textContent = "تصفير";
    card.appendChild(resetBtn);
  } else if (count === 0 && resetBtn) {
    resetBtn.remove();
  }
}

/* ---------- 6) أزرار الزيادة / النقصان ---------- */
function updateCount(id, delta) {
  const current = state.currentDay.items[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === current) return;

  state.currentDay.items[id] = next;
  saveState();
  updateCardUI(id);
  renderHeaderStats();
}

function resetProduct(id) {
  const item = findItem(id);
  openConfirm(
    "تصفير منتج",
    `هل تريد تصفير عدد "${item.name}"؟`,
    () => {
      state.currentDay.items[id] = 0;
      saveState();
      updateCardUI(id);
      renderHeaderStats();
      showToast(`تم تصفير ${item.name}`);
    }
  );
}

function resetAllProducts() {
  openConfirm(
    "تصفير جميع المنتجات",
    "هل أنت متأكد من تصفير كل المنتجات؟ لن يتم حذف هذا اليوم، فقط ستعود كل الأعداد إلى صفر.",
    () => {
      ALL_ITEMS.forEach(i => (state.currentDay.items[i.id] = 0));
      saveState();
      renderProducts(searchInput.value);
      renderHeaderStats();
      showToast("تم تصفير جميع المنتجات");
    }
  );
}

/* ---------- 7) هيدر الإحصائيات العلوية ---------- */
const todayDateEl = document.getElementById("todayDate");
const totalOrdersEl = document.getElementById("totalOrders");
const totalUniqueEl = document.getElementById("totalUnique");

function renderHeaderStats() {
  const now = new Date();
  todayDateEl.textContent = `${getDayName(now)} - ${formatDate(now)}`;

  const { total, uniqueCount } = calcTotals(state.currentDay.items);
  totalOrdersEl.textContent = total;
  totalUniqueEl.textContent = uniqueCount;
}

/* ---------- 8) إنهاء اليوم ---------- */
function endDay() {
  const { total, uniqueCount, topProduct } = calcTotals(state.currentDay.items);

  if (total === 0) {
    openConfirm(
      "إنهاء اليوم",
      "لم يتم تسجيل أي طلبات اليوم. هل تريد إنهاء اليوم رغم ذلك؟",
      () => doEndDay(total, uniqueCount, topProduct)
    );
    return;
  }

  openConfirm(
    "إنهاء اليوم",
    `سيتم حفظ تقرير اليوم (${total} طلب) وبدء يوم جديد. هل أنت متأكد؟`,
    () => doEndDay(total, uniqueCount, topProduct)
  );
}

function doEndDay(total, uniqueCount, topProduct) {
  const report = {
    id: Date.now().toString(),
    date: state.currentDay.date,
    dayName: state.currentDay.dayName,
    items: { ...state.currentDay.items },
    total,
    uniqueCount,
    topProduct,
    savedAt: Date.now()
  };

  state.history.unshift(report);
  state.currentDay = createEmptyDay();
  saveState();

  renderProducts(searchInput.value);
  renderHeaderStats();
  showToast("✅ تم حفظ تقرير اليوم وبدء يوم جديد");
}

/* ---------- 9) سجل الأيام ---------- */
const historyModal = document.getElementById("historyModal");
const historyList = document.getElementById("historyList");

function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    historyList.innerHTML = `<p class="empty-state">لا توجد تقارير محفوظة بعد 📭</p>`;
    return;
  }

  state.history.forEach(report => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <div class="history-item-info" data-open-report="${report.id}">
        <span class="history-item-day">${report.dayName}</span>
        <span class="history-item-date">${report.date}</span>
      </div>
      <span class="history-item-total">${report.total} طلب</span>
    `;
    historyList.appendChild(row);
  });
}

function deleteReport(id) {
  openConfirm(
    "حذف التقرير",
    "هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.",
    () => {
      state.history = state.history.filter(r => r.id !== id);
      saveState();
      renderHistory();
      closeModal("reportModal");
      showToast("تم حذف التقرير");
    }
  );
}

function deleteAllReports() {
  if (state.history.length === 0) {
    showToast("لا توجد تقارير لحذفها");
    return;
  }
  openConfirm(
    "حذف جميع التقارير",
    "هل أنت متأكد من حذف كل التقارير المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.",
    () => {
      state.history = [];
      saveState();
      renderHistory();
      showToast("تم حذف جميع التقارير");
    }
  );
}

/* ---------- 10) عرض تقرير مفصل ---------- */
const reportTitle = document.getElementById("reportTitle");
const reportSummary = document.getElementById("reportSummary");
const reportTableBody = document.getElementById("reportTableBody");
const deleteThisReportBtn = document.getElementById("deleteThisReportBtn");

function openReport(id) {
  const report = state.history.find(r => r.id === id);
  if (!report) return;

  reportTitle.textContent = `تقرير ${report.dayName} - ${report.date}`;

  reportSummary.innerHTML = `
    <div class="stat-box">
      <span class="num">${report.total}</span>
      <span class="lbl">إجمالي الطلبات</span>
    </div>
    <div class="stat-box">
      <span class="num">${report.uniqueCount}</span>
      <span class="lbl">منتجات مختلفة</span>
    </div>
    <div class="stat-box wide">
      <span class="num">${report.topProduct ? "🏆 " + report.topProduct.name : "—"}</span>
      <span class="lbl">${report.topProduct ? `أكثر منتج مبيعاً (${report.topProduct.count} طلب)` : "لا يوجد"}</span>
    </div>
  `;

  reportTableBody.innerHTML = "";
  const rows = ALL_ITEMS
    .map(i => ({ name: i.name, count: report.items[i.id] || 0 }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) {
    reportTableBody.innerHTML = `<tr><td colspan="2">لا توجد طلبات مسجلة في هذا اليوم</td></tr>`;
  } else {
    rows.forEach((r, idx) => {
      const tr = document.createElement("tr");
      if (idx === 0) tr.className = "top-row";
      tr.innerHTML = `<td>${r.name}</td><td>${r.count}</td>`;
      reportTableBody.appendChild(tr);
    });
  }

  deleteThisReportBtn.dataset.reportId = report.id;
  openModal("reportModal");
}

/* ---------- 11) الإحصائيات العامة ---------- */
const statsBody = document.getElementById("statsBody");

function renderStats() {
  const { total, uniqueCount, topProduct } = calcTotals(state.currentDay.items);

  statsBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-box">
        <span class="num">${total}</span>
        <span class="lbl">إجمالي طلبات اليوم</span>
      </div>
      <div class="stat-box">
        <span class="num">${uniqueCount}</span>
        <span class="lbl">عدد المنتجات المباعة</span>
      </div>
      <div class="stat-box wide">
        <span class="num">${topProduct ? "🏆 " + topProduct.name : "—"}</span>
        <span class="lbl">${topProduct ? `أكثر منتج مبيعاً اليوم (${topProduct.count} طلب)` : "لا توجد طلبات بعد"}</span>
      </div>
      <div class="stat-box wide">
        <span class="num">${state.history.length}</span>
        <span class="lbl">إجمالي الأيام المسجلة</span>
      </div>
    </div>
  `;
}

/* ---------- 12) المودالات (Modal) ---------- */
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

/* ---------- 13) نافذة تأكيد عامة ---------- */
const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

let pendingConfirmAction = null;

function openConfirm(title, message, onConfirm) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  pendingConfirmAction = onConfirm;
  openModal("confirmModal");
}

confirmOkBtn.addEventListener("click", () => {
  if (typeof pendingConfirmAction === "function") pendingConfirmAction();
  pendingConfirmAction = null;
  closeModal("confirmModal");
});

confirmCancelBtn.addEventListener("click", () => {
  pendingConfirmAction = null;
  closeModal("confirmModal");
});

/* ---------- 14) Toast ---------- */
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  requestAnimationFrame(() => toast.classList.add("show"));

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 250);
  }, 2200);
}

/* ---------- 15) ربط الأحداث ---------- */
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  renderProducts(searchInput.value);
});

productsContainer.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "plus") updateCount(id, 1);
  else if (action === "minus") updateCount(id, -1);
  else if (action === "reset-one") resetProduct(id);
});

document.getElementById("resetAllBtn").addEventListener("click", resetAllProducts);
document.getElementById("endDayBtn").addEventListener("click", endDay);

document.getElementById("statsBtn").addEventListener("click", () => {
  renderStats();
  openModal("statsModal");
});

document.getElementById("historyBtn").addEventListener("click", () => {
  renderHistory();
  openModal("historyModal");
});

document.getElementById("deleteAllReportsBtn").addEventListener("click", deleteAllReports);

historyList.addEventListener("click", e => {
  const target = e.target.closest("[data-open-report]");
  if (target) openReport(target.dataset.openReport);
});

deleteThisReportBtn.addEventListener("click", () => {
  const id = deleteThisReportBtn.dataset.reportId;
  if (id) deleteReport(id);
});

/* ---------- 16) بدء التشغيل ---------- */
function init() {
  loadState();
  renderHeaderStats();
  renderProducts();

  // تحديث تاريخ/وقت الهيدر كل دقيقة لضمان دقة اليوم المعروض
  setInterval(renderHeaderStats, 60000);

  // تسجيل الـ Service Worker لدعم العمل بدون إنترنت (PWA)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        /* تجاهل الأخطاء بصمت إذا لم يكن الملف متاحًا (مثلاً عند الفتح المباشر file://) */
      });
    });
  }
}

init();
