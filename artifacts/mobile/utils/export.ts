import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Utility to export JSON data to a CSV file and open the share sheet.
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 */
export async function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    Alert.alert('No Data', 'There is no data available to export.');
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) return '';
          // Handle Date objects or timestamp strings
          if (header.includes('at') || header === 'createdAt') {
            try { val = new Date(val).toLocaleString(); } catch(e) {}
          }
          const strVal = String(val);
          // Handle strings with commas, quotes or newlines
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }).join(',')
      )
    ].join('\n');

    // --- WEB SUPPORT ---
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // --- MOBILE SUPPORT ---
    if (!FileSystem || !(FileSystem as any).writeAsStringAsync) {
      Alert.alert('Not Supported', 'CSV Export is not available on this platform configuration.');
      return;
    }

    const cacheDir = (FileSystem as any).cacheDirectory;
    const fileUri = `${cacheDir}${filename}.csv`;
    await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${filename}`,
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert('Success', `File saved to: ${fileUri}`);
    }
  } catch (error: any) {
    console.error('[ExportCSV] Error:', error);
    Alert.alert('Export Failed', 'An error occurred while generating the CSV file.');
  }
}
