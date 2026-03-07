'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import type { User } from '@/types/auth.type';
import { toast } from 'sonner';

const STORAGE_USER = 'user';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(forceRefresh = false): Promise<User | null> {
    if (typeof window === 'undefined') return null;

    if (!forceRefresh) {
        const stored = localStorage.getItem(STORAGE_USER);
        if (stored) {
            try {
                return JSON.parse(stored) as User;
            } catch {
                localStorage.removeItem(STORAGE_USER);
            }
        }
    }

    const token = apiClient.getAccessToken();
    if (!token) return null;

    try {
        const response = await apiClient.get<{ user: User }>('/auth/me');
        const user = response.user;
        if (user) {
            localStorage.setItem(STORAGE_USER, JSON.stringify(user));
        }
        return user ?? null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        const token = apiClient.getAccessToken();

        if (!token) {
            setUser(null);
            localStorage.removeItem(STORAGE_USER);
            setLoading(false);
            return;
        }

        try {
            const currentUser = await fetchCurrentUser(true);
            setUser(currentUser);
            if (currentUser) {
                apiClient.startTokenRefreshTimer();
            }
        } catch (err) {
            toast.error('Please login again.');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const logout = useCallback(async () => {
        try {
            await apiClient.delete('/auth/signout');
        } catch {

        } finally {
            apiClient.clearTokens();
            localStorage.removeItem(STORAGE_USER);
            setUser(null);
            router.push('/');
        }
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};