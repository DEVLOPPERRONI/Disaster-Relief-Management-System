import { apiGet, apiPost, apiPut, apiDelete } from "./api.js";
import { requireAuth, applyUserHeader, setupLogout } from "./auth.js";

let disasters = [];
let selectedDeleteId = null;

const ui = {
  loadingState: document.getElementById("loadingState"),
  errorState: document.getElementById("errorState"),
  emptyState: document.getElementById("emptyState"),
  tableWrapper: document.getElementById("tableWrapper"),
  tableBody: document.getElementById("disasterTableBody"),
  searchInput: document.getElementById("searchInput"),
  form: document.getElementById("disasterForm"),
  formAlert: document.getElementById("disasterFormAlert"),
  saveButton: document.getElementById("saveDisasterBtn"),
  modalTitle: document.getElementById("disasterModalTitle"),
  disasterId: document.getElementById("disasterId"),
  disasterName: document.getElementById("disasterName"),
  disasterType: document.getElementById("disasterType"),
  disasterDescription: document.getElementById("disasterDescription"),
  disasterSeverity: document.getElementById("disasterSeverity"),
  disasterStatus: document.getElementById("disasterStatus"),
  disasterStartDate: document.getElementById("disasterStartDate"),
  disasterEndDate: document.getElementById("disasterEndDate"),
  disasterAffectedPeople: document.getElementById("disasterAffectedPeople"),
  toastBody: document.getElementById("toastBody"),
};

const disasterModal = new bootstrap.Modal(document.getElementById("disasterModal"));
const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
const appToast = new bootstrap.Toast(document.getElementById("appToast"), { delay: 2500 });

const showToast = (message, type = "success") => {
  const toast = document.getElementById("appToast");
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  ui.toastBody.textContent = message;
  appToast.show();
};

const showState = (state) => {
  ui.loadingState.classList.add("d-none");
  ui.errorState.classList.add("d-none");
  ui.emptyState.classList.add("d-none");
  ui.tableWrapper.classList.add("d-none");
  if (state === "loading") ui.loadingState.classList.remove("d-none");
  if (state === "error") ui.errorState.classList.remove("d-none");
  if (state === "empty") ui.emptyState.classList.remove("d-none");
  if (state === "table") ui.tableWrapper.classList.remove("d-none");
};

const toDateInputValue = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const ensureDisasterTypeOption = (value) => {
  if (!value) return;
  const exists = Array.from(ui.disasterType.options).some((opt) => opt.value === value);
  if (!exists) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    ui.disasterType.appendChild(option);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const severityBadgeClass = (severity) => {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "critical") return "badge-severity-critical";
  if (normalized === "high") return "badge-severity-high";
  if (normalized === "medium") return "badge-severity-medium";
  return "badge-severity-low";
};

const statusBadgeClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "text-bg-danger";
  if (normalized === "monitoring") return "text-bg-warning";
  if (normalized === "resolved") return "text-bg-info";
  return "text-bg-success";
};

const renderTable = () => {
  ui.tableBody.innerHTML = "";
  disasters.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.DisasterID}</td>
      <td class="fw-semibold">${item.DisasterName}</td>
      <td>${item.DisasterType}</td>
      <td><span class="badge ${severityBadgeClass(item.Severity)}">${item.Severity}</span></td>
      <td><span class="badge ${statusBadgeClass(item.Status)}">${item.Status}</span></td>
      <td>${formatDate(item.StartDate)}</td>
      <td>${Number(item.AffectedPeople || 0).toLocaleString()}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${item.DisasterID}">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.DisasterID}">Delete</button>
      </td>
    `;
    ui.tableBody.appendChild(tr);
  });
  showState("table");
};

const loadDisasters = async (search = "") => {
  showState("loading");
  try {
    const endpoint = search ? `/api/disasters/search?query=${encodeURIComponent(search)}` : "/api/disasters";
    disasters = await apiGet(endpoint);
    if (disasters.length === 0) {
      showState("empty");
      return;
    }
    renderTable();
  } catch (error) {
    console.error("Load disasters error:", error);
    showState("error");
  }
};

const resetForm = () => {
  ui.form.reset();
  ui.disasterId.value = "";
  ui.disasterAffectedPeople.value = 0;
  ui.modalTitle.textContent = "Create Disaster";
  ui.saveButton.textContent = "Create Disaster";
  ui.formAlert.className = "alert d-none";
  ui.formAlert.textContent = "";
  ui.disasterType.value = "";
};

const setFormAlert = (message, type = "danger") => {
  ui.formAlert.className = `alert alert-${type}`;
  ui.formAlert.textContent = message;
};

const buildPayload = () => ({
  DisasterName: ui.disasterName.value.trim(),
  DisasterType: ui.disasterType.value.trim(),
  Description: ui.disasterDescription.value.trim(),
  Severity: ui.disasterSeverity.value,
  Status: ui.disasterStatus.value,
  StartDate: ui.disasterStartDate.value,
  EndDate: ui.disasterEndDate.value || null,
  AffectedPeople: Number(ui.disasterAffectedPeople.value),
});

const validatePayload = (payload) => {
  if (!payload.DisasterName || !payload.DisasterType || !payload.Severity || !payload.Status || !payload.StartDate) {
    return "Please complete all required fields.";
  }
  if (!Number.isInteger(payload.AffectedPeople) || payload.AffectedPeople < 0) {
    return "Affected people must be a non-negative integer.";
  }
  if (payload.EndDate && new Date(payload.EndDate) < new Date(payload.StartDate)) {
    return "End date cannot be before start date.";
  }
  return null;
};

const handleSaveDisaster = async (event) => {
  event.preventDefault();
  const payload = buildPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    setFormAlert(validationError);
    return;
  }

  const disasterId = ui.disasterId.value;
  ui.saveButton.disabled = true;
  ui.saveButton.textContent = "Saving...";
  try {
    if (disasterId) {
      await apiPut(`/api/disasters/${disasterId}`, payload);
      showToast("Disaster updated successfully.");
    } else {
      await apiPost("/api/disasters", payload);
      showToast("Disaster created successfully.");
    }
    disasterModal.hide();
    resetForm();
    await loadDisasters(ui.searchInput.value.trim());
  } catch (error) {
    setFormAlert(error.message || "Failed to save disaster.");
  } finally {
    ui.saveButton.disabled = false;
    ui.saveButton.textContent = disasterId ? "Update Disaster" : "Create Disaster";
  }
};

const openCreateModal = () => {
  resetForm();
  disasterModal.show();
};

const openEditModal = async (id) => {
  resetForm();
  try {
    const data = await apiGet(`/api/disasters/${id}`);
    ui.disasterId.value = data.DisasterID;
    ui.disasterName.value = data.DisasterName || "";
    ensureDisasterTypeOption(data.DisasterType || "");
    ui.disasterType.value = data.DisasterType || "";
    ui.disasterDescription.value = data.Description || "";
    ui.disasterSeverity.value = data.Severity || "";
    ui.disasterStatus.value = data.Status || "";
    ui.disasterStartDate.value = toDateInputValue(data.StartDate);
    ui.disasterEndDate.value = toDateInputValue(data.EndDate);
    ui.disasterAffectedPeople.value = Number(data.AffectedPeople || 0);
    ui.modalTitle.textContent = "Edit Disaster";
    ui.saveButton.textContent = "Update Disaster";
    disasterModal.show();
  } catch (error) {
    showToast(error.message || "Failed to load disaster details.", "danger");
  }
};

const handleTableActions = (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");
  if (editBtn) {
    const id = Number(editBtn.getAttribute("data-id"));
    openEditModal(id);
  }
  if (deleteBtn) {
    selectedDeleteId = Number(deleteBtn.getAttribute("data-id"));
    deleteModal.show();
  }
};

const confirmDelete = async () => {
  if (!selectedDeleteId) return;
  const btn = document.getElementById("confirmDeleteBtn");
  btn.disabled = true;
  btn.textContent = "Deleting...";
  try {
    await apiDelete(`/api/disasters/${selectedDeleteId}`);
    showToast("Disaster deleted successfully.");
    deleteModal.hide();
    selectedDeleteId = null;
    await loadDisasters(ui.searchInput.value.trim());
  } catch (error) {
    showToast(error.message || "Failed to delete disaster.", "danger");
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete";
  }
};

const setupSearch = () => {
  let timer;
  ui.searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      loadDisasters(ui.searchInput.value.trim());
    }, 350);
  });
};

const setupSidebarToggle = () => {
  const toggleBtn = document.getElementById("sidebarToggle");
  if (!toggleBtn) return;
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
};

const init = async () => {
  if (!requireAuth()) return;
  applyUserHeader();
  setupLogout();
  setupSidebarToggle();

  document.getElementById("openCreateModalBtn").addEventListener("click", openCreateModal);
  document.getElementById("emptyCreateBtn").addEventListener("click", openCreateModal);
  document.getElementById("retryLoadBtn").addEventListener("click", () => loadDisasters(ui.searchInput.value.trim()));
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
  ui.form.addEventListener("submit", handleSaveDisaster);
  ui.tableBody.addEventListener("click", handleTableActions);

  setupSearch();
  await loadDisasters();
};

init();
