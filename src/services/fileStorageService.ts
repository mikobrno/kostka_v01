import { supabase } from '../lib/supabase';

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: string;
}

export class FileStorageService {
  private static readonly BUCKET_NAME = 'client-files';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Validates file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Soubor je příliš velký. Maximální velikost je ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type (basic validation)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Nepodporovaný typ souboru'
      };
    }

    return { isValid: true };
  }

  /**
   * Uploads a file to Supabase Storage
   */
  static async uploadFile(file: File, clientId: string, sectionId: string): Promise<UploadedFile> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Generate unique file name
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `clients/${clientId}/sections/${sectionId}/${uniqueFileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Chyba při nahrávání souboru: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      const uploadedFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: uniqueFileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath,
        uploadedAt: new Date().toISOString()
      };

      return uploadedFile;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Nepodařilo se nahrát soubor: ${error.message}`);
    }
  }

  /**
   * Deletes a file from Supabase Storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw new Error(`Chyba při mazání souboru: ${error.message}`);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error(`Nepodařilo se smazat soubor: ${error.message}`);
    }
  }

  /**
   * Gets public URL for a stored file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Formats file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gets file icon based on file type
   */
  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.startsWith('text/')) return '📄';
    return '📎';
  }
}