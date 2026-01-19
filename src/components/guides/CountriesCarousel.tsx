"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Country = {
  id: string;
  name: string;
  iso_code: string;
  slug: string;
};

type Props = {
  countries: Country[];
  continent: string;
};

export default function CountriesCarousel({ countries, continent }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [countries]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === "left" ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
    // Zkontrolovat po scrollování
    setTimeout(checkScrollability, 300);
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Předchozí země"
        >
          <FiChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Scrollable container with 2 rows */}
      <div
        ref={scrollRef}
        onScroll={checkScrollability}
        className="overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Split countries into two rows */}
        {(() => {
          const midPoint = Math.ceil(countries.length / 2);
          const firstRow = countries.slice(0, midPoint);
          const secondRow = countries.slice(midPoint);
          
          return (
            <div className="flex flex-col gap-3 min-w-max">
              {/* First row */}
              <div className="flex gap-3 flex-shrink-0">
                {firstRow.map((country) => (
                  <Link
                    key={country.id}
                    href={`/zeme/${continent}/${country.slug}`}
                    className="group flex-shrink-0 flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 min-w-[160px]"
                  >
                    {country.iso_code && (
                      <span
                        className={`fi fi-${country.iso_code.toLowerCase()} text-lg flex-shrink-0`}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 whitespace-nowrap">
                      {country.name}
                    </span>
                  </Link>
                ))}
              </div>
              {/* Second row */}
              {secondRow.length > 0 && (
                <div className="flex gap-3 flex-shrink-0">
                  {secondRow.map((country) => (
                    <Link
                      key={country.id}
                      href={`/zeme/${continent}/${country.slug}`}
                      className="group flex-shrink-0 flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 min-w-[160px]"
                    >
                      {country.iso_code && (
                        <span
                          className={`fi fi-${country.iso_code.toLowerCase()} text-lg flex-shrink-0`}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 whitespace-nowrap">
                        {country.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Další země"
        >
          <FiChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
