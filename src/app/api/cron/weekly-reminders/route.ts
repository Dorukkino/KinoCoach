import { NextRequest, NextResponse } from "next/server";
import { createAdminContainer } from "@/infrastructure/di/container";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const container = createAdminContainer();
  if (!container.sendWeeklyReminder) {
    return NextResponse.json(
      { error: "Weekly reminder not configured" },
      { status: 503 }
    );
  }

  const result = await container.sendWeeklyReminder.execute();
  return NextResponse.json({ ok: true, ...result });
}
