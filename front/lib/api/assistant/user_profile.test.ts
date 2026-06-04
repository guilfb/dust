import {
  AGENT_PROFILE_METADATA_KEY,
  buildUserProfileContext,
  MAX_AGENT_PROFILE_LENGTH_CHARS,
} from "@app/lib/api/assistant/user_profile";
import { createResourceTest } from "@app/tests/utils/generic_resource_tests";
import { describe, expect, it } from "vitest";

describe("buildUserProfileContext", () => {
  it("returns null when no profile metadata is set", async () => {
    const { authenticator } = await createResourceTest({ role: "admin" });

    expect(await buildUserProfileContext(authenticator)).toBeNull();
  });

  it("returns null when the profile is only whitespace", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(AGENT_PROFILE_METADATA_KEY, "   ", workspace.id);

    expect(await buildUserProfileContext(authenticator)).toBeNull();
  });

  it("wraps the profile content in a <user_profile> block", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(
      AGENT_PROFILE_METADATA_KEY,
      "Always reply in French.",
      workspace.id
    );

    expect(await buildUserProfileContext(authenticator)).toBe(
      "<user_profile>\nAlways reply in French.\n</user_profile>"
    );
  });

  it("truncates content exceeding MAX_AGENT_PROFILE_LENGTH_CHARS", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    const longContent = "x".repeat(MAX_AGENT_PROFILE_LENGTH_CHARS + 1000);
    await user.setMetadata(
      AGENT_PROFILE_METADATA_KEY,
      longContent,
      workspace.id
    );

    const context = await buildUserProfileContext(authenticator);
    if (!context) {
      throw new Error("Expected a user profile context.");
    }

    const inner = context
      .replace("<user_profile>\n", "")
      .replace("\n</user_profile>", "");
    expect(inner.length).toBe(MAX_AGENT_PROFILE_LENGTH_CHARS);
  });
});
