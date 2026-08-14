import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/lib/env";
import { type Database } from "@/shared/types/database";

/** Client do browser. É por ele que passam as leituras, escritas e o realtime. */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
