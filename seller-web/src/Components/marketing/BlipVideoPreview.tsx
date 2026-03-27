import { useRef, useState } from "react"
import { Play } from "lucide-react"
import VideoPlayer from "@/Shared/VideoPlayer"

type BlipVideoPreviewProps = {
  src?: string
  poster?: string
  productName: string
}

export default function BlipVideoPreview({ src, poster, productName }: BlipVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!src) {
    return <div className="h-full w-full bg-[#F2F4F7]" />
  }

  return (
    <div className="relative h-full w-full">
      <VideoPlayer
        ref={videoRef}
        src={src}
        poster={poster}
        controls={isPlaying}
        muted={false}
        autoPlay={false}
        className="h-full w-full"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            aria-label={`Play blip video for ${productName}`}
            className="h-10 w-10 rounded-full bg-black/30 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={() => {
              setIsPlaying(true)
              videoRef.current?.play().catch(() => setIsPlaying(false))
            }}
          >
            <Play className="h-5 w-5 text-white" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}

