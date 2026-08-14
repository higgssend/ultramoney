import React from 'react';
import { Download, FileText, Printer, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

interface ExportColumn<T = unknown> {
  header: string;
  key: string;
  format?: (value: T) => string;
}

interface DataExportToolbarProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  title: string;
}

export const DataExportToolbar = <T extends Record<string, unknown>>({ 
  data, 
  columns, 
  filename, 
  title 
}: DataExportToolbarProps<T>): React.ReactElement => {
  const { addToast } = useToast();

  const getExportData = () => {
    return data.map(item => {
      const row: Record<string, string | number | boolean | null> = {};
      columns.forEach(col => {
        const val = col.key.split('.').reduce<unknown>((o, i) => {
          if (o && typeof o === 'object' && i in o) {
            return (o as Record<string, unknown>)[i];
          }
          return null;
        }, item);
        row[col.header] = col.format ? col.format(val) : ((val as string | number | boolean | null) ?? '');
      });
      return row;
    });
  };

  const handleExportExcel = () => {
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)); // max 31 chars
      XLSX.writeFile(wb, `${filename}.xlsx`);
      addToast('Archivo Excel generado', 'success');
    } catch (error) {
      addToast('Error al exportar a Excel', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = getExportData();
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Archivo CSV generado', 'success');
    } catch (error) {
      addToast('Error al exportar a CSV', 'error');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Title
      doc.setFontSize(18);
      doc.text(`Reporte: ${title}`, 14, 22);
      
      // Date
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = data.map(item => {
        return columns.map(col => {
          const val = col.key.split('.').reduce((o, i) => (o ? o[i] : null), item);
          return col.format ? col.format(val) : (val ?? '');
        });
      });

      autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229] } // Indigo 600
      });

      doc.save(`${filename}.pdf`);
      addToast('Archivo PDF generado', 'success');
    } catch (error) {
      addToast('Error al exportar a PDF', 'error');
    }
  };

  const handlePrint = () => {
    try {
      const exportData = getExportData();
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const thead = columns.map(c => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f3f4f6;">${c.header}</th>`).join('');
      const tbody = exportData.map(row => {
        const tds = columns.map(c => `<td style="border: 1px solid #ddd; padding: 8px;">${row[c.header]}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <p>Generado el: ${new Date().toLocaleString()}</p>
            <table>
              <thead><tr>${thead}</tr></thead>
              <tbody>${tbody}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      addToast('Error al imprimir', 'error');
      addToast('Error al imprimir', 'error');
    }
  };

  const handleExportJPEG = async () => {
    try {
      addToast('Generando imagen JPEG...', 'info');
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1000px';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '40px';
      
      const exportData = getExportData();
      
      // Build HTML string for table
      container.innerHTML = `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h1 style="font-size: 24px; margin-bottom: 20px; color: #0f172a;">${title}</h1>
          <p style="margin-bottom: 20px; color: #64748b;">Generado el ${new Date().toLocaleDateString()}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                ${columns.map(col => `<th style="padding: 12px; border-bottom: 2px solid #e2e8f0;">${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${exportData.map((row, i) => `
                <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  ${columns.map(col => `<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${row[col.header]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 40px; text-align: right; color: #94a3b8; font-size: 12px;">
            Exportado desde UltraMoney
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${filename}.jpg`;
      link.click();
      
      addToast('Imagen JPEG descargada exitosamente', 'success');
    } catch (error) {
      console.error(error);
      addToast('Error al generar la imagen', 'error');
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-max">
      <button
        onClick={handleExportExcel}
        title="Exportar a Excel"
        className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4" />
      </button>
      <button
        onClick={handleExportCSV}
        title="Exportar a CSV"
        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={handleExportPDF}
        title="Exportar a PDF"
        className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
      >
        <FileText className="w-4 h-4" />
      </button>
      <button
        onClick={handleExportJPEG}
        title="Exportar a JPEG (Imagen)"
        className="p-1.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
      <button
        onClick={handlePrint}
        title="Imprimir"
        className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Printer className="w-4 h-4" />
      </button>
    </div>
  );
};
