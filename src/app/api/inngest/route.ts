import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { refreshExpiredTokens } from "@/lib/inngest/functions/refresh-tokens";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshExpiredTokens],
});
