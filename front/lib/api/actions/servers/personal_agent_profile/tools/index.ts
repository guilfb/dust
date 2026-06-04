import { MCPError } from "@app/lib/actions/mcp_errors";
import type { ToolHandlers } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import { buildTools } from "@app/lib/actions/mcp_internal_actions/tool_definition";
import {
  PERSONAL_AGENT_PROFILE_TOOLS_METADATA,
  RETRIEVE_PERSONAL_AGENT_PROFILE_TOOL_NAME,
  UPDATE_PERSONAL_AGENT_PROFILE_TOOL_NAME,
} from "@app/lib/api/actions/servers/personal_agent_profile/metadata";
import {
  PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS,
  PERSONAL_AGENT_PROFILE_METADATA_KEY,
} from "@app/lib/api/assistant/personal_agent_profile";
import { Err, Ok } from "@app/types/shared/result";

const handlers: ToolHandlers<typeof PERSONAL_AGENT_PROFILE_TOOLS_METADATA> = {
  [RETRIEVE_PERSONAL_AGENT_PROFILE_TOOL_NAME]: async (_, { auth }) => {
    const user = auth.user();
    if (!user) {
      return new Err(
        new MCPError(
          "No personal agent profile available as there is no user authenticated."
        )
      );
    }

    const owner = auth.getNonNullableWorkspace();
    const metadata = await user.getMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      owner.id
    );
    const content = metadata?.value?.trim();

    return new Ok([
      {
        type: "text" as const,
        text:
          content && content.length > 0
            ? content
            : "(no personal agent profile set)",
      },
    ]);
  },

  [UPDATE_PERSONAL_AGENT_PROFILE_TOOL_NAME]: async ({ content }, { auth }) => {
    const user = auth.user();
    if (!user) {
      return new Err(
        new MCPError(
          "No personal agent profile available as there is no user authenticated."
        )
      );
    }

    const owner = auth.getNonNullableWorkspace();
    const capped = content.slice(0, PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS);
    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      capped,
      owner.id
    );

    return new Ok([
      {
        type: "text" as const,
        text: "Personal agent profile updated.",
      },
    ]);
  },
};

export const TOOLS = buildTools(
  PERSONAL_AGENT_PROFILE_TOOLS_METADATA,
  handlers
);
