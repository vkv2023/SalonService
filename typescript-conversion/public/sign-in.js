const resultEl = document.getElementById("result");
const clerkEmpty = document.getElementById("clerk-empty");
const successBanner = document.getElementById("success-banner");
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
let clerkAudience = "";
let clerkLoadPromise = null;
const clerkFallbackScriptUrls = [
  "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js",
  "https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"
];

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

function showSuccessMessage(message = "Account created. Please sign in.") {
  if (!successBanner) {
    return;
  }

  successBanner.textContent = message;
  successBanner.classList.remove("hidden");
}

function hideSuccessMessage() {
  if (!successBanner) {
    return;
  }

  successBanner.classList.add("hidden");
}

function wasJustSignedUp() {
  return sessionStorage.getItem("salonAfterSignup") === "true";
}

function storeSession(payload) {
  localStorage.setItem("salonAuth", JSON.stringify(payload));
}

function clearSavedSession() {
  localStorage.removeItem("salonAuth");
}

function readClerkTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("__clerk_db_jwt") ?? params.get("__clerk_jwt");
  if (!token) {
    return null;
  }

  // Remove transient auth params from URL without reloading.
  params.delete("__clerk_db_jwt");
  params.delete("__clerk_jwt");
  params.delete("__clerk_handshake");
  params.delete("__clerk_status");
  params.delete("__clerk_redirect_count");
  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
  return token;
}

function hasSavedAppSession() {
  try {
    const raw = localStorage.getItem("salonAuth");
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    return Boolean(parsed?.backend || parsed?.userId || parsed?.token);
  } catch (_error) {
    return false;
  }
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

function getClerkScriptUrls() {
  const urls = [];
  if (clerkIssuer) {
    const base = clerkIssuer.replace(/\/$/, "");
    urls.push(`${base}/npm/@clerk/clerk-js@latest/dist/clerk.browser.js`);
  }

  return [...urls, ...clerkFallbackScriptUrls];
}

function getClerkSdk() {
  return window.Clerk ?? window.clerk ?? globalThis.Clerk ?? null;
}

async function loadClerkScript() {
  const scriptUrls = getClerkScriptUrls();

  for (const scriptUrl of scriptUrls) {
    try {
      await new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${scriptUrl}"]`);
        if (existing) {
          if (getClerkSdk()) {
            resolve();
            return;
          }

          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Clerk script load failed")), {
            once: true
          });
          return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Clerk script load failed"));
        document.head.appendChild(script);
      });

      if (getClerkSdk()) {
        return;
      }
    } catch (_error) {
      // Try next script host.
    }
  }

  throw new Error(
    "Failed to load Clerk browser SDK. Verify internet access and CLERK_ISSUER in your .env file."
  );
}

async function ensureClerkLoaded() {
  if (!clerkPublishableKey) {
    throw new Error("Missing Clerk publishable key");
  }

  const readySdk = getClerkSdk();
  if (readySdk?.isReady?.()) {
    return;
  }

  if (!clerkLoadPromise) {
    clerkLoadPromise = (async () => {
      if (!getClerkSdk()) {
        await loadClerkScript();
      }

      const sdk = getClerkSdk();
      if (!sdk) {
        throw new Error("Clerk SDK did not initialize");
      }

      if (sdk?.load && !sdk?.isReady?.()) {
        await sdk.load({ publishableKey: clerkPublishableKey });
      }
    })().catch((error) => {
      clerkLoadPromise = null;
      throw error;
    });
  }

  await clerkLoadPromise;
}

async function getClerkToken() {
  const tokenFromUrl = readClerkTokenFromUrl();
  if (tokenFromUrl) {
    return tokenFromUrl;
  }

  const sdk = getClerkSdk();
  if (!sdk?.session?.getToken) {
    console.warn("Clerk session is not available");
    return null;
  }

  try {
    if (clerkAudience) {
      return await sdk.session.getToken({ template: clerkAudience });
    }
  } catch (_error) {
    // Some Clerk deployments use the default session token instead of a custom audience template.
  }

  try {
    return await sdk.session.getToken();
  } catch (error) {
    console.error("Failed to obtain Clerk token", error);
    return null;
  }
}

function isClerkRedirectReturn() {
  return Array.from(new URLSearchParams(window.location.search).keys()).some(
    (key) => key.startsWith("__clerk") || key.startsWith("clerk_")
  );
}

async function syncClerkUserToBackend() {
  const token = await getClerkToken();
  if (!token) {
    clearSavedSession();
    showResult({ message: "Clerk session token is unavailable. Please sign in again." });
    return;
  }

  const sdk = getClerkSdk();
  const clerkUser = sdk?.user;
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
    showPanel(clerkSection);
    showSuccessMessage("You are already signed in.");
    showResult({ step: "clerk-login", status: loginResult.response.status, ...loginResult.payload });
    storeSession({ source: "clerk", token, backend: loginResult.payload });
    clerkEmpty.textContent = "Clerk session is active.";
    return;
  }

  clearSavedSession();

  if (loginResult.response.status === 404) {
    showPanel(profileSection);
    showResult({ step: "clerk-login", status: loginResult.response.status, ...loginResult.payload });
    clerkEmpty.textContent = "Clerk signed in, now complete your profile and role.";
    return;
  }

  showPanel(clerkSection);
  showResult({ step: "clerk-login", status: loginResult.response.status, ...loginResult.payload });
  clerkEmpty.textContent = "Unable to complete backend sign-in. Please try again.";
}

async function redirectToClerk(mode) {
  const returnUrl = `${window.location.origin}/sign-in`;
  let clerk = null;

  try {
    await ensureClerkLoaded();
    clerk = getClerkSdk();
  } catch (error) {
    console.warn("Clerk SDK is unavailable, using direct Clerk redirect", error);
  }

  if (mode === "signUp" && typeof clerk?.redirectToSignUp === "function") {
    await clerk.redirectToSignUp({
      afterSignUpUrl: returnUrl,
      signInFallbackRedirectUrl: returnUrl,
      signUpFallbackRedirectUrl: returnUrl
    });
    return;
  }

  if (mode === "signIn" && typeof clerk?.redirectToSignIn === "function") {
    await clerk.redirectToSignIn({
      afterSignInUrl: returnUrl,
      signInFallbackRedirectUrl: returnUrl,
      signUpFallbackRedirectUrl: returnUrl
    });
    return;
  }

  if (mode === "signUp" && typeof clerk?.openSignUp === "function") {
    clerk.openSignUp();
    return;
  }

  if (mode === "signIn" && typeof clerk?.openSignIn === "function") {
    clerk.openSignIn();
    return;
  }

  if (clerkIssuer) {
    const fallbackBase = clerkIssuer.replace(/\/$/, "");
    const fallbackParams = new URLSearchParams({
      redirect_url: returnUrl
    });
    if (mode === "signUp") {
      fallbackParams.set("mode", "sign_up");
    }
    const fallbackUrl = `${fallbackBase}/?${fallbackParams.toString()}`;
    window.location.assign(fallbackUrl);
    return;
  }

  throw new Error("Clerk sign-in is unavailable. Verify Clerk SDK and environment settings.");
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

  if (body.role === "SALON_OWNER") {
    signupResult.payload = {
      ...signupResult.payload,
      note: "Salon owner registration is pending admin approval."
    };
  }

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

  sessionStorage.setItem("salonAfterSignup", "true");
  showSuccessMessage();
  setTimeout(() => {
    window.location.replace("/sign-in");
  }, 1200);
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
  void redirectToClerk("signIn").catch((error) => {
    showResult({ message: error?.message ?? "Unable to start Clerk sign-in" });
  });
});

clerkSignUpButton?.addEventListener("click", () => {
  void redirectToClerk("signUp").catch((error) => {
    showResult({ message: error?.message ?? "Unable to start Clerk sign-up" });
  });
});

async function bootstrap() {
  const configResponse = await fetch("/api/public-config");
  if (!configResponse.ok) {
    throw new Error("Failed to load public auth config");
  }
  const config = await configResponse.json();
  authMode = config.authMode ?? "clerk";
  clerkPublishableKey = config.clerkPublishableKey ?? "";
  clerkIssuer = config.clerkIssuer ?? "";
  clerkAudience = config.clerkAudience ?? "";

  if (authMode === "clerk") {
    showPanel(clerkSection);
    clerkEmpty.textContent = "Click continue to sign in with Clerk.";

    if (wasJustSignedUp()) {
      sessionStorage.removeItem("salonAfterSignup");
      showSuccessMessage();
    }

    if (hasSavedAppSession()) {
      clerkEmpty.textContent = "Restoring your session...";
    }

    await ensureClerkLoaded().catch((error) => {
      console.warn("Proceeding without Clerk SDK", error);
      clerkEmpty.textContent =
        "Using browser fallback mode. Click Continue with Clerk to sign in.";
    });

    const sdk = getClerkSdk();
    if (sdk?.session || sdk?.user || isClerkRedirectReturn()) {
      await syncClerkUserToBackend();
      return;
    }

    if (hasSavedAppSession()) {
      clearSavedSession();
    }

    clerkEmpty.textContent = "Click continue to sign in with Clerk.";
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
