const API_BASE =
  window.location.port === "5000"
    ? ""
    : "http://localhost:5000";

const getToken = () => localStorage.getItem("dms_token");

const request = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  let data = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return data;
};

const handleAuthError = (error) => {
  if (error.status === 401) {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    window.location.href = "login.html";
  }
};

const apiGet = async (url) => {
  try {
    return await request(url, { method: "GET" });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
};

const apiPost = async (url, body) => {
  try {
    return await request(url, { method: "POST", body: JSON.stringify(body) });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
};

const apiPut = async (url, body) => {
  try {
    return await request(url, { method: "PUT", body: JSON.stringify(body) });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
};

const apiDelete = async (url) => {
  try {
    return await request(url, { method: "DELETE" });
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
};

export { apiGet, apiPost, apiPut, apiDelete };
