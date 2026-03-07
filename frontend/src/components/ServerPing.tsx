"use client";

import { useEffect } from "react";

export default function ServerPing() {
    useEffect(() => {
        // Silently ping the backend health endpoint to wake it up
        // This assumes your backend URL is set here or falls back to localhost
        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9090";
        fetch(`${apiUrl}/health`, { method: "GET" })
            .catch(() => { });
    }, []);

    return null;
}
