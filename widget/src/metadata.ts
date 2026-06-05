export interface WidgetMetadata {
  browser: string;
  browserVersion: string;
  os: string;
  device: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  metadata: Record<string, unknown>;
}

export function collectMetadata(): WidgetMetadata {
  const ua = navigator.userAgent;
  const browserMatch =
    ua.match(/Edg\/([\d.]+)/) ??
    ua.match(/Chrome\/([\d.]+)/) ??
    ua.match(/Firefox\/([\d.]+)/) ??
    ua.match(/Version\/([\d.]+).*Safari/);
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Unknown";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : ua.includes("Linux")
            ? "Linux"
            : "Unknown";
  const device = /Tablet|iPad/i.test(ua) ? "Tablet" : /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";

  return {
    browser,
    browserVersion: browserMatch?.[1] ?? "",
    os,
    device,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pageUrl: window.location.href,
    referrer: document.referrer,
    userAgent: ua,
    metadata: { timestamp: new Date().toISOString(), language: navigator.language },
  };
}
