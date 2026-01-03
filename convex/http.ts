import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleWebhook } from "./webhooks";

const http = httpRouter();

// Add auth routes
auth.addHttpRoutes(http);

// Webhook endpoint for receiving external webhook notifications
// POST /webhook - receives and stores webhook payloads
http.route({
  path: "/webhook",
  method: "POST",
  handler: handleWebhook,
});

export default http;
