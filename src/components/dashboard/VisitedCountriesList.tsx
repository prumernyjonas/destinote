import { Button } from "@/components/ui/Button";

type Visited = { iso2: string; name: string };

export function VisitedCountriesList({
  countries,
  onRemove,
}: {
  countries: Visited[];
  onRemove?: (iso2: string) => void;
}) {
  if (!countries || countries.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Zatím žádné navštívené země. Kliknutím na mapu je můžete přidávat.
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {countries.map((c) => (
        <li
          key={c.iso2}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-white"
        >
          <span className="font-medium">{c.name}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(c.iso2)}
              className="text-gray-500 hover:text-red-600 focus:outline-none"
              aria-label={`Odebrat ${c.name}`}
              title={`Odebrat ${c.name}`}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
