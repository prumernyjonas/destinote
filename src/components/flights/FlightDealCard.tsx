"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { FlightDeal } from "@/lib/flights/travelpayouts";

type Props = {
  deal: FlightDeal & { buyLink: string };
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FlightDealCard({ deal }: Props) {
  return (
    <Card variant="outlined" className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {deal.origin}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-lg font-bold text-gray-900">
              {deal.destination}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">
              {formatPrice(deal.price)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              orientační cena
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Odlet:</span>
            <span>{formatDate(deal.departuredate)}</span>
          </div>
          {deal.returndate && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Návrat:</span>
              <span>{formatDate(deal.returndate)}</span>
            </div>
          )}
          {deal.airline && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Aerolinka:</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {deal.airline}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <a
          href={deal.buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="primary" className="w-full">
            Koupit na Kiwi
          </Button>
        </a>
        <p className="text-xs text-gray-500 text-center">
          Otevře se Kiwi.com (česky, CZK). Cena je orientační a může se lišit.
        </p>
      </CardFooter>
    </Card>
  );
}

