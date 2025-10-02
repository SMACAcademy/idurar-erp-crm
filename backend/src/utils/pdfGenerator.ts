import puppeteer from 'puppeteer';
import { formatCurrency, formatDate } from './reportHelpers';

interface MemberReportData {
  memberInfo: any;
  pgInfo: any;
  paymentSummary: any;
  paymentHistory: any[];
  leavingRequests: any[];
  otpHistory: any[];
  financialSummary: any;
  accountActivity: any;
}

// Generate HTML template for member report PDF
const generateReportHTML = (reportData: MemberReportData): string => {
  const { memberInfo, pgInfo, paymentSummary, paymentHistory, leavingRequests, financialSummary } = reportData;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Member Report - ${memberInfo.name}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background: #fff;
                font-size: 12px;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                border-bottom: 3px solid #2c3e50; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }
            .header h1 { 
                color: #2c3e50; 
                font-size: 28px; 
                margin-bottom: 10px;
                font-weight: bold;
            }
            .header .subtitle { 
                color: #7f8c8d; 
                font-size: 16px;
                font-weight: 300;
            }
            .section { 
                margin-bottom: 25px; 
                page-break-inside: avoid;
            }
            .section-title { 
                background: #34495e; 
                color: white; 
                padding: 12px 15px; 
                font-size: 16px; 
                font-weight: bold;
                margin-bottom: 15px;
                border-radius: 5px;
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin-bottom: 20px;
            }
            .info-item { 
                background: #f8f9fa; 
                padding: 12px; 
                border-left: 4px solid #3498db;
                border-radius: 3px;
            }
            .info-item strong { 
                color: #2c3e50; 
                display: block; 
                margin-bottom: 5px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .info-item span { 
                color: #34495e; 
                font-size: 13px;
                font-weight: 500;
            }
            .status-badge { 
                display: inline-block; 
                padding: 4px 12px; 
                border-radius: 15px; 
                font-size: 11px; 
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status-active { background: #d4edda; color: #155724; }
            .status-inactive { background: #f8d7da; color: #721c24; }
            .status-paid { background: #d1ecf1; color: #0c5460; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-overdue { background: #f8d7da; color: #721c24; }
            .table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 15px;
                background: white;
                border-radius: 5px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .table th { 
                background: #34495e; 
                color: white; 
                padding: 12px 8px; 
                text-align: left; 
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .table td { 
                padding: 10px 8px; 
                border-bottom: 1px solid #dee2e6;
                font-size: 11px;
            }
            .table tr:nth-child(even) { background: #f8f9fa; }
            .table tr:hover { background: #e9ecef; }
            .summary-cards { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
                gap: 15px; 
                margin-bottom: 20px;
            }
            .summary-card { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 20px; 
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .summary-card h3 { 
                font-size: 24px; 
                margin-bottom: 5px;
                font-weight: bold;
            }
            .summary-card p { 
                font-size: 12px; 
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .financial-overview { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 8px; 
                border: 2px solid #e9ecef;
            }
            .financial-overview h3 { 
                color: #2c3e50; 
                margin-bottom: 15px;
                font-size: 18px;
            }
            .amount { 
                font-weight: bold; 
                font-size: 14px;
            }
            .amount.positive { color: #27ae60; }
            .amount.negative { color: #e74c3c; }
            .amount.neutral { color: #f39c12; }
            .page-break { page-break-before: always; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .mt-20 { margin-top: 20px; }
            .mb-10 { margin-bottom: 10px; }
            .footer { 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #ecf0f1; 
                text-align: center; 
                color: #7f8c8d;
                font-size: 11px;
            }
            @media print {
                body { print-color-adjust: exact; }
                .page-break { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>Member Comprehensive Report</h1>
                <div class="subtitle">Generated on ${formatDate(new Date())}</div>
            </div>

            <!-- Member Information -->
            <div class="section">
                <div class="section-title">📋 Member Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Full Name</strong>
                        <span>${memberInfo.name}</span>
                    </div>
                    <div class="info-item">
                        <strong>Member ID</strong>
                        <span>${memberInfo.memberId}</span>
                    </div>
                    <div class="info-item">
                        <strong>Age</strong>
                        <span>${memberInfo.age} years</span>
                    </div>
                    <div class="info-item">
                        <strong>Gender</strong>
                        <span>${memberInfo.gender}</span>
                    </div>
                    <div class="info-item">
                        <strong>Email</strong>
                        <span>${memberInfo.email}</span>
                    </div>
                    <div class="info-item">
                        <strong>Phone</strong>
                        <span>${memberInfo.phone}</span>
                    </div>
                    <div class="info-item">
                        <strong>Location</strong>
                        <span>${memberInfo.location}</span>
                    </div>
                    <div class="info-item">
                        <strong>Work</strong>
                        <span>${memberInfo.work}</span>
                    </div>
                    <div class="info-item">
                        <strong>Status</strong>
                        <span class="status-badge ${memberInfo.isActive ? 'status-active' : 'status-inactive'}">
                            ${memberInfo.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="info-item">
                        <strong>Membership Duration</strong>
                        <span>${memberInfo.membershipDuration}</span>
                    </div>
                    <div class="info-item">
                        <strong>Date of Joining</strong>
                        <span>${formatDate(memberInfo.dateOfJoining)}</span>
                    </div>
                    <div class="info-item">
                        <strong>Rent Type</strong>
                        <span>${memberInfo.rentType}</span>
                    </div>
                </div>
            </div>

            <!-- PG Information -->
            <div class="section">
                <div class="section-title">🏠 PG Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>PG Name</strong>
                        <span>${pgInfo.pgName}</span>
                    </div>
                    <div class="info-item">
                        <strong>PG Location</strong>
                        <span>${pgInfo.pgLocation}</span>
                    </div>
                    <div class="info-item">
                        <strong>PG Type</strong>
                        <span>${pgInfo.pgType}</span>
                    </div>
                    <div class="info-item">
                        <strong>Room Number</strong>
                        <span>${pgInfo.roomNo || 'Not Assigned'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Room Rent</strong>
                        <span>${pgInfo.roomRent ? formatCurrency(pgInfo.roomRent) : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Electricity Charge</strong>
                        <span>${pgInfo.roomElectricityCharge ? formatCurrency(pgInfo.roomElectricityCharge) : 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Financial Summary -->
            <div class="section">
                <div class="section-title">💰 Financial Summary</div>
                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>${formatCurrency(paymentSummary.totalPaidAmount)}</h3>
                        <p>Total Paid</p>
                    </div>
                    <div class="summary-card">
                        <h3>${formatCurrency(paymentSummary.totalPendingAmount)}</h3>
                        <p>Total Pending</p>
                    </div>
                    <div class="summary-card">
                        <h3>${formatCurrency(paymentSummary.totalOverdueAmount)}</h3>
                        <p>Total Overdue</p>
                    </div>
                    <div class="summary-card">
                        <h3>${paymentSummary.paymentComplianceRate}%</h3>
                        <p>Payment Compliance</p>
                    </div>
                </div>
                
                <div class="financial-overview">
                    <h3>Payment Statistics</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Total Payments</strong>
                            <span>${paymentSummary.totalPayments}</span>
                        </div>
                        <div class="info-item">
                            <strong>Approved Payments</strong>
                            <span>${paymentSummary.approvedPayments}</span>
                        </div>
                        <div class="info-item">
                            <strong>Average Monthly Payment</strong>
                            <span>${formatCurrency(paymentSummary.avgMonthlyPayment)}</span>
                        </div>
                        <div class="info-item">
                            <strong>On-time Payment Rate</strong>
                            <span>${financialSummary.onTimePaymentPercentage}%</span>
                        </div>
                        <div class="info-item">
                            <strong>Average Payment Delay</strong>
                            <span>${financialSummary.averagePaymentDelay} days</span>
                        </div>
                        <div class="info-item">
                            <strong>Advance Amount</strong>
                            <span>${formatCurrency(memberInfo.advanceAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment History -->
            <div class="section page-break">
                <div class="section-title">📊 Payment History</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Month/Year</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Paid Date</th>
                            <th>Status</th>
                            <th>Method</th>
                            <th>Approval</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentHistory.slice(0, 20).map(payment => `
                            <tr>
                                <td>${payment.month}/${payment.year}</td>
                                <td class="amount">${formatCurrency(payment.amount)}</td>
                                <td>${formatDate(payment.dueDate)}</td>
                                <td>${payment.paidDate ? formatDate(payment.paidDate) : '-'}</td>
                                <td>
                                    <span class="status-badge status-${payment.paymentStatus.toLowerCase()}">
                                        ${payment.paymentStatus}
                                    </span>
                                </td>
                                <td>${payment.paymentMethod || '-'}</td>
                                <td>
                                    <span class="status-badge status-${payment.approvalStatus.toLowerCase()}">
                                        ${payment.approvalStatus}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${paymentHistory.length > 20 ? `<p class="text-center mt-20"><em>Showing latest 20 payments out of ${paymentHistory.length} total payments</em></p>` : ''}
            </div>

            <!-- Leaving Requests -->
            ${leavingRequests.length > 0 ? `
            <div class="section">
                <div class="section-title">🚪 Leaving Requests</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Requested Date</th>
                            <th>Leave Date</th>
                            <th>Status</th>
                            <th>Pending Dues</th>
                            <th>Final Amount</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leavingRequests.map(request => `
                            <tr>
                                <td>${formatDate(request.createdAt)}</td>
                                <td>${formatDate(request.requestedLeaveDate)}</td>
                                <td>
                                    <span class="status-badge status-${request.status.toLowerCase()}">
                                        ${request.status}
                                    </span>
                                </td>
                                <td>${request.pendingDues ? formatCurrency(request.pendingDues) : '-'}</td>
                                <td>${request.finalAmount ? formatCurrency(request.finalAmount) : '-'}</td>
                                <td>${request.reason}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <p>This report was generated automatically by the PG Management System.</p>
                <p>Report generated for: ${memberInfo.name} (${memberInfo.memberId}) on ${formatDate(new Date())}</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate PDF from member report data
export const generateMemberReportPDF = async (
  reportData: MemberReportData,
  outputPath: string
): Promise<string> => {
  let browser;
  
  try {
    // Generate HTML content
    const htmlContent = generateReportHTML(reportData);
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF with proper formatting
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
          <span>Member Report - ${reportData.memberInfo.name} (${reportData.memberInfo.memberId})</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${formatDate(new Date())}</span>
        </div>
      `
    });
    
    console.log(`PDF generated successfully: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};