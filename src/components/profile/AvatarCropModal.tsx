"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button } from "@/components/ui/Button";

interface AvatarCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

export default function AvatarCropModal({
  imageSrc,
  onClose,
  onCropComplete,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug: zkontrolovat, jestli se imageSrc načítá
  useEffect(() => {
    console.log("[AvatarCropModal] imageSrc:", imageSrc ? "existuje" : "neexistuje", imageSrc?.substring(0, 50));
  }, [imageSrc]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Nastavit velikost canvasu na velikost cropu
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Vykreslit oříznutý obrázek
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Vytvořit kruhový crop
    const circleCanvas = document.createElement("canvas");
    const circleCtx = circleCanvas.getContext("2d");
    if (!circleCtx) {
      throw new Error("No 2d context");
    }

    const size = Math.min(pixelCrop.width, pixelCrop.height);
    circleCanvas.width = size;
    circleCanvas.height = size;

    // Vykreslit kruhový crop
    circleCtx.beginPath();
    circleCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    circleCtx.clip();
    circleCtx.drawImage(
      canvas,
      (size - pixelCrop.width) / 2,
      (size - pixelCrop.height) / 2
    );

    return new Promise((resolve, reject) => {
      circleCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Chyba při ořezávání:", error);
      alert("Chyba při ořezávání obrázku");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Upravit profilovou fotku
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Přesuňte a přibližte obrázek, poté klikněte na Uložit
          </p>
        </div>

        <div 
          className="relative bg-gray-900" 
          style={{ 
            height: "400px", 
            width: "100%",
            position: "relative"
          }}
        >
          {imageSrc ? (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
                cropShape="round"
                showGrid={false}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p>Načítání obrázku...</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Přiblížení
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Zrušit
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={!croppedAreaPixels}
            >
              Uložit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
