// ─────────────────────────────────────────────────────────────────────────────
// Civic App – Centralized Theme  (CivicFix – Warm Beige / Olive-Brown)
// Only change color values here; never hard-code colors in screen files.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
    // ── Brand ──────────────────────────────────────────────────────────────────
    primary: '#8A7B47',          // Olive-brown accent – buttons, FAB, active icons
    primaryDark: '#6B5E34',      // Darker olive – avatar text, active labels
    primaryLight: '#EDE5C8',     // Very light olive – hover / highlight bg

    // ── Backgrounds ─────────────────────────────────────────────────────────────
    background: '#D6C28A',       // Warm beige / sand main background
    surface: '#F3EBD2',          // Cream card background
    surfaceAlt: '#EDE5C8',       // Secondary surfaces (placeholders, etc.)
    headerBg: '#E5D8B0',         // Top header area – light cream

    // ── Text ────────────────────────────────────────────────────────────────────
    textPrimary: '#1F2937',      // Headings, primary body
    textSecondary: '#6B7280',    // Sub-headings, labels
    textMuted: '#9CA3AF',        // Timestamps, captions

    // ── Borders & Dividers ──────────────────────────────────────────────────────
    border: '#D4C9A0',

    // ── Category Card Pastels ───────────────────────────────────────────────────
    peach: '#F2DDD1',            // Pothole – muted peach
    mint: '#DFF0E7',             // Waste – soft mint
    lightYellow: '#F5EDCC',      // Lighting – pale yellow
    lightBlue: '#DCE8F4',        // Water leak – soft blue

    // ── Status Badges ───────────────────────────────────────────────────────────
    statusPendingBg: '#EDE5C8',
    statusPendingText: '#8A7B47',

    statusInProgressBg: '#F2DDD1',
    statusInProgressText: '#8A6B47',

    statusResolvedBg: '#DFF0E7',
    statusResolvedText: '#059669',

    // ── Timeline / State Dots ───────────────────────────────────────────────────
    timelineDotDone: '#10B981',  // Green for completed steps
    timelineDotPending: '#D4C9A0',
    timelineLine: '#D4C9A0',

    // ── Error / Warning ─────────────────────────────────────────────────────────
    error: '#EF4444',
    errorBg: '#FEE2E2',

    // ── Avatar ──────────────────────────────────────────────────────────────────
    avatarBg: '#EDE5C8',
    avatarText: '#6B5E34',
};

/**
 * Returns the correct status color set for a given status string.
 * Use statusColor(status).bg for the badge background and
 *     statusColor(status).text for the text color.
 */
export function statusColor(status: string): { bg: string; text: string } {
    switch (status) {
        case 'Pending':
            return { bg: colors.statusPendingBg, text: colors.statusPendingText };
        case 'In Progress':
            return { bg: colors.statusInProgressBg, text: colors.statusInProgressText };
        case 'Resolved':
            return { bg: colors.statusResolvedBg, text: colors.statusResolvedText };
        default:
            return { bg: '#E8E0C4', text: colors.textSecondary };
    }
}
