"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
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

function continentToCzSlug(continent?: string): string {
  const c = (continent || "").toLowerCase();
  if (c.includes("asia")) return "asie";
  if (c.includes("europe")) return "evropa";
  if (c.includes("africa")) return "afrika";
  if (c.includes("oceania") || c.includes("australia")) return "australie";
  if (
    c.includes("north america") ||
    c.includes("south america") ||
    c.includes("america")
  )
    return "amerika";
  if (c.includes("antarctica")) return "antarktida";
  return "svet";
}

export default function PublicWorldMap({
  geojsonUrl = "/countries.json",
}: PublicWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hoveredIdRef = useRef<number | string | null>(null);

  // locale již zaregistrováno výše

  useEffect(() => {
    if (!containerRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}&language=cs`,
      center: [15, 25],
      zoom: 2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // Nepoužíváme 3D/Globe projekci

    map.on("load", async () => {
      const res = await fetch(geojsonUrl);
      if (!res.ok) return;
      const data = await res.json();
      // Normalizace: připojit Somaliland k Somálsku (SOM)
      try {
        if (data && Array.isArray(data.features)) {
          for (const f of data.features as any[]) {
            const p: any = f.properties || {};
            const nameBlob = `${p.NAME || ""} ${p.ADMIN || ""} ${
              p.BRK_NAME || ""
            } ${p.NAME_LONG || ""}`.toLowerCase();
            if (nameBlob.includes("somaliland")) {
              p.ADM0_A3 = "SOM";
              p.ISO_A3 = "SOM";
              p.GU_A3 = "SOM";
              p.SU_A3 = "SOM";
              p.SOV_A3 = "SOM";
              p.NAME = "Somalia";
              p.NAME_LONG = "Somalia";
              p.ADMIN = "Somalia";
            }
          }
        }
      } catch {}

      map.addSource("countries-public", {
        type: "geojson",
        data,
        // V našem GeoJSONu chybí ISO_A2, použijeme stabilní kód ADM0_A3
        promoteId: "ADM0_A3",
      } as any);
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

      const popup = new maplibregl.Popup({
        closeButton: true,
        // Reuse jeden popup bez zavírací prodlevy mezi kliky
        closeOnClick: false,
      });

      const onClick = (e: any) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const props: any = f.properties || {};
        // Získáme název a odvodíme ISO2 buď z alpha-3 kódu, nebo z názvu
        const rawName: string =
          props.NAME_LONG || props.ADMIN || props.NAME || "";
        const code3Candidates: Array<string | undefined> = [
          props.ISO_A3,
          props.GU_A3,
          props.SU_A3,
          props.SOV_A3,
          props.ADM0_A3,
        ];
        const code3 = (code3Candidates.find(
          (c) =>
            typeof c === "string" &&
            /^[A-Z]{3}$/.test(c as string) &&
            c !== "-99"
        ) || "") as string;
        const iso2FromA3 = (countries as any).alpha3ToAlpha2?.(code3);
        const iso2Guess = iso2FromA3 || countries.getAlpha2Code(rawName, "en");
        const iso2 = iso2Guess
          ? (iso2Guess as string).toUpperCase()
          : undefined;
        const czName = iso2 ? countries.getName(iso2, "cs") : undefined;
        const name: string = czName || rawName;
        const continent: string = props.CONTINENT || props.REGION_UN || "";
        const continentSlug = continentToCzSlug(continent);
        const countrySlug = slugify(name);
        const url = `/zeme/${continentSlug}/${countrySlug}`;

        const safeName = name.replace(/</g, "&lt;");
        const flag = iso2
          ? `<span class=\"fi fi-${iso2.toLowerCase()}\" style=\"font-size:20px\"></span>`
          : "";
        const html = `
          <div style=\"min-width:220px\">
            <div style=\"display:flex;align-items:center;gap:8px;margin-bottom:6px\">
              ${flag}
              <div style=\"font-weight:700;font-size:16px\">${safeName}</div>
            </div>
            <a href=\"${url}\" style=\"display:block;color:#16a34a;font-weight:700;text-decoration:none;margin:8px 0\">ZOBRAZIT DETAIL ZEMĚ ▸</a>
            <a href=\"/community\" style=\"display:block;color:#16a34a;font-weight:700;text-decoration:none\">CESTOPISY A REPORTÁŽE ▸</a>
          </div>`;
        // Bez zavírání: přepíšeme obsah a pozici existujícího popupu
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

  return <div ref={containerRef} className="w-full h-[60vh] min-h-[460px]" />;
}
