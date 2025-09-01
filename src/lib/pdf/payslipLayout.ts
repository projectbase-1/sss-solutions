import jsPDF from 'jspdf';

// A4 Paper dimensions in mm (ISO 216)
export const A4_DIMENSIONS = {
  width: 210,
  height: 297,
  margins: {
    top: 15,
    bottom: 15,
    left: 10,
    right: 10
  }
} as const;

// Verification logging for PDF page size
export const verifyPDFPageSize = (doc: jsPDF) => {
  const pageInfo = doc.internal.pageSize;
  const actualWidth = Math.round(pageInfo.getWidth());
  const actualHeight = Math.round(pageInfo.getHeight());
  
  console.log('=== PDF Page Size Verification ===');
  console.log(`Expected A4 Dimensions: ${A4_DIMENSIONS.width}mm × ${A4_DIMENSIONS.height}mm`);
  console.log(`Actual PDF Dimensions: ${actualWidth}mm × ${actualHeight}mm`);
  console.log(`Format Match: ${actualWidth === A4_DIMENSIONS.width && actualHeight === A4_DIMENSIONS.height ? 'VERIFIED ✅' : 'MISMATCH ❌'}`);
  console.log(`Page Unit: ${doc.internal.scaleFactor} units per mm`);
  console.log(`Document Properties:`, doc.internal);
  console.log('================================');
  
  return {
    isValid: actualWidth === A4_DIMENSIONS.width && actualHeight === A4_DIMENSIONS.height,
    actual: { width: actualWidth, height: actualHeight },
    expected: A4_DIMENSIONS
  };
};

export interface PayslipData {
  employee: {
    id: string;
    employee_id: string;
    name: string;
    position: string;
    join_date: string;
    basic_salary: number;
    hra: number;
    allowances: number;
    gross_salary?: number;
    pf_number?: string;
    esi_number?: string;
  };
  branch: {
    name: string;
  };
  stats: {
    present_days: number;
    absent_days: number;
    late_days: number;
    ot_hours: number;
  };
  month: string;
}

export const drawPayslipSection = (
  doc: jsPDF,
  data: PayslipData,
  yPosition: number
): number => {
  const { employee, branch, stats, month } = data;
  
  // Verify PDF dimensions before drawing
  const verification = verifyPDFPageSize(doc);
  if (!verification.isValid) {
    console.warn('PDF dimensions do not match A4 standard!');
  }
  
  // Calculate financial values
  const otAmount = stats.ot_hours * 60;
  const grossEarnings = employee.gross_salary || (employee.basic_salary + employee.hra + employee.allowances) || 0; // Use monthly gross salary or calculate from components
  // PF calculation on basic + allowances only (excludes OT)
  const pfBaseSalary = employee.basic_salary + employee.hra + employee.allowances;
  const pf = Math.min(Math.round(pfBaseSalary * 0.12), 1800);
  const esi = Math.round(grossEarnings * 0.0075);
  const totalDeductions = pf + esi;
  const netPay = grossEarnings + otAmount - totalDeductions;
  
  const startX = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const availableWidth = pageWidth - (2 * margin);
  const availableHeight = pageHeight - (2 * margin);
  
  // Calculate section height to fit 3 sections with gaps
  const sectionGap = 2;
  const sectionHeight = (availableHeight - (2 * sectionGap)) / 3; // ~56mm per section
  
  let yPos = yPosition;
  
  // Draw main border
  doc.setLineWidth(1.0);
  doc.rect(startX, yPos, availableWidth, sectionHeight);
  
  // Scale factors for content
  const contentPadding = 8;
  const headerHeight = sectionHeight * 0.18; // 18% for header
  const infoHeight = sectionHeight * 0.26; // Increased to 26% for more breathing room in employee info
  const tableHeight = sectionHeight - headerHeight - infoHeight - 20; // Increased space for better layout
  
  // Header section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('SSS SOLUTIONS', startX + availableWidth/2, yPos + 8, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('PAYSLIP', startX + availableWidth/2, yPos + 15, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(branch.name, startX + availableWidth/2, yPos + 21, { align: 'center' });
  
  // Draw line under header
  const headerBottom = yPos + headerHeight;
  doc.setLineWidth(0.3);
  doc.line(startX + contentPadding, headerBottom + 1, startX + availableWidth - contentPadding, headerBottom + 1);
  
  // Employee information section
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  
  const employeeInfo = [
    [`Emp No: ${employee.employee_id || ''}`, `Employee Name: ${employee.name || ''}`],
    [`Designation: ${employee.position || ''}`, `Date of Join: ${employee.join_date || ''}`],
    [`Report Month: ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}`, `OT Hrs: ${stats.ot_hours.toFixed(1)} hrs`]
  ];
  
  let infoY = headerBottom + 5;
  const infoLineHeight = 4.8;
  employeeInfo.forEach(([left, right]) => {
    doc.text(left, startX + contentPadding, infoY);
    doc.text(right, startX + availableWidth/2 + contentPadding, infoY);
    infoY += infoLineHeight;
  });
  
  // Earnings and Deductions section
  const tableStartY = headerBottom + infoHeight + 2;
  const earningsX = startX + contentPadding;
  const deductionsX = startX + availableWidth/2 + contentPadding;
  const columnWidth = (availableWidth/2) - (2 * contentPadding);
  
  // Headers
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.text('Earnings', earningsX, tableStartY);
  doc.text('Amount', earningsX + columnWidth - 10, tableStartY, { align: 'right' });
  
  doc.text('Deductions', deductionsX, tableStartY);
  doc.text('Amount', deductionsX + columnWidth - 10, tableStartY, { align: 'right' });
  
  // Draw lines under headers
  doc.setLineWidth(0.2);
  doc.line(earningsX, tableStartY + 1, earningsX + columnWidth - 5, tableStartY + 1);
  doc.line(deductionsX, tableStartY + 1, deductionsX + columnWidth - 5, tableStartY + 1);
  
  // Data
  doc.setFont(undefined, 'normal');
  doc.setFontSize(6);
  const earnings = [
    ['Basic + D.A', grossEarnings.toFixed(2)], // Use monthly gross earnings
    ['HRA', employee.hra.toFixed(2)],
    ['Conveyance', '0.00'],
    ['Other Allowance', employee.allowances.toFixed(2)],
    ['Overtime Amount', otAmount.toFixed(2)]
  ];
  
  const deductions = [
    ['PF', pf.toFixed(2)],
    ['ESI', esi.toFixed(2)],
    ['Advance', '0.00'],
    ['Food Allowance', '0.00'],
    ['Other', '0.00']
  ];
  
  let dataY = tableStartY + 4;
  const dataLineHeight = 4.4;
  const maxRows = Math.min(earnings.length, deductions.length, 3); // Limit rows to fit
  
  for (let i = 0; i < maxRows; i++) {
    if (earnings[i]) {
      doc.text(earnings[i][0], earningsX, dataY);
      doc.text(earnings[i][1], earningsX + columnWidth - 10, dataY, { align: 'right' });
    }
    if (deductions[i]) {
      doc.text(deductions[i][0], deductionsX, dataY);
      doc.text(deductions[i][1], deductionsX + columnWidth - 10, dataY, { align: 'right' });
    }
    dataY += dataLineHeight;
  }
  
  // NET PAY - positioned between table data and totals
  const netPayHeight = 8;
  const netPayY = dataY + 3; // Small gap after the table data
  
  doc.setLineWidth(0.3);
  doc.rect(startX + contentPadding, netPayY, availableWidth - (2 * contentPadding), netPayHeight);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text(`NET PAY: ${netPay.toFixed(2)}`, startX + availableWidth/2, netPayY + netPayHeight/2 + 1, { align: 'center' });
  
  // Totals - positioned after NET PAY (without horizontal lines above)
  let totalsY = netPayY + netPayHeight + 3;
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(7);
  doc.text('Total Earnings', earningsX, totalsY);
  doc.text((grossEarnings + otAmount).toFixed(2), earningsX + columnWidth - 10, totalsY, { align: 'right' });
  doc.text('Total Deductions', deductionsX, totalsY);
  doc.text(totalDeductions.toFixed(2), deductionsX + columnWidth - 10, totalsY, { align: 'right' });
  
  // Footer Information - positioned at the bottom with proper spacing
  const footerY = yPos + sectionHeight - 15; // 15mm from bottom of section
  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  
  // Position elements with proper spacing - align ESI under "Advance"
  const leftColX = startX + contentPadding;
  const centerColX = startX + availableWidth/3;
  const rightColX = deductionsX; // Align with deductions column for ESI
  
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, leftColX, footerY);
  doc.text(`PF: ${employee.pf_number || 'N/A'}`, centerColX, footerY);
  doc.text(`ESI: ${employee.esi_number || 'N/A'}`, rightColX, footerY);
  
  return yPosition + sectionHeight + sectionGap; // Return next Y position with gap
};
