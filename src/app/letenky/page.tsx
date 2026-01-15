"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/Button";

type FilterType = "cheapest" | "all" | "direct";

export default function FlightsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [scriptKey, setScriptKey] = useState(0);
  const prevFilterRef = useRef<FilterType | null>(null);

  // URL pro různé filtry
  const widgetUrls = {
    cheapest: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=5000&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
    all: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=999999999&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
    direct: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=999999999&round_trip=true&only_direct=true&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
  };

  const widgetUrl = widgetUrls[filter];

  // Načíst widget při změně filtru
  useEffect(() => {
    const container = document.getElementById("travelpayouts-widget");
    if (!container) {
      console.error("Kontejner travelpayouts-widget nenalezen");
      return;
    }

    // Pokud se filtr změnil, vyčistit starý widget
    if (prevFilterRef.current !== null && prevFilterRef.current !== filter) {
      container.innerHTML = "";
      const scripts = document.querySelectorAll('script[src*="tpwdgt.com"]');
      scripts.forEach((script) => script.remove());
      setScriptKey((prev) => prev + 1);
    }

    // Vytvořit a přidat nový script
    const script = document.createElement("script");
    script.src = widgetUrl;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => {
      console.log("Travelpayouts widget načten:", filter);
    };
    script.onerror = () => {
      console.error("Chyba při načítání Travelpayouts widgetu:", filter);
    };

    container.appendChild(script);
    console.log("Script přidán do kontejneru:", widgetUrl);

    prevFilterRef.current = filter;

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [filter, widgetUrl]);

  return (
    <>
      {/* Filtr s tlačítky */}
      <div className="p-4 flex gap-3">
        <Button
          variant={filter === "cheapest" ? "primary" : "outline"}
          onClick={() => setFilter("cheapest")}
        >
          Nejlevnější dealy
        </Button>
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          onClick={() => setFilter("all")}
        >
          Všechny lety
        </Button>
        <Button
          variant={filter === "direct" ? "primary" : "outline"}
          onClick={() => setFilter("direct")}
        >
          Pouze přímé lety
        </Button>
      </div>

      {/* Widget */}
      <div
        id="travelpayouts-widget"
        className="w-full"
        style={{ minHeight: "calc(100vh - 120px)" }}
      ></div>
    </>
  );
}
