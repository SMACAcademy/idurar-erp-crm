import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const cleanupInactiveMemberData = async () => {
  try {
    const inactiveMembers = await prisma.member.findMany({
      where: { isActive: false },
      select: {
        id: true,
        memberId: true,
        name: true,
        photoUrl: true,
        documentUrl: true,
        digitalSignature: true,
        payment: {
          select: {
            rentBillScreenshot: true,
            electricityBillScreenshot: true
          }
        }
      }
    });

    if (inactiveMembers.length === 0) {
      return { deletedMembers: 0, deletedFiles: 0 };
    }

    const baseUploadPath = path.join(process.cwd(), 'uploads');
    let deletedFiles = 0;

    // Clean up files for each inactive member
    for (const member of inactiveMembers) {
      const filesToDelete = [
        member.photoUrl,
        member.documentUrl,
        member.digitalSignature,
        ...member.payment.flatMap(p => [p.rentBillScreenshot, p.electricityBillScreenshot])
      ].filter(Boolean);

      for (const fileUrl of filesToDelete) {
        if (!fileUrl) continue;
        try {
          const filePath = path.join(baseUploadPath, fileUrl.replace('/uploads/', ''));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        } catch (fileError) {
          console.error(`Failed to delete file: ${fileUrl}`, fileError);
        }
      }
    }

    // Delete member records (cascade will handle related data)
    const deletionResult = await prisma.member.deleteMany({
      where: { isActive: false }
    });

    console.log(`Cleanup completed: ${deletionResult.count} members, ${deletedFiles} files deleted`);

    return {
      deletedMembers: deletionResult.count,
      deletedFiles,
      memberIds: inactiveMembers.map(m => m.memberId)
    };

  } catch (error) {
    console.error('Error during inactive member cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};