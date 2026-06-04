import type { Authenticator } from "@app/lib/auth";

export const AGENT_PROFILE_METADATA_KEY = "agentProfile";
export const MAX_AGENT_PROFILE_LENGTH_CHARS = 1000;

export async function buildUserProfileContext(
  auth: Authenticator
): Promise<string | null> {
  const user = auth.user();
  if (!user) {
    return null;
  }
  const owner = auth.getNonNullableWorkspace();
  const metadata = await user.getMetadata(AGENT_PROFILE_METADATA_KEY, owner.id);
  const content = metadata?.value?.trim();
  if (!content) {
    return null;
  }
  const capped = content.slice(0, MAX_AGENT_PROFILE_LENGTH_CHARS);
  return `<user_profile>\n${capped}\n</user_profile>`;
}
