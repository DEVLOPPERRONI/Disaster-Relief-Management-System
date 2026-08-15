import { apiGet } from "./api.js";
import { requireAuth, applyUserHeader, setupLogout } from "./auth.js";

const loadStats = async () => {
  const data = await apiGet("/api/dashboard/stats");
  document.getElementById("totalDisasters").textContent = Number(
    data.TotalDisasters || 0
  ).toLocaleString();
  document.getElementById("activeDisasters").textContent = Number(
    data.ActiveDisasters || 0
  ).toLocaleString();
  document.getElementById("highSeverityDisasters").textContent = Number(
    data.HighSeverityDisasters || 0
  ).toLocaleString();
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
  try {
    await loadStats();
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    document.getElementById("totalDisasters").textContent = "N/A";
    document.getElementById("activeDisasters").textContent = "N/A";
    document.getElementById("highSeverityDisasters").textContent = "N/A";
  }
};

init();

