import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

export function initApi() {
  // Use VITE_API_URL env var when deployed (e.g. on Vercel pointing to Render backend)
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    setBaseUrl(apiUrl.replace(/\/$/, ""));
  }

  setAuthTokenGetter(() => {
    return localStorage.getItem("token");
  });
}
