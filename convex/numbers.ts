import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List all numbers for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const numbers = await ctx.db
      .query("numbers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return numbers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Create a new number
export const create = mutation({
  args: {
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("numbers", {
      value: args.value,
      userId,
      createdAt: Date.now(),
    });
  },
});

// Update a number
export const update = mutation({
  args: {
    id: v.id("numbers"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Number not found");
    }
    if (existing.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, {
      value: args.value,
    });
  },
});

// Delete a number
export const remove = mutation({
  args: {
    id: v.id("numbers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Number not found");
    }
    if (existing.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
