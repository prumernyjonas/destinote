"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type FilterType = "cheapest" | "all" | "direct";

export default function FlightsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [scriptKey, setScriptKey] = useState(0);
  const prevFilterRef = useRef<FilterType | null>(null);
  const [loadingWidget, setLoadingWidget] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);

  // URL pro různé filtry
  const widgetUrls = {
    cheapest: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=5000&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
    all: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=999999999&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
    direct: `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759.694759&lat=50.0878114&lng=14.4204598&powered_by=true&search_host=search.jetradar.com&locale=en&origin=PRG&value_min=0&value_max=999999999&round_trip=true&only_direct=true&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%23292F33ff&secondary=%230B9C1Fff&light=%23ffffff&width=1920&height=580&zoom=3&promo_id=4054&campaign_id=100`,
  };

  const widgetUrl = widgetUrls[filter];

  // URL pro dodatečný widget nad mapou
  const extraWidgetUrl = `https://tpwdgt.com/content?currency=czk&trs=486511&shmarker=694759&show_hotels=true&powered_by=true&locale=cs&searchUrl=search.jetradar.com&primary_override=%2332a8dd&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&origin=PRG&promo_id=7879&campaign_id=100`;

  // Načíst widget při změně filtru
  useEffect(() => {
    const container = document.getElementById("travelpayouts-widget");
    if (!container) {
      return;
    }

    // Pokud se filtr změnil nebo je to první načtení, nastavit loading
    if (prevFilterRef.current === null || prevFilterRef.current !== filter) {
      if (prevFilterRef.current !== null) {
        container.innerHTML = "";
        const scripts = document.querySelectorAll('script[src*="tpwdgt.com"]');
        scripts.forEach((script) => script.remove());
        setScriptKey((prev) => prev + 1);
      }
      setLoadingMap(true);
    }

    // Vytvořit a přidat nový script
    const script = document.createElement("script");
    script.src = widgetUrl;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => {
      console.log("Travelpayouts widget načten:", filter);
      setLoadingMap(false);
    };
    script.onerror = () => {
      console.error("Chyba při načítání Travelpayouts widgetu:", filter);
      setLoadingMap(false);
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

  // Načíst dodatečný widget nad mapou (načte se pouze jednou)
  useEffect(() => {
    const extraContainer = document.getElementById(
      "travelpayouts-widget-extra"
    );
    if (!extraContainer) {
      return;
    }

    // Vytvořit a přidat script pro dodatečný widget
    const extraScript = document.createElement("script");
    extraScript.src = extraWidgetUrl;
    extraScript.async = true;
    extraScript.charset = "utf-8";
    extraScript.onload = () => {
      console.log("Dodatečný Travelpayouts widget načten");
      setLoadingWidget(false);

      // Funkce pro změnu textu "Show hotels" na "Zobrazit hotely"
      const replaceShowHotelsText = () => {
        const widgetContainer = document.getElementById(
          "travelpayouts-widget-extra"
        );
        if (!widgetContainer) return;

        // Najít všechny textové uzly obsahující "Show hotels"
        const walker = document.createTreeWalker(
          widgetContainer,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent && /Show\s+hotels?/gi.test(node.textContent)) {
            node.textContent = node.textContent.replace(
              /Show\s+hotels?/gi,
              "Zobrazit hotely"
            );
          }
        }

        // Také zkusit najít tlačítka nebo odkazy
        const elements = widgetContainer.querySelectorAll("*");
        elements.forEach((element) => {
          if (
            element.textContent &&
            /Show\s+hotels?/gi.test(element.textContent)
          ) {
            element.textContent = element.textContent.replace(
              /Show\s+hotels?/gi,
              "Zobrazit hotely"
            );
          }
        });
      };

      // Zkusit změnit text několikrát, protože widget se může načítat postupně
      replaceShowHotelsText();
      setTimeout(replaceShowHotelsText, 500);
      setTimeout(replaceShowHotelsText, 1000);
      setTimeout(replaceShowHotelsText, 2000);

      // Použít MutationObserver pro sledování změn v DOM
      const observer = new MutationObserver(() => {
        replaceShowHotelsText();
      });

      const widgetContainer = document.getElementById(
        "travelpayouts-widget-extra"
      );
      if (widgetContainer) {
        observer.observe(widgetContainer, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        // Přestat sledovat po 10 sekundách
        setTimeout(() => {
          observer.disconnect();
        }, 10000);
      }
    };
    extraScript.onerror = () => {
      console.error("Chyba při načítání dodatečného Travelpayouts widgetu");
      setLoadingWidget(false);
    };

    extraContainer.appendChild(extraScript);

    return () => {
      // Cleanup
      if (extraScript.parentNode) {
        extraScript.parentNode.removeChild(extraScript);
      }
    };
  }, [extraWidgetUrl]);

  const loading = loadingWidget || loadingMap;

  return (
    <>
      {/* Dodatečný widget nad mapou */}
      <div className="w-full mb-8 relative">
        {loadingWidget && (
          <div className="w-full absolute inset-0 z-10">
            <Skeleton className="w-full h-96 rounded-lg" />
          </div>
        )}
        <div
          id="travelpayouts-widget-extra"
          className={`w-full ${
            loadingWidget ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
        ></div>
      </div>

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

      {/* Widget - mapa letenek */}
      <div
        className="w-full relative"
        style={{ minHeight: "calc(100vh - 120px)" }}
      >
        {loadingMap && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        )}
        <div
          id="travelpayouts-widget"
          className={`w-full ${
            loadingMap ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
          style={{ minHeight: "calc(100vh - 120px)" }}
        ></div>
      </div>
    </>
  );
}
