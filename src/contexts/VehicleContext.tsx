"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Vehicle, AnalysisResult } from "@/lib/types";

interface VehicleContextProps {
  vehicle: Vehicle | null;
  setVehicle: (v: Vehicle | null) => void;
  analysis: AnalysisResult | null;
  setAnalysis: (a: AnalysisResult | null) => void;
  historyKey: number;
  triggerHistoryRefresh: () => void;
}

const VehicleContext = createContext<VehicleContextProps | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicle, setVehicleState] = useState<Vehicle | null>(null);
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const storedVehicle = localStorage.getItem("activeVehicle");
      const storedAnalysis = localStorage.getItem("activeAnalysis");
      if (storedVehicle) setVehicleState(JSON.parse(storedVehicle));
      if (storedAnalysis) setAnalysisState(JSON.parse(storedAnalysis));
    } catch (e) {
      console.error("Failed to load vehicle data from LocalStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage on change
  const setVehicle = (v: Vehicle | null) => {
    setVehicleState(v);
    if (v) localStorage.setItem("activeVehicle", JSON.stringify(v));
    else localStorage.removeItem("activeVehicle");
  };

  const setAnalysis = (a: AnalysisResult | null) => {
    setAnalysisState(a);
    if (a) localStorage.setItem("activeAnalysis", JSON.stringify(a));
    else localStorage.removeItem("activeAnalysis");
  };

  const triggerHistoryRefresh = () => {
    setHistoryKey((prev) => prev + 1);
  };

  // Prevent hydration mismatch by rendering children only after loading from localStorage on client.
  if (!isLoaded) return null;

  return (
    <VehicleContext.Provider value={{ vehicle, setVehicle, analysis, setAnalysis, historyKey, triggerHistoryRefresh }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error("useVehicle must be used within a VehicleProvider");
  }
  return context;
}
