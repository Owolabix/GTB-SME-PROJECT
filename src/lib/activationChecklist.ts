const STORAGE_KEY = "lynk_activation_checklist_v1";

export type ActivationChecklistState = {
  instagramConnected: boolean;
  hasAutomation: boolean;
  hasDmActivity: boolean;
  instagramUsername: string | null;
};

export type ActivationChecklistPrefs = {
  dismissed: boolean;
  testStepSkipped: boolean;
};

export function loadActivationChecklistPrefs(): ActivationChecklistPrefs {
  if (typeof window === "undefined") {
    return { dismissed: false, testStepSkipped: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissed: false, testStepSkipped: false };
    const parsed = JSON.parse(raw) as Partial<ActivationChecklistPrefs>;
    return {
      dismissed: Boolean(parsed.dismissed),
      testStepSkipped: Boolean(parsed.testStepSkipped),
    };
  } catch {
    return { dismissed: false, testStepSkipped: false };
  }
}

export function saveActivationChecklistPrefs(prefs: ActivationChecklistPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function requiredActivationStepsDone(state: ActivationChecklistState): boolean {
  return state.instagramConnected && state.hasAutomation;
}

export function isActivationChecklistComplete(
  state: ActivationChecklistState,
  prefs: ActivationChecklistPrefs,
): boolean {
  if (!requiredActivationStepsDone(state)) return false;
  return state.hasDmActivity || prefs.testStepSkipped;
}

export function shouldShowActivationChecklist(
  state: ActivationChecklistState,
  prefs: ActivationChecklistPrefs,
): boolean {
  if (prefs.dismissed) return false;
  return !isActivationChecklistComplete(state, prefs);
}

export function activationProgress(state: ActivationChecklistState, prefs: ActivationChecklistPrefs) {
  let done = 0;
  if (state.instagramConnected) done += 1;
  if (state.hasAutomation) done += 1;
  if (state.hasDmActivity || prefs.testStepSkipped) done += 1;
  return { done, total: 3 };
}
