export function getSignInRedirectUrl(value: string | null, origin: string) {
  if (!value) return "/drive";

  try {
    const url = new URL(value, origin);
    const isAppRoute =
      url.pathname === "/drive" || url.pathname.startsWith("/dashboard/");

    if (url.origin !== origin || !isAppRoute) return "/drive";

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/drive";
  }
}
