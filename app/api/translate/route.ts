// app/api/translate/route.ts
import { NextResponse } from "next/server";

type Body = { text?: string; target?: string; source?: string };

export async function GET() {
    return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
    try {
        const { text, target, source } = (await req.json()) as Body;

        if (!text || !target) {
            return NextResponse.json(
                { error: "text & target required" },
                { status: 400 }
            );
        }

        const provider = process.env.TRANSLATE_PROVIDER;

        // ========== DeepL ==========
        if (provider === "deepl" && process.env.DEEPL_API_KEY) {
            const params = new URLSearchParams({
                text,
                target_lang: target.toUpperCase(),
            });
            if (source) params.append("source_lang", source.toUpperCase());

            const r = await fetch("https://api-free.deepl.com/v2/translate", {
                method: "POST",
                headers: {
                    Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            const data = await r.json();
            if (!r.ok) {
                return NextResponse.json(
                    { error: data?.message || "DeepL request failed" },
                    { status: 502 }
                );
            }

            const translated = data?.translations?.[0]?.text ?? "";
            return NextResponse.json({ provider: "deepl", translated });
        }

        // ========== OpenAI (fallback/provider) ==========
        if (provider === "openai" && process.env.OPENAI_API_KEY) {
            const prompt = `Translate the following text into ${target}${
                source ? ` from ${source}` : ""
            }. Only return the translation:\n\n${text}`;

            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a translation engine." },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.2,
                }),
            });

            const data = await r.json();
            if (!r.ok) {
                return NextResponse.json(
                    { error: data?.error?.message || "OpenAI request failed" },
                    { status: 502 }
                );
            }

            const translated = data?.choices?.[0]?.message?.content?.trim() ?? "";
            return NextResponse.json({ provider: "openai", translated });
        }

        // ========== No provider configured: echo back ==========
        return NextResponse.json({
            provider: "noop",
            translated: text,
            note:
                "No provider configured. Set TRANSLATE_PROVIDER=deepl or openai in .env.local",
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Unexpected server error" },
            { status: 500 }
        );
    }
}
