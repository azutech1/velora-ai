type SupabaseFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseRestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = typeof window === "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

  if (!url || !anonKey) {
    return null;
  }

  const supabaseUrl = url;
  const supabaseKey = serviceRoleKey || anonKey;

  async function request<T>(path: string, options: SupabaseFetchOptions = {}) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method: options.method ?? "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Supabase request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  }

  return { request };
}
