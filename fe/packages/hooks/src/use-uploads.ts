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

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      return { key, url: uploadUrl.split('?')[0] };
    },
    [api],
  );

  return { upload };
}
