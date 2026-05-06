import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Complaint } from '../context/AppContext';

/**
 * Service to handle data exports for professional reporting.
 */
export const ExportService = {
  /**
   * Converts a list of complaints into a CSV file and triggers the native share sheet.
   */
  async exportComplaintsToCSV(complaints: Complaint[], fileName: string = "gms_operational_report.csv") {
    try {
      console.log(`[ExportService] Preparing CSV for ${complaints.length} records...`);
      
      const headers = [
        "Complaint ID", 
        "Site Name", 
        "Category", 
        "Subcategory", 
        "Current Status", 
        "Priority Level", 
        "Created Timestamp", 
        "Work Started At", 
        "Resolved At", 
        "Resolution Duration (Hours)", 
        "Client Rating", 
        "Feedback"
      ];
      
      const rows = complaints.map(c => {
        let resTimeHrs = "N/A";
        if (c.createdAt && c.resolvedAt) {
          const diff = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
          resTimeHrs = (diff / (1000 * 3600)).toFixed(2);
        }
        
        // Sanitize strings to avoid CSV formatting issues
        const sanitize = (val: any) => {
          if (val === null || val === undefined) return "";
          return String(val).replace(/,/g, ";").replace(/\n/g, " ");
        };
        
        return [
          c.id,
          sanitize(c.siteName || c.siteId),
          sanitize(c.category),
          sanitize(c.subcategory),
          sanitize(c.status),
          sanitize(c.priority),
          c.createdAt,
          sanitize(c.startedAt),
          sanitize(c.resolvedAt),
          resTimeHrs,
          c.rating || "N/A",
          sanitize(c.ratingFeedback)
        ].join(",");
      });
      
      const csvContent = [headers.join(","), ...rows].join("\n");
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log(`[ExportService] CSV written to: ${fileUri}`);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export GMS Operational Data',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        console.error("[ExportService] Sharing is not available on this device.");
        throw new Error("Sharing is not available on this device");
      }
      
      return true;
    } catch (error) {
      console.error("[ExportService] Critical error during CSV export:", error);
      throw error;
    }
  }
};
