import {
  PERSONAL_AGENT_PROFILE_METADATA_KEY,
  buildPersonalAgentProfileContext,
  PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS,
} from "@app/lib/api/assistant/personal_agent_profile";
import { createResourceTest } from "@app/tests/utils/generic_resource_tests";
import { describe, expect, it } from "vitest";

describe("buildPersonalAgentProfileContext", () => {
  it("returns null when no profile metadata is set", async () => {
    const { authenticator } = await createResourceTest({ role: "admin" });

    expect(await buildPersonalAgentProfileContext(authenticator)).toBeNull();
  });

  it("returns null when the profile is only whitespace", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(PERSONAL_AGENT_PROFILE_METADATA_KEY, "   ", workspace.id);

    expect(await buildPersonalAgentProfileContext(authenticator)).toBeNull();
  });

  it("wraps the profile content in a <personal_agent_profile> block", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      "Always reply in French.",
      workspace.id
    );

    expect(await buildPersonalAgentProfileContext(authenticator)).toBe(
      "<personal_agent_profile>\nAlways reply in French.\n</personal_agent_profile>"
    );
  });

  it("truncates content exceeding PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    const longContent = "x".repeat(PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS + 1000);
    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      longContent,
      workspace.id
    );

    const context = await buildPersonalAgentProfileContext(authenticator);
    if (!context) {
      throw new Error("Expected a user profile context.");
    }

    const inner = context
      .replace("<personal_agent_profile>\n", "")
      .replace("\n</personal_agent_profile>", "");
    expect(inner.length).toBe(PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS);
  });
});
