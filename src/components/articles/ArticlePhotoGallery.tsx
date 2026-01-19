"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

type ArticlePhoto = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

type ArticlePhotoGalleryProps = {
  photos: ArticlePhoto[];
  articleTitle: string;
};

export default function ArticlePhotoGallery({
  photos,
  articleTitle,
}: ArticlePhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatické přepínání každých 6 sekund
  // Timer se resetuje při každé změně currentIndex (ať už automaticky nebo ručně)
  useEffect(() => {
    if (photos.length <= 1) return;

    // Zrušit předchozí timeout, pokud existuje
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Nastavit nový timeout
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    // Cleanup při unmount nebo změně indexu
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, photos.length]);

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentIndex(index);
    // Timer se automaticky resetuje díky useEffect, který sleduje currentIndex
  }, []);

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <section className="space-y-4">
      {/* Hlavní velký obrázek */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 shadow-lg">
        <Image
          key={currentPhoto.id}
          src={currentPhoto.url}
          alt={currentPhoto.alt || articleTitle}
          fill
          priority={currentIndex === 0}
          sizes="100vw"
          className="object-cover transition-opacity duration-500"
        />
      </div>

      {/* Malé náhledy pod hlavním obrázkem */}
      {photos.length > 1 && (
        <div className="flex gap-2 justify-start flex-wrap">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => handleThumbnailClick(index)}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-lg transition-all duration-200 ${
                index === currentIndex
                  ? "ring-4 ring-blue-500 ring-offset-2 scale-105"
                  : "ring-2 ring-gray-200 hover:ring-gray-300 opacity-75 hover:opacity-100"
              }`}
              aria-label={`Zobrazit obrázek ${index + 1} z ${photos.length}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt || `${articleTitle} - obrázek ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
