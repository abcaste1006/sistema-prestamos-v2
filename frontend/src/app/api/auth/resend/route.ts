import { NextResponse } from "next/server";
import api from "@/lib/api/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const response = await api.post("/auth/resend-code/", { email });
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || "Error al reenviar código" },
      { status: error.response?.status || 500 },
    );
  }
}
