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
  detailedProposal?: boolean; // Требуется ли подробное КП для этой позиции
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
        scale: 1.5, // Уменьшаем масштаб с 2 до 1.5
        useCORS: true,
        logging: true,
        backgroundColor: null, // Оптимизация прозрачности
      });
      
      // Оптимизируем качество PNG
      const imgData = canvas.toDataURL('image/png', 0.85); // Уменьшаем качество до 85%
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true, // Включаем сжатие PDF
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const height = pdfWidth / ratio;

      // Добавляем изображение с оптимизированными настройками
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height, undefined, 'FAST');
      
      // Генерируем оптимизированный PDF
      const blob = pdf.output('blob');
      
      // Проверяем размер
      if (blob.size > 4 * 1024 * 1024) { // Если больше 4MB
        console.warn('⚠️ PDF слишком большой:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
        
        // Пробуем еще раз с меньшим качеством
        const canvas2 = await html2canvas(proposalRef.current, {
          scale: 1, // Уменьшаем масштаб еще сильнее
          useCORS: true,
          logging: true,
          backgroundColor: null,
        });
        
        const imgData2 = canvas2.toDataURL('image/png', 0.7); // Уменьшаем качество до 70%
        
        const pdf2 = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
          compress: true,
        });
        
        pdf2.addImage(imgData2, 'PNG', 0, 0, pdfWidth, height, undefined, 'FAST');
        return pdf2.output('blob');
      }
      
      return blob;

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
