"use client";

import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

type CountryMapProps = {
  iso2?: string;
  countryName: string;
};

export default function CountryMap({ iso2, countryName }: CountryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Nastavení API klíče a jazyka pro MapTiler SDK
    // Trim whitespace, aby se předešlo chybám 403
    const apiKey = (process.env.NEXT_PUBLIC_MAPTILER_KEY || "").trim();
    if (!apiKey) {
      console.error("[CountryMap] NEXT_PUBLIC_MAPTILER_KEY není nastaven!");
      return;
    }
    maptilersdk.config.apiKey = apiKey;

    // Získání center země podle ISO2 kódu
    const getCountryCenter = (iso2?: string): [number, number] => {
      if (!iso2) return [0, 20]; // Světový pohled

      // Mapování centerů zemí (lng, lat) - VŠECHNY ZEMĚ
      const countryCenters: Record<string, [number, number]> = {
        // Evropa
        AL: [20.168, 41.153], // Albánie
        AD: [1.522, 42.546], // Andorra
        AT: [14.55, 47.516], // Rakousko
        BY: [27.953, 53.904], // Bělorusko
        BE: [4.469, 50.503], // Belgie
        BA: [17.679, 43.915], // Bosna a Hercegovina
        BG: [25.485, 42.733], // Bulharsko
        HR: [15.2, 45.1], // Chorvatsko
        CY: [33.429, 35.126], // Kypr
        CZ: [15.473, 49.817], // Česká republika
        DK: [9.501, 56.263], // Dánsko
        EE: [25.013, 58.595], // Estonsko
        FI: [25.748, 61.924], // Finsko
        FR: [2.213, 46.227], // Francie
        DE: [10.451, 51.165], // Německo
        GR: [21.824, 39.074], // Řecko
        HU: [19.503, 47.162], // Maďarsko
        IS: [-19.02, 64.963], // Island
        IE: [-8.243, 53.412], // Irsko
        IT: [12.567, 41.871], // Itálie
        XK: [20.902, 42.602], // Kosovo
        LV: [24.603, 56.879], // Lotyšsko
        LI: [9.555, 47.141], // Lichtenštejnsko
        LT: [23.881, 55.169], // Litva
        LU: [6.13, 49.815], // Lucembursko
        MT: [14.375, 35.937], // Malta
        MD: [28.857, 47.01], // Moldavsko
        MC: [7.424, 43.738], // Monako
        ME: [19.263, 42.43], // Černá Hora
        NL: [5.291, 52.132], // Nizozemsko
        MK: [21.745, 41.608], // Severní Makedonie
        NO: [8.468, 60.472], // Norsko
        PL: [19.145, 51.919], // Polsko
        PT: [-8.224, 39.399], // Portugalsko
        RO: [24.966, 45.943], // Rumunsko
        RU: [37.617, 55.755], // Rusko
        SM: [12.457, 43.942], // San Marino
        RS: [20.457, 44.016], // Srbsko
        SK: [19.699, 48.669], // Slovensko
        SI: [14.995, 46.151], // Slovinsko
        ES: [-3.749, 40.463], // Španělsko
        SE: [18.643, 60.128], // Švédsko
        CH: [8.227, 46.818], // Švýcarsko
        UA: [30.523, 50.45], // Ukrajina
        GB: [-3.436, 55.378], // Velká Británie
        VA: [12.453, 41.902], // Vatikán
        // Asie
        AF: [69.176, 34.522], // Afghánistán
        AM: [44.503, 40.069], // Arménie
        AZ: [47.576, 40.143], // Ázerbájdžán
        BH: [50.557, 26.066], // Bahrajn
        BD: [90.356, 23.685], // Bangladéš
        BT: [90.433, 27.514], // Bhútán
        BN: [114.727, 4.535], // Brunej
        KH: [104.991, 12.565], // Kambodža
        CN: [104.195, 35.861], // Čína
        GE: [43.356, 42.315], // Gruzie
        IN: [78.962, 20.593], // Indie
        ID: [113.921, -0.789], // Indonésie
        IR: [53.688, 32.427], // Írán
        IQ: [44.366, 33.315], // Irák
        IL: [34.851, 31.046], // Izrael
        JP: [138.252, 36.204], // Japonsko
        JO: [36.238, 30.585], // Jordánsko
        KZ: [66.923, 48.019], // Kazachstán
        KW: [47.481, 29.311], // Kuvajt
        KG: [74.766, 41.204], // Kyrgyzstán
        LA: [102.495, 19.856], // Laos
        LB: [35.862, 33.854], // Libanon
        MY: [101.975, 4.21], // Malajsie
        MV: [73.509, 3.202], // Maledivy
        MN: [103.847, 46.862], // Mongolsko
        MM: [95.956, 21.916], // Myanmar
        NP: [84.124, 28.394], // Nepál
        KP: [125.762, 39.039], // Severní Korea
        OM: [55.923, 21.473], // Omán
        PK: [73.047, 33.684], // Pákistán
        PS: [35.233, 31.952], // Palestina
        PH: [121.774, 12.879], // Filipíny
        QA: [51.184, 25.354], // Katar
        SA: [45.079, 23.885], // Saúdská Arábie
        SG: [103.819, 1.352], // Singapur
        KR: [127.766, 35.907], // Jižní Korea
        LK: [80.771, 7.873], // Srí Lanka
        SY: [38.996, 34.802], // Sýrie
        TW: [121.565, 25.033], // Tchaj-wan
        TJ: [71.276, 38.861], // Tádžikistán
        TH: [100.992, 15.87], // Thajsko
        TL: [125.727, -8.874], // Východní Timor
        TR: [35.243, 38.963], // Turecko
        TM: [59.556, 38.969], // Turkmenistán
        AE: [54.377, 23.424], // Spojené arabské emiráty
        UZ: [64.585, 41.377], // Uzbekistán
        VN: [108.277, 14.058], // Vietnam
        YE: [44.207, 15.552], // Jemen
        // Afrika
        EG: [30.802, 26.82],
        MA: [-5.547, 33.971],
        TN: [9.537, 33.886],
        ZA: [22.937, -30.559],
        KE: [37.906, 0.023],
        TZ: [34.888, -6.369],
        GH: [-1.023, 7.946],
        NG: [8.675, 9.082],
        DZ: [2.632, 36.753],
        EH: [-12.885, 24.215], // Západní Sahara
        MG: [47.508, -18.879], // Madagaskar
        ML: [-3.524, 17.57], // Mali
        AO: [17.873, -11.202], // Angola
        ET: [38.787, 9.145], // Etiopie
        UG: [32.29, 1.373], // Uganda
        RW: [30.061, -1.944], // Rwanda
        BW: [23.813, -22.328], // Botswana
        ZW: [31.03, -19.015], // Zimbabwe
        MZ: [35.529, -18.665], // Mosambik
        MW: [33.93, -13.254], // Malawi
        ZM: [27.849, -15.387], // Zambie
        SN: [-17.467, 14.497], // Senegal
        CI: [-5.547, 7.54], // Pobřeží slonoviny
        CM: [11.502, 3.848], // Kamerun
        CD: [23.655, -4.038], // Demokratická republika Kongo
        SO: [45.318, 2.047], // Somálsko
        SD: [30.217, 15.5], // Súdán
        SS: [31.307, 6.877], // Jižní Súdán
        NE: [8.081, 17.608], // Niger
        TD: [18.732, 15.454], // Čad
        BF: [-1.561, 12.238], // Burkina Faso
        MR: [-10.941, 21.008], // Mauritánie
        LR: [-10.797, 6.428], // Libérie
        SL: [-11.779, 8.46], // Sierra Leone
        GN: [-10.94, 9.945], // Guinea
        GW: [-15.18, 11.803], // Guinea-Bissau
        CV: [-24.013, 16.538], // Kapverdy
        ST: [6.613, 0.186], // Svatý Tomáš a Princův ostrov
        GA: [11.609, -0.803], // Gabon
        GQ: [10.267, 1.65], // Rovníková Guinea
        CG: [15.827, -0.228], // Kongo
        CF: [20.939, 7.369], // Středoafrická republika
        DJ: [42.59, 11.825], // Džibutsko
        ER: [38.931, 15.179], // Eritrea
        LS: [28.233, -29.61], // Lesotho
        SZ: [31.465, -26.522], // Svazijsko
        KM: [43.872, -11.645], // Komory
        MU: [57.552, -20.348], // Mauricius
        SC: [55.454, -4.68], // Seychely
        // Severní Amerika
        AG: [-61.796, 17.06], // Antigua a Barbuda
        BS: [-77.396, 25.034], // Bahamy
        BB: [-59.543, 13.193], // Barbados
        BZ: [-88.497, 17.189], // Belize
        CA: [-106.346, 56.13], // Kanada
        CR: [-84.09, 9.748], // Kostarika
        CU: [-77.781, 21.521], // Kuba
        DM: [-61.357, 15.415], // Dominika
        DO: [-70.162, 18.735], // Dominikánská republika
        SV: [-88.896, 13.794], // Salvador
        GD: [-61.679, 12.116], // Grenada
        GT: [-90.23, 15.783], // Guatemala
        HT: [-72.285, 18.971], // Haiti
        HN: [-86.241, 15.2], // Honduras
        JM: [-77.297, 18.109], // Jamajka
        MX: [-102.552, 23.634], // Mexiko
        NI: [-85.207, 12.265], // Nikaragua
        PA: [-80.782, 8.538], // Panama
        KN: [-62.73, 17.357], // Svatý Kryštof a Nevis
        LC: [-60.978, 13.909], // Svatá Lucie
        VC: [-61.287, 12.984], // Svatý Vincenc a Grenadiny
        TT: [-61.222, 10.691], // Trinidad a Tobago
        US: [-95.712, 37.09], // USA
        PR: [-66.59, 18.221], // Portoriko
        GL: [-42.604, 71.707], // Grónsko
        // Jižní Amerika
        AR: [-63.616, -38.416], // Argentina
        BO: [-65.255, -16.29], // Bolívie
        BR: [-51.925, -14.235], // Brazílie
        CL: [-71.543, -35.675], // Chile
        CO: [-74.297, 4.57], // Kolumbie
        EC: [-78.467, -1.831], // Ekvádor
        FK: [-59.524, -51.796], // Falklandy
        GY: [-58.93, 4.86], // Guyana
        PY: [-58.443, -23.442], // Paraguay
        PE: [-75.015, -9.19], // Peru
        SR: [-56.027, 3.919], // Surinam
        UY: [-56.164, -34.901], // Uruguay
        VE: [-66.59, 6.423], // Venezuela
        // Austrálie a Oceánie
        AU: [133.775, -25.274], // Austrálie
        FJ: [178.065, -17.713], // Fidži
        KI: [-157.363, 1.87], // Kiribati
        MH: [171.185, 7.131], // Marshallovy ostrovy
        FM: [158.162, 6.887], // Mikronésie
        NR: [166.931, -0.523], // Nauru
        NZ: [174.886, -40.9], // Nový Zéland
        PW: [134.582, 7.515], // Palau
        PG: [143.955, -6.315], // Papua-Nová Guinea
        WS: [-172.105, -13.759], // Samoa
        SB: [160.156, -9.645], // Šalomounovy ostrovy
        TO: [-175.198, -21.178], // Tonga
        TV: [179.195, -7.11], // Tuvalu
        VU: [168.315, -15.377], // Vanuatu
      };

      return countryCenters[iso2.toUpperCase()] || [0, 20];
    };

    // Získání vhodného zoom levelu pro zemi - zoomuje přímo na zemi, ne na kontinent
    const getCountryZoom = (iso2?: string): number => {
      if (!iso2) return 2;

      // Velké země mají nižší zoom, malé země vyšší - ale všechny se zoomují na samotnou zemi
      const veryLargeCountries = ["RU", "CA", "US", "CN", "BR", "AU", "IN"]; // Obrovské země
      const mediumCountries = [
        "MX",
        "AR",
        "DZ",
        "LY",
        "SD",
        "MN",
        "GR",
        "TR",
        "IR",
        "SA",
      ];
      const smallCountries = ["SG", "LU", "MC", "LI", "VA", "AD", "SM", "MT"];

      if (veryLargeCountries.includes(iso2.toUpperCase())) return 2; // Velké země - extrémně oddálené
      if (mediumCountries.includes(iso2.toUpperCase())) return 4; // Střední země - více oddálené
      if (smallCountries.includes(iso2.toUpperCase())) return 6; // Malé země - více oddálené
      return 4; // Výchozí pro ostatní země - více oddálené
    };

    const zoom = getCountryZoom(iso2);
    // Center podle konkrétní země, aby byla uprostřed
    const center = getCountryCenter(iso2);

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS,
      center: center,
      zoom: zoom,
      language: "cs",
      attributionControl: false,
      renderWorldCopies: true, // Povoluje zobrazení mapy vícekrát pro viditelnost ostrovů na okrajích
    });
    mapRef.current = map;

    // Přidání kompaktního attribution
    map.addControl(new maptilersdk.AttributionControl({ compact: true }));

    map.on("load", async () => {
      // Explicitně nastavíme jazyk pro jistotu
      map.setLanguage("cs");

      const res = await fetch("/countries-hd.json");
      if (!res.ok) return;
      const data = await res.json();

      // Přidání unique ID pro každý feature
      if (data && Array.isArray(data.features)) {
        data.features.forEach((f: any, idx: number) => {
          f.id = idx;
        });
      }

      map.addSource("countries", {
        type: "geojson",
        data,
        generateId: false,
      });

      // Všechny země - šedé
      map.addLayer({
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": "#e5e7eb",
          "fill-opacity": 0.3,
        },
      });

      // Hraniční čáry všech zemí
      map.addLayer({
        id: "countries-outline",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#9ca3af",
          "line-width": 1,
          "line-opacity": 0.5,
        },
      });

      // Vyznačení konkrétní země - pokud máme ISO2 kód
      if (iso2) {
        map.addLayer({
          id: "selected-country-fill",
          type: "fill",
          source: "countries",
          paint: {
            "fill-color": "#22c55e", // Zelená barva
            "fill-opacity": 0.6,
          },
          filter: ["==", ["get", "ISO3166-1-Alpha-2"], iso2.toUpperCase()],
        });

        map.addLayer({
          id: "selected-country-outline",
          type: "line",
          source: "countries",
          paint: {
            "line-color": "#16a34a", // Tmavší zelená
            "line-width": 2,
            "line-opacity": 1,
          },
          filter: ["==", ["get", "ISO3166-1-Alpha-2"], iso2.toUpperCase()],
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [iso2, countryName]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
