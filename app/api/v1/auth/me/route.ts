import { NextResponse } from "next/server";
import { requireActor } from "@/server/auth/sesion";
import { toProblem } from "@/server/http/problem";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    return NextResponse.json({ data: actor });
  } catch (error) {
    return toProblem(error, request);
  }
}
