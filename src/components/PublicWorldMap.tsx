"use client";

import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";

// Registrace českého locale pro i18n-iso-countries (provedeno jednou při načtení modulu)
try {
  countries.registerLocale(cs as any);
} catch {}

type PublicWorldMapProps = {
  geojsonUrl?: string;
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mapování ISO2 kódu na český slug kontinentu
const countryToContinentSlug: Record<string, string> = {
  // Evropa
  AL: "evropa",
  AD: "evropa",
  AT: "evropa",
  BY: "evropa",
  BE: "evropa",
  BA: "evropa",
  BG: "evropa",
  HR: "evropa",
  CY: "evropa",
  CZ: "evropa",
  DK: "evropa",
  EE: "evropa",
  FI: "evropa",
  FR: "evropa",
  DE: "evropa",
  GR: "evropa",
  HU: "evropa",
  IS: "evropa",
  IE: "evropa",
  IT: "evropa",
  XK: "evropa",
  LV: "evropa",
  LI: "evropa",
  LT: "evropa",
  LU: "evropa",
  MT: "evropa",
  MD: "evropa",
  MC: "evropa",
  ME: "evropa",
  NL: "evropa",
  MK: "evropa",
  NO: "evropa",
  PL: "evropa",
  PT: "evropa",
  RO: "evropa",
  RU: "evropa",
  SM: "evropa",
  RS: "evropa",
  SK: "evropa",
  SI: "evropa",
  ES: "evropa",
  SE: "evropa",
  CH: "evropa",
  UA: "evropa",
  GB: "evropa",
  VA: "evropa",
  // Asie
  AF: "asie",
  AM: "asie",
  AZ: "asie",
  BH: "asie",
  BD: "asie",
  BT: "asie",
  BN: "asie",
  KH: "asie",
  CN: "asie",
  GE: "asie",
  IN: "asie",
  ID: "asie",
  IR: "asie",
  IQ: "asie",
  IL: "asie",
  JP: "asie",
  JO: "asie",
  KZ: "asie",
  KW: "asie",
  KG: "asie",
  LA: "asie",
  LB: "asie",
  MY: "asie",
  MV: "asie",
  MN: "asie",
  MM: "asie",
  NP: "asie",
  KP: "asie",
  OM: "asie",
  PK: "asie",
  PS: "asie",
  PH: "asie",
  QA: "asie",
  SA: "asie",
  SG: "asie",
  KR: "asie",
  LK: "asie",
  SY: "asie",
  TW: "asie",
  TJ: "asie",
  TH: "asie",
  TL: "asie",
  TR: "asie",
  TM: "asie",
  AE: "asie",
  UZ: "asie",
  VN: "asie",
  YE: "asie",
  // Afrika
  DZ: "afrika",
  AO: "afrika",
  BJ: "afrika",
  BW: "afrika",
  BF: "afrika",
  BI: "afrika",
  CV: "afrika",
  CM: "afrika",
  CF: "afrika",
  TD: "afrika",
  KM: "afrika",
  CD: "afrika",
  CG: "afrika",
  CI: "afrika",
  DJ: "afrika",
  EG: "afrika",
  GQ: "afrika",
  ER: "afrika",
  SZ: "afrika",
  ET: "afrika",
  GA: "afrika",
  GM: "afrika",
  GH: "afrika",
  GN: "afrika",
  GW: "afrika",
  KE: "afrika",
  LS: "afrika",
  LR: "afrika",
  LY: "afrika",
  MG: "afrika",
  MW: "afrika",
  ML: "afrika",
  MR: "afrika",
  MU: "afrika",
  MA: "afrika",
  MZ: "afrika",
  NA: "afrika",
  NE: "afrika",
  NG: "afrika",
  RW: "afrika",
  ST: "afrika",
  SN: "afrika",
  SC: "afrika",
  SL: "afrika",
  SO: "afrika",
  ZA: "afrika",
  SS: "afrika",
  SD: "afrika",
  TZ: "afrika",
  TG: "afrika",
  TN: "afrika",
  UG: "afrika",
  ZM: "afrika",
  ZW: "afrika",
  // Severní Amerika
  AG: "severni-amerika",
  BS: "severni-amerika",
  BB: "severni-amerika",
  BZ: "severni-amerika",
  CA: "severni-amerika",
  CR: "severni-amerika",
  CU: "severni-amerika",
  DM: "severni-amerika",
  DO: "severni-amerika",
  SV: "severni-amerika",
  GD: "severni-amerika",
  GT: "severni-amerika",
  HT: "severni-amerika",
  HN: "severni-amerika",
  JM: "severni-amerika",
  MX: "severni-amerika",
  NI: "severni-amerika",
  PA: "severni-amerika",
  KN: "severni-amerika",
  LC: "severni-amerika",
  VC: "severni-amerika",
  TT: "severni-amerika",
  US: "severni-amerika",
  PR: "severni-amerika",
  GL: "severni-amerika",
  // Jižní Amerika
  AR: "jizni-amerika",
  BO: "jizni-amerika",
  BR: "jizni-amerika",
  CL: "jizni-amerika",
  CO: "jizni-amerika",
  EC: "jizni-amerika",
  GY: "jizni-amerika",
  PY: "jizni-amerika",
  PE: "jizni-amerika",
  SR: "jizni-amerika",
  UY: "jizni-amerika",
  VE: "jizni-amerika",
  FK: "jizni-amerika",
  // Austrálie a Oceánie
  AU: "australie",
  FJ: "australie",
  KI: "australie",
  MH: "australie",
  FM: "australie",
  NR: "australie",
  NZ: "australie",
  PW: "australie",
  PG: "australie",
  WS: "australie",
  SB: "australie",
  TO: "australie",
  TV: "australie",
  VU: "australie",
};

function getContinentSlug(iso2?: string): string {
  if (!iso2) return "svet";
  return countryToContinentSlug[iso2.toUpperCase()] || "svet";
}

export default function PublicWorldMap({
  geojsonUrl = "/countries-hd.json",
}: PublicWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const hoveredIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Nastavení API klíče a jazyka pro MapTiler SDK
    // Trim whitespace, aby se předešlo chybám 403
    const apiKey = (process.env.NEXT_PUBLIC_MAPTILER_KEY || "").trim();
    if (!apiKey) {
      console.error("[PublicWorldMap] NEXT_PUBLIC_MAPTILER_KEY není nastaven!");
      return;
    }
    maptilersdk.config.apiKey = apiKey;

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [15, 25],
      zoom: 2,
      language: "cs", // Čeština pro všechny popisky na mapě
      attributionControl: false,
    });
    mapRef.current = map;

    // Přidání kompaktního attribution
    map.addControl(new maptilersdk.AttributionControl({ compact: true }));

    map.on("load", async () => {
      // Explicitně nastavíme jazyk pro jistotu
      map.setLanguage("cs");

      const res = await fetch(geojsonUrl);
      if (!res.ok) return;
      const data = await res.json();

      // Přidání unique ID pro každý feature (nutné pro feature-state)
      if (data && Array.isArray(data.features)) {
        data.features.forEach((f: any, idx: number) => {
          f.id = idx;
        });
      }

      map.addSource("countries-public", {
        type: "geojson",
        data,
        generateId: false, // Už máme vlastní ID
      });

      map.addLayer({
        id: "countries-public-fill",
        type: "fill",
        source: "countries-public",
        paint: {
          "fill-color": "#9ca3af",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.25,
            0.12,
          ],
          "fill-outline-color": "#93c5fd",
        },
      });

      const popup = new maptilersdk.Popup({
        closeButton: true,
        closeOnClick: false,
      });

      const onClick = (e: any) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const props: any = f.properties || {};

        // Nová struktura dat: ISO3166-1-Alpha-2 a ISO3166-1-Alpha-3
        const rawName: string = props.name || props.NAME || "";
        const iso2Raw = props["ISO3166-1-Alpha-2"] || props.ISO_A2;
        const iso3Raw = props["ISO3166-1-Alpha-3"] || props.ISO_A3;

        let iso2: string | undefined;
        if (iso2Raw && typeof iso2Raw === "string" && iso2Raw.length === 2) {
          iso2 = iso2Raw.toUpperCase();
        } else if (iso3Raw && typeof iso3Raw === "string") {
          iso2 = (countries as any).alpha3ToAlpha2?.(iso3Raw.toUpperCase());
        }

        const czName = iso2 ? countries.getName(iso2, "cs") : undefined;
        const name: string = czName || rawName;
        const continentSlug = getContinentSlug(iso2);
        const countrySlug = slugify(name);
        const url = `/zeme/${continentSlug}/${countrySlug}`;

        const safeName = name.replace(/</g, "&lt;");
        const flag = iso2
          ? `<span class="fi fi-${iso2.toLowerCase()}" style="font-size:20px"></span>`
          : "";
        const html = `
          <div style="min-width:220px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              ${flag}
              <div style="font-weight:700;font-size:16px">${safeName}</div>
            </div>
            <a href="${url}" style="display:block;color:#16a34a;font-weight:700;text-decoration:none;margin:8px 0">ZOBRAZIT DETAIL ZEMĚ ▸</a>
            <a href="/community" style="display:block;color:#16a34a;font-weight:700;text-decoration:none">CESTOPISY A REPORTÁŽE ▸</a>
          </div>`;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      };

      map.on("click", "countries-public-fill", onClick);

      map.on("mousemove", "countries-public-fill", (e: any) => {
        map.getCanvas().style.cursor = "pointer";
        const id = e.features?.[0]?.id as number | string | undefined;
        if (id === undefined) return;
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
          map.setFeatureState(
            { source: "countries-public", id: hoveredIdRef.current },
            { hover: false }
          );
        }
        hoveredIdRef.current = id;
        map.setFeatureState(
          { source: "countries-public", id },
          { hover: true }
        );
      });

      map.on("mouseleave", "countries-public-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: "countries-public", id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [geojsonUrl]);

  return <div ref={containerRef} className="w-full h-[60vh] min-h-115" />;
}
