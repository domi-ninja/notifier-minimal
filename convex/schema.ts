import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Simple demo table for numbers
  numbers: defineTable({
    value: v.number(),
    userId: v.id("users"),
    createdAt: v.number(), // Unix timestamp
  }).index("by_user", ["userId"]),
});
