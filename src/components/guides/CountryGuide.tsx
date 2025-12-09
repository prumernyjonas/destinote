// src/components/guides/CountryGuide.tsx
import { generateCountryGuide } from "@/lib/ai/generateGuides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Props = {
  name: string;
  iso2?: string;
  continent: string;
};

export default async function CountryGuide({ name, iso2, continent }: Props) {
  const guide = await generateCountryGuide({ name, iso2, continent });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Průvodce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-800">{guide.overview}</p>
          <div>
            <div className="font-semibold text-gray-900 mb-2">Top tipy</div>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {guide.topTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kdy jet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{guide.bestTimeToVisit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bezpečnost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{guide.safety}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Doprava</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{guide.gettingAround}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
