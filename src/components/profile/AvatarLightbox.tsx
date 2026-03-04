"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";

type Props = {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AvatarLightbox({ imageUrl, alt, isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) {
      // Zablokovat scrollování stránky když je lightbox otevřený
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        aria-label="Zavřít"
      >
        <FiX className="w-6 h-6" />
      </button>

      {/* Image container */}
      <div
        className="relative p-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-96 h-96 max-w-[80vw] max-h-[80vh] rounded-full overflow-hidden shadow-2xl border-4 border-white/20">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
