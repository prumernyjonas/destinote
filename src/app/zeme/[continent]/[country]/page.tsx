export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ continent: string; country: string }>;
}) {
  const { continent, country } = await params;
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 capitalize">
        {country.replace(/-/g, " ")}
      </h1>
      <p className="text-gray-600 mt-2">
        Kontinent:{" "}
        <span className="capitalize">{continent.replace(/-/g, " ")}</span>
      </p>
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">
          Veřejný detail země. Sem později doplníme reálný obsah – přehled,
          tipy, letenky a články. Tato stránka nevyžaduje přihlášení.
        </p>
      </div>
    </main>
  );
}
