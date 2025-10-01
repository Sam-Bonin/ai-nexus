import { FileAttachment } from '@/types/chat';

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

export const isSupportedAttachmentType = (type: string) => {
  return type.startsWith('image/') || type === 'application/pdf';
};

export const isWithinFileSizeLimit = (size: number, limit = MAX_FILE_SIZE_BYTES) => {
  return size <= limit;
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToAttachment = async (file: File): Promise<FileAttachment> => {
  const data = await readFileAsBase64(file);
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    data,
  };
};

export const filesToAttachments = async (files: File[]): Promise<FileAttachment[]> => {
  const attachments: FileAttachment[] = [];
  for (const file of files) {
    attachments.push(await fileToAttachment(file));
  }
  return attachments;
};

export const getMaxAttachmentSize = () => MAX_FILE_SIZE_BYTES;
