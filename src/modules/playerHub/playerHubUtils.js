export function getPlayerHubProfileDefaults() {
  return {
    profileId: "",
    username: "",
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    country: "",
    clubOrTeam: "",
    clubTeamId: "",
    clubTeamName: "",
    teamNote: "",
    profileType: "Player",
    freeAgent: false,
    region: "",
    primaryRole: "",
    secondaryRole: "",
    customRole: "",
    level: "",
    availability: "",
    lookingForTeam: false,
    availableAsSubstitute: false,
    canGuestForTeams: false,
    interestedAbroad: false,
    publicVisible: false,
    approved: false,
    createdAt: "",
    updatedAt: "",
  };
}

export function normalizePlayerHubProfile(profile = {}) {
  const defaults = getPlayerHubProfileDefaults();
  const country = String(profile.country || profile.region || "").trim();
  const teamNote = String(profile.teamNote || profile.clubOrTeam || "").trim();

  return {
    ...defaults,
    ...profile,
    firstName: String(profile.firstName || "").trim(),
    lastName: String(profile.lastName || "").trim(),
    country,
    clubTeamId: String(profile.clubTeamId || "").trim(),
    clubTeamName: String(profile.clubTeamName || "").trim(),
    teamNote,
    clubOrTeam: String(profile.clubOrTeam || teamNote || "").trim(),
    freeAgent: Boolean(profile.freeAgent),
    lookingForTeam: Boolean(profile.lookingForTeam),
    availableAsSubstitute: Boolean(profile.availableAsSubstitute),
    canGuestForTeams: Boolean(profile.canGuestForTeams),
    interestedAbroad: Boolean(profile.interestedAbroad),
    publicVisible: Boolean(profile.publicVisible),
    approved: Boolean(profile.approved),
    profileType:
      String(profile.profileType || "").trim() === "Captain"
        ? "Captain"
        : "Player",
  };
}

export function getPlayerHubProfileTypeOptions() {
  return ["Player", "Captain"];
}

export function getPlayerHubAccessRequestCards() {
  return [
    {
      type: "CAPTAIN",
      title: "Captain",
      description: "Team contact",
      tags: ["Captain", "Team contact"],
    },
    {
      type: "TRAINER",
      title: "Trainer",
      description: "Team Builder",
      tags: ["Trainer", "Team Builder"],
    },
    {
      type: "ORGANIZER",
      title: "Organizer",
      description: "Tournaments",
      tags: ["Organizer", "Tournaments"],
    },
  ];
}
