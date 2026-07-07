import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncentivePackage, IncentiveTier, SaleItem } from '../types/incentive';
import { formatCurrency } from './formatCurrency';
import { calculatePriceWithPpn } from './pricing';
import { MonthlyPayout, QuarterlyPayout } from './payoutEngine';

interface GenerateSalesPdfOptions {
  sales: SaleItem[];
  packages: IncentivePackage[];
  activeTier: IncentiveTier;
  totalSA: number;
  totalIncentive: number;
  monthlyPayout?: MonthlyPayout;
  quarterlyPayout?: QuarterlyPayout;
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
  monthlyPayout,
  quarterlyPayout,
  selectedMonthName,
  selectedYear,
  salespersonName,
  salesCode,
  output = 'save',
}: GenerateSalesPdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const paidIncentive = monthlyPayout?.monthlyIncome ?? Math.round(totalIncentive * 0.8);
  const currentMonth80 = monthlyPayout?.firstMonthAmount ?? Math.round(totalIncentive * 0.8);
  const saved20 = monthlyPayout?.deferredAmount ?? Math.round(totalIncentive * 0.2);
  const deferred20 = monthlyPayout?.deferredSourceAmount ?? 0;
  const upressPaid = quarterlyPayout?.totalAmount ?? 0;
  const totalIncome = paidIncentive + upressPaid;
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

  const summaryTop = 42;
  const cardWidth = (pageWidth - margin * 2 - 8) / 5;
  const summary = [
    ['SA Bulan Ini', `${totalSA} SA`],
    ['SA Triwulan', `${quarterlyPayout?.totalQuarterSA ?? totalSA} SA`],
    ['Insentif Dibayar', formatCurrency(paidIncentive)],
    ['Upress Dibayar', formatCurrency(upressPaid)],
    ['Total Pendapatan', formatCurrency(totalIncome)],
  ];

  summary.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 2);
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
    startY: 72,
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
  const boxTop = finalY + 7;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, boxTop, pageWidth - margin * 2, 38, 2, 2, 'FD');
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Skema Insentif Bulanan', margin + 4, boxTop + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Insentif bulan ini (100%): ${formatCurrency(totalIncentive)}`, margin + 4, boxTop + 16);
  doc.text(`80% dibayarkan bulan ini: ${formatCurrency(currentMonth80)}`, margin + 4, boxTop + 24);
  doc.text(`20% disimpan: ${formatCurrency(saved20)}`, margin + 4, boxTop + 32);
  doc.setFont('helvetica', 'bold');
  doc.text(`20% masuk dari ${monthlyPayout?.deferredSourcePeriod.label ?? '-'}: ${formatCurrency(deferred20)}`, pageWidth - margin - 4, boxTop + 24, { align: 'right' });
  doc.text(`Total insentif dibayar: ${formatCurrency(paidIncentive)}`, pageWidth - margin - 4, boxTop + 32, { align: 'right' });

  const upressRows = quarterlyPayout?.rows.map((row) => [
    row.label,
    `${row.totalSA} SA`,
    row.tierLabel,
    `${formatCurrency(row.baseAmount)} x ${row.percentage}%`,
    formatCurrency(row.amount),
  ]) ?? [];

  autoTable(doc, {
    startY: boxTop + 46,
    head: [['Periode Upress', 'SA', 'Tier', 'Perhitungan', 'Nominal']],
    body: upressRows.length ? upressRows : [['-', '0 SA', '<10 SA', '-', formatCurrency(0)]],
    foot: [['Total Upress Dibayar', `${quarterlyPayout?.totalQuarterSA ?? 0} SA`, '', '', formatCurrency(upressPaid)]],
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      1: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const incomeY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? boxTop + 66) + 7;
  doc.setDrawColor(221, 214, 254);
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, incomeY, pageWidth - margin * 2, 16, 2, 2, 'FD');
  doc.setTextColor(76, 29, 149);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Pendapatan Bulan Ini: ${formatCurrency(totalIncome)}`, pageWidth - margin - 4, incomeY + 10, { align: 'right' });
  doc.text(`Insentif ${formatCurrency(paidIncentive)} + Upress ${formatCurrency(upressPaid)}`, margin + 4, incomeY + 10);

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
