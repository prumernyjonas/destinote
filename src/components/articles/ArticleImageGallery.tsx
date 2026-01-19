"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export interface GalleryPhoto {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

export interface PreviewPhoto {
  file: File;
  preview: string;
}

interface ArticleImageGalleryProps {
  // Existující obrázky z galerie
  galleryPhotos?: GalleryPhoto[];
  // Nové obrázky (preview)
  galleryPreviews?: PreviewPhoto[];
  // Původní cover obrázek (pokud není v galerii)
  originalCoverUrl?: string | null;
  // Aktuální cover URL
  coverUrl?: string | null;
  // Alt text pro cover
  coverAlt?: string | null;
  // Je cover označen k smazání?
  coverMarkedForDelete?: boolean;
  // Je cover z galerie?
  coverFromGallery?: { url: string; alt: string | null } | null;
  // Index vybraného cover obrázku z nových
  selectedCoverIndex?: number | null;
  // Obrázky označené k smazání
  photosToDelete?: string[];
  // Je článek pending?
  isPending?: boolean;
  // Je ukládání?
  saving?: boolean;
  // Je nahrávání galerie?
  uploadingGallery?: boolean;
  // Callbacky
  onCoverFromGallery?: (photoUrl: string, photoAlt: string | null) => void;
  onCoverFromPreview?: (index: number) => void;
  onRemoveGalleryPhoto?: (photoId: string) => void;
  onCancelRemovePhoto?: (photoId: string) => void;
  onRemovePreview?: (index: number) => void;
  onCoverDelete?: () => void;
  onCoverDeleteCancel?: () => void;
  onRestoreOriginalCover?: () => void;
}

export function ArticleImageGallery({
  galleryPhotos = [],
  galleryPreviews = [],
  originalCoverUrl,
  coverUrl,
  coverAlt,
  coverMarkedForDelete = false,
  coverFromGallery,
  selectedCoverIndex,
  photosToDelete = [],
  isPending = false,
  saving = false,
  uploadingGallery = false,
  onCoverFromGallery,
  onCoverFromPreview,
  onRemoveGalleryPhoto,
  onCancelRemovePhoto,
  onRemovePreview,
  onCoverDelete,
  onCoverDeleteCancel,
  onRestoreOriginalCover,
}: ArticleImageGalleryProps) {
  const hasImages =
    galleryPhotos.length > 0 ||
    galleryPreviews.length > 0 ||
    (coverUrl && !coverMarkedForDelete);

  if (!hasImages) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Nahrané obrázky (klikněte pro výběr hlavní fotografie):
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Původní cover obrázek (pokud není v galerii a není vybrán jiný cover) */}
        {originalCoverUrl &&
          !coverMarkedForDelete &&
          !galleryPhotos.find((p) => p.url === originalCoverUrl) &&
          !coverFromGallery &&
          selectedCoverIndex === null && (
            <div
              className={`relative border-2 border-green-500 ring-2 ring-green-200 rounded-lg overflow-hidden ${
                isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
              onClick={() => {
                if (isPending) return;
                // Cover už je vybrán, nic neděláme
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalCoverUrl}
                alt={coverAlt || "Hlavní fotografie"}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                Hlavní fotografie
              </div>
              {onCoverDelete && (
                <div className="absolute top-1 right-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoverDelete();
                    }}
                    disabled={isPending || saving || uploadingGallery}
                    className="text-xs bg-white"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          )}

        {/* Původní cover obrázek (pokud není v galerii, ale je vybrán jiný cover) */}
        {originalCoverUrl &&
          !coverMarkedForDelete &&
          !galleryPhotos.find((p) => p.url === originalCoverUrl) &&
          (coverFromGallery || selectedCoverIndex !== null) &&
          onRestoreOriginalCover && (
            <div
              className={`relative border-2 border-gray-200 rounded-lg overflow-hidden transition-all ${
                isPending
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-gray-300 cursor-pointer"
              }`}
              onClick={() => {
                if (isPending) return;
                onRestoreOriginalCover();
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalCoverUrl}
                alt={coverAlt || "Gallery photo"}
                className="w-full h-32 object-cover"
              />
              {onCoverDelete && (
                <div className="absolute top-1 right-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCoverDelete();
                    }}
                    disabled={isPending || saving || uploadingGallery}
                    className="text-xs bg-white"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          )}

        {/* Obrázky z galerie */}
        {galleryPhotos.map((photo) => {
          const isMarkedForDelete = photosToDelete.includes(photo.id);
          const isCurrentCover =
            selectedCoverIndex === null &&
            ((coverUrl === photo.url && !coverMarkedForDelete) ||
              coverFromGallery?.url === photo.url);

          if (isMarkedForDelete) {
            return (
              <div
                key={photo.id}
                className="relative border-2 border-yellow-300 rounded-lg p-2 bg-yellow-50"
              >
                <div className="text-xs text-yellow-800 text-center mb-2">
                  Bude smazán
                </div>
                {onCancelRemovePhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelRemovePhoto(photo.id)}
                    disabled={isPending}
                    className="w-full"
                  >
                    Zrušit
                  </Button>
                )}
              </div>
            );
          }

          return (
            <div
              key={photo.id}
              className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } ${
                isCurrentCover
                  ? "border-green-500 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                if (isPending || !onCoverFromGallery) return;
                onCoverFromGallery(photo.url, photo.alt);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || "Gallery photo"}
                className="w-full h-32 object-cover"
              />
              {isCurrentCover && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Hlavní fotografie
                </div>
              )}
              {onRemoveGalleryPhoto && (
                <div className="absolute top-1 right-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveGalleryPhoto(photo.id);
                    }}
                    disabled={isPending || saving || uploadingGallery}
                    className="text-xs bg-white"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Preview nových obrázků */}
        {galleryPreviews.map((preview, index) => {
          const isCover = selectedCoverIndex === index;
          return (
            <div
              key={`preview-${index}`}
              className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } ${
                isCover
                  ? "border-green-500 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                if (isPending || !onCoverFromPreview) return;
                onCoverFromPreview(index);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover opacity-75"
              />
              {isCover && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Hlavní fotografie
                </div>
              )}
              {onRemovePreview && (
                <div className="absolute top-1 right-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePreview(index);
                    }}
                    disabled={isPending || saving || uploadingGallery}
                    className="text-xs bg-white"
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zpráva, že obrázek je označen k smazání */}
      {coverMarkedForDelete &&
        coverUrl &&
        !coverFromGallery &&
        galleryPreviews.length === 0 &&
        onCoverDeleteCancel && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Obrázek bude smazán po uložení změn</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCoverDeleteCancel}
                disabled={isPending}
              >
                Zrušit
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
