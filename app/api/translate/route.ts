// app/api/translate/route.ts
import { NextResponse } from "next/server";

type Body = { text?: string; target?: string; source?: string };

export async function GET() {
    return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
    const { text, target, source } = (await req.json()) as Body;

    if (!text || !target) {
        return NextResponse.json({ error: "text & target required" }, { status: 400 });
    }

    const provider = process.env.TRANSLATE_PROVIDER;

    try {
        if (provider === "deepl" && process.env.DEEPL_API_KEY) {
            const r = await fetch("https://api-free.deepl.com/v2/translate", {
                method: "POST",
                headers: {
                    "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    text,
                    target_lang: target.toUpperCase(), // e.g. ZH/EN/JA
                    ...(source ? { source_lang: source.toUpperCase() } : {}),
                }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.message || "deepl error");
            return NextResponse.json({ translation: data.translations?.[0]?.text ?? "" });
        }

        if (provider === "openai" && process.env.OPENAI_API_KEY) {
            const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
            const prompt =
                `Translate the following text into ${target}. Only output the translation, no explanations.\n\n` +
                text;

            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: "You are a high-quality translation engine." },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0,
                }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error?.message || "openai error");
            const textOut = data.choices?.[0]?.message?.content?.trim() ?? "";
            return NextResponse.json({ translation: textOut });
        }

        // Fallback：没配 Key 时仍然可用
        const fake = `[${target}] ${text.toUpperCase()}`;
        return NextResponse.json({
            translation: fake,
            note: "No provider configured; returned fake translation.",
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "translate failed" }, { status: 500 });
    }
}
