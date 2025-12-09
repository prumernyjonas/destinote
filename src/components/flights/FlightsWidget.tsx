// src/components/flights/FlightsWidget.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Props = {
  query: string; // např. název země nebo regionu
};

function buildExternalLinks(query: string) {
  const q = encodeURIComponent(query);
  return [
    {
      name: "Kiwi.com",
      href: `https://www.kiwi.com/cz/hledej?to=${q}`,
    },
    {
      name: "Skyscanner",
      href: `https://www.skyscanner.cz/transport/flights-to/${q}`,
    },
    {
      name: "Google Flights",
      href: `https://www.google.com/travel/flights?q=${q}`,
    },
  ];
}

export default function FlightsWidget({ query }: Props) {
  const links = buildExternalLinks(query);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Letenky</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">
          Rychlé vyhledání letenek pro: <span className="font-semibold">{query}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-green-700 border-green-300 hover:border-green-600 hover:text-green-900 transition"
            >
              {l.name} →
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


