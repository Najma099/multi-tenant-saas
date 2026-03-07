"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { Workspace } from "@/types/workspace.type";
import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
} from "@/lib/workspace.api";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;

  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  setActiveWorkspace: React.Dispatch<React.SetStateAction<Workspace | null>>;
  switchWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<Workspace[]>;
  addWorkspace: (name: string) => Promise<Workspace>;
  renameWorkspace: (id: number, name: string) => Promise<Workspace>;
  removeWorkspace: (id: number) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const refreshWorkspaces = useCallback(async () => {
    const token = apiClient.getAccessToken();
    if (!token) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      const data = await apiClient.get<Workspace[]>("/workspaces");
      setWorkspaces(data);

      if (data.length > 0) {
        const savedId = localStorage.getItem("lastWorkspaceId");
        const found = data.find((w) => w.id.toString() === savedId);


        setActiveWorkspace(found || data[0]);
      } else {
        setActiveWorkspace(null);
      }
      return data;
    } catch (err) {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWorkspace = async (name: string) => {
    try {
      const response = await createWorkspace(name);
      await refreshWorkspaces();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const renameWorkspace = async (id: number, name: string) => {
    try {
      const response = await updateWorkspace(id, name);
      await refreshWorkspaces();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const removeWorkspace = async (id: number,) => {
    try {
      await deleteWorkspace(id);

      if (activeWorkspace?.id === id) {
        localStorage.removeItem("lastWorkspaceId");
      }

      await refreshWorkspaces();
    } catch (error) {
      throw error;
    }
  };

  const switchWorkspace = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem("lastWorkspaceId", workspace.id.toString());
  };

  useEffect(() => {
    if (user) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
    }
  }, [user, refreshWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        setWorkspaces,
        setActiveWorkspace,
        switchWorkspace,
        refreshWorkspaces,
        addWorkspace,
        renameWorkspace,
        removeWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};