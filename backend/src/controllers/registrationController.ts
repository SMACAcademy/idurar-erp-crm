import { Request, Response } from "express";
import prisma from "../config/prisma";
import {
  ImageType,
  createImageUploadResult,
  deleteImage,
} from "../utils/imageUpload";
import { Gender, RentType, PgType } from "@prisma/client";
import {
  PersonalDataValidation,
  CreateMemberRequest,
} from "../types/request";


export const validatePersonalData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      dob,
      gender,
      phone,
      email,
      location,
    }: PersonalDataValidation = req.body;

    // Validate required fields
    if (!name || !dob || !gender || !phone || !email || !location) {
      res.status(400).json({
        success: false,
        message: "All personal data fields are required",
        error:
          "Missing required fields: name, dob, gender, phone, email, location",
      });
      return;
    }

    // Validate date of birth format and logic
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
        error: "Date of birth must be a valid ISO date string",
        field: "dob",
      });
      return;
    }

    // Check if date of birth is not in the future
    if (dobDate > new Date()) {
      res.status(400).json({
        success: false,
        message: "Invalid date of birth",
        error: "Date of birth cannot be in the future",
        field: "dob",
      });
      return;
    }

    // Check if person is at least 16 years old (minimum age for PG)
    const minAge = 16;
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const isOldEnough = age > minAge || (age === minAge && monthDiff >= 0 && today.getDate() >= dobDate.getDate());

    if (!isOldEnough) {
      res.status(400).json({
        success: false,
        message: "Age requirement not met",
        error: `Minimum age requirement is ${minAge} years`,
        field: "dob",
      });
      return;
    }

    const [
      existingMemberByPhone,
      existingMemberByEmail,
      existingRegMemberByPhone,
      existingRegMemberByEmail,
    ] = await Promise.all([
      prisma.member.findUnique({ where: { phone: phone } }),
      prisma.member.findUnique({ where: { email: email } }),
      prisma.registeredMember.findUnique({
        where: { phone: phone },
      }),
      prisma.registeredMember.findUnique({
        where: { email: email },
      }),
    ]);

    // Check for conflicts and clean up images if any found
    if (existingMemberByPhone || existingRegMemberByPhone) {
      res.status(409).json({
        success: false,
        message: "Phone number already exists",
        error: "A member or registration with this phone number already exists",
        field: "phone",
      });
      return;
    }

    if (existingMemberByEmail || existingRegMemberByEmail) {
      res.status(409).json({
        success: false,
        message: "Email already exists",
        error: "A member or registration with this email already exists",
        field: "email",
      });
      return;
    }

    // If validation passes, return success
    res.status(200).json({
      success: true,
      message: "Personal data validation successful",
      data: {
        name,
        dob,
        gender,
        phone,
        location,
      },
    });
  } catch (error) {
    console.error("Error validating personal data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to validate personal data",
    });
  }
};

export const completeRegistration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract files from multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const profileImage = files?.profileImage?.[0];
    const documentImage = files?.documentImage?.[0];

    // Parse the registration data from form data
    const registrationData: CreateMemberRequest = {
      name: req.body.name,
      dob: req.body.dob,
      gender: req.body.gender as Gender,
      phone: req.body.phone,
      location: req.body.location,
      email: req.body.email,
      work: req.body.work,
      pgLocation: req.body.pgLocation,
      rentType: req.body.rentType as RentType,
      pgType: req.body.pgType as PgType,
      dateOfRelieving: req.body.dateOfRelieving, // Optional (only for short-term rent)
    };

    // Validate required fields
    const requiredFields = [
      "name",
      "dob",
      "gender",
      "phone",
      "location",
      "work",
      "email",
      "pgLocation",
      "rentType",
      "pgType",
    ];
    const missingFields = requiredFields.filter(
      (field) => !registrationData[field as keyof CreateMemberRequest]
    );

    if (missingFields.length > 0) {
      // Clean up uploaded files if validation fails
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: `Required fields missing: ${missingFields.join(", ")}`,
      });
      return;
    }

    // Validate date of birth
    const dobDate = new Date(registrationData.dob);
    if (isNaN(dobDate.getTime())) {
      // Clean up uploaded files if validation fails
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
        error: "Date of birth must be a valid ISO date string",
        field: "dob",
      });
      return;
    }

    // Check if date of birth is not in the future
    if (dobDate > new Date()) {
      // Clean up uploaded files if validation fails
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Invalid date of birth",
        error: "Date of birth cannot be in the future",
        field: "dob",
      });
      return;
    }

    // Check if person is at least 16 years old (minimum age for PG)
    const minAge = 16;
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const isOldEnough = age > minAge || (age === minAge && monthDiff >= 0 && today.getDate() >= dobDate.getDate());

    if (!isOldEnough) {
      // Clean up uploaded files if validation fails
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Age requirement not met",
        error: `Minimum age requirement is ${minAge} years`,
        field: "dob",
      });
      return;
    }

    // Check if both images are provided
    if (!profileImage || !documentImage) {
      // Clean up any uploaded files
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Both profile and document images are required",
        error: "Please upload both profile image and document image",
      });
      return;
    }

    // Check if the pgLocation and pgType correspond to an existing PG
    const existingPG = await prisma.pG.findFirst({
      where: {
        location: registrationData.pgLocation,
        type: registrationData.pgType,
      },
    });

    if (!existingPG) {
      // Clean up uploaded files if PG validation fails
      if (profileImage)
        await deleteImage(profileImage.filename, ImageType.PROFILE);
      if (documentImage)
        await deleteImage(documentImage.filename, ImageType.DOCUMENT);

      res.status(400).json({
        success: false,
        message: "Invalid PG location or type",
        error:
          "The specified PG location and type do not match any existing PG",
      });
      return;
    }

    // Re-check for duplicate records
    const [
      existingMemberByPhone,
      existingMemberByEmail,
      existingRegMemberByPhone,
      existingRegMemberByEmail,
    ] = await Promise.all([
      prisma.member.findUnique({ where: { phone: registrationData.phone } }),
      prisma.member.findUnique({ where: { email: registrationData.email } }),
      prisma.registeredMember.findUnique({
        where: { phone: registrationData.phone },
      }),
      prisma.registeredMember.findUnique({
        where: { email: registrationData.email },
      }),
    ]);

    // Check for conflicts and clean up images if any found
    if (existingMemberByPhone || existingRegMemberByPhone) {
      res.status(409).json({
        success: false,
        message: "Phone number already exists",
        error: "A member or registration with this phone number already exists",
        field: "phone",
      });
      return;
    }

    if (existingMemberByEmail || existingRegMemberByEmail) {
      res.status(409).json({
        success: false,
        message: "Email already exists",
        error: "A member or registration with this email already exists",
        field: "email",
      });
      return;
    }

    // Create image upload results
    const profileImageResult = createImageUploadResult(
      profileImage,
      ImageType.PROFILE
    );
    const documentImageResult = createImageUploadResult(
      documentImage,
      ImageType.DOCUMENT
    );

    // Create new registered member record
    const newRegisteredMember = await prisma.registeredMember.create({
      data: {
        name: registrationData.name,
        dob: new Date(registrationData.dob),
        gender: registrationData.gender,
        location: registrationData.location,
        pgLocation: registrationData.pgLocation,
        work: registrationData.work,
        email: registrationData.email,
        phone: registrationData.phone,
        photoUrl: profileImageResult.url,
        documentUrl: documentImageResult.url,
        rentType: registrationData.rentType,
        pgType: registrationData.pgType,
        dateOfRelieving: registrationData.dateOfRelieving
          ? new Date(registrationData.dateOfRelieving)
          : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Registration completed successfully",
      data: {
        member: newRegisteredMember,
        images: {
          profile: profileImageResult,
          document: documentImageResult,
        },
      },
    });
  } catch (error) {
    console.error("Error completing registration:", error);

    // Clean up uploaded files on error
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const profileImage = files?.profileImage?.[0];
    const aadharImage = files?.aadharImage?.[0];

    if (profileImage)
      await deleteImage(profileImage.filename, ImageType.PROFILE);
    if (aadharImage)
      await deleteImage(aadharImage.filename, ImageType.DOCUMENT);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to complete registration",
    });
  }
};
