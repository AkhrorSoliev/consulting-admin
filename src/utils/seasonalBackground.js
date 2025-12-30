/**
 * Determines the current season based on the month
 * @returns {string} - 'spring', 'summer', 'autumn', or 'winter'
 */
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1

  if (month >= 3 && month <= 5) {
    return "spring";
  } else if (month >= 6 && month <= 8) {
    return "summer";
  } else if (month >= 9 && month <= 11) {
    return "autumn";
  } else {
    return "winter";
  }
}

/**
 * Gets the background image path for the current season
 * @returns {string} - path to the seasonal background image
 */
export function getSeasonalBackgroundPath() {
  const season = getCurrentSeason();
  return `/${season}.jpg`;
}
