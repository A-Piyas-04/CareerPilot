const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type ServerApiOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>;
};

export async function serverApiRequest<T>(
  path: string,
  options: ServerApiOptions & { accessToken: string },
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${options.accessToken}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String(data.detail)
        : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}
