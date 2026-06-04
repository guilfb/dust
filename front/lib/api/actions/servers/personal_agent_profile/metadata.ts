import type { ServerMetadata } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { createToolsRecord } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS } from "@app/lib/api/assistant/personal_agent_profile";
import type { JSONSchema7 as JSONSchema } from "json-schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const PERSONAL_AGENT_PROFILE_SERVER_NAME = "personal_agent_profile" as const;
export const RETRIEVE_PERSONAL_AGENT_PROFILE_TOOL_NAME = "retrieve";
export const UPDATE_PERSONAL_AGENT_PROFILE_TOOL_NAME = "update_personal_agent_profile";

export const PERSONAL_AGENT_PROFILE_TOOLS_METADATA = createToolsRecord({
  [RETRIEVE_PERSONAL_AGENT_PROFILE_TOOL_NAME]: {
    description:
      "Retrieve the current user's personal agent profile: the free-text " +
      "instructions applied to all of their agents.",
    schema: {},
    stake: "never_ask",
    displayLabels: {
      running: "Retrieving personal agent profile",
      done: "Retrieved personal agent profile",
    },
  },
  [UPDATE_PERSONAL_AGENT_PROFILE_TOOL_NAME]: {
    description:
      "Overwrite the current user's personal agent profile: free-text " +
      "instructions (applied to all of their agents across every conversation) " +
      "describing how the agents should behave. This fully replaces the existing " +
      `profile, so include everything that should be kept. Capped at ${PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS} characters.`,
    schema: {
      content: z
        .string()
        .describe(
          "The full new personal agent profile content. Replaces the existing profile entirely."
        ),
    },
    // High stake so the user must validate before the profile is persisted: it
    // shapes every future agent run and is a persistent prompt-injection vector.
    stake: "high",
    displayLabels: {
      running: "Updating personal agent profile",
      done: "Updated personal agent profile",
    },
  },
});

export const PERSONAL_AGENT_PROFILE_SERVER = {
  serverInfo: {
    name: PERSONAL_AGENT_PROFILE_SERVER_NAME,
    version: "1.0.0",
    description:
      "User-scoped personal agent profile tools, the instructions applied to all of their agents.",
    authorization: null,
    icon: "ActionDocumentTextIcon",
    documentationUrl: null,
    instructions: null,
  },
  tools: Object.values(PERSONAL_AGENT_PROFILE_TOOLS_METADATA).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(z.object(t.schema)) as JSONSchema,
    displayLabels: t.displayLabels,
  })),
  tools_stakes: Object.fromEntries(
    Object.values(PERSONAL_AGENT_PROFILE_TOOLS_METADATA).map((t) => [t.name, t.stake])
  ),
} as const satisfies ServerMetadata;
