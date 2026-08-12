const resultEl = document.getElementById("result");
const clerkEmpty = document.getElementById("clerk-empty");
const clerkSection = document.getElementById("clerk-section");
const profileSection = document.getElementById("profile-section");
const legacySection = document.getElementById("legacy-section");
const profileForm = document.getElementById("profile-form");
const legacySigninForm = document.getElementById("legacy-signin-form");
const clerkSignInButton = document.getElementById("clerk-sign-in");
const clerkSignUpButton = document.getElementById("clerk-sign-up");
const profileFields = {
  firstName: document.getElementById("profile-first-name"),
  lastName: document.getElementById("profile-last-name"),
  email: document.getElementById("profile-email"),
  username: document.getElementById("profile-username"),
  role: document.getElementById("profile-role"),
  phone: document.getElementById("profile-phone")
};

let authMode = "clerk";
let clerkPublishableKey = "";
let clerkIssuer = "";

function showResult(payload) {
  resultEl.textContent = JSON.stringify(payload, null, 2);
}

function showPanel(panel) {
  [clerkSection, profileSection, legacySection].forEach((section) => {
    if (!section) {
      return;
    }
    section.classList.remove("active");
    section.classList.add("hidden");
  });

  panel.classList.remove("hidden");
  panel.classList.add("active");
}

function storeSession(payload) {
  localStorage.setItem("salonAuth", JSON.stringify(payload));
}

async function callBackend(path, { method = "POST", headers = {}, body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      ...headers
    },
    body
  });

  const payload = await response.json().catch(() => ({ message: "Invalid server response" }));
  return { response, payload };
}

async function ensureClerkLoaded() {
  if (!clerkPublishableKey) {
    throw new Error("Missing Clerk publishable key");
  }

  if (!window.Clerk) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
      script.async = true;
      script.setAttribute("data-clerk-publishable-key", clerkPublishableKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Clerk browser SDK"));
      document.head.appendChild(script);
    });
  }

  if (window.Clerk?.load) {
    await window.Clerk.load({ publishableKey: clerkPublishableKey });
  }
}

async function getClerkToken() {
  if (!window.Clerk?.session?.getToken) {
    return null;
  }

  return window.Clerk.session.getToken();
}

async function syncClerkUserToBackend() {
  const token = await getClerkToken();
  if (!token) {
    showResult({ message: "Clerk session token is unavailable" });
    return;
  }

  const clerkUser = window.Clerk?.user;
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
  const firstName = clerkUser?.firstName ?? "";
  const lastName = clerkUser?.lastName ?? "";
  const username = clerkUser?.username ?? email.split("@")[0] ?? "";

  profileFields.firstName.value = firstName;
  profileFields.lastName.value = lastName;
  profileFields.email.value = email;
  profileFields.username.value = username;

  const loginResult = await callBackend("/api/auth/login", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (loginResult.response.ok) {
    showPanel(profileSection);
    showResult({ step: "clerk-login", status: loginResult.response.status, ...loginResult.payload });
    storeSession({ source: "clerk", token, backend: loginResult.payload });
    clerkEmpty.textContent = "Clerk session is active.";
    return;
  }

  showPanel(profileSection);
  showResult({ step: "clerk-login", status: loginResult.response.status, ...loginResult.payload });
  clerkEmpty.textContent = "Clerk signed in, now complete your profile and role.";
}

function getRedirectTarget() {
  const returnUrl = `${window.location.origin}/sign-in`;
  if (!clerkIssuer) {
    return returnUrl;
  }

  return `${clerkIssuer.replace(/\/$/, "")}/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
}

async function redirectToClerk(mode) {
  await ensureClerkLoaded();

  const clerk = window.Clerk;
  if (mode === "signUp" && typeof clerk?.redirectToSignUp === "function") {
    await clerk.redirectToSignUp();
    return;
  }

  if (mode === "signIn" && typeof clerk?.redirectToSignIn === "function") {
    await clerk.redirectToSignIn();
    return;
  }

  window.location.href = getRedirectTarget();
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = await getClerkToken();
  if (!token) {
    showResult({ message: "Please complete Clerk sign in first" });
    return;
  }

  const formData = new FormData(profileForm);
  const body = {
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim().toUpperCase(),
    phone: String(formData.get("phone") ?? "").trim() || undefined
  };

  const signupResult = await callBackend("/api/auth/signup", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!signupResult.response.ok) {
    showResult({ step: "clerk-signup", status: signupResult.response.status, ...signupResult.payload });
    return;
  }

  const loginResult = await callBackend("/api/auth/login", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  showResult({
    step: "clerk-signup+login",
    signupStatus: signupResult.response.status,
    signup: signupResult.payload,
    loginStatus: loginResult.response.status,
    login: loginResult.payload
  });

  if (loginResult.response.ok) {
    storeSession({ source: "clerk", token, backend: loginResult.payload });
  }
});

legacySigninForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(legacySigninForm);

  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toUpperCase();

  const { response, payload } = await callBackend("/api/auth/login", {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-role": role
    }
  });

  showResult({ status: response.status, ...payload });
  if (response.ok) {
    storeSession({ source: "legacy", userId, role, backend: payload });
  }
});

clerkSignInButton?.addEventListener("click", () => {
  void redirectToClerk("signIn");
});

clerkSignUpButton?.addEventListener("click", () => {
  void redirectToClerk("signUp");
});

async function bootstrap() {
  const configResponse = await fetch("/api/public-config");
  const config = await configResponse.json();
  authMode = config.authMode ?? "clerk";
  clerkPublishableKey = config.clerkPublishableKey ?? "";
  clerkIssuer = config.clerkIssuer ?? "";

  if (authMode === "clerk") {
    showPanel(clerkSection);
    clerkEmpty.textContent = "Click continue to sign in with Clerk.";
    await ensureClerkLoaded().catch((error) => {
      showResult({ message: error?.message ?? "Failed to load Clerk" });
    });

    if (window.Clerk?.user) {
      await syncClerkUserToBackend();
    }
    return;
  }

  showPanel(legacySection);
  clerkSection.classList.add("hidden");
  profileSection.classList.add("hidden");
  clerkEmpty.textContent = "Clerk is disabled for this environment.";
  showResult({ message: "Legacy auth mode is active" });
}

bootstrap().catch((error) => {
  showResult({ message: error?.message ?? "Failed to initialize auth UI" });
});
