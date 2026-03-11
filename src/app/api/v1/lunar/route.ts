import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

// Uses lunar-javascript package — lightweight, no network calls
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Lunar = require("lunar-javascript");

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;

  const url = req.nextUrl;
  const dateStr = url.searchParams.get("date");

  if (!dateStr) return err("?date=YYYY-MM-DD required", 422);

  const parts = dateStr.split("-");
  if (parts.length !== 3) return err("Invalid date format. Use YYYY-MM-DD", 422);

  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    return err("Invalid date", 422);
  }

  try {
    const solar = Lunar.Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();

    return ok({
      solar: { year: y, month: m, day: d },
      lunar: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        isLeapMonth: lunar.isLeapMonth(),
        yearInGanZhi: lunar.getYearInGanZhi(),
        monthInGanZhi: lunar.getMonthInGanZhi(),
        dayInGanZhi: lunar.getDayInGanZhi(),
        yearInChinese: lunar.getYearInChinese(),
        monthInChinese: lunar.getMonthInChinese(),
        dayInChinese: lunar.getDayInChinese(),
        festivals: lunar.getFestivals(),
        solarTerms: solar.getTerms(),
      },
    });
  } catch {
    return err("Failed to convert date", 500);
  }
}
