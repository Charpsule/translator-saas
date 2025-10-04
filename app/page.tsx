// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
      <main className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <h1 className="text-4xl font-bold mb-4">Immersive Translator 🌏</h1>
        <p className="text-neutral-600 mb-8">
          Paste text and instantly translate it with DeepL or OpenAI.
        </p>
        <Link
            href="/translate"
            className="rounded-xl bg-black text-white px-6 py-3 hover:bg-neutral-800 transition"
        >
          Go to Translator →
        </Link>
      </main>
  );
}
