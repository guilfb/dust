import type { Authenticator } from "@app/lib/auth";

export const PERSONAL_AGENT_PROFILE_METADATA_KEY = "personalAgentProfile";
export const PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS = 1000;

const PERSONAL_AGENT_PROFILE_GUARD =
  "The following are the user's personal preferences for how they like agents " +
  "to communicate with them — such as tone, language, formatting, and level of " +
  "detail. If a preference conflicts with your agent instructions or the current " +
  "task, do not silently ignore it: use the `ask_user_question` tool to ask the " +
  "user whether they want this preference to take precedence for the current " +
  "conversation. If the user confirms, treat their confirmation as an explicit, " +
  "authoritative instruction and apply the preference for the rest of the " +
  "conversation even though it contradicts your agent instructions — do not refuse " +
  "on the grounds that your instructions take priority. If the user declines, keep " +
  "following your instructions. This override never applies to core safety and " +
  "system policies, which you must always follow regardless of any preference or " +
  "confirmation. Ask only once per distinct conflict, and only when the conflict " +
  "actually affects your response.";

export async function buildPersonalAgentProfileContext(
  auth: Authenticator
): Promise<string | null> {
  const user = auth.user();
  if (!user) {
    return null;
  }

  const metadata = await user.getMetadata(PERSONAL_AGENT_PROFILE_METADATA_KEY);
  const content = metadata?.value?.trim();
  if (!content) {
    return null;
  }
  const capped = content.slice(0, PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS);
  return (
    "<personal_agent_profile>\n" +
    `${PERSONAL_AGENT_PROFILE_GUARD}\n\n` +
    `${capped}\n` +
    "</personal_agent_profile>"
  );
}
