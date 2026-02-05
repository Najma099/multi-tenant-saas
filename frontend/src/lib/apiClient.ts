import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface BackendResponse<T> {
  statusCode: string;
  message: string;
  success: boolean;
  data: T;
}

function getAccessTokenExpiryMs(accessToken: string): number | null {
  try {
    const [, payload] = accessToken.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const decoded = JSON.parse(json) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedRequestsQueue: Array<(token: string) => void> = [];
  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly REFRESH_BEFORE_MS = 60 * 1000;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });
    this.setupInterceptors();
  }

  public getAccessToken = () => localStorage.getItem("accessToken");
  public getRefreshToken = () => localStorage.getItem("refreshToken");

 public setTokens(tokens: Tokens): void {
  console.log("Setting tokens:", tokens);
  if (tokens.accessToken) localStorage.setItem("accessToken", tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
  this.startTokenRefreshTimer();
}

  public clearTokens(): void {
    this.stopTokenRefreshTimer();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  public startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();
    const token = this.getAccessToken();
    if (!token) return;

    const expMs = getAccessTokenExpiryMs(token);
    if (!expMs) return;

    const delay = expMs - Date.now() - this.REFRESH_BEFORE_MS;

    if (delay <= 0) {
      void this.refreshAccessToken();
      return;
    }

    this.refreshTimerId = setTimeout(() => {
      this.refreshTimerId = null;
      void this.refreshAccessToken();
    }, delay);
  }

  public stopTokenRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  private async refreshAccessToken(): Promise<string> {
  const refreshToken = this.getRefreshToken();
  const expiredToken = this.getAccessToken();

  try {
    // res.data will be { statusCode, message, data: { accessToken, refreshToken } }
    const res = await axios.post(`${API_BASE_URL}/auth/token/refresh`, 
      { refreshToken },
      { headers: { Authorization: `Bearer ${expiredToken}` } }
    );

    //console.log("Refresh API raw response:", res.data);

    const newTokens = res.data.data; 
    
    if (!newTokens || !newTokens.accessToken) {
      throw new Error("Tokens missing in refresh response");
    }

    this.setTokens(newTokens);
    //console.log("Tokens successfully updated in storage");
    
    return newTokens.accessToken;
  } catch (err) {
    //console.error("Refresh failed, clearing and redirecting", err);
    this.clearTokens();
    // Redirect to root "/" to avoid the 404 on "/signin"
    if (typeof window !== "undefined") window.location.href = "/";
    throw err;
  }
}

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const original = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !original._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.failedRequestsQueue.push((token) => {
                original.headers!.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(original));
              });
            });
          }

          original._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.failedRequestsQueue.forEach((cb) => cb(newToken));
            this.failedRequestsQueue = [];
            return this.axiosInstance(original);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Generalized request handler to unwrap the "data" field
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const res = await this.axiosInstance.request<BackendResponse<T>>(config);
    return res.data.data;
  }

  public get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ ...config, method: "GET", url });
  }

  public post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig) {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  public delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ ...config, method: "DELETE", url });
  }
}

const apiClient = new ApiClient();
export default apiClient;