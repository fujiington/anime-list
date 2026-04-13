import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 space-y-5 text-center">
      <Image
        src="/web-app-manifest-512x512.png"
        alt="AnimeList"
        width={80}
        height={80}
        className="rounded-2xl opacity-60"
      />
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-zinc-600">404</h1>
        <p className="text-zinc-500 text-sm">This page doesn&apos;t exist.</p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white text-sm rounded-lg transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
