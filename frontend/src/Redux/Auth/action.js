import axios from "axios";
import {
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  GET_USER_FAILURE,
  LOGOUT,
  GET_ALL_CUSTOMERS_REQUEST,
  GET_ALL_CUSTOMERS_SUCCESS,
  GET_ALL_CUSTOMERS_FAILURE,
} from "./actionTypes";
import api, { API_BASE_URL } from "../../config/api";

const normalizeRole = (role) => {
  if (!role || typeof role !== "string") {
    return undefined;
  }

  const upper = role.toUpperCase();
  return upper.startsWith("ROLE_") ? upper.slice(5) : upper;
};

const readStoredAuthUser = () => {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const buildAuthState = (responseData) => {
  const source = responseData?.data ?? responseData ?? {};
  const normalizedRole = normalizeRole(source?.role ?? source?.userRole ?? source?.user?.role);

  const fallbackUser = {
    id: source?.userId ?? source?.id,
    fullName: source?.fullName ?? source?.username ?? source?.email ?? "",
    email: source?.email,
    role: normalizedRole,
    approvalStatus: source?.approvalStatus,
    clerkId: source?.clerkId
  };

  const user = source?.user
    ? {
        ...source.user,
        role: normalizeRole(source.user.role)
      }
    : fallbackUser;

  const hasUser = Boolean(user?.id || user?.email || user?.role);
  return {
    jwt: source?.jwt ?? source?.accessToken ?? null,
    user: hasUser ? user : null,
    raw: responseData
  };
};

const persistAuthState = ({ jwt, user }) => {
  if (jwt) {
    localStorage.setItem("jwt", jwt);
  }

  if (user) {
    localStorage.setItem("authUser", JSON.stringify(user));
  }
};

export const registerUser = (userData) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });
  console.log("auth action - ",userData)
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/signup`,
      userData.userData
    );
    const authState = buildAuthState(response.data);
    persistAuthState(authState);

    if (authState.user?.role === "ADMIN") {
      userData.navigate("/admin");
    } else if (authState.user?.role === "SALON_OWNER") {
      userData.navigate("/salon-dashboard");
    } else {
      userData.navigate("/");
    }

    console.log("registerr :- ", response.data);
    dispatch({ type: REGISTER_SUCCESS, payload: authState });
  } catch (error) {
    console.log("error ", error);
    dispatch({ type: REGISTER_FAILURE, payload: error });
  }
};

// Login action creators
const loginRequest = () => ({ type: LOGIN_REQUEST });
const loginSuccess = (user) => ({ type: LOGIN_SUCCESS, payload: user });

export const loginUser = (userData) => async (dispatch) => {
  dispatch(loginRequest());
  try {
    const loginPayload = {
      ...userData.data,
      username: userData.data?.username ?? userData.data?.email
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/login`,
      loginPayload
    );
    const authState = buildAuthState(response.data);
    persistAuthState(authState);

    if (authState.user?.role === "ADMIN") {
      userData.navigate("/admin");
    } else if (authState.user?.role === "SALON_OWNER") {
      userData.navigate("/salon-dashboard");
    } else {
      userData.navigate("/");
    }

    console.log("login ", response.data);
    dispatch(loginSuccess(authState));
  } catch (error) {
    console.log("error ", error);
    dispatch({ type: LOGIN_FAILURE, payload: error });
  }
};

//  get user from token
export const getAllCustomers = (token) => {
  return async (dispatch) => {
    console.log("jwt - ", token);
    dispatch({ type: GET_ALL_CUSTOMERS_REQUEST });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const users = response.data;
      dispatch({ type: GET_ALL_CUSTOMERS_SUCCESS, payload: users });
      console.log("All Customers", users);
    } catch (error) {
      const errorMessage = error.message;
      console.log(error);
      dispatch({ type: GET_ALL_CUSTOMERS_FAILURE, payload: errorMessage });
    }
  };
};

export const getUser = (token) => {
  return async (dispatch) => {
    const storedUser = readStoredAuthUser();
    if (!token && storedUser) {
      dispatch({
        type: GET_USER_SUCCESS,
        payload: storedUser
      });
      return;
    }

    dispatch({ type: GET_USER_REQUEST });

    if (!token) {
      dispatch({ type: GET_USER_FAILURE, payload: "No auth token found" });
      return;
    }

    try {
      const response = await api.get(`/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const authState = buildAuthState(response.data);
      persistAuthState(authState);
      dispatch({ type: GET_USER_SUCCESS, payload: authState.user ?? response.data });
      console.log("req User ", response.data);
    } catch (error) {
      const status = error?.response?.status;
      if ((status === 401 || status === 404) && storedUser) {
        dispatch({ type: GET_USER_SUCCESS, payload: storedUser });
        return;
      }

      const errorMessage = error.message;
      dispatch({ type: GET_USER_FAILURE, payload: errorMessage });
    }
  };
};

export const logout = () => {
  return async (dispatch) => {
    dispatch({ type: LOGOUT });
    localStorage.clear();
  };
};
