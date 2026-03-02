import type { S3Service } from '../../src/s3/s3.service';

let s3Counter = 0;

/** Create a deterministic S3Service mock (no real S3 calls). */
export function mockS3Service(): jest.Mocked<S3Service> {
  return {
    generatePresignedUploadUrl: jest.fn().mockImplementation(
      async (userId: string, contentType: string, _size: number) => {
        const id = ++s3Counter;
        return {
          uploadUrl: `https://s3.mock/upload/${userId}/${id}`,
          key: `uploads/${userId}/mock-key-${id}.${contentType.split('/')[1] ?? 'bin'}`,
        };
      },
    ),
    getPresignedReadUrl: jest
      .fn()
      .mockImplementation(async (key: string) => `https://s3.mock/read/${key}`),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    deleteObjects: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<S3Service>;
}
