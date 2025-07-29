// awsClient.js
import pkg from 'pg';
const { Pool } = pkg;
import AWS from 'aws-sdk';
import multer from 'multer';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config();

// AWS RDS PostgreSQL connection
const pool = new Pool({
  user: process.env.RDS_USERNAME,
  host: process.env.RDS_HOSTNAME,
  database: process.env.RDS_DB_NAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // For RDS SSL connection
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
  max: 20, // Maximum connections in pool
  min: 2,  // Minimum connections in pool
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to AWS RDS PostgreSQL successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to AWS RDS:', err.message);
    return false;
  }
};

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Single bucket name - rera-dev
const bucketName = process.env.S3_BUCKET_NAME || 'rera-dev';

// Test S3 connection
const testS3Connection = async () => {
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Connected to AWS S3 bucket '${bucketName}' successfully`);
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to AWS S3:', err.message);
    return false;
  }
};

// Multer configuration for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (increased for larger files)
  },
  fileFilter: (req, file, cb) => {
    // Extended file type support
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|zip|rar/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype.includes('application/') || 
                    file.mimetype.includes('text/') ||
                    file.mimetype.includes('image/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not supported. Allowed: images, PDFs, documents, spreadsheets, presentations, and archives'));
    }
  }
});

// S3 helper functions for single bucket
export const uploadToS3 = async (file, key, folder = null) => {
  // Construct the full path with folder structure
  const fullKey = folder ? `${folder}/${key}` : key;
  
  const params = {
    Bucket: bucketName,
    Key: fullKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadDate: new Date().toISOString(),
      fileSize: file.size.toString()
    }
  };

  try {
    const result = await s3.upload(params).promise();
    console.log(`✅ Uploaded to S3: ${fullKey}`);
    return {
      url: result.Location,
      key: fullKey,
      bucket: bucketName,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }
};

export const deleteFromS3 = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`✅ Deleted file from S3: ${key}`);
    return true;
  } catch (err) {
    throw new Error(`S3 delete failed: ${err.message}`);
  }
};

// Move file within the bucket (copy and delete)
export const moveFileInS3 = async (oldKey, newKey) => {
  try {
    // Copy to new location
    await s3.copyObject({
      Bucket: bucketName,
      CopySource: `${bucketName}/${oldKey}`,
      Key: newKey
    }).promise();

    // Delete old file
    await deleteFromS3(oldKey);
    
    console.log(`✅ Moved file from ${oldKey} to ${newKey}`);
    return true;
  } catch (err) {
    throw new Error(`S3 move failed: ${err.message}`);
  }
};

// List files in a specific folder
export const listS3Files = async (prefix = '', maxKeys = 1000) => {
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];
  } catch (err) {
    throw new Error(`S3 list failed: ${err.message}`);
  }
};

export const getSignedUrl = (key, expires = 3600) => {
  // Handle null, undefined, or empty values
  if (!key || key.trim() === '') {
    return null;
  }

  let actualKey = key;
  
  try {
    // Try to parse as JSON first
    const parsedKey = JSON.parse(key);
    if (typeof parsedKey === 'object' && parsedKey.key) {
      actualKey = parsedKey.key;
    } else if (typeof parsedKey === 'string') {
      actualKey = parsedKey;
    }
  } catch (error) {
    // If JSON parsing fails, treat the key as a plain string
    // This handles cases where the key is already a plain S3 key
    actualKey = key;
  }

  // Validate that we have a non-empty key after processing
  if (!actualKey || actualKey.trim() === '') {
    return null;
  }

  const params = {
    Bucket: bucketName,
    Key: actualKey,
    Expires: expires
  };

  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Get file metadata from S3
export const getFileMetadata = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    const result = await s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      metadata: result.Metadata,
      etag: result.ETag
    };
  } catch (err) {
    throw new Error(`Failed to get file metadata: ${err.message}`);
  }
};

// Database helper functions
export const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Helper function to determine file category based on path or mimetype
export const categorizeFile = (filePath, mimeType) => {
  const path = filePath.toLowerCase();
  const mime = mimeType.toLowerCase();
  
  if (path.includes('document') || path.includes('file') || mime.includes('pdf') || mime.includes('document')) {
    return 'documents';
  }
  
  if (path.includes('photo') || path.includes('image') || mime.includes('image')) {
    return 'photos';
  }
  
  if (path.includes('user') || path.includes('profile')) {
    return 'photos';
  }
  
  return 'documents'; // Default category
};

// Utility to create folder structure path
export const createFolderPath = (category, subcategory = null, userRole = null) => {
  let path = category;
  
  if (subcategory) {
    path += `/${subcategory}`;
  }
  
  if (userRole) {
    path += `/${userRole}`;
  }
  
  return path;
};

// Initialize connections
export const initializeConnections = async () => {
  console.log('🔄 Initializing AWS connections...');
  
  const dbConnected = await testConnection();
  const s3Connected = await testS3Connection();
  
  if (!dbConnected) {
    throw new Error('Failed to connect to AWS RDS');
  }
  
  if (!s3Connected) {
    throw new Error('Failed to connect to AWS S3');
  }
  
  console.log(`✅ All AWS services connected successfully to bucket: ${bucketName}`);
  return { dbConnected, s3Connected, bucketName };
};

// Graceful shutdown
export const closeConnections = async () => {
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (err) {
    console.error('❌ Error closing database connections:', err);
  }
};

// Get bucket statistics
export const getBucketStats = async () => {
  try {
    const params = {
      Bucket: bucketName
    };
    
    const objects = await s3.listObjectsV2(params).promise();
    
    let totalSize = 0;
    let totalFiles = objects.Contents?.length || 0;
    const categories = {};
    
    objects.Contents?.forEach(obj => {
      totalSize += obj.Size;
      const category = categorizeFile(obj.Key, '');
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return {
      bucketName,
      totalFiles,
      totalSize: totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      categories,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    throw new Error(`Failed to get bucket stats: ${err.message}`);
  }
};

// ================================================================================================================================================
// FILE LISTING & BROWSING ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ================================================================================================================================================

// List all files in a folder with pagination
export const listFilesInFolder = async (folder = '', maxKeys = 1000, continuationToken = null) => {
  const params = {
    Bucket: bucketName,
    Prefix: folder ? `${folder}/` : '',
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    
    const files = result.Contents.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag,
      fileName: path.basename(obj.Key),
      folder: path.dirname(obj.Key) === '.' ? '' : path.dirname(obj.Key)
    }));

    return {
      files,
      isTruncated: result.IsTruncated,
      nextContinuationToken: result.NextContinuationToken,
      totalCount: result.KeyCount
    };
  } catch (err) {
    throw new Error(`Failed to list files: ${err.message}`);
  }
};

// Get folder structure (directories only)
export const getFolderStructure = async (prefix = '') => {
  const params = {
    Bucket: bucketName,
    Prefix: prefix ? `${prefix}/` : '',
    Delimiter: '/'
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    
    const folders = result.CommonPrefixes ? result.CommonPrefixes.map(obj => ({
      name: obj.Prefix.replace(prefix ? `${prefix}/` : '', '').replace('/', ''),
      fullPath: obj.Prefix.slice(0, -1) // Remove trailing slash
    })) : [];

    return folders;
  } catch (err) {
    throw new Error(`Failed to get folder structure: ${err.message}`);
  }
};

// ========================
// FILE OPERATIONS
// ========================

// Download file from S3
export const downloadFromS3 = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    const result = await s3.getObject(params).promise();
    return {
      buffer: result.Body,
      contentType: result.ContentType,
      metadata: result.Metadata,
      lastModified: result.LastModified,
      size: result.ContentLength
    };
  } catch (err) {
    throw new Error(`Failed to download file: ${err.message}`);
  }
};

// Check if file exists
export const fileExists = async (key) => {
  try {
    await s3.headObject({
      Bucket: bucketName,
      Key: key
    }).promise();
    return true;
  } catch (err) {
    if (err.code === 'NotFound') {
      return false;
    }
    throw new Error(`Error checking file existence: ${err.message}`);
  }
};

// Generate presigned URL for file download
export const generatePresignedUrl = async (key, expiresIn = 3600) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn // URL expires in seconds (default 1 hour)
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (err) {
    throw new Error(`Failed to generate presigned URL: ${err.message}`);
  }
};

// ========================
// FILE COPYING & MOVING
// ========================

// Copy file within the same bucket
export const copyFile = async (sourceKey, destinationKey) => {
  const params = {
    Bucket: bucketName,
    CopySource: `${bucketName}/${sourceKey}`,
    Key: destinationKey
  };

  try {
    await s3.copyObject(params).promise();
    console.log(`✅ Copied file from ${sourceKey} to ${destinationKey}`);
    return true;
  } catch (err) {
    throw new Error(`Failed to copy file: ${err.message}`);
  }
};

// Move file (copy + delete original)
export const moveFile = async (sourceKey, destinationKey) => {
  try {
    await copyFile(sourceKey, destinationKey);
    await deleteFromS3(sourceKey);
    console.log(`✅ Moved file from ${sourceKey} to ${destinationKey}`);
    return true;
  } catch (err) {
    throw new Error(`Failed to move file: ${err.message}`);
  }
};

// ========================
// FOLDER OPERATIONS
// ========================

// Create folder (by uploading an empty object)
export const createFolder = async (folderPath) => {
  const params = {
    Bucket: bucketName,
    Key: `${folderPath}/`,
    Body: '',
    ContentType: 'application/x-directory'
  };

  try {
    await s3.upload(params).promise();
    console.log(`✅ Created folder: ${folderPath}`);
    return true;
  } catch (err) {
    throw new Error(`Failed to create folder: ${err.message}`);
  }
};

// Delete folder and all its contents
export const deleteFolder = async (folderPath) => {
  try {
    // First, list all objects in the folder
    const listParams = {
      Bucket: bucketName,
      Prefix: `${folderPath}/`
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) {
      console.log(`Folder ${folderPath} is empty or doesn't exist`);
      return true;
    }

    // Delete all objects in the folder
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key }))
      }
    };

    await s3.deleteObjects(deleteParams).promise();
    console.log(`✅ Deleted folder and all contents: ${folderPath}`);
    return true;
  } catch (err) {
    throw new Error(`Failed to delete folder: ${err.message}`);
  }
};

// ========================
// BULK OPERATIONS
// ========================

// Delete multiple files
export const deleteMultipleFiles = async (keys) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('Keys must be a non-empty array');
  }

  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: keys.map(key => ({ Key: key }))
    }
  };

  try {
    const result = await s3.deleteObjects(params).promise();
    console.log(`✅ Deleted ${result.Deleted.length} files`);
    return {
      deleted: result.Deleted,
      errors: result.Errors || []
    };
  } catch (err) {
    throw new Error(`Failed to delete multiple files: ${err.message}`);
  }
};

// Search files by name pattern
export const searchFiles = async (searchTerm, folder = '') => {
  try {
    const { files } = await listFilesInFolder(folder, 1000);
    
    const matchingFiles = files.filter(file => 
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return matchingFiles;
  } catch (err) {
    throw new Error(`Failed to search files: ${err.message}`);
  }
};

// ========================
// UPLOAD UTILITIES
// ========================

// Upload multiple files
export const uploadMultipleFiles = async (files, folder = null) => {
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array');
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const uniqueKey = `${uuidv4()}-${file.originalname}`;
      const uploadResult = await uploadToS3(file, uniqueKey, folder);
      results.push(uploadResult);
    } catch (err) {
      errors.push({
        fileName: file.originalname,
        error: err.message
      });
    }
  }

  return {
    successful: results,
    failed: errors,
    totalUploaded: results.length,
    totalFailed: errors.length
  };
};

// Upload with progress tracking (for large files)
export const uploadWithProgress = async (file, key, folder = null, onProgress) => {
  const fullKey = folder ? `${folder}/${key}` : key;
  
  const params = {
    Bucket: bucketName,
    Key: fullKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadDate: new Date().toISOString(),
      fileSize: file.size.toString()
    }
  };

  try {
    const upload = s3.upload(params);
    
    // Track upload progress
    upload.on('httpUploadProgress', (progress) => {
      if (onProgress) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage, progress.loaded, progress.total);
      }
    });

    const result = await upload.promise();
    console.log(`✅ Uploaded with progress tracking: ${fullKey}`);
    return {
      url: result.Location,
      key: fullKey,
      bucket: bucketName,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (err) {
    throw new Error(`S3 upload with progress failed: ${err.message}`);
  }
};

// ========================
// STORAGE ANALYTICS
// ========================

// Get bucket storage info
export const getBucketInfo = async () => {
  try {
    const listParams = {
      Bucket: bucketName
    };

    const result = await s3.listObjectsV2(listParams).promise();
    
    let totalSize = 0;
    let fileCount = 0;
    const fileTypes = {};

    for (const obj of result.Contents) {
      totalSize += obj.Size;
      fileCount++;
      
      const ext = path.extname(obj.Key).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    }

    return {
      totalFiles: fileCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      fileTypes,
      bucketName
    };
  } catch (err) {
    throw new Error(`Failed to get bucket info: ${err.message}`);
  }
};

// Get folder size
export const getFolderSize = async (folderPath) => {
  try {
    const listParams = {
      Bucket: bucketName,
      Prefix: `${folderPath}/`
    };

    const result = await s3.listObjectsV2(listParams).promise();
    
    let totalSize = 0;
    let fileCount = 0;

    for (const obj of result.Contents) {
      totalSize += obj.Size;
      fileCount++;
    }

    return {
      folderPath,
      fileCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize)
    };
  } catch (err) {
    throw new Error(`Failed to get folder size: ${err.message}`);
  }
};

// ========================
// UTILITY FUNCTIONS
// ========================

// Format bytes to human readable format
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Generate unique file name
export const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  
  return `${name}_${timestamp}_${uuid}${ext}`;
};

// Validate file type
export const validateFileType = (mimetype, allowedTypes = []) => {
  if (allowedTypes.length === 0) {
    // Default allowed types
    allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
  }

  return allowedTypes.includes(mimetype);
};

// Initialize all connections
export const initializeServices = async () => {
  console.log('🔄 Initializing AWS services...');
  
  const dbConnected = await testConnection();
  const s3Connected = await testS3Connection();
  
  if (dbConnected && s3Connected) {
    console.log('✅ All services initialized successfully');
    return true;
  } else {
    console.log('❌ Some services failed to initialize');
    return false;
  }
};

// Export the main clients
export { pool as db, s3, bucketName };
export default { 
  db: pool, 
  s3, 
  bucketName, 
  upload, 
  uploadToS3, 
  deleteFromS3, 
  moveFileInS3,
  listS3Files,
  getSignedUrl,
  getFileMetadata,
  categorizeFile,
  createFolderPath,
  getBucketStats,
  query,
  getClient,
  initializeConnections,
  closeConnections,
  listFilesInFolder,
  getFolderStructure,
  downloadFromS3,
  fileExists,
  generatePresignedUrl,
  copyFile,
  moveFile,
  createFolder,
  deleteFolder,
  deleteMultipleFiles,
  searchFiles,
  uploadMultipleFiles,
  uploadWithProgress,
  getBucketInfo,
  getFolderSize,
  formatBytes,
  generateUniqueFileName,
  validateFileType,
  initializeServices
};