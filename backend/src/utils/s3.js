import s3 from '../config/s3.js';

export const uploadToS3 = async (file, folder = 'invoices') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  await s3.upload(params).promise();
  return key;
};

export const getSignedUrl = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: 3600
  };
  return s3.getSignedUrl('getObject', params);
};

export const deleteFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };
  await s3.deleteObject(params).promise();
};
