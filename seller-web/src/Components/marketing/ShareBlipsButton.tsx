import { useState } from "react"
import { Share2 } from "lucide-react"
import { useNotification } from "@/Hooks/useNotification"

type ShareBlipsButtonProps = {
  blipLink?: string
  blipUrl?: string
  productName: string
  className?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err)
    }
  }

  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)

    return successful
  } catch (err) {
    console.error("Fallback copy method failed:", err)
    return false
  }
}

export default function ShareBlipsButton({ blipLink, blipUrl, productName, className }: ShareBlipsButtonProps) {
  const { showNotification } = useNotification()
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = async () => {
    const linkToCopy = blipLink || blipUrl || ""

    if (!linkToCopy) {
      showNotification("No link available to share", "error")
      return
    }

    const success = await copyToClipboard(linkToCopy)
    if (success) {
      setIsCopied(true)
      showNotification("Blip link copied to clipboard!", "information")
      setTimeout(() => setIsCopied(false), 2000)
    } else {
      showNotification("Failed to copy blip link", "error")
    }
  }

  return (
    <button
      type="button"
      className={
        className ??
        "h-8 px-3 rounded-[10px] whitespace-nowrap border border-[#0BB248] text-[#0BB248] text-xs font-semibold hover:bg-[#0BB248]/10 flex items-center gap-2"
      }
      aria-label={`Share blip for ${productName}`}
      onClick={handleShare}
      data-copied={isCopied ? "true" : "false"}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      Share Blips
    </button>
  )
}

