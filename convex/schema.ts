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

  // Webhooks table for storing received webhook payloads
  webhooks: defineTable({
    // The raw payload received from the webhook
    payload: v.string(),
    // Source identifier (e.g., "github", "stripe", "custom")
    source: v.string(),
    // Status of the webhook processing
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("failed")
    ),
    // Optional error message if processing failed
    errorMessage: v.optional(v.string()),
    // Optional user association (webhooks may not always be user-specific)
    userId: v.optional(v.id("users")),
    // Timestamp when the webhook was received
    receivedAt: v.number(),
    // Timestamp when the webhook was last processed/updated
    processedAt: v.optional(v.number()),
  })
    .index("by_source", ["source"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_received_at", ["receivedAt"]),
});
