// components/dashboard/BadgesGrid.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/types/database";

interface BadgesGridProps {
  badges: Badge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moje odznaky</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.length === 0 ? (
            <p className="text-gray-500 text-center py-8 col-span-full">
              Zatím nemáte žádné odznaky.
            </p>
          ) : (
            badges.map((badge) => (
              <div
                key={badge.id}
                className={`text-center p-4 border rounded-lg ${
                  badge.earnedAt ? "" : "opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h3 className="font-medium text-gray-900">{badge.name}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
                <div className="mt-2">
                  {badge.earnedAt ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Získáno
                    </span>
                  ) : (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      Progres: {badge.progress || 0}%
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
