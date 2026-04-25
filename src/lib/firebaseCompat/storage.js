import { getApp } from './app';

const DEFAULT_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'feedback-screenshots';

export const getStorage = (app = getApp()) => ({
  type: 'supabaseStorageCompat',
  supabase: app.supabase,
  bucket: DEFAULT_BUCKET
});

export const ref = (storageOrRef, path = '') => {
  if (storageOrRef?.type === 'storageRef') {
    return {
      ...storageOrRef,
      path: [storageOrRef.path, path].filter(Boolean).join('/')
    };
  }

  return {
    type: 'storageRef',
    storage: storageOrRef,
    bucket: storageOrRef.bucket,
    path
  };
};

export const uploadBytes = async (storageRef, file, metadata = {}) => {
  const { data, error } = await storageRef.storage.supabase.storage
    .from(storageRef.bucket)
    .upload(storageRef.path, file, {
      contentType: metadata.contentType || file?.type,
      upsert: true
    });

  if (error) {
    const mapped = new Error(error.message || 'Storage upload failed.');
    mapped.code = error.code || 'storage/unknown';
    mapped.originalError = error;
    throw mapped;
  }

  return {
    metadata: {
      bucket: storageRef.bucket,
      fullPath: data?.path || storageRef.path,
      name: storageRef.path.split('/').at(-1)
    },
    ref: storageRef
  };
};

export const getDownloadURL = async (storageRef) => {
  const { data: signedData, error: signedError } = await storageRef.storage.supabase.storage
    .from(storageRef.bucket)
    .createSignedUrl(storageRef.path, 60 * 60 * 24 * 30);

  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data } = storageRef.storage.supabase.storage
    .from(storageRef.bucket)
    .getPublicUrl(storageRef.path);

  return data.publicUrl;
};
