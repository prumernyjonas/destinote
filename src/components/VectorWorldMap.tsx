"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map, GeoJSONSource } from "maplibre-gl";
import { dbUtils } from "@/utils/supabase-db";

type VectorWorldMapProps = {
  userId?: string; // currently signed-in user id (for saving visits)
  onCountrySelected?: (iso: string, name: string) => void; // optional callback
  geojsonUrl?: string; // override GeoJSON path (defaults to /countries.geojson)
};

export default function VectorWorldMap({
  userId,
  onCountrySelected,
  geojsonUrl = "/countries.json",
}: VectorWorldMapProps) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoveredIdRef = useRef<number | string | null>(null);
  const selectedIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}&language=cs`,
      center: [0, 20],
      zoom: 2,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // Bezpečné získání českého názvu regionu z ISO kódu (cache jedné instance DisplayNames)
    let _dn: Intl.DisplayNames | null = null;
    const regionName = (code?: string) => {
      if (!code) return undefined;
      try {
        // Normalizace pár neoficiálních / alternativních kódů z datasetů:
        // FX = Metropolitan France → FR, UK → GB, EL → GR (Řecko), XK = Kosovo (mimo standard, ponecháme)
        const normMap: Record<string, string> = {
          FX: "FR",
          UK: "GB",
          EL: "GR",
        };
        const c = (code || "").toUpperCase();
        const normalized = normMap[c] ?? c;
        _dn = _dn ?? new Intl.DisplayNames(["cs"], { type: "region" });
        let name = _dn.of(normalized) as string | undefined;
        // Bezpečné české fallbacky pro jistotu (kdyby DisplayNames vrátil undefined)
        const csFallbacks: Record<string, string> = {
          FR: "Francie",
          GR: "Řecko",
          GB: "Spojené království",
          XK: "Kosovo",
        };
        if (!name) name = csFallbacks[normalized];
        return name;
      } catch {
        return undefined;
      }
    };

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Přepnout projekci na zeměkouli a přidat atmosférický efekt
    const enableGlobe = () => {
      try {
        const supportsGlobe = typeof (map as any).setProjection === "function";
        if (supportsGlobe) {
          (map as any).setProjection("globe");
          (map as any).setFog?.({
            range: [0.5, 10],
            color: "#dbeafe",
            "horizon-blend": 0.2,
          } as any);
        } else {
          // Explicitní fallback – odstraní varování o neznámé projekci
          (map as any).setProjection?.("mercator");
        }
      } catch {
        (map as any).setProjection?.("mercator");
      }
    };

    // Vylepšení kvality vykreslování pro lepší přesnost polygonů
    const optimizeRendering = () => {
      try {
        // nastavení lepší kvality vykreslování
        (map as any).setRenderWorldCopies?.(false);
        // lepší antialiasing
        (map as any).setAntialias?.(true);
        // optimalizace pro lepší výkon s detailními polygony
        (map as any).setMaxTileCacheSize?.(50);
      } catch {
        // ignore if not supported
      }
    };
    map.on("style.load", enableGlobe);

    map.on("load", async () => {
      enableGlobe();
      optimizeRendering();
      // Načtení GeoJSON států
      const res = await fetch(geojsonUrl);
      if (!res.ok) {
        console.error("Cannot load GeoJSON from", geojsonUrl);
        return;
      }
      const data = await res.json();

      // Log: vypsat název každé země (česky) při načtení
      try {
        const total = Array.isArray(data?.features) ? data.features.length : 0;
        console.log(`Načteno států: ${total}`);
        if (Array.isArray(data?.features)) {
          for (const f of data.features) {
            const props: any = f.properties || {};
            const isoA2 =
              typeof props.ISO_A2 === "string"
                ? props.ISO_A2.toUpperCase()
                : undefined;
            const name =
              regionName(isoA2) || props.ADMIN || props.NAME_LONG || "";
            if (name) console.log(name);
          }
        }
      } catch {}

      async function saveVisit(isoA2?: string) {
        if (!userId || !isoA2) return;
        await dbUtils.saveVisitIso(userId, isoA2.toUpperCase());
      }

      map.addSource("countries", {
        type: "geojson",
        data,
        // generuje interní feature.id pro práci s feature-state (hover/selected)
        generateId: true,
        // zachovat maximum detailu – nevykonávej dodatečnou simplifikaci na úrovni zdroje
        tolerance: 0,
        // zlepšení kvality vykreslování
        buffer: 64,
        maxzoom: 14,
        // lepší zpracování polygonů
        promoteId: "ISO_A2",
      } as any);

      // Hrany států - vylepšené pro lepší přesnost
      map.addLayer({
        id: "countries-outline",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#3b82f6",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            0.8,
            4,
            1.0,
            6,
            1.4,
            8,
            1.8,
            10,
            2.2,
            12,
            2.6,
          ],
          // lepší kvalita vykreslování hran
          "line-opacity": 0.9,
          "line-blur": 0,
        },
        // lepší vykreslování při různých zoom úrovních
        minzoom: 0,
        maxzoom: 14,
      });

      // Výplň: zvýraznění na hover a zelená po kliknutí (feature-state) - vylepšená pro lepší přesnost
      map.addLayer({
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#22c55e",
            "#9ca3af",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.6,
            ["boolean", ["feature-state", "hover"], false],
            0.2,
            0.05,
          ],
          // vylepšené vykreslování polygonů
          "fill-antialias": true,
          "fill-outline-color": "transparent", // odstraníme duplicitní hrany
        },
        // lepší vykreslování při různých zoom úrovních
        minzoom: 0,
        maxzoom: 14,
      });

      // Dodatečná vrstva pro lepší vykreslování hranic při vyšších zoom úrovních
      map.addLayer({
        id: "countries-outline-enhanced",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#1e40af",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            0.5,
            10,
            0.8,
            12,
            1.2,
            14,
            1.6,
          ],
          "line-opacity": 0.7,
          "line-blur": 0,
        },
        // zobrazit pouze při vyšších zoom úrovních
        minzoom: 8,
        maxzoom: 14,
      });

      // Klik na stát: vybarví zeleně a vypíše název v češtině
      map.on("click", "countries-fill", (e) => {
        const feature = e.features && e.features[0];
        if (!feature) return;
        const isoA2 = (feature.properties as any)?.ISO_A2 as string | undefined;
        const name =
          regionName(isoA2) || (feature.properties as any)?.ADMIN || "";
        if (name) console.log(name);
        const currentId = feature.id as number | string | undefined;
        if (currentId !== undefined) {
          if (selectedIdRef.current !== null) {
            map.setFeatureState(
              { source: "countries", id: selectedIdRef.current },
              { selected: false }
            );
          }
          map.setFeatureState(
            { source: "countries", id: currentId },
            { selected: true }
          );
          selectedIdRef.current = currentId;
          // persist + callback
          saveVisit(isoA2).catch(console.error);
          if (onCountrySelected)
            onCountrySelected((isoA2 || "")?.toUpperCase(), name);
        }
      });

      // Hover efekt a kurzor - vylepšené pro všechny vrstvy
      const handleMouseMove = (e: any) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features && e.features[0];
        const id = feature?.id as number | string | undefined;
        if (id === undefined) return;
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
          map.setFeatureState(
            { source: "countries", id: hoveredIdRef.current },
            { hover: false }
          );
        }
        hoveredIdRef.current = id;
        map.setFeatureState({ source: "countries", id }, { hover: true });
      };

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = "";
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: "countries", id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      };

      // Přidání hover efektů pro všechny vrstvy
      map.on("mousemove", "countries-fill", handleMouseMove);
      map.on("mousemove", "countries-outline", handleMouseMove);
      map.on("mousemove", "countries-outline-enhanced", handleMouseMove);

      map.on("mouseleave", "countries-fill", handleMouseLeave);
      map.on("mouseleave", "countries-outline", handleMouseLeave);
      map.on("mouseleave", "countries-outline-enhanced", handleMouseLeave);
    });

    // Globální fallback: klik mimo vrstvu → vyhledat stát pod kurzorem a vypsat název
    map.on("click", (e) => {
      // Pokud vrstva ještě není v aktuálním stylu, nic nedělej
      if (!map.getLayer("countries-fill")) return;
      try {
        const feats = map.queryRenderedFeatures(e.point, {
          layers: [
            "countries-fill",
            "countries-outline",
            "countries-outline-enhanced",
          ],
        });
        if (!feats || feats.length === 0) return;
        const f = feats[0];
        const props: any = f.properties || {};
        const isoA2 =
          typeof props.ISO_A2 === "string"
            ? props.ISO_A2.toUpperCase()
            : undefined;
        const name = regionName(isoA2) || props.ADMIN || props.NAME_LONG || "";
        if (name) console.log(name);
      } catch (err) {
        console.warn("countries layers not ready yet:", err);
      }
    });

    return () => {
      map.remove();
    };
  }, [geojsonUrl, onCountrySelected, userId]);

  return <div ref={containerRef} className="w-full h-[60vh] min-h-[460px]" />;
}
