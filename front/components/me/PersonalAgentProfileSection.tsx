import { PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS } from "@app/lib/api/assistant/personal_agent_profile";
import {
  usePersonalAgentProfile,
  useUpdatePersonalAgentProfile,
} from "@app/lib/swr/user";
import type { WorkspaceType } from "@app/types/user";
import { Button, Spinner, TextArea } from "@dust-tt/sparkle";
import { useEffect, useState } from "react";

interface PersonalAgentProfileSectionProps {
  owner: WorkspaceType;
}

export function PersonalAgentProfileSection({
  owner,
}: PersonalAgentProfileSectionProps) {
  const { profile, isProfileLoading } = usePersonalAgentProfile({ owner });
  const { updatePersonalAgentProfile } = useUpdatePersonalAgentProfile({
    owner,
  });
  const [localProfile, setLocalProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const isDirty = localProfile !== profile;

  const handleSave = async () => {
    setIsSaving(true);
    await updatePersonalAgentProfile(localProfile);
    setIsSaving(false);
  };

  if (isProfileLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TextArea
        placeholder="E.g. Always reply in French, use bullet points, keep answers concise."
        value={localProfile}
        onChange={(e) => setLocalProfile(e.target.value)}
        maxLength={PERSONAL_AGENT_PROFILE_MAX_LENGTH_CHARS}
        rows={8}
        resize="vertical"
      />
      <div className="flex justify-end">
        <Button
          label="Save"
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
