import Link from "next/link";

/**
 * Global 404 Not Found page
 * This handles cases where no locale is matched
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">
          Page not found
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
