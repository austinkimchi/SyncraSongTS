export function display(provider: { provider: string }): string {
  if (!provider || !provider.provider) {
    return "Unknown Provider";
  }

  if (provider.provider === "apple") {
    return "Apple Music";
  } else if (provider.provider === "spotify") {
    return "Spotify";
  }

  return "Unknown Provider";
}
