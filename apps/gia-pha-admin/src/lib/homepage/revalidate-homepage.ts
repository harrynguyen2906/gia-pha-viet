export async function revalidateHomepage() {
  const baseUrl = process.env.GIA_PHA_WEB_URL;
  const secret = process.env.REVALIDATION_SECRET;

  if (!baseUrl || !secret) {
    return {
      ok: false,
      skipped: true,
      reason: "Missing GIA_PHA_WEB_URL or REVALIDATION_SECRET",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/api/revalidate/homepage`, {
      method: "POST",
      headers: {
        "x-revalidation-secret": secret,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, skipped: false, reason: text || response.statusText };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    return { ok: false, skipped: false, reason: String(error) };
  }
}
