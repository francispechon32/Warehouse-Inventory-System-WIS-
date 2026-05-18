/** Keys for “show low-stock prompt once per login” (or once ever when guest). */
const GUEST_PROMPT_KEY = "inv_low_stock_prompt_guest";

function sessionKey(userId) {
  return `inv_low_stock_prompt_${userId}`;
}

/**
 * Whether to auto-open the low-stock notification.
 * - No userId (no login yet): once per browser (localStorage).
 * - With userId: once per login session (sessionStorage).
 */
export function shouldShowLowStockPrompt(userId = null) {
  try {
    if (userId) {
      return !sessionStorage.getItem(sessionKey(userId));
    }
    return !localStorage.getItem(GUEST_PROMPT_KEY);
  } catch {
    return false;
  }
}

/** Call after auto-showing the prompt so it does not repeat until next login. */
export function markLowStockPromptShown(userId = null) {
  try {
    if (userId) {
      sessionStorage.setItem(sessionKey(userId), String(Date.now()));
    } else {
      localStorage.setItem(GUEST_PROMPT_KEY, String(Date.now()));
    }
  } catch {
    /* storage unavailable */
  }
}

/** Call on successful login so the prompt can show again this session. */
export function resetLowStockPromptForLogin(userId) {
  if (!userId) return;
  try {
    sessionStorage.removeItem(sessionKey(userId));
  } catch {
    /* ignore */
  }
}
