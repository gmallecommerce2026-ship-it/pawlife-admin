import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { AdoptionApplication } from '@/types/application';
import { buildPdfTranslated } from '@/utils/adoptionFormI18n';
import {
  ApplicationPdfTemplate,
  PDF_WIDTH,
  type PdfTranslated,
} from '@/components/pdf/ApplicationPdfTemplate';

export interface PdfAssets {
  tr: PdfTranslated;
  petImage?: string;
  avatarImage?: string;
}

const toDataUrl = async (url?: string | null): Promise<string | undefined> => {
  if (!url) return undefined;
  try {
    const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
    const src = isExternal ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;
    const res = await fetch(src, { cache: 'force-cache' });
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
};

/** Chuẩn bị dữ liệu cho PDF: dịch tĩnh (tức thì) + tải ảnh song song */
export const loadPdfAssets = async (application: AdoptionApplication): Promise<PdfAssets> => {
  const [petImage, avatarImage] = await Promise.all([
    toDataUrl(application.pet?.avatarUrl || application.pet?.images?.[0]?.url),
    toDataUrl(application.user?.avatarUrl),
  ]);
  return { tr: buildPdfTranslated(application), petImage, avatarImage };
};

const safeFileName = (a: AdoptionApplication) => {
  const first = (a.fullName || a.user?.name || 'Nguoi_nhan_nuoi').trim().split(/\s+/)[0];
  return `${first} - Don_nhan_nuoi.pdf`;
};

export const downloadApplicationPdf = async (
  application: AdoptionApplication,
  assets?: PdfAssets,
  fileName?: string,
) => {
  const [{ default: html2canvas }, { jsPDF }, ready] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
    assets ? Promise.resolve(assets) : loadPdfAssets(application),
  ]);

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_WIDTH}px;pointer-events:none;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() =>
      root.render(
        <ApplicationPdfTemplate
          application={application}
          tr={ready.tr}
          petImage={ready.petImage}
          avatarImage={ready.avatarImage}
        />,
      ),
    );

    await (document as any).fonts?.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const el = host.firstElementChild as HTMLElement | null;
    if (!el) throw new Error('Không render được template PDF');

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFDFD',
      width: el.offsetWidth,
      windowWidth: PDF_WIDTH,
    });

    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pdf = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'px', format: [w, h], hotfixes: ['px_scaling'] });
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
    pdf.save(fileName || safeFileName(application));
  } finally {
    root.unmount();
    host.remove();
  }
};