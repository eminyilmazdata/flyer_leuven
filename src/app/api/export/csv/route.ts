import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COORDINATOR_COOKIE } from "@/lib/constants";
import { verifyCoordinatorToken } from "@/lib/coordinator-token";
import { loadBoardRows } from "@/lib/board";

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const jar = await cookies();
  if (!(await verifyCoordinatorToken(jar.get(COORDINATOR_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await loadBoardRows();
  const header = [
    "street",
    "status",
    "volunteer",
    "reserved_at",
    "completed_at",
  ];
  const lines = rows.map((r) =>
    [
      escapeCsvCell(r.name),
      r.status,
      escapeCsvCell(r.username ?? ""),
      r.reservedAt?.toISOString() ?? "",
      r.completedAt?.toISOString() ?? "",
    ].join(","),
  );
  const body = [header.join(","), ...lines].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="flyer-leuven-streets.csv"',
    },
  });
}
