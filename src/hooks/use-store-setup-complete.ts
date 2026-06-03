import { useCallback, useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { getClientSession } from "@/lib/authSession";
import {
  isStoreSetupCompleteForUser,
  STORE_SETUP_CHANGED_EVENT,
} from "@/lib/storeSetup";

export function useStoreSetupComplete() {
  const location = useLocation();
  const [complete, setComplete] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const session = await getClientSession();
    if (!session?.user) {
      setComplete(false);
      return;
    }
    setComplete(await isStoreSetupCompleteForUser(session.user.id));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, location.pathname]);

  useEffect(() => {
    const onChanged = () => void refresh();
    window.addEventListener(STORE_SETUP_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(STORE_SETUP_CHANGED_EVENT, onChanged);
  }, [refresh]);

  return {
    storeSetupComplete: complete === true,
    setupLoading: complete === null,
  };
}
