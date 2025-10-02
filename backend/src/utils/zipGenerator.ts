import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

interface ZipGenerationOptions {
  memberData: any;
  pdfPath: string;
  tempDir: string;
  outputPath: string;
  includeManifest?: boolean;
}

interface ZipGenerationResult {
  zipPath: string;
  zipSize: number;
  filesIncluded: {
    pdf: boolean;
    paymentScreenshots: number;
    documentImages: number;
    manifest: boolean;
  };
}

// Generate ZIP file containing member report and organized files
export const generateMemberReportZip = async (
  options: ZipGenerationOptions
): Promise<ZipGenerationResult> => {
  const { memberData, pdfPath, tempDir, outputPath, includeManifest = true } = options;
  
  return new Promise((resolve, reject) => {
    try {
      // Create write stream for the output ZIP file
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      let zipSize = 0;
      const result: ZipGenerationResult = {
        zipPath: outputPath,
        zipSize: 0,
        filesIncluded: {
          pdf: false,
          paymentScreenshots: 0,
          documentImages: 0,
          manifest: false
        }
      };

      // Handle stream events
      output.on('close', () => {
        result.zipSize = archive.pointer();
        console.log(`ZIP file created successfully: ${outputPath}`);
        console.log(`Total bytes: ${result.zipSize}`);
        resolve(result);
      });

      output.on('error', (err) => {
        console.error('Output stream error:', err);
        reject(err);
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        reject(err);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          reject(err);
        }
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add PDF file to ZIP
      if (fs.existsSync(pdfPath)) {
        const pdfFileName = `${memberData.memberInfo.memberId}_${memberData.memberInfo.name.replace(/[^a-z0-9]/gi, '_')}_report.pdf`;
        archive.file(pdfPath, { name: pdfFileName });
        result.filesIncluded.pdf = true;
        console.log(`Added PDF to ZIP: ${pdfFileName}`);
      }

      // Add payment screenshots folder
      const paymentFolder = path.join(tempDir, 'payment_screenshots');
      if (fs.existsSync(paymentFolder)) {
        const paymentFiles = fs.readdirSync(paymentFolder);
        paymentFiles.forEach(file => {
          const filePath = path.join(paymentFolder, file);
          if (fs.statSync(filePath).isFile()) {
            archive.file(filePath, { name: `payment_screenshots/${file}` });
            result.filesIncluded.paymentScreenshots++;
          }
        });
        console.log(`Added ${result.filesIncluded.paymentScreenshots} payment screenshots to ZIP`);
      }

      // Add documents folder
      const documentsFolder = path.join(tempDir, 'documents');
      if (fs.existsSync(documentsFolder)) {
        const documentFiles = fs.readdirSync(documentsFolder);
        documentFiles.forEach(file => {
          const filePath = path.join(documentsFolder, file);
          if (fs.statSync(filePath).isFile()) {
            archive.file(filePath, { name: `documents/${file}` });
            result.filesIncluded.documentImages++;
          }
        });
        console.log(`Added ${result.filesIncluded.documentImages} document images to ZIP`);
      }

      // Add manifest file if requested
      if (includeManifest) {
        const manifestContent = createDetailedManifest(memberData, result);
        archive.append(manifestContent, { name: 'file_manifest.json' });
        result.filesIncluded.manifest = true;
        console.log('Added manifest file to ZIP');
      }

      // Add README file
      const readmeContent = createReadmeContent(memberData);
      archive.append(readmeContent, { name: 'README.txt' });
      console.log('Added README file to ZIP');

      // Finalize the archive
      archive.finalize();

    } catch (error) {
      console.error('Error generating ZIP file:', error);
      reject(error);
    }
  });
};

// Create detailed manifest for the ZIP contents
const createDetailedManifest = (memberData: any, result: ZipGenerationResult): string => {
  const manifest = {
    memberInfo: {
      name: memberData.memberInfo.name,
      memberId: memberData.memberInfo.memberId,
      email: memberData.memberInfo.email,
      pgName: memberData.pgInfo.pgName,
      roomNo: memberData.pgInfo.roomNo || 'Not Assigned',
      generatedOn: new Date().toISOString(),
      generatedBy: 'PG Management System'
    },
    zipContents: {
      memberReport: {
        file: `${memberData.memberInfo.memberId}_${memberData.memberInfo.name.replace(/[^a-z0-9]/gi, '_')}_report.pdf`,
        description: 'Comprehensive member report with all details, payment history, and analytics',
        included: result.filesIncluded.pdf
      },
      paymentScreenshots: {
        folder: 'payment_screenshots/',
        description: 'Payment receipts and bill screenshots organized by month/year and attempt number',
        fileCount: result.filesIncluded.paymentScreenshots,
        fileNamingPattern: '{memberId}_{month}_{year}_attempt_{attemptNumber}_{billType}.{extension}'
      },
      documents: {
        folder: 'documents/',
        description: 'Member documents including profile photo, ID proof, and digital signature',
        fileCount: result.filesIncluded.documentImages,
        fileNamingPattern: '{memberId}_{documentType}.{extension}'
      },
      manifest: {
        file: 'file_manifest.json',
        description: 'This manifest file describing the ZIP contents',
        included: result.filesIncluded.manifest
      },
      readme: {
        file: 'README.txt',
        description: 'Instructions and information about the ZIP contents',
        included: true
      }
    },
    statistics: {
      totalFiles: result.filesIncluded.paymentScreenshots + result.filesIncluded.documentImages + 
                 (result.filesIncluded.pdf ? 1 : 0) + 
                 (result.filesIncluded.manifest ? 1 : 0) + 1, // +1 for README
      zipSizeBytes: result.zipSize,
      membershipDuration: memberData.memberInfo.membershipDuration,
      totalPayments: memberData.paymentSummary.totalPayments,
      totalPaidAmount: memberData.paymentSummary.totalPaidAmount,
      paymentComplianceRate: memberData.paymentSummary.paymentComplianceRate
    },
    instructions: {
      pdfViewing: 'Open the PDF file with any PDF reader to view the comprehensive member report',
      imageViewing: 'Payment screenshots and documents are organized in separate folders for easy access',
      fileNaming: 'All files are named with member ID and descriptive information for easy identification'
    }
  };

  return JSON.stringify(manifest, null, 2);
};

// Create README content for the ZIP file
const createReadmeContent = (memberData: any): string => {
  const readme = `
PG MANAGEMENT SYSTEM - MEMBER REPORT PACKAGE
===========================================

Member Information:
- Name: ${memberData.memberInfo.name}
- Member ID: ${memberData.memberInfo.memberId}
- Email: ${memberData.memberInfo.email}
- PG: ${memberData.pgInfo.pgName}
- Room: ${memberData.pgInfo.roomNo || 'Not Assigned'}
- Status: ${memberData.memberInfo.status}
- Generated On: ${new Date().toLocaleString()}

PACKAGE CONTENTS:
================

1. MEMBER REPORT (PDF)
   - File: ${memberData.memberInfo.memberId}_${memberData.memberInfo.name.replace(/[^a-z0-9]/gi, '_')}_report.pdf
   - Description: Comprehensive member report with all details, payment history, and analytics
   - Format: PDF (Printable)

2. PAYMENT SCREENSHOTS FOLDER
   - Folder: payment_screenshots/
   - Contents: Payment receipts and bill screenshots
   - Organization: Files are named by month/year and attempt number
   - Naming Pattern: {memberId}_{month}_{year}_attempt_{attemptNumber}_{billType}.{extension}
   - Examples:
     * ${memberData.memberInfo.memberId}_03_2024_attempt_1_rent_bill.jpg
     * ${memberData.memberInfo.memberId}_03_2024_attempt_1_electricity_bill.png

3. DOCUMENTS FOLDER
   - Folder: documents/
   - Contents: Member documents (photo, ID proof, digital signature)
   - Naming Pattern: {memberId}_{documentType}.{extension}
   - Examples:
     * ${memberData.memberInfo.memberId}_photo.jpg
     * ${memberData.memberInfo.memberId}_document.pdf
     * ${memberData.memberInfo.memberId}_signature.png

4. SYSTEM FILES
   - file_manifest.json: Detailed manifest of all files in this package
   - README.txt: This instruction file

VIEWING INSTRUCTIONS:
====================

1. PDF Report:
   - Open with any PDF viewer (Adobe Reader, Browser, etc.)
   - Contains complete member information and analytics
   - Print-friendly format

2. Payment Screenshots:
   - Images can be viewed with any image viewer
   - Organized chronologically by payment period
   - Include both rent and electricity bill screenshots

3. Member Documents:
   - Profile photo, ID documents, and digital signature
   - Can be viewed with appropriate applications

SUPPORT:
========
For questions about this report package, contact the PG Management System administrator.

Generated by PG Management System
Report Generation Date: ${new Date().toLocaleString()}
Member: ${memberData.memberInfo.name} (${memberData.memberInfo.memberId})
  `.trim();

  return readme;
};

// Helper function to get human-readable file size
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper function to validate ZIP file
export const validateZipFile = async (zipPath: string): Promise<boolean> => {
  try {
    const stats = fs.statSync(zipPath);
    return stats.isFile() && stats.size > 0;
  } catch (error) {
    console.error('Error validating ZIP file:', error);
    return false;
  }
};