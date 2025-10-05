import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export default function PdfPreviewDialog({ open, onOpenChange, pdfUrl, title = 'Document' }) {
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


