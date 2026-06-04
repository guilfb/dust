import {
  buildPersonalAgentProfileContext,
  PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS,
  PERSONAL_AGENT_PROFILE_METADATA_KEY,
} from "@app/lib/api/assistant/personal_agent_profile";
import { createResourceTest } from "@app/tests/utils/generic_resource_tests";
import { describe, expect, it } from "vitest";

describe("buildPersonalAgentProfileContext", () => {
  it("returns null when no profile metadata is set", async () => {
    const { authenticator } = await createResourceTest({ role: "admin" });

    expect(await buildPersonalAgentProfileContext(authenticator)).toBeNull();
  });

  it("returns null when the profile is only whitespace", async () => {
    const { authenticator } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(PERSONAL_AGENT_PROFILE_METADATA_KEY, "   ");

    expect(await buildPersonalAgentProfileContext(authenticator)).toBeNull();
  });

  it("wraps the profile content in a <personal_agent_profile> block with the guard preamble", async () => {
    const { authenticator } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      "Always reply in French."
    );

    const context = await buildPersonalAgentProfileContext(authenticator);
    if (!context) {
      throw new Error("Expected a user profile context.");
    }

    // The block contains the guard preamble, followed by the user content.
    expect(context).toMatch(/^<personal_agent_profile>\n/);
    expect(context).toMatch(/\n<\/personal_agent_profile>$/);
    // On conflict, the guard instructs the agent to ask the user (via the
    // ask_user_question tool) instead of silently dropping the preference.
    expect(context).toContain("ask_user_question");
    expect(context).toContain("take precedence for the current conversation");
    // On confirmation the preference overrides the agent instructions, but never
    // core safety/system policies.
    expect(context).toContain("authoritative instruction");
    expect(context).toContain("core safety and system policies");
    expect(context).toContain("Always reply in French.");
    // The guard precedes the user content so the model reads the conflict rule
    // before the preferences themselves.
    expect(context.indexOf("ask_user_question")).toBeLessThan(
      context.indexOf("Always reply in French.")
    );
  });

  it("truncates content exceeding PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS", async () => {
    const { authenticator } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    const longContent = "x".repeat(
      PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS + 1000
    );

    await user.setMetadata(PERSONAL_AGENT_PROFILE_METADATA_KEY, longContent);

    const context = await buildPersonalAgentProfileContext(authenticator);
    if (!context) {
      throw new Error("Expected a user profile context.");
    }

    // Only the user-supplied content is capped; the guard preamble is constant
    // and excluded from the limit. Isolate the content as the longest run of
    // consecutive "x" so stray "x" letters in the guard prose don't skew the count.
    const contentLength = Math.max(
      ...(context.match(/x+/g) ?? [""]).map((run) => run.length)
    );
    expect(contentLength).toBe(PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS);
  });

  it("is workspace-agnostic: a profile stored without a workspaceId is read back regardless of the authenticator's workspace", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    // A profile written workspace-scoped must NOT be picked up
    // by the user-scoped read.
    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      "Workspace-scoped profile.",
      workspace.id
    );
    expect(await buildPersonalAgentProfileContext(authenticator)).toBeNull();

    // The user-scoped profile (null workspaceId) is the one that applies.
    await user.setMetadata(
      PERSONAL_AGENT_PROFILE_METADATA_KEY,
      "User-scoped profile."
    );
    const context = await buildPersonalAgentProfileContext(authenticator);
    expect(context).toContain("User-scoped profile.");
    expect(context).not.toContain("Workspace-scoped profile.");
  });
});
