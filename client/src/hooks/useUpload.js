import { useCallback, useState } from 'react';

import uploadService from '../services/uploadService';

const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (type, file) => {
    setIsUploading(true);
    setError(null);

    try {
      const uploaders = {
        avatar: uploadService.uploadAvatar,
        resume: uploadService.uploadResume,
        logo: uploadService.uploadCompanyLogo,
        projectImage: uploadService.uploadProjectImage,
      };
      const uploader = uploaders[type];

      if (!uploader) {
        throw new Error(`Unsupported upload type: ${type}`);
      }

      const response = await uploader(file);
      const payload = response?.data?.data;
      const url =
        payload?.resume_url || payload?.avatar_url || payload?.company_logo || payload?.url || '';

      return {
        ...response.data,
        payload,
        url,
      };
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải lên file');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading, error };
};

export default useUpload;
