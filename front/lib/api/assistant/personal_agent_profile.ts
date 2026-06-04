import type { Authenticator } from "@app/lib/auth";

export const PERSONAL_AGENT_PROFILE_METADATA_KEY = "personalAgentProfile";
export const PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS = 1000;

export async function buildPersonalAgentProfileContext(
  auth: Authenticator
): Promise<string | null> {
  const user = auth.user();
  if (!user) {
    return null;
  }
  const owner = auth.getNonNullableWorkspace();
  const metadata = await user.getMetadata(
    PERSONAL_AGENT_PROFILE_METADATA_KEY,
    owner.id
  );
  const content = metadata?.value?.trim();
  if (!content) {
    return null;
  }
  const capped = content.slice(0, PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS);
  return `<personal_agent_profile>\n${capped}\n</personal_agent_profile>`;
}
