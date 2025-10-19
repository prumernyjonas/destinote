"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type CabinClass = "economy" | "premium" | "business" | "first";

type FlightSegment = {
  departureAirport: string; // IATA
  departureTime: string; // ISO
  arrivalAirport: string; // IATA
  arrivalTime: string; // ISO
  airline: string; // code or name
  flightNumber: string;
  aircraft?: string;
  durationMinutes: number;
};

type FlightResult = {
  id: string;
  priceCZK: number;
  totalDurationMinutes: number;
  segments: FlightSegment[];
  baggage: { cabin: boolean; checked: boolean };
  refundable: boolean;
  changeable: boolean;
  co2Kg: number;
  tags?: { cheapest?: boolean; fastest?: boolean; recommended?: boolean };
};

const mockResults: FlightResult[] = [
  {
    id: "r1",
    priceCZK: 2890,
    totalDurationMinutes: 115,
    co2Kg: 120,
    baggage: { cabin: true, checked: false },
    refundable: false,
    changeable: true,
    tags: { cheapest: true, recommended: true },
    segments: [
      {
        departureAirport: "PRG",
        departureTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        arrivalAirport: "BCN",
        arrivalTime: new Date(
          Date.now() + 24 * 3600 * 1000 + 115 * 60000
        ).toISOString(),
        airline: "VY",
        flightNumber: "VY1234",
        aircraft: "A320",
        durationMinutes: 115,
      },
    ],
  },
  {
    id: "r2",
    priceCZK: 4590,
    totalDurationMinutes: 190,
    co2Kg: 210,
    baggage: { cabin: true, checked: true },
    refundable: true,
    changeable: true,
    tags: {},
    segments: [
      {
        departureAirport: "PRG",
        departureTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        arrivalAirport: "FRA",
        arrivalTime: new Date(
          Date.now() + 48 * 3600 * 1000 + 55 * 60000
        ).toISOString(),
        airline: "LH",
        flightNumber: "LH1401",
        aircraft: "A320",
        durationMinutes: 55,
      },
      {
        departureAirport: "FRA",
        departureTime: new Date(
          Date.now() + 48 * 3600 * 1000 + 80 * 60000
        ).toISOString(),
        arrivalAirport: "BCN",
        arrivalTime: new Date(
          Date.now() + 48 * 3600 * 1000 + 80 * 60000 + 110 * 60000
        ).toISOString(),
        airline: "LH",
        flightNumber: "LH1122",
        aircraft: "A321",
        durationMinutes: 110,
      },
    ],
  },
  {
    id: "r3",
    priceCZK: 5190,
    totalDurationMinutes: 160,
    co2Kg: 170,
    baggage: { cabin: true, checked: false },
    refundable: false,
    changeable: false,
    tags: { fastest: true },
    segments: [
      {
        departureAirport: "PRG",
        departureTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        arrivalAirport: "BCN",
        arrivalTime: new Date(
          Date.now() + 72 * 3600 * 1000 + 160 * 60000
        ).toISOString(),
        airline: "OK",
        flightNumber: "OK560",
        aircraft: "B737",
        durationMinutes: 160,
      },
    ],
  },
];

function formatPriceCZK(value: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${m} min`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

export default function FlightsPage() {
  // Search panel state
  const [from, setFrom] = useState("PRG");
  const [to, setTo] = useState("BCN");
  const [roundTrip, setRoundTrip] = useState(true);
  const [departDate, setDepartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [returnDate, setReturnDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState<CabinClass>("economy");

  // Filters and sorting
  const [stopsFilter, setStopsFilter] = useState<
    "any" | "direct" | "max1" | "max2"
  >("any");
  const [maxPrice, setMaxPrice] = useState<number>(() =>
    Math.max(...mockResults.map((r) => r.priceCZK))
  );
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "recommended" | "cheapest" | "fastest" | "depart" | "arrive" | "co2"
  >("recommended");

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const allAirlines = useMemo(() => {
    const set = new Set<string>();
    mockResults.forEach((r) => r.segments.forEach((s) => set.add(s.airline)));
    return Array.from(set).sort();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = mockResults.filter((r) => r.priceCZK <= maxPrice);
    if (stopsFilter !== "any") {
      list = list.filter((r) => {
        const stops = Math.max(0, r.segments.length - 1);
        if (stopsFilter === "direct") return stops === 0;
        if (stopsFilter === "max1") return stops <= 1;
        if (stopsFilter === "max2") return stops <= 2;
        return true;
      });
    }
    if (selectedAirlines.length > 0) {
      list = list.filter((r) =>
        r.segments.some((s) => selectedAirlines.includes(s.airline))
      );
    }

    const by = sortBy;
    list = [...list].sort((a, b) => {
      if (by === "cheapest") return a.priceCZK - b.priceCZK;
      if (by === "fastest")
        return a.totalDurationMinutes - b.totalDurationMinutes;
      if (by === "co2") return a.co2Kg - b.co2Kg;
      if (by === "depart")
        return (
          new Date(a.segments[0].departureTime).getTime() -
          new Date(b.segments[0].departureTime).getTime()
        );
      if (by === "arrive")
        return (
          new Date(a.segments[a.segments.length - 1].arrivalTime).getTime() -
          new Date(b.segments[b.segments.length - 1].arrivalTime).getTime()
        );
      // recommended: price + duration heuristic
      const aScore = a.priceCZK * 0.7 + a.totalDurationMinutes * 3;
      const bScore = b.priceCZK * 0.7 + b.totalDurationMinutes * 3;
      return aScore - bScore;
    });

    return list;
  }, [maxPrice, selectedAirlines, sortBy, stopsFilter]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const resetFilters = () => {
    setStopsFilter("any");
    setMaxPrice(Math.max(...mockResults.map((r) => r.priceCZK)));
    setSelectedAirlines([]);
  };

  const FiltersPanel = (
    <Card className="md:sticky md:top-4" variant="outlined">
      <CardHeader>
        <CardTitle>Filtry</CardTitle>
        <CardDescription>Upřesněte výsledky</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Přestupy</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { v: "any", l: "Libovolně" },
                { v: "direct", l: "Bez přestupu" },
                { v: "max1", l: "Max. 1 přestup" },
                { v: "max2", l: "Max. 2 přestupy" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.v}
                className={`cursor-pointer rounded border px-3 py-2 text-sm ${
                  stopsFilter === opt.v
                    ? "border-green-600 text-green-700 bg-green-50"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="stops"
                  className="hidden"
                  checked={stopsFilter === opt.v}
                  onChange={() => setStopsFilter(opt.v)}
                />
                {opt.l}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900">Max. cena</p>
          <div className="mt-2">
            <input
              type="range"
              min={Math.min(...mockResults.map((r) => r.priceCZK))}
              max={Math.max(...mockResults.map((r) => r.priceCZK))}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-sm text-gray-600">
              {formatPriceCZK(maxPrice)}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900">Aerolinky</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {allAirlines.map((code) => {
              const checked = selectedAirlines.includes(code);
              return (
                <label
                  key={code}
                  className={`cursor-pointer rounded border px-3 py-2 text-sm ${
                    checked
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() =>
                      setSelectedAirlines((prev) =>
                        checked
                          ? prev.filter((a) => a !== code)
                          : [...prev, code]
                      )
                    }
                  />
                  {code}
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowMobileFilters(false)}
        >
          Použít
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letenky</h1>
          <p className="text-gray-600 mt-2">Najděte ideální spojení</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="hidden sm:block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recommended">Doporučené</option>
            <option value="cheapest">Nejlevnější</option>
            <option value="fastest">Nejrychlejší</option>
            <option value="depart">Odlet</option>
            <option value="arrive">Přílet</option>
            <option value="co2">CO₂</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden"
            onClick={() => setShowMobileFilters((v) => !v)}
          >
            Filtry
          </Button>
        </div>
      </div>

      <ErrorMessage error={error} className="mt-4" />

      {/* Search Panel */}
      <section className="mt-6">
        <Card variant="outlined">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Odkud
                </label>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="PRG"
                />
              </div>
              <div className="flex items-end md:items-start md:col-span-0">
                <Button
                  variant="ghost"
                  className="md:mt-5"
                  onClick={handleSwap}
                >
                  ↕︎
                </Button>
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">Kam</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="BCN"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">
                  Odlet
                </label>
                <input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-gray-600 mb-1">
                    Návrat
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={roundTrip}
                      onChange={(e) => setRoundTrip(e.target.checked)}
                    />
                    Zpáteční
                  </label>
                </div>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  disabled={!roundTrip}
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2 flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Cestující
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Třída
                  </label>
                  <select
                    value={cabin}
                    onChange={(e) => setCabin(e.target.value as CabinClass)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-3 flex items-end justify-end gap-2">
                <Button variant="ghost">Uložit hledání</Button>
                <Button variant="primary">Hledat</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Mobile filters */}
      {showMobileFilters && (
        <section className="mt-4 sm:hidden">{FiltersPanel}</section>
      )}

      <section className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Desktop Filters */}
        <div className="hidden md:block md:col-span-3">{FiltersPanel}</div>

        {/* Results */}
        <div className="md:col-span-9">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              {filteredAndSorted.length} výsledků
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Seřadit:</span>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recommended">Doporučené</option>
                <option value="cheapest">Nejlevnější</option>
                <option value="fastest">Nejrychlejší</option>
                <option value="depart">Odlet</option>
                <option value="arrive">Přílet</option>
                <option value="co2">CO₂</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse" variant="outlined">
                  <CardContent className="h-28" />
                </Card>
              ))}
              <div className="flex justify-center mt-6">
                <LoadingSpinner text="Načítání letů…" />
              </div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <Card variant="outlined">
              <CardContent className="py-12 text-center">
                <p className="text-gray-700 font-medium">Žádné výsledky.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Upravte filtry nebo zkuste jiné datum.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSorted.map((r) => {
                const stops = Math.max(0, r.segments.length - 1);
                const depart = r.segments[0].departureTime;
                const arrive = r.segments[r.segments.length - 1].arrivalTime;
                return (
                  <Card key={r.id} variant="outlined">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-7">
                          <div className="flex items-center gap-3">
                            {r.tags?.cheapest && (
                              <span className="rounded bg-green-100 text-green-700 text-xs px-2 py-1">
                                Nejlevnější
                              </span>
                            )}
                            {r.tags?.fastest && (
                              <span className="rounded bg-blue-100 text-blue-700 text-xs px-2 py-1">
                                Nejrychlejší
                              </span>
                            )}
                            {r.tags?.recommended && (
                              <span className="rounded bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                                Doporučeno
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatTime(depart)}
                            </div>
                            <div className="flex-1 h-px bg-gray-200" />
                            <div className="text-lg font-semibold text-gray-900">
                              {formatTime(arrive)}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {stops === 0
                              ? "Přímý let"
                              : `${stops} přestup${
                                  stops === 1 ? "" : stops < 5 ? "y" : "ů"
                                }`}{" "}
                            • {formatDuration(r.totalDurationMinutes)}
                          </div>
                          <button
                            className="mt-2 text-xs text-gray-600 underline"
                            onClick={() =>
                              setExpandedId(expandedId === r.id ? null : r.id)
                            }
                          >
                            {expandedId === r.id
                              ? "Skrýt detaily"
                              : "Zobrazit detaily"}
                          </button>
                          {expandedId === r.id && (
                            <div className="mt-3 space-y-2">
                              {r.segments.map((s, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm text-gray-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                                      {s.airline}
                                    </span>
                                    <span className="font-medium">
                                      {s.departureAirport}{" "}
                                      {formatTime(s.departureTime)}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium">
                                      {s.arrivalAirport}{" "}
                                      {formatTime(s.arrivalTime)}
                                    </span>
                                  </div>
                                  <div className="text-gray-500">
                                    {formatDuration(s.durationMinutes)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPriceCZK(r.priceCZK)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                            {r.baggage.cabin && (
                              <span className="rounded bg-gray-100 px-2 py-0.5">
                                Kabinové
                              </span>
                            )}
                            {r.baggage.checked && (
                              <span className="rounded bg-gray-100 px-2 py-0.5">
                                Odbavené
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {r.refundable
                              ? "Refundovatelné"
                              : "Nerefundovatelné"}{" "}
                            •{" "}
                            {r.changeable
                              ? "Změny povoleny"
                              : "Změny nepovoleny"}
                          </div>
                        </div>
                        <div className="sm:col-span-2 flex sm:flex-col items-end sm:items-stretch gap-2">
                          <Button variant="ghost">Sdílet</Button>
                          <Button variant="primary">Vybrat</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
