'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import {
  downloadApplicationPdf,
  loadPdfAssets,
  type PdfAssets,
} from '@/utils/exportApplicationPdf';
import { ApplicationPdfTemplate, PDF_WIDTH } from '@/components/pdf/ApplicationPdfTemplate';

interface Props {
  application: AdoptionApplication;
  className?: string;
  iconSize?: number;
}

export const DownloadPdfButton: React.FC<Props> = ({
  application,
  className = 'p-1.5 rounded-lg text-gray-400 hover:text-[#E89B5A] hover:bg-orange-50 transition-colors disabled:opacity-50',
  iconSize = 16,
}) => {
  const [assets, setAssets] = useState<PdfAssets | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pageH, setPageH] = useState(0);

  // Thu nhỏ bản xem trước cho vừa khung
  useLayoutEffect(() => {
    if (!assets) return;
    const calc = () => {
      const w = scrollRef.current?.clientWidth ?? PDF_WIDTH;
      setScale(Math.min(1, (w - 32) / PDF_WIDTH));
      setPageH(pageRef.current?.offsetHeight ?? 0);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (scrollRef.current) ro.observe(scrollRef.current);
    if (pageRef.current) ro.observe(pageRef.current);
    return () => ro.disconnect();
  }, [assets]);

  const openPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreparing) return;
    try {
      setIsPreparing(true);
      setError(null);
      setAssets(await loadPdfAssets(application));
    } catch (err) {
      console.error(err);
      alert('Không thể tải bản xem trước. Vui lòng thử lại.');
    } finally {
      setIsPreparing(false);
    }
  };

  const close = () => {
    if (isDownloading) return;
    setAssets(null);
  };

  const confirm = async () => {
    if (!assets) return;
    try {
      setIsDownloading(true);
      setError(null);
      await downloadApplicationPdf(application, assets);
      setAssets(null);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      setError('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        disabled={isPreparing}
        title="Xem trước & tải đơn nhận nuôi (PDF)"
        className={className}
      >
        {isPreparing ? <Loader2 size={iconSize} className="animate-spin" /> : <Download size={iconSize} />}
      </button>

      {assets &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
          >
            <div
              className="bg-white w-full max-w-[880px] max-h-[94vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Xem trước đơn nhận nuôi</h3>
                  <p className="text-[12px] text-gray-500">Kiểm tra nội dung trước khi tải file PDF.</p>
                </div>
                <button onClick={close} disabled={isDownloading} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#EDEDED] py-4">
                <div style={{ width: PDF_WIDTH * scale, height: pageH * scale, margin: '0 auto' }}>
                  <div
                    ref={pageRef}
                    style={{ width: PDF_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                    className="shadow-lg"
                  >
                    <ApplicationPdfTemplate
                      application={application}
                      tr={assets.tr}
                      petImage={assets.petImage}
                      avatarImage={assets.avatarImage}
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
                <p className="text-[12px] text-red-600 min-h-[16px]">{error}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={close}
                    disabled={isDownloading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-semibold rounded-[10px] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirm}
                    disabled={isDownloading}
                    className="px-5 py-2 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[13px] font-bold rounded-[10px] flex items-center gap-1.5 disabled:opacity-70"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Đang tạo PDF...
                      </>
                    ) : (
                      <>
                        <Download size={14} /> Tải xuống
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DownloadPdfButton;