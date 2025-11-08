import { Redis } from "@upstash/redis";
export const redis = new Redis({
  url: "https://engaged-cub-22125.upstash.io",
  token: "AVZtAAIncDI4YWVkMWE3M2M3ZDE0NzQ4ODNlMjYzNzBjYTU3YmY3OHAyMjIxMjU",
});

await redis.set("foo", "bar");
await redis.get("foo");
