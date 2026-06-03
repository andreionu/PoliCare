import { openApiSpec } from "@/lib/openapi"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(openApiSpec)
}
