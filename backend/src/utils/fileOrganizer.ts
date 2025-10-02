import fs from 'fs';
import path from 'path';

interface FileOrganizationResult {
  paymentFolder: string;
  documentsFolder: string;
  copiedFiles: {
    paymentScreenshots: string[];
    documentImages: string[];
  };
}

// Helper function to ensure directory exists
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper function to copy file if it exists
const copyFileIfExists = (sourcePath: string, destinationPath: string): boolean => {
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destinationPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
    return false;
  }
};

// Helper function to get file extension
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9.\-_]/gi, '_');
};

// Organize member files into structured folders
export const organizeMemberFiles = async (
  memberData: any,
  tempDir: string
): Promise<FileOrganizationResult> => {
  try {
    const memberName = sanitizeFilename(memberData.memberInfo.name);
    const memberId = memberData.memberInfo.memberId;
    
    // Create main folders
    const paymentFolder = path.join(tempDir, 'payment_screenshots');
    const documentsFolder = path.join(tempDir, 'documents');
    
    ensureDirectoryExists(paymentFolder);
    ensureDirectoryExists(documentsFolder);
    
    const result: FileOrganizationResult = {
      paymentFolder,
      documentsFolder,
      copiedFiles: {
        paymentScreenshots: [],
        documentImages: []
      }
    };

    // Process member documents
    if (memberData.memberInfo.photoUrl) {
      const photoPath = path.resolve(memberData.memberInfo.photoUrl);
      const photoExtension = getFileExtension(memberData.memberInfo.photoUrl);
      const photoDestination = path.join(documentsFolder, `${memberId}_photo${photoExtension}`);
      
      if (copyFileIfExists(photoPath, photoDestination)) {
        result.copiedFiles.documentImages.push(`${memberId}_photo${photoExtension}`);
      }
    }

    if (memberData.memberInfo.documentUrl) {
      const docPath = path.resolve(memberData.memberInfo.documentUrl);
      const docExtension = getFileExtension(memberData.memberInfo.documentUrl);
      const docDestination = path.join(documentsFolder, `${memberId}_document${docExtension}`);
      
      if (copyFileIfExists(docPath, docDestination)) {
        result.copiedFiles.documentImages.push(`${memberId}_document${docExtension}`);
      }
    }

    if (memberData.memberInfo.digitalSignature) {
      const signPath = path.resolve(memberData.memberInfo.digitalSignature);
      const signExtension = getFileExtension(memberData.memberInfo.digitalSignature);
      const signDestination = path.join(documentsFolder, `${memberId}_signature${signExtension}`);
      
      if (copyFileIfExists(signPath, signDestination)) {
        result.copiedFiles.documentImages.push(`${memberId}_signature${signExtension}`);
      }
    }

    // Process payment screenshots
    memberData.paymentHistory.forEach((payment: any, index: number) => {
      const paymentPrefix = `${memberId}_${payment.month}_${payment.year}_attempt_${payment.attemptNumber}`;
      
      // Copy rent bill screenshot
      if (payment.rentBillScreenshot) {
        const rentBillPath = path.resolve(payment.rentBillScreenshot);
        const rentBillExtension = getFileExtension(payment.rentBillScreenshot);
        const rentBillDestination = path.join(paymentFolder, `${paymentPrefix}_rent_bill${rentBillExtension}`);
        
        if (copyFileIfExists(rentBillPath, rentBillDestination)) {
          result.copiedFiles.paymentScreenshots.push(`${paymentPrefix}_rent_bill${rentBillExtension}`);
        }
      }
      
      // Copy electricity bill screenshot
      if (payment.electricityBillScreenshot) {
        const electricityBillPath = path.resolve(payment.electricityBillScreenshot);
        const electricityBillExtension = getFileExtension(payment.electricityBillScreenshot);
        const electricityBillDestination = path.join(paymentFolder, `${paymentPrefix}_electricity_bill${electricityBillExtension}`);
        
        if (copyFileIfExists(electricityBillPath, electricityBillDestination)) {
          result.copiedFiles.paymentScreenshots.push(`${paymentPrefix}_electricity_bill${electricityBillExtension}`);
        }
      }
    });

    console.log(`Files organized successfully for member ${memberName} (${memberId})`);
    console.log(`Payment screenshots: ${result.copiedFiles.paymentScreenshots.length}`);
    console.log(`Document images: ${result.copiedFiles.documentImages.length}`);
    
    return result;
    
  } catch (error) {
    console.error('Error organizing member files:', error);
    throw new Error(`Failed to organize member files: ${error}`);
  }
};

// Create a detailed file manifest
export const createFileManifest = (
  memberData: any,
  organizationResult: FileOrganizationResult
): string => {
  const manifest = {
    memberInfo: {
      name: memberData.memberInfo.name,
      memberId: memberData.memberInfo.memberId,
      generatedOn: new Date().toISOString()
    },
    fileStructure: {
      paymentScreenshots: {
        folder: 'payment_screenshots/',
        description: 'Payment receipts and bill screenshots organized by month/year',
        files: organizationResult.copiedFiles.paymentScreenshots.map(filename => ({
          filename,
          description: getFileDescription(filename)
        }))
      },
      documents: {
        folder: 'documents/',
        description: 'Member documents including photo, ID proof, and digital signature',
        files: organizationResult.copiedFiles.documentImages.map(filename => ({
          filename,
          description: getDocumentDescription(filename)
        }))
      },
      report: {
        file: 'member_report.pdf',
        description: 'Comprehensive member report with all details and analytics'
      }
    },
    summary: {
      totalPaymentScreenshots: organizationResult.copiedFiles.paymentScreenshots.length,
      totalDocumentImages: organizationResult.copiedFiles.documentImages.length,
      totalFiles: organizationResult.copiedFiles.paymentScreenshots.length + 
                  organizationResult.copiedFiles.documentImages.length + 1 // +1 for PDF
    }
  };
  
  return JSON.stringify(manifest, null, 2);
};

// Helper function to get file description from filename
const getFileDescription = (filename: string): string => {
  if (filename.includes('_rent_bill')) {
    const parts = filename.split('_');
    const month = parts[1];
    const year = parts[2];
    return `Rent bill screenshot for ${month}/${year}`;
  } else if (filename.includes('_electricity_bill')) {
    const parts = filename.split('_');
    const month = parts[1];
    const year = parts[2];
    return `Electricity bill screenshot for ${month}/${year}`;
  }
  return 'Payment related screenshot';
};

// Helper function to get document description from filename
const getDocumentDescription = (filename: string): string => {
  if (filename.includes('_photo')) {
    return 'Member profile photo';
  } else if (filename.includes('_document')) {
    return 'Member identification document';
  } else if (filename.includes('_signature')) {
    return 'Member digital signature';
  }
  return 'Member document';
};

// Clean up temporary directory
export const cleanupTempDirectory = (tempDir: string): void => {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary directory: ${tempDir}`);
    }
  } catch (error) {
    console.error(`Error cleaning up temporary directory ${tempDir}:`, error);
  }
};