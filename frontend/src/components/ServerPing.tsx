"use client";

import apiClient from "@/lib/apiClient";
import { useEffect } from "react";

export default function ServerPing() {
    useEffect(() => {
        apiClient.get('/health');
    }, []);

    return null;
}
