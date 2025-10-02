import { Router } from "express";
import multer from "multer";
import {
  validatePersonalData,
  completeRegistration,
} from "../controllers/registrationController";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import {
  validatePersonalDataSchema,
} from "../validations/userValidation";
import { fileFilter } from "../utils/imageUpload";

const router = Router();


const registrationUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'profileImage') {
        cb(null, 'uploads/profile');
      } else if (file.fieldname === 'documentImage') {
        cb(null, 'uploads/document');
      } else {
        cb(new Error('Invalid field name'), '');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      cb(null, `${timestamp}-${randomNum}.${extension}`);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 2 // Profile + Aadhar
  }
});

router.post("/validate", 
  validateBody(validatePersonalDataSchema), 
  validatePersonalData
);
  
router.post("/",
  registrationUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ]),
  completeRegistration
);



export default router;
