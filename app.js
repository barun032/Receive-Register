/* app.js - Receive Copy System (Full) */

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
let recordsPerPage = parseInt(recordsPerPageSelect.value, 10) || 20;
let totalPages = 1;

// Helpers
function showNotification(message, type = "info") {
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
  localStorage.setItem("receives", JSON.stringify(receives));
}

function updateStats() {
  totalReceives.textContent = receives.length;
  pendingReceives.textContent = receives.filter(
    (r) => (r.action || "").toLowerCase() === "pending"
  ).length;
  successReceives.textContent = receives.filter(
    (r) => (r.action || "").toLowerCase() === "success"
  ).length;
}

// Search Functionality
function filterReceives(searchTerm) {
  if (!searchTerm) {
    filteredReceives = [];
  } else {
    filteredReceives = receives.filter((receive) => {
      const haystack = [
        receive.consecutiveNo,
        receive.slNo,
        receive.subject,
        receive.shortSubject,
        receive.toWhomAddressed,
        receive.action,
        receive.fileNo,
        receive.collectionNoTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    });
  }
  currentPage = 1;
  renderTable();
  updatePagination();
}

// Pagination Functions
function getCurrentPageData() {
  const dataToRender =
    filteredReceives.length > 0 ? filteredReceives : receives;

  if (recordsPerPage === 0) {
    return dataToRender; // show all
  }

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  return dataToRender.slice(startIndex, endIndex);
}

function updatePagination() {
  const dataToRender =
    filteredReceives.length > 0 ? filteredReceives : receives;
  const totalRecords = dataToRender.length;

  totalPages =
    recordsPerPage === 0
      ? 1
      : Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  // Show/hide pagination
  if (totalRecords > (recordsPerPage === 0 ? 0 : recordsPerPage)) {
    paginationContainer.classList.add("show");
    paginationContainer.style.display = "block";
  } else {
    paginationContainer.classList.remove("show");
    paginationContainer.style.display = "none";
  }

  // Update info text
  if (recordsPerPage === 0) {
    paginationInfo.textContent = `Showing all ${totalRecords} records`;
  } else if (totalRecords === 0) {
    paginationInfo.textContent = `Showing 0 records`;
  } else {
    const startRecord = (currentPage - 1) * recordsPerPage + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
    paginationInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;
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
  // Scroll table into view
  document
    .getElementById("receiveTable")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render - updated to include full form fields
function renderTable() {
  const currentPageData = getCurrentPageData();
  const dataToRender =
    filteredReceives.length > 0 ? filteredReceives : receives;

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
        <tr>
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
                ? `<div style="font-size:0.9em;color:#555">${escapeHtml(
                    replyDate
                  )}</div>`
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
}

// Basic HTML escape
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Load receives.json (on first load) then fallback to localStorage
async function loadReceivesFromJSON() {
  try {
    const response = await fetch("receives.json");
    if (!response.ok) throw new Error("receives.json not found");
    const data = await response.json();
    if (!Array.isArray(data))
      throw new Error("Invalid JSON format: expected array");
    // Map to expected shape (allow both old small records and full-form records)
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
    // if there's localStorage data, prefer localStorage to preserve user edits
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

// Modal Functions
function openModal() {
  receiveModal.style.display = "block";
  receiveModal.setAttribute("aria-hidden", "false");
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("consecutiveNo").focus();
  document.body.style.overflow = "hidden";
}

function closeModalFunc() {
  receiveModal.style.display = "none";
  receiveModal.setAttribute("aria-hidden", "true");
  receiveForm.reset();
  document.body.style.overflow = "auto";
}

// Add new receive
function addReceive(event) {
  event.preventDefault();

  const consecutiveNo = document.getElementById("consecutiveNo").value.trim();
  const date = document.getElementById("date").value;
  const toWhomAddressed = document
    .getElementById("toWhomAddressed")
    .value.trim();
  const shortSubject = document.getElementById("shortSubject").value.trim();
  const fileNo = document.getElementById("fileNo").value.trim();
  const serialNoOfLetter = document
    .getElementById("serialNoOfLetter")
    .value.trim();
  const collectionNoTitle = document
    .getElementById("collectionNoTitle")
    .value.trim();
  const fileNoInCollection = document
    .getElementById("fileNoInCollection")
    .value.trim();
  const replyNo = document.getElementById("replyNo").value.trim();
  const replyDate = document.getElementById("replyDate").value;
  const reminderNo = document.getElementById("reminderNo").value.trim();
  const reminderDate = document.getElementById("reminderDate").value;
  const stampRs = document.getElementById("stampRs").value;
  const stampP = document.getElementById("stampP").value;
  const remarks = document.getElementById("remarks").value.trim();

  if (!consecutiveNo || !date || !toWhomAddressed || !shortSubject) {
    showNotification(
      "Please fill required fields (Consecutive No, Date, To Whom Addressed, Short Subject).",
      "error"
    );
    return;
  }

  const newReceive = {
    id: generateId(),
    consecutiveNo,
    date,
    toWhomAddressed,
    shortSubject,
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
    // keep legacy friendly fields
    slNo: consecutiveNo,
    subject: shortSubject,
    action: "pending",
  };

  receives.push(newReceive);
  saveToLocalStorage();
  updateStats();

  // go to last page
  const dataToRender =
    filteredReceives.length > 0 ? filteredReceives : receives;
  if (recordsPerPage > 0) {
    const newTotalPages = Math.ceil(dataToRender.length / recordsPerPage);
    currentPage = newTotalPages;
  } else {
    currentPage = 1;
  }

  renderTable();
  updatePagination();

  closeModalFunc();
  showNotification("Receive added successfully!", "success");
}

// Export CSV
function exportToCSV() {
  if (receives.length === 0) {
    showNotification("No data to export!", "error");
    return;
  }

  // Use columns consistent with the multi-column table
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

  const csvContent = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "receives.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification("Data exported as CSV!", "success");
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
  a.download = "receives.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification("Data exported as JSON!", "success");
}

// Print receives - same multi-row header and columns
function printReceives() {
  const dataToPrint = getCurrentPageData();
  if (!dataToPrint || dataToPrint.length === 0) {
    showNotification("No data to print!", "error");
    return;
  }

  const printDate = new Date().toLocaleDateString();

  const printRows = dataToPrint
    .map((r) => {
      const consecutiveNo = r.consecutiveNo || "";
      const date = formatDateForPrint(r.date);
      const toWhom = r.toWhomAddressed || "";
      const shortSubject = r.shortSubject || "";

      const fileNo = r.fileNo || "";
      const serial = r.serialNoOfLetter || "";
      const fileAndSerial = [fileNo, serial].filter(Boolean).join(" / ");

      const collection = r.collectionNoTitle || "";
      const fileInCollection = r.fileNoInCollection || "";

      const replyNo = r.replyNo || "";
      const replyDate = r.replyDate ? formatDateForPrint(r.replyDate) : "";

      const reminderNo = r.reminderNo || "";
      const reminderDate = r.reminderDate
        ? formatDateForPrint(r.reminderDate)
        : "";

      const stampRs = r.stampRs || "";
      const stampP = r.stampP || "";
      const remarks = r.remarks || "";

      return `
      <tr>
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
              ? `<div style="font-size:0.9em;color:#555">${escapeHtml(
                  replyDate
                )}</div>`
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

  const printContent = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Receive Copy Report</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; margin: 10px; }
        .print-header { text-align:center; margin-bottom:10px; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th, td { border:1px solid #bbb; padding:8px; }
        th { background:#f2f2f2; font-weight:700; text-align:center; }
        td { text-align:center; }
        td:first-child, th:first-child { width:8%; }
        td:nth-child(2), th:nth-child(2) { width:9%; }
        td:nth-child(3), th:nth-child(3) { width:18%; text-align:left; }
        td:nth-child(4), th:nth-child(4) { width:20%; text-align:left; }
        @page { margin: 1cm; size: auto; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>Receive Copy Report</h1>
        <div>Printed: ${printDate}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2">Consecutive No.</th>
            <th rowspan="2">Date</th>
            <th rowspan="2">To whom addressed</th>
            <th rowspan="2">Short subject</th>
            <th colspan="3">Where the draft is placed</th>
            <th rowspan="2">No. and date of reply received</th>
            <th colspan="2">Reminder</th>
            <th colspan="2">Value of Stamp</th>
            <th rowspan="2">Remarks</th>
          </tr>
          <tr>
            <th>File No. &amp; Serial No. of letter of file</th>
            <th>No. &amp; title of the collection</th>
            <th>No. of file within the collection</th>
            <th>No.</th>
            <th>Date</th>
            <th>Rs.</th>
            <th>P.</th>
          </tr>
        </thead>
        <tbody>
          ${printRows}
        </tbody>
      </table>
    </body>
  </html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(printContent);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);

  showNotification(`Printing ${dataToPrint.length} visible records!`, "info");
}

// Clear all
function clearAllData() {
  if (receives.length === 0) {
    showNotification("No data to clear!", "error");
    return;
  }
  if (
    !confirm(
      "Are you sure you want to delete all receive data? This action cannot be undone."
    )
  )
    return;
  receives = [];
  filteredReceives = [];
  currentPage = 1;
  saveToLocalStorage();
  updateStats();
  renderTable();
  updatePagination();
  showNotification("All data cleared!", "info");
}

// Import JSON File
importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
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
createReceiveBtn.addEventListener("click", openModal);
createFirstReceive && createFirstReceive.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalFunc);
cancelBtn.addEventListener("click", closeModalFunc);
receiveForm.addEventListener("submit", addReceive);

exportCsvBtn.addEventListener("click", exportToCSV);
exportJsonBtn.addEventListener("click", exportToJSON);
printBtn.addEventListener("click", printReceives);
clearAllBtn.addEventListener("click", clearAllData);

firstPageBtn.addEventListener("click", () => goToPage(1));
prevPageBtn.addEventListener("click", () =>
  goToPage(Math.max(1, currentPage - 1))
);
nextPageBtn.addEventListener("click", () =>
  goToPage(Math.min(totalPages, currentPage + 1))
);
lastPageBtn.addEventListener("click", () => goToPage(totalPages));

recordsPerPageSelect.addEventListener("change", (e) => {
  recordsPerPage = parseInt(e.target.value, 10);
  currentPage = 1;
  renderTable();
  updatePagination();
});

searchInput.addEventListener("input", (e) => {
  filterReceives(e.target.value.trim());
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadReceivesFromJSON();
  // ensure stateful defaults
  recordsPerPage = parseInt(recordsPerPageSelect.value, 10) || 20;
  updatePagination();
});
