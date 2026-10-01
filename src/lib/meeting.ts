export function googleMeetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'meet.google.com' ||
        !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(url.pathname)) return null;
    return `https://meet.google.com${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return null;
  }
}

export function legacyJitsiUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'meet.jit.si' ? url.href : null;
  } catch {
    return null;
  }
}
