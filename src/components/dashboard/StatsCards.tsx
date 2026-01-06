// components/dashboard/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { UserStats } from "@/types/database";

interface StatsCardsProps {
  stats: UserStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moje cestovatelské statistiky</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg cursor-pointer">
            <div className="text-2xl font-bold text-green-600">
              {stats?.countriesVisited || 0}
            </div>
            <div className="text-sm text-gray-600">Navštívené země</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.continentsVisited || 0}
            </div>
            <div className="text-sm text-gray-600">Kontinenty</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.badgesEarned || 0}
            </div>
            <div className="text-sm text-gray-600">Odznaky</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer">
            <div className="text-2xl font-bold text-orange-600">
              Level {stats?.level || 1}
            </div>
            <div className="text-sm text-gray-600">Cestovatel</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
