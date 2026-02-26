import { useCallback } from 'react';
import { useApi } from './api-context';
import { generateFileName } from '@lifespan/utils';

export interface UploadResult {
  key: string;
  url: string;
}

export function usePresignedUpload() {
  const api = useApi();

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const fileName = generateFileName(file.name);
      const { uploadUrl, key } = await api.uploads.getPresignedUrl({
        fileName,
        contentType: file.type,
        size: file.size,
      });

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed with status ${response.status}`);
      }

      const parsedUrl = new URL(uploadUrl);
      return { key, url: `${parsedUrl.origin}${parsedUrl.pathname}` };
    },
    [api],
  );

  return { upload };
}
