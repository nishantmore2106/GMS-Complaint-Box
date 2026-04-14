import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Compresses an image at the given URI.
 * @param uri The local URI of the image to compress.
 * @param maxWidth The maximum width for the compressed image.
 * @param quality Compression quality (0 to 1).
 * @returns An object containing the new URI and size information.
 */
export async function compressImage(uri: string, maxWidth = 1200, quality = 0.7) {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.JPEG }
    );
    return result;
  } catch (error) {
    console.error('[compressImage] Compression failed:', error);
    // Return original if compression fails
    return { uri, width: 0, height: 0 };
  }
}
