import { v } from "convex/values";
import {
  httpAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Webhook status type
const webhookStatus = v.union(
  v.literal("pending"),
  v.literal("processed"),
  v.literal("failed")
);

// List all webhooks (optionally filtered by source or status)
export const list = query({
  args: {
    source: v.optional(v.string()),
    status: v.optional(webhookStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let webhooksQuery;

    if (args.source) {
      webhooksQuery = ctx.db
        .query("webhooks")
        .withIndex("by_source", (q) => q.eq("source", args.source!));
    } else if (args.status) {
      webhooksQuery = ctx.db
        .query("webhooks")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      webhooksQuery = ctx.db
        .query("webhooks")
        .withIndex("by_received_at");
    }

    const webhooks = await webhooksQuery.collect();

    // Sort by receivedAt descending (most recent first)
    const sorted = webhooks.sort((a, b) => b.receivedAt - a.receivedAt);

    // Apply limit if specified
    if (args.limit && args.limit > 0) {
      return sorted.slice(0, args.limit);
    }

    return sorted;
  },
});

// Get a single webhook by ID
export const get = query({
  args: {
    id: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(args.id);
  },
});

// Create a new webhook entry (typically called when receiving a webhook)
export const create = mutation({
  args: {
    payload: v.string(),
    source: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhooks", {
      payload: args.payload,
      source: args.source,
      status: "pending",
      userId: args.userId,
      receivedAt: Date.now(),
    });
  },
});

// Internal mutation for storing webhooks from HTTP actions (no auth required)
export const storeWebhookInternal = internalMutation({
  args: {
    payload: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhooks", {
      payload: args.payload,
      source: args.source,
      status: "pending",
      receivedAt: Date.now(),
    });
  },
});

// Update webhook status (e.g., after processing)
export const updateStatus = mutation({
  args: {
    id: v.id("webhooks"),
    status: webhookStatus,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Webhook not found");
    }

    const updateData: {
      status: "pending" | "processed" | "failed";
      processedAt: number;
      errorMessage?: string;
    } = {
      status: args.status,
      processedAt: Date.now(),
    };

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.id, updateData);
  },
});

// Delete a webhook
export const remove = mutation({
  args: {
    id: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Webhook not found");
    }

    await ctx.db.delete(args.id);
  },
});

// List webhooks for the current user
export const listByUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by receivedAt descending (most recent first)
    const sorted = webhooks.sort((a, b) => b.receivedAt - a.receivedAt);

    // Apply limit if specified
    if (args.limit && args.limit > 0) {
      return sorted.slice(0, args.limit);
    }

    return sorted;
  },
});

// Get webhook statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const webhooks = await ctx.db.query("webhooks").collect();

    const stats = {
      total: webhooks.length,
      pending: webhooks.filter((w) => w.status === "pending").length,
      processed: webhooks.filter((w) => w.status === "processed").length,
      failed: webhooks.filter((w) => w.status === "failed").length,
    };

    return stats;
  },
});

/**
 * HTTP Action to receive webhook events from external services.
 * This is the main entry point for all incoming webhook notifications.
 *
 * Endpoint: POST /webhook
 *
 * Expected request format:
 * - Content-Type: application/json
 * - Body: JSON payload from the external service
 * - Optional header X-Webhook-Source: identifier for the source service
 *
 * Response:
 * - 200 OK: Webhook received and stored successfully
 * - 400 Bad Request: Invalid JSON payload
 * - 405 Method Not Allowed: Non-POST request
 * - 500 Internal Server Error: Failed to process webhook
 */
export const handleWebhook = httpAction(async (ctx, request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          Allow: "POST",
        },
      }
    );
  }

  try {
    // Extract the source from header or use "unknown"
    const source = request.headers.get("X-Webhook-Source") || "unknown";

    // Parse the JSON body
    let payload: string;
    try {
      const body = await request.text();
      // Validate it's valid JSON by parsing
      JSON.parse(body);
      payload = body;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Store the webhook event in the database using internal mutation
    const webhookId = await ctx.runMutation(
      internal.webhooks.storeWebhookInternal,
      {
        payload,
        source,
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook received successfully",
        webhookId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
