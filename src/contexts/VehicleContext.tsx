"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Vehicle, AnalysisResult } from "@/lib/types";
import { kvGet, kvSet } from "@/lib/kv-client";

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

  // Load from KV (Upstash Redis) on mount — then persist to localStorage
  useEffect(() => {
    async function load() {
      try {
        const storedVehicle = await kvGet<Vehicle>("activeVehicle");
        const storedAnalysis = await kvGet<AnalysisResult>("activeAnalysis");
        if (storedVehicle) setVehicleState(storedVehicle);
        if (storedAnalysis) setAnalysisState(storedAnalysis);
      } catch (e) {
        console.error("Failed to load vehicle data from KV:", e);
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  // Save to KV + localStorage on change
  const setVehicle = (v: Vehicle | null) => {
    setVehicleState(v);
    kvSet("activeVehicle", v);
  };

  const setAnalysis = (a: AnalysisResult | null) => {
    setAnalysisState(a);
    kvSet("activeAnalysis", a);
  };

  const triggerHistoryRefresh = () => {
    setHistoryKey((prev) => prev + 1);
  };

  // Prevent hydration mismatch by rendering children only after loading on client.
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
