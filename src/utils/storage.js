const KEY = "focusmate_users";

/* ---------- Utility: base64 helpers ---------- */
function bufToBase64(buf) {
  // ArrayBuffer -> base64
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBuf(b64) {
  // base64 -> ArrayBuffer
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/* ---------- Crypto helpers (Web Crypto API) ---------- */

/**
 * generateSalt
 * - Returns a base64-encoded random salt (16 bytes).
 */
function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToBase64(salt.buffer);
}

/**
 * deriveKey
 * - Derives a key from a password and base64 salt using PBKDF2 + SHA-256.
 * - iterations: 100000 (reasonable client-side default; adjust if needed).
 * - returns a base64-encoded derived key (32 bytes).
 */
async function deriveKey(password, saltB64, iterations = 100000, keyLen = 32) {
  // Convert password to ArrayBuffer
  const enc = new TextEncoder();
  const passBuf = enc.encode(password);

  // Import password as a CryptoKey for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passBuf,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive bits using PBKDF2
  const saltBuf = base64ToBuf(saltB64);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations,
      hash: "SHA-256"
    },
    baseKey,
    keyLen * 8 // bits
  );

  return bufToBase64(derivedBits);
}

/* ---------- Raw storage helpers (unchanged contract) ---------- */
export function loadUsersRaw() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
export function saveUsersRaw(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

/* ---------- Ensure user exists (legacy wrapper) ---------- */
export function ensureUserRaw(username) {
  const users = loadUsersRaw();
  if (!users[username]) {
    users[username] = {
      // password field will be either:
      // - legacy plaintext string (old data), or
      // - object { salt: "...", hash: "..." } (new hashed form)
      password: "",
      tasks: [],
      focusByDate: {},
      moodsByDate: {},
      moodsHistory: []
    };
    saveUsersRaw(users);
  }
  return users[username];
}

/* ---------- Register / Login with password hashing ---------- */

/**
 * registerUser(username, password)
 * - Creates a new user and stores a hashed password (salt + derived key).
 * - Returns { username } on success.
 */
export async function registerUser(username, password) {
  const users = loadUsersRaw();
  if (users[username]) throw new Error("User exists");

  // generate salt and derived key
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);

  users[username] = {
    password: { salt, hash }, // store hashed password object
    tasks: [],
    focusByDate: {},
    moodsByDate: {},
    moodsHistory: []
  };

  saveUsersRaw(users);

  // set session snapshot for immediate UI use
  try {
    sessionStorage.setItem("fm_session", username);
    sessionStorage.setItem(
      "fm_user_data",
      JSON.stringify({
        tasks: users[username].tasks,
        focusByDate: users[username].focusByDate,
        moodsByDate: users[username].moodsByDate,
        moodsHistory: users[username].moodsHistory
      })
    );
  } catch {}

  return { username };
}

/**
 * loginUser(username, password)
 * - Verifies the provided password against stored hash.
 * - Supports legacy plaintext passwords: if a plaintext password is found and matches,
 *   the stored password will be upgraded to the hashed form automatically.
 * - On success, sets sessionStorage.fm_session and fm_user_data and returns { username, data }.
 */
export async function loginUser(username, password) {
  const users = loadUsersRaw();
  const u = users[username];
  if (!u) throw new Error("User not found");

  // If password stored as object { salt, hash }, verify via PBKDF2
  if (u.password && typeof u.password === "object" && u.password.salt && u.password.hash) {
    const salt = u.password.salt;
    const expectedHash = u.password.hash;
    const derived = await deriveKey(password, salt);
    if (derived !== expectedHash) throw new Error("Invalid password");
    // success: set session snapshot
    const decrypted = {
      tasks: u.tasks || [],
      focusByDate: u.focusByDate || {},
      moodsByDate: u.moodsByDate || {},
      moodsHistory: u.moodsHistory || []
    };
    try {
      sessionStorage.setItem("fm_session", username);
      sessionStorage.setItem("fm_user_data", JSON.stringify(decrypted));
    } catch (err) {
      console.warn("loginUser: failed to set session snapshot", err);
    }
    return { username, data: decrypted };
  }

  // Legacy: password stored as plaintext string (old data)
  if (u.password && typeof u.password === "string") {
    if (u.password !== password) throw new Error("Invalid password");
    // Upgrade: hash the plaintext password and replace stored value with { salt, hash }
    const salt = generateSalt();
    const hash = await deriveKey(password, salt);
    users[username].password = { salt, hash };
    saveUsersRaw(users);
    // set session snapshot
    const decrypted = {
      tasks: u.tasks || [],
      focusByDate: u.focusByDate || {},
      moodsByDate: u.moodsByDate || {},
      moodsHistory: u.moodsHistory || []
    };
    try {
      sessionStorage.setItem("fm_session", username);
      sessionStorage.setItem("fm_user_data", JSON.stringify(decrypted));
    } catch (err) {
      console.warn("loginUser: failed to set session snapshot", err);
    }
    return { username, data: decrypted };
  }

  // No password set (empty) — treat as no-password account (legacy behavior)
  if (!u.password) {
    const decrypted = {
      tasks: u.tasks || [],
      focusByDate: u.focusByDate || {},
      moodsByDate: u.moodsByDate || {},
      moodsHistory: u.moodsHistory || []
    };
    try {
      sessionStorage.setItem("fm_session", username);
      sessionStorage.setItem("fm_user_data", JSON.stringify(decrypted));
    } catch (err) {
      console.warn("loginUser: failed to set session snapshot", err);
    }
    return { username, data: decrypted };
  }

  // Fallback: invalid password format
  throw new Error("Invalid password format");
}

/* ---------- Save user data (authoritative) ---------- */
export async function saveUserData(username, data) {
  const users = loadUsersRaw();
  const u = users[username];
  if (!u) throw new Error("User not found");
  u.tasks = data.tasks || u.tasks || [];
  u.focusByDate = data.focusByDate || u.focusByDate || {};
  u.moodsByDate = data.moodsByDate || u.moodsByDate || {};
  u.moodsHistory = data.moodsHistory || u.moodsHistory || [];
  saveUsersRaw(users);

  try {
    const sessionUser = sessionStorage.getItem("fm_session");
    if (sessionUser === username) {
      sessionStorage.setItem(
        "fm_user_data",
        JSON.stringify({
          tasks: u.tasks,
          focusByDate: u.focusByDate,
          moodsByDate: u.moodsByDate,
          moodsHistory: u.moodsHistory
        })
      );
    }
  } catch {}
}

/* ---------- saveUsers wrapper that updates session snapshot ---------- */
export function saveUsers(obj) {
  saveUsersRaw(obj);
  try {
    const sessionUser = sessionStorage.getItem("fm_session");
    if (sessionUser && obj[sessionUser]) {
      sessionStorage.setItem(
        "fm_user_data",
        JSON.stringify({
          tasks: obj[sessionUser].tasks || [],
          focusByDate: obj[sessionUser].focusByDate || {},
          moodsByDate: obj[sessionUser].moodsByDate || {},
          moodsHistory: obj[sessionUser].moodsHistory || []
        })
      );
    }
  } catch (err) {
    console.warn("saveUsers: failed to update fm_user_data", err);
  }
}

/* ---------- loadUsers synchronous shim (UI-facing) ---------- */
export function loadUsers() {
  const usersRaw = loadUsersRaw();
  const sessionUser = sessionStorage.getItem("fm_session");
  const userDataJson = sessionStorage.getItem("fm_user_data");

  // shallow clone so we don't mutate localStorage object
  const out = JSON.parse(JSON.stringify(usersRaw || {}));

  if (sessionUser && userDataJson) {
    try {
      const decrypted = JSON.parse(userDataJson);
      out[sessionUser] = out[sessionUser] || {};
      out[sessionUser].tasks = decrypted.tasks || out[sessionUser].tasks || [];
      out[sessionUser].focusByDate = decrypted.focusByDate || out[sessionUser].focusByDate || {};
      out[sessionUser].moodsByDate = decrypted.moodsByDate || out[sessionUser].moodsByDate || {};
      out[sessionUser].moodsHistory = decrypted.moodsHistory || out[sessionUser].moodsHistory || [];
    } catch (err) {
      console.warn("loadUsers: failed to parse fm_user_data", err);
    }
  }

  return out;
}

/* Convenience wrappers */
export function saveUsersRawWrapper(obj) {
  saveUsersRaw(obj);
}
export function ensureUser(username) {
  return ensureUserRaw(username);
}

/* Debug helper (temporary) */
export function __debug_dump() {
  const raw = loadUsersRaw();
  const sessionUser = sessionStorage.getItem("fm_session");
  const fm = sessionStorage.getItem("fm_user_data");
  return { raw, sessionUser, fm_user_data: fm ? JSON.parse(fm) : null, loadUsers: loadUsers() };
}
if (typeof window !== "undefined") {
  window.__debug_storage = { dump: () => __debug_dump() };
}