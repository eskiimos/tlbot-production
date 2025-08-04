'use client';

import { useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CommercialProposalHTML } from './CommercialProposalHTML';

interface CartItem {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  basePrice: number;
  selectedOptions: {[category: string]: string[]};
  optionsDetails: {
    id: string;
    name: string;
    category: string;
    price: number;
  }[];
  totalPrice: number;
  image?: string;
}

interface UserData {
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  inn?: string;
}

interface PDFGeneratorProps {
  cartItems: CartItem[];
  userData: UserData;
}

export default function usePDFGenerator({ cartItems, userData }: PDFGeneratorProps) {
  const proposalRef = useRef<HTMLDivElement>(null);

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!proposalRef.current) {
      console.error("Компонент для генерации PDF не смонтирован.");
      return null;
    }

    try {
      const canvas = await html2canvas(proposalRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const height = pdfWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
      
      return pdf.output('blob');

    } catch (error) {
      console.error("Ошибка при генерации PDF:", error);
      return null;
    }
  };

  const ProposalComponent = useMemo(() => {
    return (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
            <CommercialProposalHTML ref={proposalRef} cartItems={cartItems} userData={userData} />
        </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, userData, proposalRef]);


  return {
    generatePdfBlob,
    ProposalComponent
  };
}
