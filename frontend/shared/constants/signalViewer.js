/**
 * Shared constants for signal viewers - ensures consistent colors across all views
 */
export const CHANNEL_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666',
  '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
];

export function getChannelColor(channelIndex, channelProps = {}) {
  return channelProps[channelIndex]?.color ?? CHANNEL_COLORS[channelIndex % CHANNEL_COLORS.length];
}
