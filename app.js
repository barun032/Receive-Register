/* app.js - Receive Copy System (Modern UI with Pagination) */

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
let recordsPerPage = 20;
let totalPages = 1;

// Helpers
function showNotification(message, type = "info") {
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  notification.innerHTML = `${icon} ${message}`;
  notification.className = `notification ${type}`;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateForPrint(dateString) {
  if (!dateString) return "";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function saveToLocalStorage() {
  localStorage.setItem("receives", JSON.stringify(receives));
}

function updateStats() {
  totalReceives.textContent = receives.length;
  pendingReceives.textContent = receives.filter(r => r.action === "pending").length;
  successReceives.textContent = receives.filter(r => r.action === "success").length;
}

// Search Functionality
function filterReceives(searchTerm) {
  if (!searchTerm) {
    filteredReceives = [...receives];
  } else {
    filteredReceives = receives.filter(receive =>
      receive.slNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receive.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receive.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  currentPage = 1; // Reset to first page when searching
  renderTable();
  updatePagination();
}

// Pagination Functions
function getCurrentPageData() {
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  
  if (recordsPerPage === 0) {
    return dataToRender; // Show all records
  }
  
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  return dataToRender.slice(startIndex, endIndex);
}

function updatePagination() {
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  const totalRecords = dataToRender.length;
  
  if (recordsPerPage === 0) {
    totalPages = 1;
  } else {
    totalPages = Math.ceil(totalRecords / recordsPerPage);
  }
  
  // Show/hide pagination
  if (totalRecords > (recordsPerPage === 0 ? 0 : recordsPerPage)) {
    paginationContainer.classList.add('show');
  } else {
    paginationContainer.classList.remove('show');
  }
  
  // Update pagination info
  if (recordsPerPage === 0) {
    paginationInfo.textContent = `Showing all ${totalRecords} records`;
  } else {
    const startRecord = ((currentPage - 1) * recordsPerPage) + 1;
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);
    paginationInfo.textContent = `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;
  }
  
  // Update button states
  firstPageBtn.disabled = currentPage === 1;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  lastPageBtn.disabled = currentPage === totalPages;
  
  // Generate page numbers
  generatePageNumbers();
}

function generatePageNumbers() {
  pageNumbers.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust if we're at the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // First page and ellipsis
  if (startPage > 1) {
    const firstPageBtn = createPageNumber(1);
    pageNumbers.appendChild(firstPageBtn);
    
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-number ellipsis';
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = createPageNumber(i);
    if (i === currentPage) {
      pageBtn.classList.add('active');
    }
    pageNumbers.appendChild(pageBtn);
  }
  
  // Last page and ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-number ellipsis';
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }
    
    const lastPageBtn = createPageNumber(totalPages);
    pageNumbers.appendChild(lastPageBtn);
  }
}

function createPageNumber(page) {
  const pageBtn = document.createElement('button');
  pageBtn.className = 'page-number';
  pageBtn.textContent = page;
  pageBtn.addEventListener('click', () => goToPage(page));
  return pageBtn;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderTable();
  updatePagination();
  
  // Scroll to top of table
  tableBody.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Render
function renderTable() {
  const currentPageData = getCurrentPageData();
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  
  if (dataToRender.length === 0) {
    emptyState.style.display = "block";
    receiveTable.style.display = "none";
    paginationContainer.classList.remove('show');
    tableBody.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  receiveTable.style.display = "table";

  tableBody.innerHTML = currentPageData
    .map(
      (receive, index) => `
      <tr>
        <td><strong>${receive.slNo}</strong></td>
        <td>${formatDate(receive.date)}</td>
        <td>${receive.subject}</td>
        <td><span class="status-${receive.action}">${receive.action.charAt(0).toUpperCase() + receive.action.slice(1)}</span></td>
      </tr>
    `
    )
    .join("");
}

// Load receives.json
async function loadReceivesFromJSON() {
  try {
    const response = await fetch("receives.json");
    if (!response.ok) throw new Error("receives.json not found");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid JSON format: expected array");
    receives = data.map(item => ({ id: item.id || generateId(), ...item }));
    saveToLocalStorage();
    updateStats();
    renderTable();
    updatePagination();
    console.info("receives.json loaded");
  } catch (err) {
    console.error("Error loading receives.json:", err);
    showNotification("Failed to load receives.json", "error");
    const fromLS = JSON.parse(localStorage.getItem("receives") || "null");
    if (Array.isArray(fromLS) && fromLS.length) {
      receives = fromLS;
      updateStats();
      renderTable();
      updatePagination();
      showNotification("Loaded data from localStorage", "info");
    }
  }
}

// Modal Functions
function openModal() {
  receiveModal.style.display = "block";
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  document.getElementById("slNo").focus();
  document.body.style.overflow = "hidden";
}

function closeModalFunc() {
  receiveModal.style.display = "none";
  receiveForm.reset();
  document.body.style.overflow = "auto";
}

// Add new receive
function addReceive(event) {
  event.preventDefault();

  const slNo = document.getElementById("slNo").value.trim();
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value.trim();
  const action = document.getElementById("action").value;

  if (!slNo || !date || !subject || !action) {
    showNotification("Please fill all fields.", "error");
    return;
  }

  const newReceive = { id: generateId(), slNo, date, subject, action };
  receives.push(newReceive);
  saveToLocalStorage();
  updateStats();
  
  // Go to last page if new record doesn't fit on current page
  const dataToRender = filteredReceives.length > 0 ? filteredReceives : receives;
  if (recordsPerPage > 0) {
    const newTotalPages = Math.ceil(dataToRender.length / recordsPerPage);
    if (currentPage !== newTotalPages) {
      currentPage = newTotalPages;
    }
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

  const headers = ["SL No", "Date", "Subject", "Action"];
  const csvContent = [
    headers.join(","),
    ...receives.map(r => [`"${r.slNo}"`, `"${r.date}"`, `"${r.subject}"`, `"${r.action}"`].join(","))
  ].join("\n");

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

// Print receives
function printReceives() {
  if (receives.length === 0) {
    showNotification("No data to print!", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  const printDate = new Date().toLocaleDateString();

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Receive Copy Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .print-header h1 { font-size: 24px; margin-bottom: 10px; color: #333; }
          .print-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
          .print-table th { background-color: #f2f2f2; font-weight: bold; color: #333; }
          .print-footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          .print-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block; }
          .print-status-pending { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
          .print-status-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          @page { margin: 1cm; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Receive Copy Report</h1>
          <p>Generated on: ${printDate}</p>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th>SL No</th>
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${receives.map(r => `
              <tr>
                <td>${r.slNo}</td>
                <td>${formatDateForPrint(r.date)}</td>
                <td>${r.subject}</td>
                <td><span class="print-status print-status-${r.action}">${r.action.charAt(0).toUpperCase() + r.action.slice(1)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="print-footer">
          <p>Total Receives: ${receives.length} | Pending: ${receives.filter(r => r.action === "pending").length} | Success: ${receives.filter(r => r.action === "success").length}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);

  showNotification("Print dialog opened!", "info");
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
      receives = data.map(item => ({ id: item.id || generateId(), ...item }));
      saveToLocalStorage();
      updateStats();
      renderTable();
      updatePagination();
      showNotification("Imported JSON successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Invalid JSON file!", "error");
    }
  };
  reader.readAsText(file);
});

// Event listeners for modal
createReceiveBtn.addEventListener("click", openModal);
createFirstReceive.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalFunc);
cancelBtn.addEventListener("click", closeModalFunc);

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === receiveModal) {
    closeModalFunc();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && receiveModal.style.display === "block") {
    closeModalFunc();
  }
});

// Search functionality
searchInput.addEventListener("input", (e) => {
  filterReceives(e.target.value);
});

// Pagination event listeners
firstPageBtn.addEventListener("click", () => goToPage(1));
prevPageBtn.addEventListener("click", () => goToPage(currentPage - 1));
nextPageBtn.addEventListener("click", () => goToPage(currentPage + 1));
lastPageBtn.addEventListener("click", () => goToPage(totalPages));

// Records per page change
recordsPerPageSelect.addEventListener("change", (e) => {
  recordsPerPage = parseInt(e.target.value);
  currentPage = 1; // Reset to first page when changing records per page
  renderTable();
  updatePagination();
});

// Form submission
receiveForm.addEventListener("submit", addReceive);

// Export/Import event listeners
exportCsvBtn.addEventListener("click", exportToCSV);
exportJsonBtn.addEventListener("click", exportToJSON);
printBtn.addEventListener("click", printReceives);
clearAllBtn.addEventListener("click", clearAllData);

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  loadReceivesFromJSON();
});