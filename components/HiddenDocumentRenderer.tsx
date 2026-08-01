import React, { useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { DocumentTemplate } from './DocumentTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { insforge } from '../lib/insforge';

export const HiddenDocumentRenderer: React.FC = () => {
  const { pdfQueue, removePdfJob, companySettings } = useStore();
  const processingRef = useRef(false);

  useEffect(() => {
    if (pdfQueue.length > 0 && !processingRef.current) {
      const processNext = async () => {
        processingRef.current = true;
        const job = pdfQueue[0];

        try {
          // Give DOM a small moment to render the template
          await new Promise(resolve => setTimeout(resolve, 500));

          const printElement = document.getElementById(`hidden-pdf-${job.id}`);
          if (!printElement) throw new Error("Element not found");

          const canvas = await html2canvas(printElement, { scale: 2 });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const pdf = new jsPDF('p', 'mm', 'letter');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          const pdfBlob = pdf.output('blob');
          
          const fileName = `${job.client.id}_${job.type}_${Date.now()}.pdf`;
          
          const { error } = await (insforge.storage.from('client-documents').upload as any)(
            fileName, 
            pdfBlob, 
            { contentType: 'application/pdf', upsert: true }
          );

          if (error) throw error;
          
          const { data: publicData } = insforge.storage.from('client-documents').getPublicUrl(fileName);
          const docLink = publicData.publicUrl;
          
          // Save URL to client_documents table
          await insforge.database.from('client_documents').insert({
            client_id: job.client.id,
            title: `Documento ${job.type} - ${new Date().toLocaleDateString('es-DO')}`,
            type: job.type,
            file_url: docLink,
            file_type: 'application/pdf',
            upload_date: new Date().toISOString(),
            lender_id: job.client.lender_id || '' // Must pass lender_id for RLS
          });

          console.log(`Successfully generated and uploaded ${job.type} PDF for client ${job.client.name}`);
        } catch (err) {
          console.error("Error generating hidden PDF:", err);
        } finally {
          removePdfJob(job.id);
          processingRef.current = false;
        }
      };

      processNext();
    }
  }, [pdfQueue, removePdfJob, companySettings]);

  if (pdfQueue.length === 0) return null;

  const activeJob = pdfQueue[0];

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
      <DocumentTemplate 
        id={`hidden-pdf-${activeJob.id}`}
        docType={activeJob.type}
        client={activeJob.client}
        company={companySettings}
        loan={activeJob.loan}
        cashierName={activeJob.cashierName}
        transaction={activeJob.transaction}
      />
    </div>
  );
};
