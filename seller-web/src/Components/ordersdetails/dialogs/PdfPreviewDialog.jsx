import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { useNotification } from '@/Hooks/useNotification';
import NotificationBanner from "@/Components/ui/NotificationBanner";

export default function PdfPreviewDialog({ open, onOpenChange, pdfUrl, title = 'Document' }) {
  const { notification, hideNotification } = useNotification();

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleDownload}>Download as PDF</Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="w-full h-[70vh] border rounded-md overflow-hidden bg-gray-50">
          {/* Notification Banner - Renders at this location for all pages */}
          {notification.isVisible && notification.type && (
            <div className=" pb-3 pt-0 lg:pt-2 ">
              <NotificationBanner
                message={notification.message}
                type={notification.type}
                visibility={notification.visibility}
                onClose={hideNotification}
              />
            </div>
          )}
          {pdfUrl ? (
            <iframe title="pdf-preview" src={pdfUrl} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Generating document…</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


