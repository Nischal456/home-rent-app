'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

interface ContractViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractUrl?: string;
  contractName?: string;
  tenantName?: string;
}

export function ContractViewerDialog({
  isOpen,
  onClose,
  contractUrl,
  contractName = 'Rental Agreement Contract',
  tenantName = 'Tenant',
}: ContractViewerDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  if (!contractUrl) return null;

  const isPdf =
    contractUrl.toLowerCase().endsWith('.pdf') ||
    contractUrl.toLowerCase().includes('.pdf') ||
    contractName.toLowerCase().endsWith('.pdf');

  // Convert Cloudinary PDF URL into high-res rendered page JPG URL
  // e.g. https://res.cloudinary.com/.../image/upload/v123/...pdf
  //   => https://res.cloudinary.com/.../image/upload/f_auto,q_auto,pg_1/v123/...jpg
  const getPageUrl = (page: number) => {
    if (!isPdf) return contractUrl;
    try {
      if (contractUrl.includes('res.cloudinary.com')) {
        return contractUrl
          .replace(/\/upload\/(?:v\d+\/)?/, (match) => {
            return `/upload/f_auto,q_auto,pg_${page}/`;
          })
          .replace(/\.pdf$/i, '.jpg');
      }
    } catch {
      // fallback
    }
    return contractUrl;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setHasReachedEnd(false);
      setIsLoadingImage(true);
    }
  };

  const handleNextPage = () => {
    if (!hasReachedEnd) {
      setCurrentPage((p) => p + 1);
      setIsLoadingImage(true);
    }
  };

  const currentDisplayUrl = getPageUrl(currentPage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] rounded-[2.5rem] border border-slate-200 shadow-2xl p-0 bg-slate-900 text-white flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-black text-white truncate flex items-center gap-2">
                <span>{contractName}</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
                  {isPdf ? 'PDF Contract' : 'Photo Contract'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 truncate">
                Contract for <span className="text-slate-200 font-semibold">{tenantName}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg"
                onClick={() => setZoom((z) => Math.max(50, z - 20))}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-[11px] font-bold text-slate-300 px-1 w-10 text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg"
                onClick={() => setZoom((z) => Math.min(250, z + 20))}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg"
                onClick={() => setZoom(100)}
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Direct Link / Open in new tab */}
            <a
              href={isPdf ? currentDisplayUrl : contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Full Size</span>
            </a>
          </div>
        </div>

        {/* Document Viewing Area */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                <span className="text-xs font-bold text-slate-300">Rendering contract...</span>
              </div>
            </div>
          )}

          <div
            className="transition-transform duration-200 ease-out origin-top flex justify-center max-w-full"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              key={currentDisplayUrl}
              src={currentDisplayUrl}
              alt={`Contract page ${currentPage}`}
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800 bg-white"
              onLoad={() => setIsLoadingImage(false)}
              onError={() => {
                setIsLoadingImage(false);
                if (currentPage > 1) {
                  setHasReachedEnd(true);
                  setCurrentPage((p) => p - 1);
                }
              }}
            />
          </div>
        </div>

        {/* Bottom Pagination Bar (for multi-page PDF documents) */}
        {isPdf && (
          <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span>Page {currentPage}</span>
              {hasReachedEnd && (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                  Last Page
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isLoadingImage}
                className="rounded-xl h-9 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={hasReachedEnd || isLoadingImage}
                className="rounded-xl h-9 text-xs font-bold border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
