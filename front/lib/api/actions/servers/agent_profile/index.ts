import { makeInternalMCPServer } from "@app/lib/actions/mcp_internal_actions/utils";
import { registerTool } from "@app/lib/actions/mcp_internal_actions/wrappers";
import type { AgentLoopContextType } from "@app/lib/actions/types";
import { AGENT_PROFILE_SERVER_NAME } from "@app/lib/api/actions/servers/agent_profile/metadata";
import { TOOLS } from "@app/lib/api/actions/servers/agent_profile/tools";
import type { Authenticator } from "@app/lib/auth";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function createServer(
  auth: Authenticator,
  agentLoopContext?: AgentLoopContextType
): McpServer {
  const server = makeInternalMCPServer(AGENT_PROFILE_SERVER_NAME);

  // The agent profile is scoped to the current user. Without a user
  // (triggers, scheduled runs, API-key runs, agent-to-agent execution) there is
  // nothing to update, so we expose a single explanatory tool and return early.
  const user = auth.user();

  if (!user) {
    server.tool(
      "profile_not_available",
      "The agent profile is scoped to users but no user is currently authenticated.",
      {},
      async () => {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "No agent profile available as there is no user authenticated.",
            },
          ],
        };
      }
    );
    return server;
  }

  for (const tool of TOOLS) {
    registerTool(auth, agentLoopContext, server, tool, {
      monitoringName: AGENT_PROFILE_SERVER_NAME,
    });
  }

  return server;
}

export default createServer;
