import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

export const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const createServiceClient = () =>
  createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export const getUserFromRequest = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { user: null, error: "Missing Authorization header" };

  const userClient = createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return { user: null, error: error?.message ?? "Unauthenticated" };
  return { user: data.user, error: null };
};

export const userIsAdmin = async (service: ReturnType<typeof createServiceClient>, userId: string) => {
  const { data } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return Boolean(data);
};
