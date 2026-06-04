import { MCPError } from "@app/lib/actions/mcp_errors";
import type { ToolHandlers } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { buildTools } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import {
  AGENT_PROFILE_TOOLS_METADATA,
  RETRIEVE_AGENT_PROFILE_TOOL_NAME,
  UPDATE_AGENT_PROFILE_TOOL_NAME,
} from "@app/lib/api/actions/servers/agent_profile/metadata";
import {
  AGENT_PROFILE_METADATA_KEY,
  MAX_AGENT_PROFILE_LENGTH_CHARS,
} from "@app/lib/api/assistant/user_profile";
import { Err, Ok } from "@app/types/shared/result";

const handlers: ToolHandlers<typeof AGENT_PROFILE_TOOLS_METADATA> = {
  [RETRIEVE_AGENT_PROFILE_TOOL_NAME]: async (_, { auth }) => {
    const user = auth.user();
    if (!user) {
      return new Err(
        new MCPError(
          "No agent profile available as there is no user authenticated."
        )
      );
    }

    const owner = auth.getNonNullableWorkspace();
    const metadata = await user.getMetadata(
      AGENT_PROFILE_METADATA_KEY,
      owner.id
    );
    const content = metadata?.value?.trim();

    return new Ok([
      {
        type: "text" as const,
        text: content && content.length > 0 ? content : "(no agent profile set)",
      },
    ]);
  },

  [UPDATE_AGENT_PROFILE_TOOL_NAME]: async ({ content }, { auth }) => {
    const user = auth.user();
    if (!user) {
      return new Err(
        new MCPError(
          "No agent profile available as there is no user authenticated."
        )
      );
    }

    const owner = auth.getNonNullableWorkspace();
    const capped = content.slice(0, MAX_AGENT_PROFILE_LENGTH_CHARS);
    await user.setMetadata(AGENT_PROFILE_METADATA_KEY, capped, owner.id);

    return new Ok([
      {
        type: "text" as const,
        text: "Agent profile updated.",
      },
    ]);
  },
};

export const TOOLS = buildTools(AGENT_PROFILE_TOOLS_METADATA, handlers);
