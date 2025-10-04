// app/translate/page.tsx
"use client";

import { useState } from "react";

export default function TranslatePage() {
    const [text, setText] = useState("");
    const [target, setTarget] = useState("zh"); // 目标语言：中文
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function handleTranslate() {
        setErr(null);
        setOut("");
        if (!text.trim()) {
            setErr("请输入要翻译的文本");
            return;
        }
        setLoading(true);
        try {
            const r = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, target }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data?.error || "翻译失败");
            setOut(data.translation || "");
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            handleTranslate();
        }
    }

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">粘贴文本翻译</h1>

            <div className="flex gap-3 items-center">
                <label className="text-sm text-neutral-600">目标语言</label>
                <select
                    className="rounded-md border px-3 py-2"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                >
                    <option value="zh">中文 (zh)</option>
                    <option value="en">英语 (en)</option>
                    <option value="ja">日语 (ja)</option>
                    <option value="ko">韩语 (ko)</option>
                    <option value="de">德语 (de)</option>
                    <option value="fr">法语 (fr)</option>
                </select>
                <button
                    onClick={handleTranslate}
                    disabled={loading}
                    className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
                >
                    {loading ? "翻译中…" : "翻译"}
                </button>
                <span className="text-xs text-neutral-500">快捷键：⌘/Ctrl + Enter</span>
            </div>

            <textarea
                className="w-full h-48 border rounded-lg p-3"
                placeholder="在这里粘贴要翻译的文本…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
            />

            {err && <p className="text-red-600 text-sm">{err}</p>}

            <div className="space-y-2">
                <h2 className="text-lg font-medium">译文</h2>
                <pre className="whitespace-pre-wrap rounded-lg border p-3 min-h-24">
          {out || (loading ? "…" : "（结果会显示在这里）")}
        </pre>
            </div>
        </main>
    );
}
