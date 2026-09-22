'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, CheckCircle2, Phone, Calendar, ExternalLink, X, Plus, Sparkles, Image as ImageIcon, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import NepaliDate from 'nepali-date-converter';

interface EditTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
  onSuccess: () => void;
  onViewContract?: () => void;
}

// Client-side quick compression for large phone photos
async function compressImageIfNeeded(file: File): Promise<File | Blob> {
  if (!file.type.startsWith('image/') || file.size < 1.5 * 1024 * 1024) {
    return file; // Already small or not an image
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// Blazing fast direct upload to Cloudinary using signed XMLHttpRequest with live progress
function uploadDirectToCloudinary(
  file: File | Blob,
  fileName: string,
  signData: { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string },
  onProgress: (pct: number) => void
): Promise<{ url: string; name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file, fileName);
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('folder', signData.folder);
    formData.append('signature', signData.signature);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({
            url: res.secure_url || res.url,
            name: fileName,
          });
        } catch {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during direct upload'));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, true);
    xhr.send(formData);
  });
}

export function EditTenantDialog({ isOpen, onClose, tenant, onSuccess, onViewContract }: EditTenantDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  useEffect(() => {
    if (tenant && isOpen) {
      setPhoneNumber(tenant.phoneNumber || tenant.phone || '');
      setRentAmount(tenant.roomId?.rentAmount != null ? String(tenant.roomId.rentAmount) : '');
      if (tenant.leaseEndDate) {
        try {
          const d = new Date(tenant.leaseEndDate);
          if (!isNaN(d.getTime())) {
            setLeaseEndDate(d.toISOString().split('T')[0]);
          } else {
            setLeaseEndDate('');
          }
        } catch {
          setLeaseEndDate('');
        }
      } else {
        setLeaseEndDate('');
      }
      setSelectedFile(null);
      setUploadProgress(null);
      setProgressPercent(null);
    }
  }, [tenant, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be under 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?._id) return;

    setIsSubmitting(true);
    setUploadProgress(null);
    setProgressPercent(null);

    try {
      let contractUrl = tenant.contractDocument;
      let contractName = tenant.contractName;

      // 1. Fast Direct Upload to Cloudinary if new file selected
      if (selectedFile) {
        setUploadProgress('Preparing file...');
        const preparedFile = await compressImageIfNeeded(selectedFile);

        setUploadProgress('Connecting to Cloudinary...');
        try {
          // Attempt fast direct client-to-Cloudinary upload
          const signRes = await fetch('/api/upload/contract/sign');
          const signData = await signRes.json();

          if (!signRes.ok || !signData.success) {
            throw new Error(signData.message || 'Signature failed');
          }

          setUploadProgress('Uploading directly to Cloudinary...');
          const uploadResult = await uploadDirectToCloudinary(
            preparedFile,
            selectedFile.name,
            signData,
            (pct) => {
              setProgressPercent(pct);
              setUploadProgress(`Uploading: ${pct}%`);
            }
          );

          contractUrl = uploadResult.url;
          contractName = uploadResult.name;
        } catch (directErr: any) {
          console.warn('Direct upload fallback:', directErr);
          // Fallback to server route if direct upload failed
          setUploadProgress('Uploading document via server...');
          const formData = new FormData();
          formData.append('file', preparedFile, selectedFile.name);

          const uploadRes = await fetch('/api/upload/contract', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success) {
            throw new Error(uploadData.message || 'Failed to upload contract');
          }

          contractUrl = uploadData.url;
          contractName = uploadData.name;
        }
      }

      // 2. Update tenant details in MongoDB
      setUploadProgress('Saving tenant profile...');
      const patchRes = await fetch(`/api/admin/tenants/${tenant._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          rentAmount: rentAmount.trim() !== '' ? Number(rentAmount) : undefined,
          leaseEndDate: leaseEndDate ? new Date(leaseEndDate).toISOString() : null,
          contractDocument: contractUrl,
          contractName: contractName,
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        throw new Error(patchData.message || 'Failed to update tenant details');
      }

      toast.success(
        tenant.contractDocument || selectedFile
          ? 'Tenant details & contract updated!'
          : 'Tenant details saved successfully!',
        { icon: '✅' }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating tenant details:', err);
      toast.error(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
      setProgressPercent(null);
    }
  };

  const nepaliLeaseEndPreview = leaseEndDate ? (() => {
    try {
      return new NepaliDate(new Date(leaseEndDate)).format('YYYY MMMM DD');
    } catch {
      return '';
    }
  })() : '';

  const hasContract = Boolean(tenant?.contractDocument);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 sm:p-8 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {hasContract ? '📝 Edit Tenant & Contract' : '📄 Add Contract & Tenant Details'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-semibold text-slate-500">
            {hasContract
              ? `Manage phone number, lease end time, or replace agreement contract for `
              : `Add mobile number, lease end date, and upload agreement contract for `}
            <strong className="text-slate-800">{tenant?.fullName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {/* Phone / Mobile Number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile / Phone Number
            </Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9841234567"
              className="h-12 rounded-2xl border-slate-200 font-semibold text-slate-900 focus:ring-blue-100"
            />
          </div>

          {/* Monthly Rent (Rs) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Monthly Rent (Rs)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                Rs
              </span>
              <Input
                type="number"
                min="0"
                step="100"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder="e.g. 18600"
                className="pl-11 h-12 rounded-2xl border-slate-200 font-semibold text-slate-900 focus:ring-blue-100"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Base recurring rent for unit {tenant?.roomId?.roomNumber || 'assigned room'}.
            </p>
          </div>

          {/* Lease End Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" /> Lease End Date / Time
            </Label>
            <Input
              type="date"
              value={leaseEndDate}
              onChange={(e) => setLeaseEndDate(e.target.value)}
              className="h-12 rounded-2xl border-slate-200 font-semibold text-slate-900 focus:ring-blue-100"
            />
            {nepaliLeaseEndPreview && (
              <p className="text-[11px] font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200/70 inline-block">
                Nepali Date: {nepaliLeaseEndPreview} B.S.
              </p>
            )}
          </div>

          {/* Contract Document (PDF or Photo) via Cloudinary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Agreement Contract (PDF or Photo)
              </Label>
              {hasContract ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] font-bold tracking-wider uppercase">
                  Active Contract
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-bold tracking-wider uppercase">
                  No contract added
                </Badge>
              )}
            </div>

            {/* Existing contract display */}
            {hasContract && !selectedFile && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {tenant.contractName || 'Current Agreement Contract'}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700">Stored on Cloudinary</span>
                  </div>
                </div>
                {onViewContract && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onViewContract}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs h-8"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </Button>
                )}
              </div>
            )}

            {/* Upload input zone */}
            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center transition-all bg-slate-50/60 hover:bg-white group cursor-pointer">
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                {selectedFile ? (
                  <div className="text-xs">
                    <span className="font-bold text-emerald-700 block">Selected: {selectedFile.name}</span>
                    <span className="text-slate-400 font-medium">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) - Click to replace</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {hasContract ? 'Click to replace contract with new file' : 'Click to select contract PDF or photo'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      Fast Direct Upload to Cloudinary (PDF, PNG, JPG, WEBP)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {uploadProgress && (
            <div className="space-y-1.5 p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {uploadProgress}
                </span>
                {progressPercent !== null && <span>{progressPercent}%</span>}
              </div>
              {progressPercent !== null && (
                <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl h-12 font-bold border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl h-12 font-bold bg-[#0B2863] hover:bg-[#0B2863]/90 text-white flex-1 shadow-md gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving...
                </>
              ) : hasContract ? (
                'Save Changes'
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Contract & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
