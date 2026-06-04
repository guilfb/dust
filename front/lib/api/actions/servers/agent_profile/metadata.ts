import type { ServerMetadata } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { createToolsRecord } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { MAX_AGENT_PROFILE_LENGTH_CHARS } from "@app/lib/api/assistant/user_profile";
import type { JSONSchema7 as JSONSchema } from "json-schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AGENT_PROFILE_SERVER_NAME = "agent_profile" as const;
export const RETRIEVE_AGENT_PROFILE_TOOL_NAME = "retrieve";
export const UPDATE_AGENT_PROFILE_TOOL_NAME = "update_agent_profile";

export const AGENT_PROFILE_TOOLS_METADATA = createToolsRecord({
  [RETRIEVE_AGENT_PROFILE_TOOL_NAME]: {
    description:
      "Retrieve the current user's agent profile: the free-text instructions " +
      "applied to all of their agents.",
    schema: {},
    stake: "never_ask",
    displayLabels: {
      running: "Retrieving agent profile",
      done: "Retrieved agent profile",
    },
  },
  [UPDATE_AGENT_PROFILE_TOOL_NAME]: {
    description:
      "Overwrite the current user's agent profile: free-text instructions " +
      "(applied to all of their agents across every conversation) describing " +
      "how the agents should behave. This fully replaces the existing profile, " +
      `so include everything that should be kept. Capped at ${MAX_AGENT_PROFILE_LENGTH_CHARS} characters.`,
    schema: {
      content: z
        .string()
        .describe(
          "The full new agent profile content. Replaces the existing profile entirely."
        ),
    },
    // High stake so the user must validate before the profile is persisted: it
    // shapes every future agent run and is a persistent prompt-injection vector.
    stake: "high",
    displayLabels: {
      running: "Updating agent profile",
      done: "Updated agent profile",
    },
  },
});

export const AGENT_PROFILE_SERVER = {
  serverInfo: {
    name: AGENT_PROFILE_SERVER_NAME,
    version: "1.0.0",
    description:
      "User-scoped agent profile tools, the instructions applied to all of their agents.",
    authorization: null,
    icon: "ActionDocumentTextIcon",
    documentationUrl: null,
    instructions: null,
  },
  tools: Object.values(AGENT_PROFILE_TOOLS_METADATA).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(z.object(t.schema)) as JSONSchema,
    displayLabels: t.displayLabels,
  })),
  tools_stakes: Object.fromEntries(
    Object.values(AGENT_PROFILE_TOOLS_METADATA).map((t) => [t.name, t.stake])
  ),
} as const satisfies ServerMetadata;
