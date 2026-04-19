/**
 * ECharts theme helpers for dark/light mode compatibility.
 * Use with ECharts option objects for consistent text and axis styling.
 */

export const isDarkMode = () =>
  typeof document !== 'undefined' && document.documentElement?.getAttribute?.('data-theme-mode') === 'dark';

export const chartTextStyle = () => (isDarkMode() ? { color: 'rgba(255,255,255,0.9)' } : {});

export const axisTheme = () =>
  isDarkMode()
    ? {
        axisLabel: { color: 'rgba(255,255,255,0.8)' },
        nameTextStyle: { color: 'rgba(255,255,255,0.85)' },
      }
    : { axisLabel: {}, nameTextStyle: {} };

/** Apply dark-mode-aware base options to an ECharts option object */
export const withDarkTheme = (option) => {
  if (!option || !isDarkMode()) return option;
  return {
    ...option,
    backgroundColor: option.backgroundColor ?? 'transparent',
    textStyle: { ...chartTextStyle(), ...option.textStyle },
  };
};
