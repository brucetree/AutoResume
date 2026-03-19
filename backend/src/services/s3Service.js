const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
})

const BUCKET = process.env.S3_BUCKET || 'autoresume-files'

/**
 * Upload a file buffer to S3.
 * @param {Buffer} buffer - file content
 * @param {string} key - S3 object key (e.g. "resumes/123456.pdf")
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} the S3 key
 */
async function uploadToS3(buffer, key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return key
}

/**
 * Generate a presigned URL for downloading a file from S3.
 * @param {string} key - S3 object key
 * @param {number} expiresIn - seconds until URL expires (default 1 hour)
 * @returns {Promise<string>} presigned URL
 */
async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn })
}

/**
 * Download a file from S3 as a buffer.
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} file content
 */
async function downloadFromS3(key) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }))
  const chunks = []
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

module.exports = { uploadToS3, getPresignedUrl, downloadFromS3 }
