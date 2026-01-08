// src/components/guides/RegionGuide.tsx
import { generateRegionGuide } from "@/lib/ai/generateGuides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Props = {
  regionName: string; // např. "Afrika"
};

export default async function RegionGuide({ regionName }: Props) {
  const guide = await generateRegionGuide({ name: regionName });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Přehled regionu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-800">{guide.overview}</p>
          <div>
            <div className="font-semibold text-gray-900 mb-2">Highlights</div>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {guide.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sezóny</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{guide.bestSeasons}</p>
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
      </div>
    </div>
  );
}
