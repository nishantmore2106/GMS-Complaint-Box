import * as Location from "expo-location";
import { APP_CONFIG } from "../constants/config";

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export const LocationService = {
  /**
   * Calculates distance between two points in meters using Haversine formula
   */
  getDistance(coords1: Coords, coords2: Coords): number {
    if (!this.isValidCoords(coords1) || !this.isValidCoords(coords2)) {
      return Infinity;
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = (coords1.latitude * Math.PI) / 180;
    const φ2 = (coords2.latitude * Math.PI) / 180;
    const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
    const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Checks if user is within a specific radius of a site
   */
  isWithinRange(userCoords: Coords, siteCoords: Coords, radiusMeters: number = APP_CONFIG.GEOFENCE.DEFAULT_RADIUS): boolean {
    const distance = this.getDistance(userCoords, siteCoords);
    return distance <= radiusMeters;
  },

  /**
   * Validates if coordinates are not zero or invalid
   */
  isValidCoords(coords?: Coords | null): boolean {
    if (!coords) return false;
    // (0,0) is usually an uninitialized state in this app's context
    if (coords.latitude === 0 && coords.longitude === 0) return false;
    if (isNaN(coords.latitude) || isNaN(coords.longitude)) return false;
    return true;
  },

  /**
   * Finds the nearest site from a list within a specific radius
   */
  findNearestSite(userCoords: Coords, sites: Site[], radiusMeters: number = APP_CONFIG.GEOFENCE.DEFAULT_RADIUS): Site | null {
    let nearest: Site | null = null;
    let shortestDistance = Infinity;

    for (const site of sites) {
      if (!this.isValidCoords({ latitude: site.latitude, longitude: site.longitude })) continue;
      
      const distance = this.getDistance(userCoords, { 
        latitude: site.latitude, 
        longitude: site.longitude 
      });

      if (distance <= radiusMeters && distance < shortestDistance) {
        shortestDistance = distance;
        nearest = site;
      }
    }

    return nearest;
  },

  /**
   * Reverse geocodes coordinates to a human-readable address
   */
  async getAddressFromCoords(latitude: number, longitude: number): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const addr = results[0];
        const parts = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.postalCode
        ].filter(Boolean);
        return parts.join(", ");
      }
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.warn("[LocationService] Reverse geocoding failed:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }
};

