/* app.js - Receive Copy System (Full, with edit-on-row-click) */

// DOM Elements
const receiveForm = document.getElementById("receiveForm");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const receiveTable = document.getElementById("receiveTable");
const exportCsvBtn = document.getElementById("exportCsv");
const exportJsonBtn = document.getElementById("exportJson");
const printBtn = document.getElementById("printBtn");
const clearAllBtn = document.getElementById("clearAll");
const notification = document.getElementById("notification");
const importBtn = document.getElementById("importJsonFileBtn");
const importFile = document.getElementById("importJsonFile");
const searchInput = document.getElementById("searchInput");
const createFirstReceive = document.getElementById("createFirstReceive");

// Date Range Filter Elements
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const clearDateFilter = document.getElementById("clearDateFilter");

// Pagination Elements
const paginationContainer = document.getElementById("paginationContainer");
const paginationInfo = document.getElementById("paginationInfo");
const firstPageBtn = document.getElementById("firstPage");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const lastPageBtn = document.getElementById("lastPage");
const pageNumbers = document.getElementById("pageNumbers");
const recordsPerPageSelect = document.getElementById("recordsPerPage");

// Modal Elements
const createReceiveBtn = document.getElementById("createReceiveBtn");
const receiveModal = document.getElementById("receiveModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

// Stats Elements
const totalReceives = document.getElementById("totalReceives");
const pendingReceives = document.getElementById("pendingReceives");
const successReceives = document.getElementById("successReceives");

// State
let receives = [];
let filteredReceives = [];
let currentPage = 1;
let recordsPerPage = parseInt(recordsPerPageSelect?.value, 10) || 20;
let totalPages = 1;

// NEW: editing state (null => creating new; otherwise contains id of record being edited)
let editingId = null;

// Helpers
function showNotification(message, type = "info") {
  if (!notification) return;
  notification.innerHTML = `${
    type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"
  } ${message}`;
  notification.className = `notification ${type} show`;
  notification.style.display = "flex";
  setTimeout(() => {
    notification.classList.remove("show");
    notification.style.display = "none";
  }, 2500);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getNextConsecutiveNo() {
  if (receives.length === 0) return 1;

  const maxConsecutiveNo = Math.max(
    ...receives.map((r) => {
      const num = parseInt(r.consecutiveNo);
      return isNaN(num) ? 0 : num;
    })
  );

  return maxConsecutiveNo + 1;
}

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return dateString;
  }
}

function formatDateForPrint(dateString) {
  if (!dateString) return "";
  try {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return dateString;
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem("receives", JSON.stringify(receives));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

function updateStats() {
  if (!totalReceives) return;
  totalReceives.textContent = receives.length;
  pendingReceives.textContent = receives.filter(
    (r) => (r.action || "").toLowerCase() === "pending"
  ).length;
  successReceives.textContent = receives.filter(
    (r) => (r.action || "").toLowerCase() === "success"
  ).length;
}

function highlightMissingFields(missingFields) {
  const allInputs = document.querySelectorAll("#receiveForm input, #receiveForm textarea");
  allInputs.forEach((input) => {
    input.style.borderColor = "";
    input.style.boxShadow = "";
  });

  missingFields.forEach((field) => {
    let inputId = "";
    switch (field) {
      case "Consecutive No":
        inputId = "consecutiveNo";
        break;
    }
    const input = document.getElementById(inputId);
    if (input) {
      input.style.borderColor = "#e74c3c";
      input.style.boxShadow = "0 0 0 3px rgba(231, 76, 60, 0.1)";
      if (missingFields[0] === field) input.focus();
    }
  });
}

// Filtering and Date Range
function filterReceives(searchTerm, dateFromVal = null, dateToVal = null) {
  if (!searchTerm && !dateFromVal && !dateToVal) {
    filteredReceives = [];
  } else {
    filteredReceives = receives.filter((receive) => {
      // text search on consecutiveNo, shortSubject, toWhomAddressed
      let textMatch = true;
      if (searchTerm) {
        const searchFields = [receive.consecutiveNo, receive.shortSubject, receive.toWhomAddressed]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        textMatch = searchFields.includes(searchTerm.toLowerCase());
      }

      // date range
      let dateMatch = true;
      if (dateFromVal || dateToVal) {
        const receiveDate = new Date(receive.date || "");
        const fromDate = dateFromVal ? new Date(dateFromVal) : null;
        const toDate = dateToVal ? new Date(dateToVal) : null;
        if (fromDate && toDate) {
          dateMatch = receiveDate >= fromDate && receiveDate <= toDate;
        } else if (fromDate) {
          dateMatch = receiveDate >= fromDate;
        } else if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          dateMatch = receiveDate <= toDate;
        }
      }

      return textMatch && dateMatch;
    });
  }
  currentPage = 1;
  renderTable();
  updatePagination();
}

function filterByDateRange() {
  const dateFromValue = dateFrom?.value || "";
  const dateToValue = dateTo?.value || "";
  const searchTerm = searchInput?.value.trim() || "";
  filterReceives(searchTerm, dateFromValue, dateToValue);
}

// Pagination
function getCurrentPageData() {
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  if (recordsPerPage === 0) return dataToRender;
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  return dataToRender.slice(startIndex, endIndex);
}

function updatePagination() {
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  const totalRecords = dataToRender.length;

  totalPages = recordsPerPage === 0 ? 1 : Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  if (totalRecords > (recordsPerPage === 0 ? 0 : recordsPerPage)) {
    paginationContainer.classList.add("show");
    paginationContainer.style.display = "block";
  } else {
    paginationContainer.classList.remove("show");
    paginationContainer.style.display = "none";
  }

  if (recordsPerPage === 0) {
    paginationInfo.textContent = `Showing all ${totalRecords} records${filteredReceives.length > 0 ? ' (filtered)' : ''}`;
  } else if (totalRecords === 0) {
    paginationInfo.textContent = `Showing 0 records${filteredReceives.length > 0 ? ' (filtered)' : ''}`;
  } else {
    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
    paginationInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalRecords} records${filteredReceives.length > 0 ? ' (filtered)' : ''}`;
  }

  firstPageBtn.disabled = currentPage === 1;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  lastPageBtn.disabled = currentPage === totalPages;

  generatePageNumbers();
}

function generatePageNumbers() {
  pageNumbers.innerHTML = "";
  if (totalPages <= 1) return;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const btn = createPageNumber(1);
    pageNumbers.appendChild(btn);
    if (startPage > 2) {
      const ell = document.createElement("span");
      ell.className = "page-number ellipsis";
      ell.textContent = "...";
      pageNumbers.appendChild(ell);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageNumber(i);
    if (i === currentPage) btn.classList.add("active");
    pageNumbers.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ell = document.createElement("span");
      ell.className = "page-number ellipsis";
      ell.textContent = "...";
      pageNumbers.appendChild(ell);
    }
    const lastBtn = createPageNumber(totalPages);
    pageNumbers.appendChild(lastBtn);
  }
}

function createPageNumber(page) {
  const pageBtn = document.createElement("button");
  pageBtn.className = "page-number";
  pageBtn.textContent = page;
  pageBtn.addEventListener("click", () => goToPage(page));
  return pageBtn;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  updatePagination();
  document.getElementById("receiveTable").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render table (now rows are clickable for edit)
function renderTable() {
  const currentPageData = getCurrentPageData();
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;

  if (!dataToRender || dataToRender.length === 0) {
    emptyState.style.display = "block";
    receiveTable.style.display = "none";
    paginationContainer.classList.remove("show");
    tableBody.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  receiveTable.style.display = "table";

  tableBody.innerHTML = currentPageData
    .map((r) => {
      const consecutiveNo = r.consecutiveNo || "";
      const date = formatDate(r.date);
      const toWhom = r.toWhomAddressed || "";
      const shortSubject = r.shortSubject || "";

      const fileNo = r.fileNo || "";
      const serial = r.serialNoOfLetter || "";
      const fileAndSerial = [fileNo, serial].filter(Boolean).join(" / ");

      const collection = r.collectionNoTitle || "";
      const fileInCollection = r.fileNoInCollection || "";

      const replyNo = r.replyNo || "";
      const replyDate = r.replyDate ? formatDate(r.replyDate) : "";

      const reminderNo = r.reminderNo || "";
      const reminderDate = r.reminderDate ? formatDate(r.reminderDate) : "";

      const stampRs = r.stampRs || "";
      const stampP = r.stampP || "";
      const remarks = r.remarks || "";

      return `
        <tr data-id="${r.id}" class="clickable-row" title="Click to edit">
          <td>${escapeHtml(consecutiveNo)}</td>
          <td>${escapeHtml(date)}</td>
          <td style="text-align:left;">${escapeHtml(toWhom)}</td>
          <td style="text-align:left;">${escapeHtml(shortSubject)}</td>

          <td style="text-align:left;">${escapeHtml(fileAndSerial)}</td>
          <td style="text-align:left;">${escapeHtml(collection)}</td>
          <td>${escapeHtml(fileInCollection)}</td>

          <td style="text-align:left;">
            ${replyNo ? `<div>${escapeHtml(replyNo)}</div>` : ""}
            ${
              replyDate
                ? `<div style="font-size:0.9em;color:#555">${escapeHtml(replyDate)}</div>`
                : ""
            }
          </td>

          <td>${escapeHtml(reminderNo)}</td>
          <td>${escapeHtml(reminderDate)}</td>

          <td>${escapeHtml(stampRs)}</td>
          <td>${escapeHtml(stampP)}</td>

          <td style="text-align:left;">${escapeHtml(remarks)}</td>
        </tr>
      `;
    })
    .join("");

  // Attach click handlers for edit; ignore clicks on interactive elements
  tableBody.querySelectorAll("tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", (e) => {
      const ignoreTags = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "LABEL"];
      if (ignoreTags.includes(e.target.tagName)) return;
      const id = tr.getAttribute("data-id");
      if (id) openEditModal(id);
    });
  });
}

// HTML escape
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Load receives.json (fallback to localStorage)
async function loadReceivesFromJSON() {
  try {
    const response = await fetch("receives.json");
    if (!response.ok) throw new Error("receives.json not found");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid JSON format: expected array");
    receives = data.map((item) => ({
      id: item.id || generateId(),
      slNo: item.slNo || item.consecutiveNo || "",
      action: item.action || item.status || "",
      date: item.date || "",
      subject: item.subject || item.shortSubject || "",
      consecutiveNo: item.consecutiveNo || item.slNo || "",
      toWhomAddressed: item.toWhomAddressed || "",
      shortSubject: item.shortSubject || item.subject || "",
      fileNo: item.fileNo || "",
      serialNoOfLetter: item.serialNoOfLetter || "",
      collectionNoTitle: item.collectionNoTitle || "",
      fileNoInCollection: item.fileNoInCollection || "",
      replyNo: item.replyNo || "",
      replyDate: item.replyDate || "",
      reminderNo: item.reminderNo || "",
      reminderDate: item.reminderDate || "",
      stampRs: item.stampRs || "",
      stampP: item.stampP || "",
      remarks: item.remarks || "",
    }));
    const fromLS = JSON.parse(localStorage.getItem("receives") || "null");
    if (Array.isArray(fromLS) && fromLS.length) {
      receives = fromLS;
    } else {
      saveToLocalStorage();
    }
    updateStats();
    renderTable();
    updatePagination();
  } catch (err) {
    console.error("Error loading receives.json:", err);
    const fromLS = JSON.parse(localStorage.getItem("receives") || "null");
    if (Array.isArray(fromLS) && fromLS.length) {
      receives = fromLS;
      updateStats();
      renderTable();
      updatePagination();
      showNotification("Loaded data from localStorage", "info");
    } else {
      receives = [];
      updateStats();
      renderTable();
      updatePagination();
      showNotification("No initial data found", "info");
    }
  }
}

// Modal functions
function openModal() {
  editingId = null; // creating new
  receiveModal.style.display = "block";
  receiveModal.setAttribute("aria-hidden", "false");

  const consecutiveNoInput = document.getElementById("consecutiveNo");
  consecutiveNoInput.value = getNextConsecutiveNo();
  consecutiveNoInput.readOnly = true;
  consecutiveNoInput.style.backgroundColor = "#f8f9fa";
  consecutiveNoInput.style.cursor = "not-allowed";

  // set submit button text
  const submitBtn = receiveForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save Receive";

  document.getElementById("toWhomAddressed").focus();
  document.body.style.overflow = "hidden";
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.classList.add("date-input");
  });
}

function closeModalFunc() {
  receiveModal.style.display = "none";
  receiveModal.setAttribute("aria-hidden", "true");
  receiveForm.reset();

  const consecutiveNoInput = document.getElementById("consecutiveNo");
  consecutiveNoInput.readOnly = false;
  consecutiveNoInput.style.backgroundColor = "";
  consecutiveNoInput.style.cursor = "";

  editingId = null;
  document.body.style.overflow = "auto";
}

// Open edit modal populated with row data
function openEditModal(id) {
  const record = receives.find((r) => r.id === id);
  if (!record) {
    showNotification("Record not found for editing", "error");
    return;
  }

  editingId = id;
  receiveModal.style.display = "block";
  receiveModal.setAttribute("aria-hidden", "false");

  // Populate form fields
  document.getElementById("consecutiveNo").value = record.consecutiveNo || "";
  document.getElementById("date").value = record.date || "";
  document.getElementById("toWhomAddressed").value = record.toWhomAddressed || "";
  document.getElementById("shortSubject").value = record.shortSubject || "";
  document.getElementById("fileNo").value = record.fileNo || "";
  document.getElementById("serialNoOfLetter").value = record.serialNoOfLetter || "";
  document.getElementById("collectionNoTitle").value = record.collectionNoTitle || "";
  document.getElementById("fileNoInCollection").value = record.fileNoInCollection || "";
  document.getElementById("replyNo").value = record.replyNo || "";
  document.getElementById("replyDate").value = record.replyDate || "";
  document.getElementById("reminderNo").value = record.reminderNo || "";
  document.getElementById("reminderDate").value = record.reminderDate || "";
  document.getElementById("stampRs").value = record.stampRs || "";
  document.getElementById("stampP").value = record.stampP || "";
  document.getElementById("remarks").value = record.remarks || "";

  // Lock consecutive no
  const consecutiveNoInput = document.getElementById("consecutiveNo");
  consecutiveNoInput.readOnly = true;
  consecutiveNoInput.style.backgroundColor = "#f8f9fa";
  consecutiveNoInput.style.cursor = "not-allowed";

  // Update submit button text
  const submitBtn = receiveForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Update Record";

  document.getElementById("toWhomAddressed").focus();
  document.body.style.overflow = "hidden";
}

// Add or update receive
function addReceive(event) {
  event.preventDefault();

  const consecutiveNo = document.getElementById("consecutiveNo").value.trim();
  const date = document.getElementById("date").value;
  const toWhomAddressed = document.getElementById("toWhomAddressed").value.trim();
  const shortSubject = document.getElementById("shortSubject").value.trim();
  const fileNo = document.getElementById("fileNo").value.trim();
  const serialNoOfLetter = document.getElementById("serialNoOfLetter").value.trim();
  const collectionNoTitle = document.getElementById("collectionNoTitle").value.trim();
  const fileNoInCollection = document.getElementById("fileNoInCollection").value.trim();
  const replyNo = document.getElementById("replyNo").value.trim();
  const replyDate = document.getElementById("replyDate").value;
  const reminderNo = document.getElementById("reminderNo").value.trim();
  const reminderDate = document.getElementById("reminderDate").value;
  const stampRs = document.getElementById("stampRs").value;
  const stampP = document.getElementById("stampP").value;
  const remarks = document.getElementById("remarks").value.trim();

  if (!consecutiveNo) {
    showNotification("Please fill the Consecutive No. field.", "error");
    highlightMissingFields(["Consecutive No"]);
    return;
  }

  // If we are editing an existing record
  if (editingId) {
    const idx = receives.findIndex((r) => r.id === editingId);
    if (idx === -1) {
      showNotification("Record to update not found", "error");
      return;
    }

    receives[idx] = {
      ...receives[idx],
      // keep id same; consecutiveNo not changed
      consecutiveNo,
      date: date || "",
      toWhomAddressed: toWhomAddressed || "",
      shortSubject: shortSubject || "",
      fileNo,
      serialNoOfLetter,
      collectionNoTitle,
      fileNoInCollection,
      replyNo,
      replyDate,
      reminderNo,
      reminderDate,
      stampRs,
      stampP,
      remarks,
      slNo: receives[idx].slNo || consecutiveNo,
      subject: shortSubject || receives[idx].subject || "",
    };

    saveToLocalStorage();
    updateStats();
    renderTable();
    updatePagination();
    closeModalFunc();
    showNotification("Record updated successfully!", "success");
    return;
  }

  // Creating new record
  const isEmptyRecord =
    (!date || date === "") &&
    (!toWhomAddressed || toWhomAddressed === "") &&
    (!shortSubject || shortSubject === "") &&
    (!fileNo || fileNo === "") &&
    (!serialNoOfLetter || serialNoOfLetter === "") &&
    (!collectionNoTitle || collectionNoTitle === "") &&
    (!fileNoInCollection || fileNoInCollection === "") &&
    (!replyNo || replyNo === "") &&
    (!replyDate || replyDate === "") &&
    (!reminderNo || reminderNo === "") &&
    (!reminderDate || reminderDate === "") &&
    (!stampRs || stampRs === "") &&
    (!stampP || stampP === "") &&
    (!remarks || remarks === "");

  if (isEmptyRecord) {
    const userConfirmed = confirm(
      "⚠️ You are about to create an empty record with only Consecutive No.\n\n" +
        "Consecutive No.: " +
        consecutiveNo +
        "\n" +
        "All other fields will be empty.\n\n" +
        "Are you sure you want to save this empty record?"
    );
    if (!userConfirmed) {
      showNotification("Empty record creation cancelled", "info");
      return;
    }
  }

  const newReceive = {
    id: generateId(),
    consecutiveNo,
    date: date || "",
    toWhomAddressed: toWhomAddressed || "",
    shortSubject: shortSubject || "",
    fileNo,
    serialNoOfLetter,
    collectionNoTitle,
    fileNoInCollection,
    replyNo,
    replyDate,
    reminderNo,
    reminderDate,
    stampRs,
    stampP,
    remarks,
    slNo: consecutiveNo,
    subject: shortSubject || "",
    action: "pending",
  };

  receives.push(newReceive);
  saveToLocalStorage();
  updateStats();

  // go to last page
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  if (recordsPerPage > 0) {
    const newTotalPages = Math.ceil(dataToRender.length / recordsPerPage);
    currentPage = newTotalPages;
  } else {
    currentPage = 1;
  }

  renderTable();
  updatePagination();
  closeModalFunc();
  showNotification(isEmptyRecord ? "Empty record saved successfully! Consecutive No: " + consecutiveNo : "Receive added successfully!", "success");
}

// Export JSON
function exportToJSON() {
  if (receives.length === 0) {
    showNotification("No data to export!", "error");
    return;
  }
  const dataStr = JSON.stringify(receives, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receives_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Exported JSON file", "success");
}

// Export CSV
function exportToCSV() {
  if (receives.length === 0) {
    showNotification("No data to export!", "error");
    return;
  }

  const headers = [
    "Consecutive No",
    "Date",
    "To whom addressed",
    "Short subject",
    "File No & Serial",
    "Collection (No & Title)",
    "File No in Collection",
    "Reply No",
    "Reply Date",
    "Reminder No",
    "Reminder Date",
    "Stamp Rs",
    "Stamp P",
    "Remarks",
    "Action",
  ];

  const rows = receives.map((r) => [
    r.consecutiveNo || "",
    r.date || "",
    r.toWhomAddressed || "",
    r.shortSubject || "",
    [r.fileNo, r.serialNoOfLetter].filter(Boolean).join(" / "),
    r.collectionNoTitle || "",
    r.fileNoInCollection || "",
    r.replyNo || "",
    r.replyDate || "",
    r.reminderNo || "",
    r.reminderDate || "",
    r.stampRs || "",
    r.stampP || "",
    r.remarks || "",
    r.action || "",
  ]);

  const csvContent =
    [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receives_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Exported CSV file", "success");
}

// improved printReceives() — drop-in replacement
function printReceives() {
  // find visible rows in the table body
  const rows = Array.from(document.querySelectorAll("#tableBody tr"));

  if (!rows || rows.length === 0) {
    // assumes showNotification() exists in your app (keeps behavior consistent)
    showNotification("No visible records to print!", "error");
    return;
  }

  // helper to escape HTML text content so it prints safely
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // preserve the actual table header if present (keeps multi-row headers intact)
  const originalThead = document.querySelector("#receiveTable thead");
  const theadHtml = originalThead ? originalThead.outerHTML : `
    <thead>
      <tr>
        <th>Consecutive No</th><th>Date</th><th>To whom addressed</th><th>Short subject</th>
        <th>File No & Serial</th><th>Collection</th><th>File No in Collection</th>
        <th>Reply</th><th>Reminder No</th><th>Reminder Date</th><th>Rs</th><th>P</th><th>Remarks</th>
      </tr>
    </thead>
  `;

  // Build tbody from visible rows — preserve order and text, strip extra whitespace
  const printRows = rows
    .map((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      const cellsHtml = tds
        .map(td => escapeHtml(td.textContent.replace(/\s+/g, " ").trim()))
        .map(text => `<td>${text}</td>`)
        .join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .join("");

  // Print CSS: no background colors, header centered
  const printStyle = `
    body { font-family: Arial, sans-serif; color: #222; padding: 16px; }
    h3 { margin-bottom: 8px; font-size: 16px; text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: auto; }
    th, td { border: 1px solid #000; padding: 6px; vertical-align: top; word-break: break-word; }
    
    tr { page-break-inside: avoid; }
    @media print {
      button, .no-print { display: none !important; }
    }
  `;

  // construct full print HTML — includes link to your styles.css so widths/padding are kept
  const printContent = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Print - Visible Receive Copies</title>
        <link rel="stylesheet" href="styles.css">

        <style>
          body { font-family: Arial, sans-serif; color: #222; padding: 16px; }
          h3 { margin-bottom: 8px; font-size: 16px; text-align: center; }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 12px; 
            table-layout: fixed;   /* forces widths to respect colgroup */
          }

          th, td { 
            border: 1px solid #000; 
            padding: 6px; 
            vertical-align: top; 
            box-sizing: border-box; 
            overflow-wrap: break-word; 
            word-wrap: break-word; 
            white-space: normal;
          }

          thead th { 
            text-align: center; 
            font-weight: bold;
            /* No background color (as requested) */
          }

          tr { 
            page-break-inside: avoid; 
          }

          @media print {
            button, .no-print { display: none !important; }
          }
        </style>

      </head>
      <body>
        <h3>Visible Receive Copies — ${new Date().toLocaleString()}</h3>

        <table>

          <colgroup>
            <col style="width: 60px;">   <!-- Consecutive No -->
            <col style="width: 70px;">   <!-- Date -->
            <col style="width: 140px;">  <!-- To whom addressed -->
            <col style="width: 180px;">  <!-- Short subject -->
            <col style="width: 100px;">  <!-- File No & Serial -->
            <col style="width: 80px;">   <!-- Collection -->
            <col style="width: 120px;">  <!-- File No in Collection -->
            <col style="width: 70px;">   <!-- Reply -->
            <col style="width: 70px;">   <!-- Reminder No -->
            <col style="width: 80px;">   <!-- Reminder Date -->
            <col style="width: 50px;">   <!-- Rs -->
            <col style="width: 50px;">   <!-- P -->
            <col style="width: 160px;">  <!-- Remarks -->
          </colgroup>

          ${theadHtml}

          <tbody>
            ${printRows}
          </tbody>

        </table>
      </body>
    </html>
  `;


  // create a hidden iframe, write the print content, call print, then remove iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(printContent);
  doc.close();

  // some browsers need a short delay to load external stylesheet — keep it very small
  iframe.contentWindow.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
    // cleanup
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch (e) {}
    }, 500);
  }, 150);

  showNotification(`Printing ${rows.length} visible record(s)!`, "info");
}



// Clear all
function clearAllData() {
  if (receives.length === 0) {
    showNotification("No data to clear!", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete all receive data? This action cannot be undone.")) return;
  receives = [];
  filteredReceives = [];
  currentPage = 1;
  saveToLocalStorage();
  updateStats();
  renderTable();
  updatePagination();
  showNotification("All data cleared!", "info");
}

// Import JSON File handlers
importBtn?.addEventListener("click", () => importFile.click());

importFile?.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("JSON must be an array");
      receives = data.map((item) => ({ id: item.id || generateId(), ...item }));
      saveToLocalStorage();
      updateStats();
      renderTable();
      updatePagination();
      showNotification("Imported JSON successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to import JSON file", "error");
    }
  };
  reader.readAsText(file);
});

// Event listeners
createReceiveBtn?.addEventListener("click", openModal);
createFirstReceive && createFirstReceive.addEventListener("click", openModal);
closeModal?.addEventListener("click", closeModalFunc);
cancelBtn?.addEventListener("click", closeModalFunc);
receiveForm?.addEventListener("submit", addReceive);

exportCsvBtn?.addEventListener("click", exportToCSV);
exportJsonBtn?.addEventListener("click", exportToJSON);
printBtn?.addEventListener("click", printReceives);
clearAllBtn?.addEventListener("click", clearAllData);

firstPageBtn?.addEventListener("click", () => goToPage(1));
prevPageBtn?.addEventListener("click", () => goToPage(Math.max(1, currentPage - 1)));
nextPageBtn?.addEventListener("click", () => goToPage(Math.min(totalPages, currentPage + 1)));
lastPageBtn?.addEventListener("click", () => goToPage(totalPages));

recordsPerPageSelect?.addEventListener("change", (e) => {
  recordsPerPage = parseInt(e.target.value, 10);
  currentPage = 1;
  renderTable();
  updatePagination();
});

searchInput?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim();
  const dateFromValue = dateFrom?.value;
  const dateToValue = dateTo?.value;
  filterReceives(searchTerm, dateFromValue, dateToValue);
});

dateFrom?.addEventListener("change", filterByDateRange);
dateTo?.addEventListener("change", filterByDateRange);
clearDateFilter?.addEventListener("click", () => {
  if (dateFrom) dateFrom.value = "";
  if (dateTo) dateTo.value = "";
  const searchTerm = searchInput?.value.trim();
  filterReceives(searchTerm);
});

document.addEventListener("DOMContentLoaded", () => {
  loadReceivesFromJSON();
  recordsPerPage = parseInt(recordsPerPageSelect?.value, 10) || 20;
  updatePagination();
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.classList.add('date-input');
  });
});
