import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncentivePackage, IncentiveTier, SaleItem } from '../types/incentive';
import { formatCurrency } from './formatCurrency';
import { getTierLabel } from './getTier';
import { calculatePriceWithPpn } from './pricing';

interface GenerateSalesPdfOptions {
  sales: SaleItem[];
  packages: IncentivePackage[];
  activeTier: IncentiveTier;
  totalSA: number;
  totalIncentive: number;
  selectedMonthName: string;
  selectedYear: number;
  salespersonName?: string;
  salesCode?: string;
  output?: 'save' | 'blob';
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function generateSalesPdf({
  sales,
  packages,
  activeTier,
  totalSA,
  totalIncentive,
  selectedMonthName,
  selectedYear,
  salespersonName,
  salesCode,
  output = 'save',
}: GenerateSalesPdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const pay80 = Math.round(totalIncentive * 0.8);
  const pay20 = Math.round(totalIncentive * 0.2);
  const generatedAt = new Date().toLocaleString('id-ID');

  doc.setFillColor(31, 41, 55);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Kalkulator Insentif Sales', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Periode ${selectedMonthName} ${selectedYear}`, margin, 23);
  doc.text(`Dibuat ${generatedAt}`, margin, 29);
  if (salespersonName || salesCode) {
    doc.text(`Sales: ${salespersonName || '-'}${salesCode ? ` | SC: ${salesCode}` : ''}`, pageWidth - margin, 23, { align: 'right' });
  }

  const summaryTop = 44;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const summary = [
    ['Total SA', `${totalSA} SA`],
    ['Tier Aktif', getTierLabel(activeTier)],
    ['Total Insentif', formatCurrency(totalIncentive)],
    ['Rata-rata / SA', totalSA > 0 ? formatCurrency(totalIncentive / totalSA) : formatCurrency(0)],
  ];

  summary.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 3);
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, summaryTop, cardWidth, 22, 2, 2, 'FD');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(label, x + 3, summaryTop + 7);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(value, cardWidth - 6);
    doc.text(lines.slice(0, 2), x + 3, summaryTop + 15);
    doc.setFont('helvetica', 'normal');
  });

  const rows = sales.map((item, index) => {
    const selectedPackage = packages.find((pkg) => pkg.id === item.packageId);
    const incentivePerSA = selectedPackage?.[activeTier] ?? 0;
    return [
      String(index + 1),
      selectedPackage?.name ?? 'Paket tidak ditemukan',
      formatCurrency(selectedPackage?.productPrice ?? 0),
      formatCurrency(calculatePriceWithPpn(selectedPackage?.productPrice ?? 0)),
      `${item.quantity} SA`,
      formatCurrency(incentivePerSA),
      formatCurrency(incentivePerSA * item.quantity),
    ];
  });

  autoTable(doc, {
    startY: 76,
    head: [['No', 'Paket', 'Harga Produk', 'Harga + PPN', 'Jumlah', 'Insentif / SA', 'Subtotal']],
    body: rows.length ? rows : [['-', 'Belum ada data penjualan', '-', '-', '-', '-', '-']],
    foot: [['', 'Total', '', '', `${totalSA} SA`, '', formatCurrency(totalIncentive)]],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 92;
  const boxTop = finalY + 8;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, boxTop, pageWidth - margin * 2, 32, 2, 2, 'FD');
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Skema Pembayaran', margin + 4, boxTop + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`80% dibayarkan bulan pertama: ${formatCurrency(pay80)}`, margin + 4, boxTop + 17);
  doc.text(`20% dibayarkan bulan ketiga: ${formatCurrency(pay20)}`, margin + 4, boxTop + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatCurrency(totalIncentive)}`, pageWidth - margin - 4, boxTop + 25, { align: 'right' });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
    doc.text('Estimasi insentif. Validasi akhir mengikuti kebijakan perusahaan.', margin, 290);
  }

  const filename = `insentif-sales-${sanitizeFilename(salespersonName || selectedMonthName)}-${selectedYear}.pdf`;
  if (output === 'blob') {
    return doc.output('blob');
  }
  doc.save(filename);
  return undefined;
}
