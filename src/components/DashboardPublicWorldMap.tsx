"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import countries from "i18n-iso-countries";
import cs from "i18n-iso-countries/langs/cs.json";
import { dbUtils } from "@/utils/supabase-db";

// Registrace českého locale (provedeno jednou při načtení modulu)
try {
  countries.registerLocale(cs as any);
} catch {}

type DashboardPublicWorldMapProps = {
  userId: string;
  onVisitSaved?: (iso2: string, name: string) => void;
  geojsonUrl?: string;
  // požadavek z parenta: odbarvit konkrétní ISO2 (nonce kvůli opakovanému volání)
  unvisitRequest?: { iso2: string; nonce: number };
  // volitelné: informuj parenta po preloadu seznamu, aby si sjednotil počty
  onVisitedPreload?: (
    visited: Array<{ iso2: string; name: string; id: string }>
  ) => void;
};

export default function DashboardPublicWorldMap({
  userId,
  onVisitSaved,
  geojsonUrl = "/countries-hd.json",
  unvisitRequest,
  onVisitedPreload,
}: DashboardPublicWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const hoveredIdRef = useRef<number | string | null>(null);
  const clickHandlerRef = useRef<((e: any) => void) | null>(null);
  const popupRef = useRef<maptilersdk.Popup | null>(null);
  const geojsonRef = useRef<any | null>(null);
  const onVisitSavedRef = useRef<typeof onVisitSaved>(onVisitSaved);
  useEffect(() => {
    onVisitSavedRef.current = onVisitSaved;
  }, [onVisitSaved]);
  const onVisitedPreloadRef = useRef<typeof onVisitedPreload>(onVisitedPreload);
  useEffect(() => {
    onVisitedPreloadRef.current = onVisitedPreload;
  }, [onVisitedPreload]);

  // set navštívených ISO2 (abychom věděli, jestli už to máme v DB)
  const visitedIsoRef = useRef<Set<string>>(new Set());

  // pro procenta
  const [visitedCount, setVisitedCount] = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);

  const percent = totalCountries
    ? Math.round((visitedCount / totalCountries) * 100)
    : 0;

  function normalizeIso2(iso2: string): string {
    const upper = (iso2 || "").toUpperCase();
    // Francouzská území -> FR
    const franceTerritories = new Set([
      "FX", // Metropolitan France
      "GF", // French Guiana
      "RE", // Réunion
      "GP", // Guadeloupe
      "MQ", // Martinique
      "YT", // Mayotte
      "PM", // Saint Pierre and Miquelon
      "NC", // New Caledonia
      "PF", // French Polynesia
      "WF", // Wallis and Futuna
      "BL", // Saint Barthélemy
      "MF", // Saint Martin (French part)
      "TF", // French Southern Territories
      "CP", // Clipperton Island (neoficiální)
    ]);
    if (franceTerritories.has(upper)) return "FR";
    // Norská území -> NO
    const norwayTerritories = new Set([
      "SJ", // Svalbard and Jan Mayen
      "BV", // Bouvet Island
    ]);
    if (norwayTerritories.has(upper)) return "NO";
    return upper;
  }

  function getIso2FromProps(props: any): string | undefined {
    const rawName: string =
      props?.NAME_LONG || props?.ADMIN || props?.NAME || props?.name || "";
    // 0) Preferovat ISO_A2 / ISO3166-1-Alpha-2 z dat (když je k dispozici a není "-99")
    const isoA2Raw = props?.ISO_A2 || props?.["ISO3166-1-Alpha-2"];
    if (
      typeof isoA2Raw === "string" &&
      /^[A-Za-z]{2}$/.test(isoA2Raw) &&
      isoA2Raw !== "-99"
    ) {
      return normalizeIso2(isoA2Raw);
    }
    const code3Candidates: Array<string | undefined> = [
      props?.ISO_A3,
      props?.["ISO3166-1-Alpha-3"],
      props?.GU_A3,
      props?.SU_A3,
      props?.SOV_A3,
      props?.ADM0_A3,
    ];
    const code3 = (code3Candidates.find(
      (c) =>
        typeof c === "string" && /^[A-Z]{3}$/.test(c as string) && c !== "-99"
    ) || "") as string;
    const iso2FromA3 = (countries as any).alpha3ToAlpha2?.(code3);
    const iso2Guess = iso2FromA3 || countries.getAlpha2Code(rawName, "en");
    return iso2Guess ? normalizeIso2(iso2Guess as string) : undefined;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    maptilersdk.config.apiKey = apiKey || "";
    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      language: "cs",
      center: [15, 25],
      zoom: 2,
      fadeDuration: 0,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    // Potlačit neškodné "signal is aborted" chyby při rušení requestů (např. při unmountu/změně stylu)
    map.on("error", (e: any) => {
      const msg = e?.error?.message || "";
      if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("signal is aborted")
      ) {
        return;
      }
      // Ostatní chyby zalogovat pro diagnostiku
      console.warn("[MAP] error:", e?.error || e);
    });

    // Nepoužíváme 3D/Globe projekci

    // Idempotentní nastavení zdroje, vrstvy a handlerů
    const setupLayersAndHandlers = async () => {
      try {
        if (!map.getSource("countries-public")) {
          console.log("[MAP] fetching GeoJSON:", geojsonUrl);
          const res = await fetch(geojsonUrl);
          if (!res.ok) {
            console.warn("[MAP] GeoJSON fetch failed:", res.status);
            return;
          }
          const data = await res.json();
          geojsonRef.current = data;
          const featureCount = Array.isArray(data?.features)
            ? data.features.length
            : 0;
          console.log("[MAP] GeoJSON loaded, features:", featureCount);

          // Drobná normalizace dat (Somaliland -> Somalia)
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
            // Použijeme ISO3166-1-Alpha-3 jako ID feature (pro countries-hd.json)
            // Fallback na ADM0_A3 pro starší GeoJSON
            promoteId: data.features?.[0]?.properties?.["ISO3166-1-Alpha-3"]
              ? "ISO3166-1-Alpha-3"
              : "ADM0_A3",
          } as any);
          console.log("[MAP] source ensured: countries-public");

          // spočítat celkový počet zemí (unikátní ISO2 z GeoJSONu)
          const allIsoSet = new Set<string>();
          try {
            const geojson: any = data;
            for (const f of (geojson?.features as any[]) || []) {
              const props: any = f?.properties || {};
              const iso2 = getIso2FromProps(props);
              if (!iso2) continue;
              allIsoSet.add(normalizeIso2(iso2));
            }
          } catch (e) {
            console.warn("[MAP] counting total countries failed:", e);
          }
          setTotalCountries(allIsoSet.size);

          // Předvybarvení již navštívených zemí z DB
          try {
            const visited = await dbUtils.getVisitedCountries(userId);
            const visitedSet = new Set(
              (visited || []).map((v) => normalizeIso2(v.iso2 || ""))
            );
            visitedIsoRef.current = visitedSet;
            setVisitedCount(visitedSet.size);
            // Informuj parenta, ať si sjednotí počty a seznam pro header/list
            try {
              onVisitedPreloadRef.current?.(visited);
            } catch {}

            const geojson: any = data;
            for (const f of (geojson?.features as any[]) || []) {
              const props: any = f?.properties || {};
              const iso2 = getIso2FromProps(props);
              if (!iso2) continue;
              const norm = normalizeIso2(iso2);
              if (!visitedSet.has(norm)) continue;

              const id3 =
                props?.["ISO3166-1-Alpha-3"] ||
                props?.ADM0_A3 ||
                props?.ISO_A3 ||
                props?.GU_A3 ||
                props?.SU_A3 ||
                props?.SOV_A3;
              if (typeof id3 !== "string" || id3 === "-99") continue;
              try {
                map.setFeatureState(
                  { source: "countries-public", id: id3 },
                  { visited: true }
                );
              } catch {}
            }
          } catch (e) {
            console.warn("[MAP] preselect visited failed:", e);
          }
        }

        if (!map.getLayer("countries-public-fill")) {
          // Jedna vrstva: barva podle feature-state.visited, průhlednost podle hover
          map.addLayer({
            id: "countries-public-fill",
            type: "fill",
            source: "countries-public",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "visited"], false],
                "#22c55e", // navštívené – zelená
                "#9ca3af", // ostatní – šedá
              ],
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.4,
                0.18,
              ],
              "fill-outline-color": "#93c5fd",
            },
          });
          console.log("[MAP] layer ensured: countries-public-fill");
        }

        // Vytvořit popup pouze jednou
        if (!popupRef.current) {
          popupRef.current = new maptilersdk.Popup({
            closeButton: true,
            closeOnClick: false,
          });
        }
        const popup = popupRef.current;

        const onClick = async (e: any) => {
          const feats = Array.isArray(e?.features) ? e.features : [];
          const f = feats[0];
          if (!f) return;
          const props: any = f.properties || {};

          const rawName: string =
            props.NAME_LONG || props.ADMIN || props.NAME || props.name || "";
          const iso2 = getIso2FromProps(props);
          const czName = iso2 ? countries.getName(iso2, "cs") : undefined;
          const name: string = (czName || rawName || "").trim();

          // Bez ISO2 nemá smysl ukládat
          if (!iso2) {
            console.warn("[VISITED] ISO2 není k dispozici, neukládám.");
            return;
          }

          const upperIso2 = normalizeIso2(iso2);

          // ID feature pro feature-state
          const id3 =
            props?.["ISO3166-1-Alpha-3"] ||
            props?.ADM0_A3 ||
            props?.ISO_A3 ||
            props?.GU_A3 ||
            props?.SU_A3 ||
            props?.SOV_A3;

          // Sestavit obsah popupu ve stejném stylu jako PublicWorldMap
          const wrap = document.createElement("div");
          wrap.style.minWidth = "220px";

          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.alignItems = "center";
          row.style.gap = "8px";
          row.style.marginBottom = "6px";

          const flag = document.createElement("span");
          flag.className = `fi fi-${upperIso2.toLowerCase()}`;
          flag.style.fontSize = "20px";

          const title = document.createElement("div");
          title.style.fontWeight = "700";
          title.style.fontSize = "16px";
          title.textContent = name || upperIso2;

          row.appendChild(flag);
          row.appendChild(title);

          const isVisited = visitedIsoRef.current.has(upperIso2);
          const btn = document.createElement("button");
          btn.style.display = "block";
          btn.style.marginTop = "8px";
          btn.style.fontWeight = "700";
          btn.style.background = "transparent";
          btn.style.borderRadius = "6px";
          btn.style.padding = "6px 10px";
          btn.style.cursor = "pointer";

          const setBtnStyle = (visited: boolean) => {
            if (visited) {
              btn.textContent = "Odebrat zemi";
              btn.style.color = "#dc2626";
              btn.style.border = "1px solid #dc2626";
            } else {
              btn.textContent = "Označit jako navštívené";
              btn.style.color = "#16a34a";
              btn.style.border = "1px solid #16a34a";
            }
          };
          setBtnStyle(isVisited);

          btn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            if (typeof id3 !== "string" || id3 === "-99") return;
            const currentlyVisited = visitedIsoRef.current.has(upperIso2);
            // Optimistická změna barvy
            try {
              map.setFeatureState(
                { source: "countries-public", id: id3 },
                { visited: !currentlyVisited }
              );
            } catch {}

            // Optimisticky upravit lokální set a počítadlo
            if (currentlyVisited) {
              visitedIsoRef.current.delete(upperIso2);
              setVisitedCount((prev) => Math.max(0, prev - 1));
            } else {
              visitedIsoRef.current.add(upperIso2);
              setVisitedCount((prev) => prev + 1);
            }
            setBtnStyle(!currentlyVisited);

            try {
              // Voláme serverové API (funguje i na localhost), předáme fallback user-id v hlavičce
              if (currentlyVisited) {
                const delRes = await fetch(
                  `/api/visited?iso2=${upperIso2}&userId=${encodeURIComponent(
                    userId
                  )}`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      "x-user-id": userId,
                    },
                  }
                );
                if (!delRes.ok) {
                  let message = `DELETE /api/visited ${delRes.status}`;
                  try {
                    const j = await delRes.json();
                    if (j?.error) message = j.error;
                  } catch {}
                  throw new Error(message);
                }
              } else {
                const postRes = await fetch(
                  `/api/visited?iso2=${upperIso2}&userId=${encodeURIComponent(
                    userId
                  )}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-user-id": userId,
                    },
                    body: JSON.stringify({ iso2: upperIso2 }),
                  }
                );
                if (!postRes.ok) {
                  let message = `POST /api/visited ${postRes.status}`;
                  try {
                    const j = await postRes.json();
                    if (j?.error) message = j.error;
                  } catch {}
                  throw new Error(message);
                }
              }
              onVisitSavedRef.current?.(upperIso2, name);
              // Po úspěchu zavřít popup, aby nepřekážel dalším klikům
              try {
                popup.remove();
              } catch {}
            } catch (err) {
              console.error("[VISITED] změna selhala, revertuji:", err);
              // Revertovat feature-state
              try {
                map.setFeatureState(
                  { source: "countries-public", id: id3 },
                  { visited: currentlyVisited }
                );
              } catch {}
              // Revertovat lokální set/počet
              if (currentlyVisited) {
                // Původně byl visited, revertujeme odebrání
                visitedIsoRef.current.add(upperIso2);
                setVisitedCount((prev) => prev + 1);
              } else {
                visitedIsoRef.current.delete(upperIso2);
                setVisitedCount((prev) => Math.max(0, prev - 1));
              }
              setBtnStyle(currentlyVisited);
            }
          });

          wrap.appendChild(row);
          wrap.appendChild(btn);
          popup.setDOMContent(wrap).setLngLat(e.lngLat).addTo(map);
        };

        // Klik na mapu - vždy registrovat na aktuální instanci
        // Nejdřív odebrat starý handler pokud existuje
        if (clickHandlerRef.current) {
          try {
            map.off("click", clickHandlerRef.current);
          } catch {}
        }
        const clickHandler = (e: any) => {
          try {
            if (!map.getLayer("countries-public-fill")) return;
            const feats = map.queryRenderedFeatures(e.point, {
              layers: ["countries-public-fill"],
            } as any);
            const f = feats && feats[0];
            if (!f) return;
            onClick({ ...e, features: [f] });
          } catch (err) {
            console.warn("[MAP] click handler failed:", err);
          }
        };
        clickHandlerRef.current = clickHandler;
        map.on("click", clickHandler);

        // Hover efekt
        map.on("mousemove", "countries-public-fill", (e: any) => {
          map.getCanvas().style.cursor = "pointer";
          const feats = Array.isArray(e?.features) ? e.features : [];
          const id = (feats[0]?.id as number | string | undefined) ?? undefined;
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
      } catch (e) {
        console.warn("[MAP] setupLayersAndHandlers error:", e);
      }
    };

    map.on("load", async () => {
      await setupLayersAndHandlers();
    });

    // Některé styly mohou vyvolat znovunačtení; zajistíme vrstvy i tehdy
    map.on("style.load", async () => {
      // Reset handlerů, protože při změně stylu se source/layer smaže
      clickHandlerRef.current = null;
      popupRef.current = null;
      await setupLayersAndHandlers();
    });

    return () => {
      clickHandlerRef.current = null;
      popupRef.current = null;
      map.remove();
    };
  }, [geojsonUrl, userId]);

  // Reakce na externí odebrání země (např. z listu pod mapou)
  useEffect(() => {
    if (!unvisitRequest || !unvisitRequest.iso2) return;
    const map = mapRef.current;
    const data = geojsonRef.current;
    if (!map || !data) return;
    const targetIso = normalizeIso2(unvisitRequest.iso2);
    // upravit lokální evidenci a počítadlo
    if (visitedIsoRef.current.has(targetIso)) {
      visitedIsoRef.current.delete(targetIso);
      setVisitedCount((prev) => Math.max(0, prev - 1));
    }
    try {
      const features: any[] = (data?.features as any[]) || [];
      for (const f of features) {
        const props: any = f?.properties || {};
        const iso2 = getIso2FromProps(props);
        if (!iso2) continue;
        if (normalizeIso2(iso2) !== targetIso) continue;
        const id3 =
          props?.["ISO3166-1-Alpha-3"] ||
          props?.ADM0_A3 ||
          props?.ISO_A3 ||
          props?.GU_A3 ||
          props?.SU_A3 ||
          props?.SOV_A3;
        if (typeof id3 !== "string" || id3 === "-99") continue;
        try {
          map.setFeatureState(
            { source: "countries-public", id: id3 },
            { visited: false }
          );
        } catch {}
      }
    } catch {}
  }, [unvisitRequest]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm md:text-base font-medium text-slate-800">
        Objeveno:{" "}
        <span className="text-emerald-600 font-semibold">{percent} %</span> zemí
        světa{" "}
        <span className="text-slate-500">
          ({visitedCount}/{totalCountries})
        </span>
      </div>
      <div
        ref={containerRef}
        className="w-full h-150 min-h-115 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
      />
    </div>
  );
}
