"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Locale-aware 404 Not Found page
 */
export default function NotFound() {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">
          {t("error.noData")}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          {t("home.title")}
        </Link>
      </div>
    </main>
  );
}
