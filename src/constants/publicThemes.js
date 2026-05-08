export const TOURNAMENT_GROUP_COLORS = [
  {
    soft: "#eff6ff",
    border: "#bfdbfe",
    accent: "#2563eb",
    text: "#1e3a8a",
    publicSoft: "rgba(37,99,235,0.16)",
    publicBorder: "rgba(147,197,253,0.28)",
    publicText: "#bfdbfe",
  },
  {
    soft: "#ecfdf5",
    border: "#a7f3d0",
    accent: "#059669",
    text: "#065f46",
    publicSoft: "rgba(5,150,105,0.16)",
    publicBorder: "rgba(167,243,208,0.28)",
    publicText: "#bbf7d0",
  },
  {
    soft: "#f5f3ff",
    border: "#ddd6fe",
    accent: "#7c3aed",
    text: "#5b21b6",
    publicSoft: "rgba(124,58,237,0.16)",
    publicBorder: "rgba(196,181,253,0.28)",
    publicText: "#ddd6fe",
  },
  {
    soft: "#fff7ed",
    border: "#fed7aa",
    accent: "#ea580c",
    text: "#9a3412",
    publicSoft: "rgba(234,88,12,0.16)",
    publicBorder: "rgba(253,186,116,0.28)",
    publicText: "#fed7aa",
  },
  {
    soft: "#fdf2f8",
    border: "#fbcfe8",
    accent: "#db2777",
    text: "#9d174d",
    publicSoft: "rgba(219,39,119,0.16)",
    publicBorder: "rgba(251,207,232,0.28)",
    publicText: "#fbcfe8",
  },
  {
    soft: "#f0fdfa",
    border: "#99f6e4",
    accent: "#0d9488",
    text: "#115e59",
    publicSoft: "rgba(13,148,136,0.16)",
    publicBorder: "rgba(153,246,228,0.28)",
    publicText: "#99f6e4",
  },
];

export const PUBLIC_THEME_PRESETS = {
  "classic-green": {
    label: { en: "Classic Green", no: "Klassisk grønn" },
    background: "#031f16",
    surface: "#082a20",
    panel: "#0f3d2f",
    primary: "#22c55e",
    accent: "#facc15",
    text: "#ffffff",
    mutedText: "#d7f7e6",
    border: "#22c55e",
  },
  "dark-cup": {
    label: { en: "Dark Cup", no: "Mørk cup" },
    background: "#050816",
    surface: "#101827",
    panel: "#182235",
    primary: "#38bdf8",
    accent: "#c084fc",
    text: "#ffffff",
    mutedText: "#cbd5e1",
    border: "#38bdf8",
  },
  "orange-trophy": {
    label: { en: "Orange Trophy", no: "Oransje trofé" },
    background: "#190a03",
    surface: "#341407",
    panel: "#4a1d09",
    primary: "#f97316",
    accent: "#facc15",
    text: "#fff7ed",
    mutedText: "#fed7aa",
    border: "#fb923c",
  },
  "blue-arena": {
    label: { en: "Blue Arena", no: "Blå arena" },
    background: "#06172e",
    surface: "#0b2447",
    panel: "#123463",
    primary: "#3b82f6",
    accent: "#67e8f9",
    text: "#ffffff",
    mutedText: "#bfdbfe",
    border: "#60a5fa",
  },
  "gold-premium": {
    label: { en: "Gold Premium", no: "Gull premium" },
    background: "#11100a",
    surface: "#1f1b10",
    panel: "#2e2612",
    primary: "#facc15",
    accent: "#fb923c",
    text: "#fffbea",
    mutedText: "#fde68a",
    border: "#eab308",
  },
  "red-black": {
    label: { en: "Red Black", no: "Rød/svart" },
    background: "#120305",
    surface: "#1f080d",
    panel: "#2f1016",
    primary: "#ef4444",
    accent: "#f97316",
    text: "#ffffff",
    mutedText: "#fecaca",
    border: "#f87171",
  },
  "clean-white": {
    label: { en: "Clean White", no: "Ren hvit" },
    background: "#f8fafc",
    surface: "#ffffff",
    panel: "#ffffff",
    primary: "#166534",
    accent: "#2563eb",
    text: "#0f172a",
    mutedText: "#475569",
    border: "#cbd5e1",
  },
  "club-custom": {
    label: { en: "Club Custom", no: "Klubbtilpasset" },
    background: "#08111f",
    surface: "#111827",
    panel: "#1f2937",
    primary: "#22c55e",
    accent: "#3b82f6",
    text: "#ffffff",
    mutedText: "#d1d5db",
    border: "#22c55e",
  },
};


export function getDefaultPublicTheme() {
  return {
    ...PUBLIC_THEME_PRESETS["classic-green"],
    preset: "classic-green",
    mode: "preset",
  };
}

export function getDefaultPublicLiveTheme() {
  return {
    ...PUBLIC_THEME_PRESETS["clean-white"],
    preset: "clean-white",
    mode: "preset",
  };
}

export function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
}

export function normalizePublicTheme(theme) {
  const defaultTheme = getDefaultPublicTheme();
  const incomingTheme = theme || {};
  const themeWithAliases = {
    ...incomingTheme,
    background: incomingTheme.background || incomingTheme.pageBg,
    surface: incomingTheme.surface || incomingTheme.cardBg,
    panel: incomingTheme.panel || incomingTheme.cardBg,
  };
  const presetKey = String(themeWithAliases?.preset || defaultTheme.preset).trim();
  const preset = PUBLIC_THEME_PRESETS[presetKey] || PUBLIC_THEME_PRESETS["classic-green"];
  const merged = {
    ...defaultTheme,
    ...preset,
    ...themeWithAliases,
    preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : defaultTheme.preset,
  };

  [
    "background",
    "surface",
    "panel",
    "primary",
    "accent",
    "text",
    "mutedText",
    "border",
  ].forEach((field) => {
    if (!isValidHexColor(merged[field])) {
      merged[field] = defaultTheme[field];
    }
  });

  return {
    ...merged,
    pageBg: merged.background,
    cardBg: merged.panel,
  };
}

export function normalizePublicLiveTheme(theme) {
  const defaultTheme = getDefaultPublicLiveTheme();
  const incomingTheme = theme || {};
  const themeWithAliases = {
    ...incomingTheme,
    background: incomingTheme.background || incomingTheme.pageBg,
    surface: incomingTheme.surface || incomingTheme.cardBg,
    panel: incomingTheme.panel || incomingTheme.cardBg,
  };
  const presetKey = String(themeWithAliases?.preset || defaultTheme.preset).trim();
  const preset = PUBLIC_THEME_PRESETS[presetKey] || PUBLIC_THEME_PRESETS["clean-white"];
  const merged = {
    ...defaultTheme,
    ...preset,
    ...themeWithAliases,
    preset: PUBLIC_THEME_PRESETS[presetKey] ? presetKey : defaultTheme.preset,
  };

  [
    "background",
    "surface",
    "panel",
    "primary",
    "accent",
    "text",
    "mutedText",
    "border",
  ].forEach((field) => {
    if (!isValidHexColor(merged[field])) {
      merged[field] = defaultTheme[field];
    }
  });

  return {
    ...merged,
    pageBg: merged.background,
    cardBg: merged.panel,
  };
}

export function getPublicThemeStyle(theme) {
  const safeTheme = normalizePublicTheme(theme);

  return {
    "--public-bg": safeTheme.background,
    "--public-surface": safeTheme.surface,
    "--public-panel": safeTheme.panel,
    "--public-primary": safeTheme.primary,
    "--public-accent": safeTheme.accent,
    "--public-text": safeTheme.text,
    "--public-muted": safeTheme.mutedText,
    "--public-border": safeTheme.border,
  };
}

export function hexToRgba(hex, alpha = 1) {
  const safeHex = String(hex || "").trim();
  if (!isValidHexColor(safeHex)) return `rgba(15,23,42,${alpha})`;

  const normalized = safeHex.slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

export function getTournamentPublicCardTheme(tournament) {
  return normalizePublicTheme({
    background: tournament?.themeColor,
    primary: tournament?.themeColor,
    accent: tournament?.accentColor,
    ...(tournament?.publicTheme || {}),
  });
}

export function getTournamentPublicLogoUrl(tournament) {
  return String(tournament?.publicLogoUrl || "").trim();
}

export function getTournamentPublicCardImageUrl(tournament) {
  return String(
    tournament?.publicCardBackgroundUrl ||
      tournament?.publicCardImageUrl ||
      tournament?.posterImageUrl ||
      ""
  ).trim();
}

export function getTournamentPublicOrganizerName(tournament) {
  return String(
    tournament?.organizerName || tournament?.publicOrganizerName || ""
  ).trim();
}

export function getTournamentPublicLiveTheme(tournament) {
  const storedTheme = tournament?.publicLiveTheme || {};
  const cardColor = tournament?.publicLiveCardColor || storedTheme.panel;

  return normalizePublicLiveTheme({
    ...storedTheme,
    background:
      tournament?.publicLivePageBackground ||
      storedTheme.background ||
      storedTheme.pageBg,
    surface: cardColor || storedTheme.surface || storedTheme.cardBg,
    panel: cardColor || storedTheme.panel || storedTheme.cardBg,
    primary: tournament?.publicLivePrimaryColor || storedTheme.primary,
    accent: tournament?.publicLiveAccentColor || storedTheme.accent,
    text: tournament?.publicLiveTextColor || storedTheme.text,
  });
}

export function getTournamentPublicLiveLogoUrl(tournament) {
  return String(tournament?.publicLiveLogoUrl || "").trim();
}

export function getTournamentPublicLiveBackgroundUrl(tournament) {
  return String(tournament?.publicLiveBackgroundUrl || "").trim();
}

export function getPublicCardThemeStyle(theme, imageUrl = "") {
  const safeTheme = normalizePublicTheme(theme);
  const backgroundLayer = imageUrl
    ? `linear-gradient(135deg, ${hexToRgba(safeTheme.background, 0.90)}, ${hexToRgba(
        safeTheme.panel,
        0.84
      )}), url(${imageUrl})`
    : `radial-gradient(circle at 16% 8%, ${hexToRgba(
        safeTheme.accent,
        0.18
      )}, transparent 34%), linear-gradient(145deg, ${safeTheme.background}, ${
        safeTheme.panel
      } 74%)`;

  return {
    "--card-bg": safeTheme.background,
    "--card-panel": safeTheme.panel,
    "--card-primary": safeTheme.primary,
    "--card-accent": safeTheme.accent,
    "--card-text": safeTheme.text,
    "--card-muted": safeTheme.mutedText,
    "--card-border": safeTheme.border,
    background: backgroundLayer,
    backgroundSize: imageUrl ? "cover" : undefined,
    backgroundPosition: imageUrl ? "center" : undefined,
    borderColor: safeTheme.border,
    color: safeTheme.text,
  };
}

