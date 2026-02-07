import { Icon } from "@iconify/react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/Components/ui/dialog";

interface InitialViewProps {
  title: string;
  message: string;
  isPending: boolean;
  videoId: string | null;
  thumbnailUrl: string | null;
  onClose: () => void;
  onStartVerification: () => void;
  onOpenVideo: (e: React.MouseEvent) => void;
}

export function InitialView({
  title,
  message,
  isPending,
  videoId,
  thumbnailUrl,
  onClose,
  onStartVerification,
  onOpenVideo,
}: InitialViewProps) {
  return (
    <>
      <DialogHeader className="pb-2 mt-10 px-6">

        <DialogTitle className="flex items-center gap-3 flex-nowrap text-orange-600 text-xl font-semibold">
          <div className="bg-orange-100 p-2 rounded-full">
            <Icon
              icon={isPending ? "solar:clock-circle-bold" : "solar:shield-warning-bold"}
              className="h-6 w-6 text-orange-600"
            />
          </div>
          {title}
        </DialogTitle>
      </DialogHeader>

      <div className="pb-5 px-7">
        <p className="text-gray-700 text-sm mb-4 leading-relaxed">{message}</p>
        

        {!isPending && videoId && thumbnailUrl && (
          <div className="mt-4">
            <p className="text-gray-700 text-xs lg:text-sm mb-2 font-medium">
              <Icon icon="solar:play-circle-bold" className="h-4 w-4 text-blue-600 inline mr-1" />
              Watch our onboarding tutorial to learn how to complete your profile:
            </p>
            <div className="cursor-pointer group relative rounded-lg overflow-hidden" onClick={onOpenVideo}>
              <img
                src={thumbnailUrl}
                alt="Onboarding Tutorial"
                className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Icon icon="logos:youtube-icon" className="w-12 h-12" />
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex justify-end gap-3 pt-2 px-6 pb-6">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none font-medium flex items-center justify-center gap-2"
        >
          <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
          {isPending ? "Got it" : "Later"}
        </button>
        {!isPending && (
          <button
            onClick={onStartVerification}
            className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
          >
            <Icon icon="mdi:location" className="h-4 w-4" />
            Add Address
          </button>
        )}
      </DialogFooter>
    </>
  );
}

