import { apiPost } from "./api.js";

const setLoading = (button, isLoading, label) => {
  if (!button) return;
  button.disabled = isLoading;
  button.querySelector(".btn-label").textContent = isLoading ? "Please wait..." : label;
};

const showAlert = (message, type = "danger") => {
  const alertEl = document.getElementById("authAlert");
  if (!alertEl) return;
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
};

const clearAlert = () => {
  const alertEl = document.getElementById("authAlert");
  if (!alertEl) return;
  alertEl.className = "alert d-none";
  alertEl.textContent = "";
};

const isValidEmail = (value) =>
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);

export const requireAuth = () => {
  const token = localStorage.getItem("dms_token");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

export const applyUserHeader = () => {
  const userRaw = localStorage.getItem("dms_user");
  if (!userRaw) return;
  try {
    const user = JSON.parse(userRaw);
    const welcome = document.getElementById("welcomeUser");
    if (welcome) welcome.textContent = `Hi, ${user.name}`;
  } catch {
    localStorage.removeItem("dms_user");
  }
};

export const setupLogout = () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    window.location.href = "login.html";
  });
};

const setupSidebarToggle = () => {
  const toggleBtn = document.getElementById("sidebarToggle");
  if (!toggleBtn) return;
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
};

const setupLogin = () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const token = localStorage.getItem("dms_token");
  if (token) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();
    const loginBtn = document.getElementById("loginBtn");
    const login = document.getElementById("loginIdentity").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!login || !password) {
      showAlert("Please fill in all fields.");
      return;
    }

    setLoading(loginBtn, true, "Login");
    try {
      const response = await apiPost("/api/users/login", { login, password });
      localStorage.setItem("dms_token", response.token);
      localStorage.setItem("dms_user", JSON.stringify(response.user));
      window.location.href = "dashboard.html";
    } catch (error) {
      showAlert(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(loginBtn, false, "Login");
    }
  });
};

const setupRegister = () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert();
    const registerBtn = document.getElementById("registerBtn");

    const payload = {
      name: document.getElementById("registerName").value.trim(),
      email: document.getElementById("registerEmail").value.trim(),
      phone: document.getElementById("registerPhone").value.trim(),
      password: document.getElementById("registerPassword").value,
      confirmPassword: document.getElementById("registerConfirmPassword").value,
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.password || !payload.confirmPassword) {
      showAlert("Please complete all required fields.");
      return;
    }
    if (!isValidEmail(payload.email)) {
      showAlert("Please enter a valid email address.");
      return;
    }
    if (payload.password !== payload.confirmPassword) {
      showAlert("Password confirmation does not match.");
      return;
    }

    setLoading(registerBtn, true, "Register");
    try {
      await apiPost("/api/users/register", payload);
      showAlert("Registration successful. Redirecting to login...", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    } catch (error) {
      showAlert(error.message || "Registration failed.");
    } finally {
      setLoading(registerBtn, false, "Register");
    }
  });
};

setupLogin();
setupRegister();
setupSidebarToggle();
