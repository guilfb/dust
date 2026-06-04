import {
  RETRIEVE_AGENT_PROFILE_TOOL_NAME,
  UPDATE_AGENT_PROFILE_TOOL_NAME,
} from "@app/lib/api/actions/servers/agent_profile/metadata";
import { TOOLS } from "@app/lib/api/actions/servers/agent_profile/tools";
import {
  AGENT_PROFILE_METADATA_KEY,
  MAX_AGENT_PROFILE_LENGTH_CHARS,
} from "@app/lib/api/assistant/user_profile";
import type { Authenticator as AuthenticatorType } from "@app/lib/auth";
import { Authenticator } from "@app/lib/auth";
import { createResourceTest } from "@app/tests/utils/generic_resource_tests";
import { describe, expect, it } from "vitest";

function makeExtra(auth: AuthenticatorType) {
  return {
    auth,
    signal: new AbortController().signal,
  } as never;
}

function getTool(name: string) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`${name} tool not found`);
  }
  return tool;
}

function getUpdateTool() {
  return getTool(UPDATE_AGENT_PROFILE_TOOL_NAME);
}

function getRetrieveTool() {
  return getTool(RETRIEVE_AGENT_PROFILE_TOOL_NAME);
}

function firstText(content: { type: string; text?: string }[]): string {
  const item = content[0];
  if (item.type !== "text" || item.text === undefined) {
    throw new Error("Expected a text content item.");
  }
  return item.text;
}

describe("agent_profile update_agent_profile tool", () => {
  it("persists the profile for the current user and workspace", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    const result = await getUpdateTool().handler(
      { content: "Be concise." },
      makeExtra(authenticator)
    );

    expect(result.isOk()).toBe(true);

    const metadata = await user.getMetadata(
      AGENT_PROFILE_METADATA_KEY,
      workspace.id
    );
    expect(metadata?.value).toBe("Be concise.");
  });

  it("caps the persisted content at MAX_AGENT_PROFILE_LENGTH_CHARS", async () => {
    const { authenticator, workspace } = await createResourceTest({
      role: "admin",
    });
    const user = authenticator.user();
    if (!user) {
      throw new Error("Expected an authenticated user.");
    }

    const longContent = "x".repeat(MAX_AGENT_PROFILE_LENGTH_CHARS + 1000);
    const result = await getUpdateTool().handler(
      { content: longContent },
      makeExtra(authenticator)
    );

    expect(result.isOk()).toBe(true);

    const metadata = await user.getMetadata(
      AGENT_PROFILE_METADATA_KEY,
      workspace.id
    );
    expect(metadata?.value?.length).toBe(MAX_AGENT_PROFILE_LENGTH_CHARS);
  });

  it("returns an error when there is no authenticated user", async () => {
    const { workspace } = await createResourceTest({ role: "admin" });
    const noUserAuth = await Authenticator.internalAdminForWorkspace(
      workspace.sId
    );

    const result = await getUpdateTool().handler(
      { content: "Be concise." },
      makeExtra(noUserAuth)
    );

    expect(result.isErr()).toBe(true);
  });
});

describe("agent_profile retrieve tool", () => {
  it("returns the profile previously set for the current user", async () => {
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

    const result = await getRetrieveTool().handler({}, makeExtra(authenticator));

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(firstText(result.value)).toBe("Always reply in French.");
    }
  });

  it("returns a placeholder when no profile is set", async () => {
    const { authenticator } = await createResourceTest({ role: "admin" });

    const result = await getRetrieveTool().handler({}, makeExtra(authenticator));

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(firstText(result.value)).toBe("(no agent profile set)");
    }
  });

  it("returns an error when there is no authenticated user", async () => {
    const { workspace } = await createResourceTest({ role: "admin" });
    const noUserAuth = await Authenticator.internalAdminForWorkspace(
      workspace.sId
    );

    const result = await getRetrieveTool().handler({}, makeExtra(noUserAuth));

    expect(result.isErr()).toBe(true);
  });
});
