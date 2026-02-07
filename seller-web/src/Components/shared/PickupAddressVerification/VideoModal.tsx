import { Icon } from "@iconify/react";

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
}

export function VideoModal({ videoId, onClose }: VideoModalProps) {
  if (!videoId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
      >
        <button
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <Icon icon="mdi:close" className="w-8 h-8" />
        </button>
        <div className="relative pb-[56.25%] h-0" style={{ pointerEvents: "auto" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Onboarding Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ pointerEvents: "auto" }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

