/**
 * Verification test for the webhooks database schema implementation.
 * This test verifies that the Convex schema and functions are correctly defined.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Since this is a Convex backend project, we verify the schema and functions
// are correctly defined by checking the files and running TypeScript compilation

test.describe('Webhooks Database Schema Verification', () => {
  const projectRoot = process.cwd();
  const convexDir = path.join(projectRoot, 'convex');

  test('schema.ts should contain webhooks table definition', async () => {
    const schemaPath = path.join(convexDir, 'schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Verify webhooks table exists
    expect(schemaContent).toContain('webhooks: defineTable');

    // Verify required fields
    expect(schemaContent).toContain('payload: v.string()');
    expect(schemaContent).toContain('source: v.string()');
    expect(schemaContent).toContain('status: v.union');
    expect(schemaContent).toContain('receivedAt: v.number()');

    // Verify status options
    expect(schemaContent).toContain('v.literal("pending")');
    expect(schemaContent).toContain('v.literal("processed")');
    expect(schemaContent).toContain('v.literal("failed")');

    // Verify indexes
    expect(schemaContent).toContain('.index("by_source"');
    expect(schemaContent).toContain('.index("by_status"');
    expect(schemaContent).toContain('.index("by_received_at"');
  });

  test('webhooks.ts should contain CRUD operations', async () => {
    const webhooksPath = path.join(convexDir, 'webhooks.ts');
    const webhooksContent = fs.readFileSync(webhooksPath, 'utf-8');

    // Verify list query exists
    expect(webhooksContent).toContain('export const list = query');

    // Verify get query exists
    expect(webhooksContent).toContain('export const get = query');

    // Verify create mutation exists
    expect(webhooksContent).toContain('export const create = mutation');

    // Verify updateStatus mutation exists
    expect(webhooksContent).toContain('export const updateStatus = mutation');

    // Verify remove mutation exists
    expect(webhooksContent).toContain('export const remove = mutation');

    // Verify listByUser query exists
    expect(webhooksContent).toContain('export const listByUser = query');

    // Verify getStats query exists
    expect(webhooksContent).toContain('export const getStats = query');
  });

  test('webhooks.ts should have proper validation', async () => {
    const webhooksPath = path.join(convexDir, 'webhooks.ts');
    const webhooksContent = fs.readFileSync(webhooksPath, 'utf-8');

    // Verify authentication checks
    expect(webhooksContent).toContain('getAuthUserId(ctx)');
    expect(webhooksContent).toContain('Not authenticated');

    // Verify webhook status type
    expect(webhooksContent).toContain('webhookStatus = v.union');

    // Verify database operations
    expect(webhooksContent).toContain('ctx.db.insert("webhooks"');
    expect(webhooksContent).toContain('ctx.db.patch');
    expect(webhooksContent).toContain('ctx.db.delete');
    expect(webhooksContent).toContain('ctx.db.get');
  });

  test('schema should have proper optional fields', async () => {
    const schemaPath = path.join(convexDir, 'schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Verify optional fields are properly defined
    expect(schemaContent).toContain('errorMessage: v.optional(v.string())');
    expect(schemaContent).toContain('userId: v.optional(v.id("users"))');
    expect(schemaContent).toContain('processedAt: v.optional(v.number())');
  });

  test('TypeScript compilation should pass', async () => {
    // This test verifies TypeScript types are correct
    const { execSync } = require('child_process');

    try {
      execSync('npx tsc --noEmit -p convex/tsconfig.json', {
        cwd: projectRoot,
        stdio: 'pipe'
      });
      expect(true).toBe(true); // TypeScript compilation passed
    } catch (error: any) {
      console.error('TypeScript compilation error:', error.stdout?.toString() || error.stderr?.toString());
      throw new Error('TypeScript compilation failed');
    }
  });
});
