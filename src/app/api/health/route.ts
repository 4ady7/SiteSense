import { NextResponse } from "next/server";
import { serviceHealth } from "@/domain/health";

export function GET() {
  return NextResponse.json(serviceHealth());
}
