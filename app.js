/* app.js - Receive Copy System (Operations column removed) */

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

// State
let receives = []; // will be loaded from receives.json on startup

// Helpers
function showNotification(message, type = "info") {
  notification.textContent = message;
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

// Render
function renderTable() {
  if (receives.length === 0) {
    emptyState.style.display = "block";
    receiveTable.style.display = "none";
    tableBody.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";
  receiveTable.style.display = "table";

  tableBody.innerHTML = receives
    .map(
      (receive) => `
      <tr>
        <td>${receive.slNo}</td>
        <td>${formatDate(receive.date)}</td>
        <td>${receive.subject}</td>
        <td><span class="status-${receive.action}">${receive.action.charAt(0).toUpperCase() + receive.action.slice(1)}</span></td>
      </tr>
    `
    )
    .join("");
}

// Load receives.json (must be served via HTTP server)
async function loadReceivesFromJSON() {
  try {
    const response = await fetch("receives.json");
    if (!response.ok) throw new Error("receives.json not found (check server / path)");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid JSON format: expected array");
    // ensure each item has an id
    receives = data.map(item => ({ id: item.id || generateId(), ...item }));
    saveToLocalStorage(); // optional: cache into localStorage
    renderTable();
    console.info("receives.json loaded");
  } catch (err) {
    console.error("Error loading receives.json:", err);
    showNotification("Failed to load receives.json (see console)", "error");
    // fallback: try loading from localStorage (if exists)
    const fromLS = JSON.parse(localStorage.getItem("receives") || "null");
    if (Array.isArray(fromLS) && fromLS.length) {
      receives = fromLS;
      renderTable();
      showNotification("Loaded data from localStorage", "info");
    }
  }
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
  renderTable();

  receiveForm.reset();
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
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
    // printWindow.close();
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
  saveToLocalStorage();
  renderTable();
  showNotification("All data cleared!", "info");
}

// Import JSON File (via file picker)
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
      renderTable();
      showNotification("Imported JSON successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Invalid JSON file!", "error");
    }
  };
  reader.readAsText(file);
});

// Event listeners
receiveForm.addEventListener("submit", addReceive);
exportCsvBtn.addEventListener("click", exportToCSV);
exportJsonBtn.addEventListener("click", exportToJSON);
printBtn.addEventListener("click", printReceives);
clearAllBtn.addEventListener("click", clearAllData);

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  // Attempt to load from receives.json (requires running via HTTP server)
  loadReceivesFromJSON();

  // Set today's date as default in the add form
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
});
