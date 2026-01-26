"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

type UserSettingsContextValue = {
  adsEnabled: boolean;
  settingsLoaded: boolean;
  setAdsEnabled: (nextValue: boolean) => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

type UserSettingsProviderProps = {
  children: React.ReactNode;
};

export function UserSettingsProvider({ children }: UserSettingsProviderProps) {
  const { session, authReady } = useAuth();
  const [adsEnabled, setAdsEnabledState] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsUserId, setSettingsUserId] = useState<string | null>(null);

  const settingsAvailable = !!supabase && !!session;

  useEffect(() => {
    if (!settingsAvailable) return;

    if (settingsLoaded && settingsUserId === session.user.id) {
      return;
    }

    const loadSettings = async () => {
      const client = supabase;
      const activeSession = session;
      if (!client || !activeSession) return;
      setSettingsLoaded(false);
      const { data, error } = await client
        .from("user_settings")
        .select("ads_enabled")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (error) {
        setAdsEnabledState(false);
        setSettingsUserId(activeSession.user.id);
        setSettingsLoaded(true);
        return;
      }
      setAdsEnabledState(data?.ads_enabled ?? false);
      setSettingsUserId(activeSession.user.id);
      setSettingsLoaded(true);
    };

    loadSettings();
  }, [settingsAvailable, session, settingsLoaded, settingsUserId]);

  const setAdsEnabled = useCallback(async (nextValue: boolean) => {
    setAdsEnabledState(nextValue);
    if (!supabase || !session) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: session.user.id, ads_enabled: nextValue }, { onConflict: "user_id" });
  }, [session]);

  const resolvedAdsEnabled = settingsAvailable ? adsEnabled : false;
  const resolvedSettingsLoaded = settingsAvailable ? settingsLoaded : authReady;

  const value = useMemo(
    () => ({
      adsEnabled: resolvedAdsEnabled,
      settingsLoaded: resolvedSettingsLoaded,
      setAdsEnabled,
    }),
    [resolvedAdsEnabled, resolvedSettingsLoaded, setAdsEnabled],
  );

  return (
    <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}
