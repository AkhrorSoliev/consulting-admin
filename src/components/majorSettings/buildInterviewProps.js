import { handleGenerateAndCopyInvite } from "./interviewHandlers";

export default function buildInterviewProps(s, scope) {
  const map = {
    internal: {
      idPrefix: "ms-internal",
      date: s.internalDate, setDate: s.setInternalDate,
      link: s.internalLink, setLink: s.setInternalLink,
      linkType: s.internalLinkType, setLinkType: s.setInternalLinkType,
      locationName: s.internalLocationName,
      setLocationName: s.setInternalLocationName,
      locationUrl: s.internalLocationUrl,
      setLocationUrl: s.setInternalLocationUrl,
      telegramGroupId: s.internalTelegramGroupId,
      setTelegramGroupId: s.setInternalTelegramGroupId,
      telegramLabel: "Telegram group (Ichki)",
    },
    leadership: {
      idPrefix: "ms-leadership",
      date: s.leadershipDate, setDate: s.setLeadershipDate,
      link: s.leadershipLink, setLink: s.setLeadershipLink,
      linkType: s.leadershipLinkType, setLinkType: s.setLeadershipLinkType,
      locationName: s.leadershipLocationName,
      setLocationName: s.setLeadershipLocationName,
      locationUrl: s.leadershipLocationUrl,
      setLocationUrl: s.setLeadershipLocationUrl,
      telegramGroupId: s.leadershipTelegramGroupId,
      setTelegramGroupId: s.setLeadershipTelegramGroupId,
      telegramLabel: "Telegram group (Orif Aka)",
    },
    employer: {
      idPrefix: "ms-employer",
      date: s.employerDate, setDate: s.setEmployerDate,
      link: s.employerLink, setLink: s.setEmployerLink,
      linkType: s.employerLinkType, setLinkType: s.setEmployerLinkType,
      locationName: s.employerLocationName,
      setLocationName: s.setEmployerLocationName,
      locationUrl: s.employerLocationUrl,
      setLocationUrl: s.setEmployerLocationUrl,
      telegramGroupId: s.employerTelegramGroupId,
      setTelegramGroupId: s.setEmployerTelegramGroupId,
      telegramLabel: "Telegram group (Ish beruvchi)",
    },
  };
  const entry = map[scope];
  return {
    ...entry,
    tgGroups: s.tgGroups,
    inviteLoading: s.inviteCopyLoading[scope],
    onGenerateInvite: () =>
      handleGenerateAndCopyInvite(
        entry.telegramGroupId,
        scope,
        s.setInviteCopyLoading,
      ),
    isSaving: s.isSaving,
  };
}
