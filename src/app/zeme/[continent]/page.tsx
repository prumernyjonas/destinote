export default async function ContinentPage({
  params,
}: {
  params: Promise<{ continent: string }>;
}) {
  const { continent } = await params;
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 capitalize">
        {continent.replace(/-/g, " ")}
      </h1>
      <p className="text-gray-600 mt-2">
        Výběr zemí pro kontinent. Obsah bude doplněn.
      </p>
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">
          Zde bude seznam zemí, karty s destinacemi a doporučené články.
        </p>
      </div>
    </main>
  );
}
