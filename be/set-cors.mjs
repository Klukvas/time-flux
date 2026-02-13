import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

console.log('Endpoint:', process.env.S3_ENDPOINT);
console.log('Region:', process.env.S3_REGION);
console.log('Bucket:', process.env.S3_BUCKET);
console.log('Access Key:', process.env.S3_ACCESS_KEY_ID?.slice(0, 8) + '...');

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const command = new PutBucketCorsCommand({
  Bucket: process.env.S3_BUCKET,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedOrigins: ['http://localhost:3001', 'http://localhost:3000'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

try {
  const result = await client.send(command);
  console.log('CORS configuration applied successfully:', result.$metadata.httpStatusCode);
} catch (err) {
  console.error('Failed to set CORS:', err.name, err.message, err.$metadata);
  process.exit(1);
}
