"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import FlightDealCard from "./FlightDealCard";
import type { FlightDeal } from "@/lib/flights/travelpayouts";

type Props = {
  origin?: string;
  limit?: number;
  showTitle?: boolean;
};

type ApiResponse = {
  deals: (FlightDeal & { buyLink: string })[];
  updatedAt: string | null;
  provider?: "kiwi" | "aviasales";
  filteredOut?: number;
};

export default function FlightsWidget({
  origin = "PRG",
  limit = 12,
  showTitle = true,
}: Props) {
  const [deals, setDeals] = useState<(FlightDeal & { buyLink: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDeals() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          origin,
          limit: limit.toString(),
          provider: "kiwi",
          validate: "1",
        });

        const res = await fetch(`/api/flights/deals?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error("Nepodařilo se načíst letenky");
        }

        const data: ApiResponse = await res.json();

        if (!cancelled) {
          setDeals(data.deals || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Chyba při načítání letenek");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDeals();

    return () => {
      cancelled = true;
    };
  }, [origin, limit]);

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Letenky z {origin}</CardTitle>
            <CardDescription>Nejlepší nabídky letenek</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner text="Načítání letenek…" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Letenky z {origin}</CardTitle>
            <CardDescription>Nejlepší nabídky letenek</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <ErrorMessage error={error} />
        </CardContent>
      </Card>
    );
  }

  if (deals.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Letenky z {origin}</CardTitle>
            <CardDescription>Nejlepší nabídky letenek</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            Momentálně nejsou k dispozici žádné nabídky letenek.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>Letenky z {origin}</CardTitle>
          <CardDescription>Nejlepší nabídky letenek</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal, index) => (
            <FlightDealCard key={`${deal.origin}-${deal.destination}-${deal.departuredate}-${index}`} deal={deal} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
