import { Response } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../config/prisma';
import { ApiResponse } from '../types/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import { getFilteredPgIds } from '../utils/reportHelpers';
import {
  calculatePGPerformance,
  calculateRoomUtilization,
  calculatePaymentAnalytics,
  calculateFinancialSummary
} from '../utils/pgReportCalculators';

// Helper function to create header section
const createHeaderSection = (
  worksheet: ExcelJS.Worksheet, 
  reportType: 'weekly' | 'monthly', 
  dateInfo: any, 
  pgType: string, 
  sheetName: string
) => {
  // Add a title row with branding
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'MRM PG MANAGEMENT SYSTEM';
  titleCell.font = { 
    size: 22, 
    bold: true, 
    color: { argb: 'FFFFFF' },
    name: 'Calibri'
  };
  titleCell.alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  titleCell.fill = {
    type: 'gradient',
    gradient: 'angle',
    degree: 0,
    stops: [
      { position: 0, color: { argb: '1F4E79' } },
      { position: 1, color: { argb: '2F5496' } }
    ]
  };

  // Add sheet title
  worksheet.mergeCells('A2:K2');
  const sheetTitleCell = worksheet.getCell('A2');
  sheetTitleCell.value = `${sheetName.toUpperCase()} - ${pgType}`;
  sheetTitleCell.font = { 
    size: 16, 
    bold: true,
    color: { argb: 'FFFFFF' },
    name: 'Calibri'
  };
  sheetTitleCell.alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  sheetTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };

  // Add date range information
  worksheet.mergeCells('A3:K3');
  const dateCell = worksheet.getCell('A3');
  let dateText = '';
  if (reportType === 'weekly') {
    const startDate = dateInfo.startDate.toLocaleDateString();
    const endDate = dateInfo.endDate.toLocaleDateString();
    dateText = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleDateString()}`;
  } else {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[dateInfo.startDate.getMonth()];
    const year = dateInfo.startDate.getFullYear();
    dateText = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: ${month} ${year} | Generated: ${new Date().toLocaleDateString()}`;
  }
  dateCell.value = dateText;
  dateCell.font = { 
    size: 12, 
    italic: true,
    color: { argb: 'FFFFFF' },
    name: 'Calibri'
  };
  dateCell.alignment = { 
    vertical: 'middle', 
    horizontal: 'center' 
  };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '70AD47' }
  };

  // Style the first 3 rows with professional borders and heights
  [1, 2, 3].forEach(rowNumber => {
    const row = worksheet.getRow(rowNumber);
    row.height = rowNumber === 1 ? 35 : 30;
    for (let col = 1; col <= 20; col++) {
      const cell = row.getCell(col);
      cell.border = {
        top: { style: 'medium', color: { argb: '1F4E79' } },
        left: { style: 'medium', color: { argb: '1F4E79' } },
        bottom: { style: 'medium', color: { argb: '1F4E79' } },
        right: { style: 'medium', color: { argb: '1F4E79' } }
      };
    }
  });

  return 5; // Return next available row with extra spacing
};

// Helper function to create a professional table
const createTable = (worksheet: ExcelJS.Worksheet, startRow: number, data: any[], headers: string[], formatters: any[] = []) => {
  // Helper function to get header color based on category
  const getHeaderColor = (header: string): string => {
    // General info headers - Dark Blue
    if (header.includes('PG Name') || header.includes('PG Location') || header.includes('PG Type') || header.includes('Room Number')) {
      return '1F4E79';
    }
    // Member/Occupancy related - Purple
    if (header.includes('Members') || header.includes('Occupants') || header.includes('Capacity') || header.includes('Occupied') || header.includes('Vacant') || header.includes('Utilization')) {
      return '663399';
    }
    // Revenue/Financial - Green
    if (header.includes('Revenue') || header.includes('Amount') || header.includes('Rent') || header.includes('Cash') || header.includes('Collection')) {
      return '548235';
    }
    // Payment related - Orange
    if (header.includes('Payment') || header.includes('Due') || header.includes('Pending') || header.includes('Overdue') || header.includes('Received') || header.includes('Approved')) {
      return 'C65911';
    }
    // Rates/Percentages - Teal
    if (header.includes('Rate') || header.includes('Efficiency') || header.includes('Variance') || header.includes('%')) {
      return '217346';
    }
    // Status/Trend - Red
    if (header.includes('Status') || header.includes('Trend') || header.includes('Advance')) {
      return 'C5504B';
    }
    // Default - Dark Blue
    return '1F4E79';
  };

  // Headers with individual colors
  const headerRow = worksheet.getRow(startRow);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { 
      bold: true, 
      color: { argb: 'FFFFFF' },
      size: 12,
      name: 'Calibri'
    };
    cell.fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: getHeaderColor(header) } 
    };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: '000000' } },
      left: { style: 'medium', color: { argb: '000000' } },
      bottom: { style: 'medium', color: { argb: '000000' } },
      right: { style: 'medium', color: { argb: '000000' } }
    };
  });
  headerRow.height = 35;

  let currentRow = startRow + 1;

  // Create field mappings for each sheet type
  const fieldMappings: { [key: string]: string[] } = {
    'PG Performance Report': ['pgName', 'pgLocation', 'pgType', 'totalMembers', 'newMembersThisWeek', 'totalRooms', 'occupiedRooms', 'vacantRooms', 'occupancyRate', 'weeklyRevenue', 'pendingPayments', 'overduePayments', 'paymentApprovalRate', 'avgPaymentAmount', 'revenuePerMember'],
    'Room Utilization Report': ['pgName', 'pgLocation', 'roomNo', 'capacity', 'currentOccupants', 'utilizationRate', 'rentAmount', 'weeklyRevenue', 'isFullyOccupied', 'revenueEfficiency'],
    'Payment Analytics Report': ['pgName', 'pgLocation', 'totalPaymentsDue', 'paymentsReceived', 'paymentsApproved', 'paymentsPending', 'paymentsOverdue', 'totalAmountDue', 'totalAmountReceived', 'collectionEfficiency'],
    'Financial Summary Report': ['pgName', 'pgLocation', 'expectedRevenue', 'actualRevenue', 'pendingRevenue', 'overdueRevenue', 'advanceCollected', 'totalCashInflow', 'revenueVariance', 'cashFlowStatus', 'collectionTrend']
  };

  // Determine which mapping to use based on the first header
  let fieldMapping: string[] = [];
  if (headers[0] === 'PG Name' && headers.length > 10) {
    if (headers.includes('New Members')) {
      fieldMapping = fieldMappings['PG Performance Report'];
    } else if (headers.includes('Total Payments Due')) {
      fieldMapping = fieldMappings['Payment Analytics Report'];
    } else if (headers.includes('Expected Revenue (₹)')) {
      fieldMapping = fieldMappings['Financial Summary Report'];
    }
  } else if (headers[0] === 'PG Name' && headers.includes('Room Number')) {
    fieldMapping = fieldMappings['Room Utilization Report'];
  }

  // Helper function to get cell color based on value and type
  const getCellColor = (value: any, formatter: string, header: string): string => {
    if (formatter === 'percentage') {
      if (typeof value === 'number') {
        if (value >= 80) return 'E2EFDA'; // Light green - Excellent
        if (value >= 60) return 'FFF2CC'; // Light yellow - Good
        if (value >= 40) return 'FFE699'; // Yellow - Average
        return 'FFCDD2'; // Light red - Poor
      }
    }
    if (formatter === 'currency' || (typeof value === 'number' && value > 1000)) {
      return 'E8F5E8'; // Very light green for financial data
    }
    if (header.includes('Pending') || header.includes('Overdue')) {
      if (typeof value === 'number' && value > 0) {
        return 'FFEBEE'; // Light red for pending/overdue items
      }
    }
    if (header.includes('Status')) {
      if (value === 'Positive' || value === 'Good') return 'E8F5E8';
      if (value === 'Negative' || value === 'Poor') return 'FFEBEE';
      return 'FFF3E0'; // Light orange for neutral
    }
    return 'FFFFFF'; // Default white
  };

  // Data rows with smart conditional formatting
  data.forEach((rowData, rowIndex) => {
    const dataRow = worksheet.getRow(currentRow);
    
    // Use the field mapping if available, otherwise fall back to generic mapping
    const rowValues = fieldMapping.length > 0 
      ? fieldMapping.map(field => {
          let value = rowData[field];
          
          // Handle special formatting for boolean values
          if (field === 'isFullyOccupied') {
            value = value ? 'Yes' : 'No';
          }
          
          // Handle null/undefined values
          if (value === null || value === undefined) {
            value = 0;
          }
          
          return value;
        })
      : headers.map(header => {
          const headerKey = header.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');
          const matchingKey = Object.keys(rowData).find(k => 
            k.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '') === headerKey
          );
          return matchingKey ? rowData[matchingKey] : '';
        });

    rowValues.forEach((cellValue: any, colIndex: number) => {
      const cell = dataRow.getCell(colIndex + 1);
      cell.value = cellValue;
      
      // Apply formatters if provided
      if (formatters[colIndex]) {
        if (formatters[colIndex] === 'currency') {
          cell.numFmt = '#,##0';
        } else if (formatters[colIndex] === 'percentage') {
          cell.numFmt = '0.00"%"';
        } else if (formatters[colIndex] === 'number') {
          cell.numFmt = '#,##0';
        }
      }
      
      // Apply smart conditional formatting
      const cellColor = getCellColor(cellValue, formatters[colIndex], headers[colIndex]);
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: cellColor } 
      };
      
      // Font styling based on content
      if (typeof cellValue === 'number') {
        cell.font = { 
          name: 'Calibri', 
          size: 11,
          bold: formatters[colIndex] === 'currency'
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'right' 
        };
      } else {
        cell.font = { 
          name: 'Calibri', 
          size: 11 
        };
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: 'left' 
        };
      }
      
      // Professional borders
      cell.border = {
        top: { style: 'thin', color: { argb: '366092' } },
        left: { style: 'thin', color: { argb: '366092' } },
        bottom: { style: 'thin', color: { argb: '366092' } },
        right: { style: 'thin', color: { argb: '366092' } }
      };
    });
    
    // Row styling
    dataRow.height = 25;
    
    // Alternate row background for better readability
    if (rowIndex % 2 === 0) {
      for (let col = 1; col <= headers.length; col++) {
        const cell = dataRow.getCell(col);
        const currentFill = cell.fill as ExcelJS.FillPattern;
        if (!currentFill || currentFill.fgColor?.argb === 'FFFFFF') {
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'F8F9FA' } 
          };
        }
      }
    }
    
    currentRow++;
  });

  // Auto-fit column widths with professional spacing
  worksheet.columns.forEach((column, index) => {
    let maxLength = 0;
    
    worksheet.eachRow((row, rowNumber) => {
      const cell = row.getCell(index + 1);
      if (cell.value) {
        const cellValue = cell.value.toString();
        maxLength = Math.max(maxLength, cellValue.length);
      }
    });
    
    // Set professional column widths
    column.width = Math.min(Math.max(maxLength + 3, 12), 25);
  });

  // Add a summary/total row if it's financial data
  if (headers.some(h => h.includes('Revenue') || h.includes('Amount'))) {
    const summaryRow = worksheet.getRow(currentRow + 1);
    summaryRow.getCell(1).value = 'TOTALS';
    summaryRow.getCell(1).font = { bold: true, name: 'Calibri', size: 12 };
    summaryRow.getCell(1).fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'D9E1F2' } 
    };
    
    headers.forEach((header, index) => {
      const cell = summaryRow.getCell(index + 1);
      if (header.includes('Revenue') || header.includes('Amount')) {
        // Add sum formula for financial columns
        const columnLetter = String.fromCharCode(65 + index);
        cell.value = { formula: `SUM(${columnLetter}${startRow + 1}:${columnLetter}${currentRow})` };
        cell.numFmt = '#,##0';
        cell.font = { bold: true, name: 'Calibri', size: 11 };
      }
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'D9E1F2' } 
      };
      cell.border = {
        top: { style: 'medium', color: { argb: '366092' } },
        left: { style: 'thin', color: { argb: '366092' } },
        bottom: { style: 'medium', color: { argb: '366092' } },
        right: { style: 'thin', color: { argb: '366092' } }
      };
    });
    summaryRow.height = 30;
  }

  return currentRow + 3; // Return next available row with spacing
};

export const downloadReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if admin exists in request
    if (!req.admin || !req.admin.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      } as ApiResponse<null>);
      return;
    }

    // Get admin details
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { pgType: true },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    // Parse query parameters
    const { reportType } = req.params as { reportType: 'weekly' | 'monthly' };
    const { startDate, endDate, month, year } = req.query;

    // Validate report type
    if (!reportType || !['weekly', 'monthly'].includes(reportType)) {
      res.status(400).json({
        success: false,
        message: "Invalid report type. Must be 'weekly' or 'monthly'",
      } as ApiResponse<null>);
      return;
    }

    const isWeekly = reportType === 'weekly';

    // Validate required parameters
    if (isWeekly && (!startDate || !endDate)) {
      res.status(400).json({
        success: false,
        message: "Start date and end date are required for weekly reports",
      } as ApiResponse<null>);
      return;
    }

    if (!isWeekly && (!month || !year)) {
      res.status(400).json({
        success: false,
        message: "Month and year are required for monthly reports",
      } as ApiResponse<null>);
      return;
    }

    // Parse dates
    let periodStart: Date;
    let periodEnd: Date;

    if (isWeekly) {
      periodStart = new Date(startDate as string);
      periodEnd = new Date(endDate as string);
    } else {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      periodStart = new Date(yearNum, monthNum - 1, 1);
      periodEnd = new Date(yearNum, monthNum, 0);
    }

    // Get filtered PG IDs
    const filteredPgIds = await getFilteredPgIds(
      prisma,
      admin.pgType,
      undefined,
      undefined
    );

    // Fetch data from all table endpoints using helper functions
    const [pgPerformanceData, roomUtilizationData, paymentAnalyticsData, financialSummaryData] = await Promise.all([
      calculatePGPerformance(prisma, filteredPgIds, periodStart, periodEnd),
      calculateRoomUtilization(prisma, filteredPgIds, periodStart, periodEnd),
      calculatePaymentAnalytics(prisma, filteredPgIds, periodStart, periodEnd),
      calculateFinancialSummary(prisma, filteredPgIds, periodStart, periodEnd)
    ]);

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MRM PG Management System';
    workbook.created = new Date();
    workbook.company = 'MRM PG Management';
    
    // Create sheets for each table
    const pgSheet = workbook.addWorksheet('PG Performance');
    const roomSheet = workbook.addWorksheet('Room Utilization');
    const paymentSheet = workbook.addWorksheet('Payment Analytics');
    const financialSheet = workbook.addWorksheet('Financial Summary');

    // Get date info
    const dateInfo = {
      startDate: periodStart,
      endDate: periodEnd
    };

    // Format PG Performance sheet
    let currentRow = createHeaderSection(pgSheet, reportType, dateInfo, admin.pgType, 'PG Performance Report');
    const pgHeaders = ['PG Name', 'PG Location', 'PG Type', 'Total Members', 'New Members', 'Total Rooms', 'Occupied Rooms', 'Vacant Rooms', 'Occupancy Rate (%)', 'Weekly Revenue (₹)', 'Pending Payments', 'Overdue Payments', 'Payment Approval Rate (%)', 'Avg Payment Amount (₹)', 'Revenue Per Member (₹)'];
    const pgFormatters = ['text', 'text', 'text', 'number', 'number', 'number', 'number', 'number', 'percentage', 'currency', 'number', 'number', 'percentage', 'currency', 'currency'];
    createTable(pgSheet, currentRow, pgPerformanceData, pgHeaders, pgFormatters);

    // Format Room Utilization sheet
    currentRow = createHeaderSection(roomSheet, reportType, dateInfo, admin.pgType, 'Room Utilization Report');
    const roomHeaders = ['PG Name', 'PG Location', 'Room Number', 'Capacity', 'Current Occupants', 'Utilization Rate (%)', 'Rent Amount (₹)', 'Weekly Revenue (₹)', 'Fully Occupied', 'Revenue Efficiency (%)'];
    const roomFormatters = ['text', 'text', 'text', 'number', 'number', 'percentage', 'currency', 'currency', 'text', 'percentage'];
    createTable(roomSheet, currentRow, roomUtilizationData, roomHeaders, roomFormatters);

    // Format Payment Analytics sheet
    currentRow = createHeaderSection(paymentSheet, reportType, dateInfo, admin.pgType, 'Payment Analytics Report');
    const paymentHeaders = ['PG Name', 'PG Location', 'Total Payments Due', 'Payments Received', 'Payments Approved', 'Payments Pending', 'Payments Overdue', 'Total Amount Due (₹)', 'Total Amount Received (₹)', 'Collection Efficiency (%)'];
    const paymentFormatters = ['text', 'text', 'number', 'number', 'number', 'number', 'number', 'currency', 'currency', 'percentage'];
    createTable(paymentSheet, currentRow, paymentAnalyticsData, paymentHeaders, paymentFormatters);

    // Format Financial Summary sheet
    currentRow = createHeaderSection(financialSheet, reportType, dateInfo, admin.pgType, 'Financial Summary Report');
    const financialHeaders = ['PG Name', 'PG Location', 'Expected Revenue (₹)', 'Actual Revenue (₹)', 'Pending Revenue (₹)', 'Overdue Revenue (₹)', 'Advance Collected (₹)', 'Total Cash Inflow (₹)', 'Revenue Variance (%)', 'Cash Flow Status', 'Collection Trend'];
    const financialFormatters = ['text', 'text', 'currency', 'currency', 'currency', 'currency', 'currency', 'currency', 'percentage', 'text', 'number'];
    createTable(financialSheet, currentRow, financialSummaryData, financialHeaders, financialFormatters);

    // Generate filename
    const fileName = `${reportType}_analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write the workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error: any) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    } as ApiResponse<null>);
  }
};