import { NextResponse } from "next/server";
import { generationSchema } from "@/app/utils/schema";
import { runAgent } from "@/app/utils/newsAgent";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = generationSchema.parse(payload);
    const result = await runAgent(parsed);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent failure", error);
    if ((error as { name?: string }).name === "ZodError") {
      return NextResponse.json({ error: "Invalid request. Please review the form inputs." }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We couldn\'t assemble anything fresh for that topic. Try again in a moment."
      },
      { status: 500 }
    );
  }
}
