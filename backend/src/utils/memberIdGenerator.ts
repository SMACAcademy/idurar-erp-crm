import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const generateUniqueMemberId = async (): Promise<string> => {
  let memberId: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;


  const generateMemorableNumber = (): string => {
    
    const digits = [2, 3, 4, 5, 6, 7, 8, 9];
    const patterns = [
   
      () => {
        const a = digits[Math.floor(Math.random() * digits.length)];
        const b = digits[Math.floor(Math.random() * digits.length)];
        return `${a}${a}${b}${b}`;
      },

      () => {
        const a = digits[Math.floor(Math.random() * digits.length)];
        const b = digits[Math.floor(Math.random() * digits.length)];
        return `${a}${b}${a}${b}`;
      },

      () => {
        const start = Math.floor(Math.random() * 6) + 2; 
        const ascending = Math.random() > 0.5;
        if (ascending && start <= 6) {
          return `${start}${start + 1}${start + 2}${start + 3}`;
        } else if (!ascending && start >= 5) {
          return `${start}${start - 1}${start - 2}${start - 3}`;
        } else {
        
          return digits.sort(() => 0.5 - Math.random()).slice(0, 4).join('');
        }
      },

      () => {
        return digits.sort(() => 0.5 - Math.random()).slice(0, 4).join('');
      }
    ];

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    return selectedPattern();
  };

  // Keep generating until we find a unique ID
  while (!isUnique && attempts < maxAttempts) {
    const randomNumber = generateMemorableNumber();
    memberId = `MRM${randomNumber}`;

    // Check if this ID already exists
    const existingMember = await prisma.member.findUnique({
      where: {
        memberId: memberId
      }
    });

    if (!existingMember) {
      isUnique = true;
    }

    attempts++;
  }

  // Safety check
  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique member ID after maximum attempts');
  }

  return memberId!;
};

export const validateMemberIdFormat = (memberId: string): boolean => {
  const memberIdRegex = /^MRM[2-9]{4}$/;
  return memberIdRegex.test(memberId);
};


export const isMemberIdAvailable = async (memberId: string): Promise<boolean> => {
  const existingMember = await prisma.member.findUnique({
    where: {
      memberId: memberId
    }
  });

  return !existingMember;
};

export const generateMultipleUniqueMemberIds = async (count: number): Promise<string[]> => {
  const memberIds: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const memberId = await generateUniqueMemberId();
    memberIds.push(memberId);
  }

  return memberIds;
};
