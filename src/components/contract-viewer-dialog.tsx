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
  const [hasLoadError, setHasLoadError] = useState(false);

  if (!contractUrl) return null;

  const isPdf =
    contractUrl.toLowerCase().endsWith('.pdf') ||
    contractUrl.toLowerCase().includes('.pdf') ||
    contractName.toLowerCase().endsWith('.pdf');

  // Convert Cloudinary PDF URL into high-res rendered page JPG URL
  // e.g. https://res.cloudinary.com/.../image/upload/v1790078747/stg_tenant_contracts/abc.pdf
  //   => https://res.cloudinary.com/.../image/upload/f_auto,q_auto,pg_1/v1790078747/stg_tenant_contracts/abc.jpg
  // Preserving the version (/v.../) is critical so Cloudinary does not misinterpret folder names as transformation parameters.
  const getPageUrl = (page: number) => {
    if (!isPdf) return contractUrl;
    try {
      if (contractUrl.includes('res.cloudinary.com')) {
        let url = contractUrl;
        if (url.includes('/upload/')) {
          url = url.replace(
            /\/upload\/(v\d+\/)?/,
            (_, v) => `/upload/f_auto,q_auto,pg_${page}/${v || 'v1/'}`
          );
        }
        return url.replace(/\.pdf$/i, '.jpg');
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
      setHasLoadError(false);
    }
  };

  const handleNextPage = () => {
    if (!hasReachedEnd) {
      setCurrentPage((p) => p + 1);
      setIsLoadingImage(true);
      setHasLoadError(false);
    }
  };

  const currentDisplayUrl = getPageUrl(currentPage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] rounded-3xl border border-slate-200/90 shadow-2xl p-0 bg-white text-slate-900 flex flex-col overflow-hidden [&>button]:text-slate-500 [&>button]:hover:text-slate-900 [&>button]:bg-slate-100 [&>button]:hover:bg-slate-200 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:transition-colors">
        {/* Top Header Bar - Clean White Theme */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 truncate flex items-center gap-2">
                <span>{contractName}</span>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider hidden sm:inline-flex">
                  {isPdf ? 'PDF Contract' : 'Photo Contract'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 truncate">
                Contract for <span className="text-slate-900 font-semibold">{tenantName}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0 pr-8 sm:pr-10">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                onClick={() => setZoom((z) => Math.max(50, z - 20))}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-[11px] font-bold text-slate-700 px-1 w-10 text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                onClick={() => setZoom((z) => Math.min(250, z + 20))}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                onClick={() => setZoom(100)}
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Direct Link / Open in new tab */}
            <a
              href={currentDisplayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Full Size</span>
            </a>
          </div>
        </div>

        {/* Document Viewing Canvas - Clean Light Theme */}
        <div className="flex-1 bg-slate-100/70 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs z-10">
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">Loading document...</span>
              </div>
            </div>
          )}

          {hasLoadError && currentPage === 1 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-3xl shadow-lg max-w-md text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Document Uploaded Successfully</h4>
              <p className="text-xs text-slate-500">
                You can view or download the complete contract document directly using the full size viewer.
              </p>
              <a
                href={currentDisplayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open Original Document
              </a>
            </div>
          ) : (
            <div
              className="transition-transform duration-200 ease-out origin-top flex justify-center max-w-full"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentDisplayUrl}
                src={currentDisplayUrl}
                alt={`Contract page ${currentPage}`}
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-xl border border-slate-200 bg-white"
                onLoad={() => {
                  setIsLoadingImage(false);
                  setHasLoadError(false);
                }}
                onError={() => {
                  setIsLoadingImage(false);
                  if (currentPage > 1) {
                    setHasReachedEnd(true);
                    setCurrentPage((p) => p - 1);
                  } else {
                    setHasLoadError(true);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Pagination Bar - Clean Light Theme */}
        {isPdf && !hasLoadError && (
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
              <span>Page {currentPage}</span>
              {hasReachedEnd && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
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
                className="rounded-xl h-9 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={hasReachedEnd || isLoadingImage}
                className="rounded-xl h-9 text-xs font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 gap-1 shadow-xs"
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
