
import axios from "axios";

const defaultGatewayBaseUrl = "http://localhost:5000";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() || defaultGatewayBaseUrl;

export const NOTIFICATIONS_WS_URL =
  process.env.REACT_APP_NOTIFICATIONS_WS_URL?.trim() ||
  `${API_BASE_URL.replace(/\/$/, "")}/api/notifications/ws`;

export const ASSETS_BASE_URL =
  process.env.REACT_APP_ASSETS_BASE_URL?.trim() ||
  `${API_BASE_URL.replace(/\/$/, "")}/assets`;

const api = axios.create({
  baseURL: API_BASE_URL
});

api.defaults.headers.post['Content-Type'] = 'application/json';

export default api;