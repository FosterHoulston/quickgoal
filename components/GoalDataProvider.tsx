"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Category, Goal } from "@/lib/types";

type GoalDataContextValue = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  categoriesLoaded: boolean;
  setCategoriesLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  categoriesFromDb: boolean;
  setCategoriesFromDb: React.Dispatch<React.SetStateAction<boolean>>;
  categoriesUserId: string | null;
  setCategoriesUserId: React.Dispatch<React.SetStateAction<string | null>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  goalsLoaded: boolean;
  setGoalsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  goalsUserId: string | null;
  setGoalsUserId: React.Dispatch<React.SetStateAction<string | null>>;
};

const GoalDataContext = createContext<GoalDataContextValue | null>(null);

type GoalDataProviderProps = {
  children: React.ReactNode;
};

export function GoalDataProvider({ children }: GoalDataProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesFromDb, setCategoriesFromDb] = useState(false);
  const [categoriesUserId, setCategoriesUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [goalsUserId, setGoalsUserId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      categories,
      setCategories,
      categoriesLoaded,
      setCategoriesLoaded,
      categoriesFromDb,
      setCategoriesFromDb,
      categoriesUserId,
      setCategoriesUserId,
      goals,
      setGoals,
      goalsLoaded,
      setGoalsLoaded,
      goalsUserId,
      setGoalsUserId,
    }),
    [
      categories,
      categoriesLoaded,
      categoriesFromDb,
      categoriesUserId,
      goals,
      goalsLoaded,
      goalsUserId,
    ],
  );

  return <GoalDataContext.Provider value={value}>{children}</GoalDataContext.Provider>;
}

export function useGoalData() {
  const context = useContext(GoalDataContext);
  if (!context) {
    throw new Error("useGoalData must be used within GoalDataProvider");
  }
  return context;
}
