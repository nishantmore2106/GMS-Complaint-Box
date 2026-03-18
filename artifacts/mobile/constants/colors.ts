const primary = "#0B1F3A";
const primaryLight = "#1A3A6B";
const accent = "#2A6FFF";
const accentLight = "#4D8AFF";
const danger = "#E53935";
const warning = "#F59E0B";
const success = "#22C55E";
const surface = "#FFFFFF";
const surfaceSecondary = "#F4F6FB";
const surfaceTertiary = "#E8EDF5";
const border = "#D1D9E6";
const textPrimary = "#0B1F3A";
const textSecondary = "#4A5568";
const textMuted = "#9AA5B4";
const white = "#FFFFFF";

export const Colors = {
  primary,
  primaryLight,
  accent,
  accentLight,
  danger,
  warning,
  success,
  surface,
  surfaceSecondary,
  surfaceTertiary,
  border,
  textPrimary,
  textSecondary,
  textMuted,
  white,
  statusPending: warning,
  statusInProgress: accent,
  statusResolved: success,
};

export default {
  light: {
    text: textPrimary,
    background: surfaceSecondary,
    tint: accent,
    tabIconDefault: textMuted,
    tabIconSelected: accent,
  },
};
