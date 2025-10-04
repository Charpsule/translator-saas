// app/translate/page.tsx
"use client";

import React, { useState } from "react";

type TranslateInput = {
    text: string;
    target: string;
    source?: string;
};

type TranslateResponse = {
    provider: "deepl" | "openai" | "noop" | string;
    translated: string;
    note?: string;
};

type ApiError = { error: string };

const LANGS = [
    { code: "EN", label: "English" },
    { code: "ZH", label: "中文 (Chinese)" },
    { code: "JA", label: "日本語 (Japanese)" },
    { code: "KO", label: "한국어 (Korean)" },
    { code: "FR", label: "Français" },
    { code: "DE", label: "Deutsch" },
    { code: "ES", label: "Español" },
] as const;

function isTranslateResponse(x: unknown): x is TranslateResponse {
    if (typeof x !== "object" || x === null) return false;
    const r = x as Record<string, unknown>;
    return typeof r.provider === "string" && typeof r.translated === "string";
}

// ✅ 这里去掉了显式返回类型 : JSX.Element
export default function TranslatePage() {
    const [text, setText] = useState<string>("");
    const [target, setTarget] = useState<string>("EN");
    const [source, setSource] = useState<string>("");
    const [translated, setTranslated] = useState<string>("");
    const [provider, setProvider] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setTranslated("");
        setProvider("");
        setNote("");

        const payload: TranslateInput = {
            text: text.trim(),
            target: target.trim(),
            source: source.trim() || undefined,
        };

        if (!payload.text) {
            setLoading(false);
            setErrorMsg("Please enter text to translate.");
            return;
        }
        if (!payload.target) {
            setLoading(false);
            setErrorMsg("Please choose a target language.");
            return;
        }

        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data: unknown = await res.json();

            if (!res.ok) {
                const err = data as ApiError;
                setErrorMsg(err?.error || "Translation request failed.");
                return;
            }

            if (!isTranslateResponse(data)) {
                setErrorMsg("Unexpected response from server.");
                return;
            }

            setTranslated(data.translated);
            setProvider(data.provider);
            setNote(data.note ?? "");
        } catch (_err) { // ✅ 变量改为 _err，避免 no-unused-vars
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Translator</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium">Source (optional)</label>
                    <div className="flex gap-3">
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-60 rounded-md border p-2"
                        >
                            <option value="">Auto</option>
                            {LANGS.map((l) => (
                                <option key={l.code} value={l.code}>
                                    {l.label} ({l.code})
                                </option>
                            ))}
                        </select>
                        <span className="self-center text-sm text-gray-500">
              Leave as Auto if unsure.
            </span>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">Target</label>
                    <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-60 rounded-md border p-2"
                    >
                        {LANGS.map((l) => (
                            <option key={l.code} value={l.code}>
                                {l.label} ({l.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">Text</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={6}
                        className="w-full rounded-md border p-3"
                        placeholder="Enter text to translate…"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                    {loading ? "Translating…" : "Translate"}
                </button>
            </form>

            {errorMsg && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {errorMsg}
                </div>
            )}

            {(translated || provider || note) && (
                <section className="space-y-2">
                    <div className="text-sm text-gray-500">
                        {provider && <span>Provider: {provider}</span>}
                        {note && <span className="ml-3">Note: {note}</span>}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Result</label>
                        <textarea
                            readOnly
                            value={translated}
                            rows={6}
                            className="w-full rounded-md border p-3 bg-gray-50"
                        />
                    </div>
                </section>
            )}
        </main>
    );
}
