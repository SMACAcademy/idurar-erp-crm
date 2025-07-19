const path = require('path');
const { slugify } = require('transliteration');
const fileFilterMiddleware = require('./utils/fileFilterMiddleware');
const { getStorage, ref, uploadBytes } = require('firebase/storage');

const storage = getStorage();

const DoSingleStorage = ({
  entity,
  fileType = 'default',
  uploadFieldName = 'file',
  fieldName = 'file',
}) => {
  console.log('uploading')
  return async function (req, res, next) {
    if (!req.files || Object.keys(req.files)?.length === 0 || !req.files?.file) {
      req.body[fieldName] = null;
      next();
    } else {
      try {
        if (!fileFilterMiddleware({ type: fileType, mimetype: req.files.file.mimetype })) {
          throw new Error('Uploaded file type not supported');
        }

        let fileExtension = path.extname(req.files.file.name);
        const fileNameWithoutExt = path.parse(req.files.file.name).name;

        let uniqueFileID = Math.random().toString(36).slice(2, 7);
        let originalname = req.body.seotitle ? slugify(req.body.seotitle.toLocaleLowerCase()) : slugify(fileNameWithoutExt.toLocaleLowerCase());

        let _fileName = `${originalname}-${uniqueFileID}${fileExtension}`;

        const filePath = `public/uploads/${entity}/${_fileName}`;

        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytes(storageRef, req.files.file.data);

        uploadTask.then(snapshot => {
          // File uploaded successfully.
          req.upload = {
            fileName: _fileName,
            fieldExt: fileExtension,
            entity: entity,
            fieldName: fieldName,
            fileType: fileType,
            filePath: filePath,
          };
          req.body[fieldName] = filePath;
          next();
        }).catch(error => {
          // Handle any errors
          return res.status(403).json({
            success: false,
            result: null,
            controller: 'DoSingleStorage.js',
            message: 'Error on uploading file',
          });
        });
      } catch (error) {
        return res.status(403).json({
          success: false,
          result: null,
          controller: 'DoSingleStorage.js',
          message: 'Error on uploading file',
        });
      }
    }
  };
};

module.exports = DoSingleStorage;
