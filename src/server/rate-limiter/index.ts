import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../subscriptions/store";

// Create a new ratelimiter
export const ratelimit = {
  free: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:free",
    limiter: Ratelimit.slidingWindow(10, "10s"),
  }),
  paid: new Ratelimit({
    redis,
    analytics: true,
    prefix: "ratelimit:paid",
    limiter: Ratelimit.slidingWindow(2, "100s"),
  }),
};
