"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!supabase) {
      setAdsEnabledState(false);
      setSettingsLoaded(true);
      setSettingsUserId(null);
      return;
    }

    if (!session) {
      if (!authReady) return;
      setAdsEnabledState(false);
      setSettingsLoaded(true);
      setSettingsUserId(null);
      return;
    }

    if (settingsLoaded && settingsUserId === session.user.id) {
      return;
    }

    const loadSettings = async () => {
      setSettingsLoaded(false);
      const { data, error } = await supabase
        .from("user_settings")
        .select("ads_enabled")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        setAdsEnabledState(false);
        setSettingsUserId(session.user.id);
        setSettingsLoaded(true);
        return;
      }
      setAdsEnabledState(data?.ads_enabled ?? false);
      setSettingsUserId(session.user.id);
      setSettingsLoaded(true);
    };

    loadSettings();
  }, [authReady, session, settingsLoaded, settingsUserId]);

  const setAdsEnabled = async (nextValue: boolean) => {
    setAdsEnabledState(nextValue);
    if (!supabase || !session) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: session.user.id, ads_enabled: nextValue }, { onConflict: "user_id" });
  };

  const value = useMemo(
    () => ({
      adsEnabled,
      settingsLoaded,
      setAdsEnabled,
    }),
    [adsEnabled, settingsLoaded],
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
