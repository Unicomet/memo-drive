import { Client } from "@upstash/qstash";
import { env } from "~/env";

export const client = new Client({
  token: env.QSTASH_TOKEN,
});
