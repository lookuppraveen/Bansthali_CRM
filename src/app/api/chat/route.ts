import { requireSession, toResponse } from "@/lib/rbac";
import { ragAnswer } from "@/lib/rag";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional(),
});

export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

    const result = await ragAnswer(parsed.data.message, parsed.data.history ?? []);
    return Response.json(result);
  } catch (err) {
    return toResponse(err);
  }
}
