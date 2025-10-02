import { Request, Response } from "express";
import { ApiResponse } from "../types/response";
import { AuthenticatedRequest } from "../middlewares/auth";
import { 
  generateMemberReportWithFiles 
} from "../utils/memberReportGenerator";
import { cleanupTempDirectory } from "../utils/fileOrganizer";
import prisma from "../config/prisma";
import fs from 'fs';

// Get comprehensive member report - downloads ZIP file with PDF and organized files
export const getMemberReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  let tempDir: string | undefined;
  
  try {
    const { memberId } = req.params;
    const adminId = req.admin?.id;
    const adminPgType = req.admin?.pgType;

    if (!adminId || !adminPgType) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    // Verify member belongs to admin's PG type
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        pg: {
          type: adminPgType
        }
      },
      select: { id: true, name: true, memberId: true }
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: "Member not found or unauthorized access",
      } as ApiResponse<null>);
      return;
    }

    // Generate ZIP file with PDF and organized files
    const reportResult = await generateMemberReportWithFiles(memberId, true);
    tempDir = reportResult.tempDir;
    
    if (!reportResult.zipPath || !fs.existsSync(reportResult.zipPath)) {
      res.status(500).json({
        success: false,
        message: "Failed to generate downloadable report",
      } as ApiResponse<null>);
      return;
    }

    // Set response headers for file download
    const fileName = `${member.memberId}_${member.name.replace(/[^a-z0-9]/gi, '_')}_complete_report.zip`;
    const zipStats = fs.statSync(reportResult.zipPath);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipStats.size);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Stream the ZIP file to response
    const fileStream = fs.createReadStream(reportResult.zipPath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming ZIP file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error downloading report",
        } as ApiResponse<null>);
      }
    });
    
    fileStream.on('end', () => {
      // Clean up temporary files after successful download
      if (tempDir) {
        setTimeout(() => {
          cleanupTempDirectory(tempDir!);
        }, 5000); // Delay cleanup to ensure download completes
      }
    });
    
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error generating downloadable report:', error);
    
    // Clean up on error
    if (tempDir) {
      cleanupTempDirectory(tempDir);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to generate downloadable report",
      error: "Report generation failed",
    } as ApiResponse<null>);
  }
};