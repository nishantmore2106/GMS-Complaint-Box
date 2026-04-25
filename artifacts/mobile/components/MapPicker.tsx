import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ActivityIndicator, Alert, Platform, Modal, InteractionManager } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SoftButton } from './SoftButton';
import { SoftInput } from './SoftInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SoftCard } from './SoftCard';

interface MapPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (data: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  isDarkMode?: boolean;
}

export const MapPicker = ({ isVisible, onClose, onConfirm, initialLocation, isDarkMode = false }: MapPickerProps) => {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 22.3072, // Default to Vadodara
    longitude: initialLocation?.longitude || 73.1812,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [address, setAddress] = useState<string>("Locating...");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const mapRef = useRef<MapView>(null);
  const fetchTimer = useRef<any>(null);
  const lastGeocodedCoords = useRef<{ lat: number; lon: number } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          ...region,
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        fetchAddress(latitude, longitude);
      } else {
        Alert.alert("Location not found", "Try being more specific (e.g. city name)");
      }
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      if (initialLocation) {
        const newRegion = {
          ...region,
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        };
        setRegion(newRegion);
        fetchAddress(initialLocation.latitude, initialLocation.longitude);
      } else {
        requestCurrentLocation();
      }
    }
  }, [isVisible]);

  const requestCurrentLocation = async () => {
    setLoading(true);
    setAddress("Acquiring GPS lock...");
    
    // 🛡️ GSD Optimization: Wait briefly for Modal transition
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      // Add a 5s watchdog for permissions
      const permissionPromise = Location.requestForegroundPermissionsAsync();
      const permTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("PERM_TIMEOUT")), 5000));
      const { status } = await Promise.race([permissionPromise, permTimeout]) as any;

      if (status !== 'granted') {
         setLoading(false);
         setAddress("Location permission denied");
         return;
      }

      // Quick check for last known location
      const lastKnown = await Location.getLastKnownPositionAsync({}).catch(() => null);
      if (lastKnown) {
        const lastRegion = {
          ...region,
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
        setRegion(lastRegion);
        mapRef.current?.animateToRegion(lastRegion, 500);
        fetchAddress(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

      // Precise location with 8s watchdog
      const locationPromise = Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("GPS_TIMEOUT")), 8000)
      );

      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      
      const newRegion = {
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
      fetchAddress(location.coords.latitude, location.coords.longitude);
    } catch (error: any) {
      console.warn("[MapPicker/GSD] Location acquisition timeout/fail:", error.message);
      if (address === "Acquiring GPS lock..." || address === "Locating...") {
        setAddress("Location search timed out. Please drag marker manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAddress = (lat: number, lon: number) => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    
    // 🛡️ GSD Threshold Check: Only geocode if moved > 0.0005 degrees (~50m)
    if (lastGeocodedCoords.current) {
        const dLat = Math.abs(lastGeocodedCoords.current.lat - lat);
        const dLon = Math.abs(lastGeocodedCoords.current.lon - lon);
        if (dLat < 0.0005 && dLon < 0.0005) {
            console.log("[MapPicker] Skipping geocode (under threshold)");
            return;
        }
    }

    fetchTimer.current = setTimeout(async () => {
      setIsReverseGeocoding(true);
      try {
        // 🛡️ GSD WATCHDOG: 4s limit for Reverse Geocode
        const geocodePromise = Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        const geoTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("GEO_TIMEOUT")), 4000));
        
        const result = await Promise.race([geocodePromise, geoTimeout]) as Location.LocationGeocodedAddress[];
        if (result && result.length > 0) {
          const item = result[0];
          const addr = [item.name, item.street, item.district, item.city, item.region, item.postalCode].filter(Boolean).join(", ");
          setAddress(addr || "Unknown Location");
          lastGeocodedCoords.current = { lat, lon };
        } else {
          setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      } catch (err: any) {
        console.warn("[MapPicker] Reverse geocode slow/failed:", err.message);
        // Do not update address on error to avoid flickering during rate limits
      } finally {
        setIsReverseGeocoding(false);
      }
    }, 1200); // 🛡️ GSD Optimization: 1.2s Debounce to avoid rate limits
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    fetchAddress(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: region.latitude,
      longitude: region.longitude,
      address: address
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 10, backgroundColor: 'white' }]}>
      <View style={[styles.overlay, isDarkMode && styles.darkOverlay]}>
        <View style={[styles.container, isDarkMode && styles.darkContainer, { height: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
             <Text style={[styles.title, isDarkMode && styles.darkText]}>Mark Site Location</Text>
             <Pressable onPress={onClose} style={[styles.closeBtn, isDarkMode && styles.darkBtn]}>
                <Feather name="x" size={24} color={isDarkMode ? 'white' : '#111827'} />
             </Pressable>
          </View>

          <View style={styles.mapContainer}>
            {Platform.OS !== 'web' ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={onRegionChangeComplete}
                showsUserLocation
                showsMyLocationButton={false}
              />
            ) : (
              <View style={styles.webMapFallback}>
                <Feather name="map" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                <Text style={[styles.webMapText, isDarkMode && { color: '#94A3B8' }]}>
                  Map visualization only available on Mobile Devices.
                </Text>
              </View>
            )}

            <View style={styles.searchOverlay}>
               <SoftInput 
                  placeholder="Search location..." 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon="search"
                  rightIcon={isSearching ? "loader" : "arrow-right"}
                  onRightIconPress={handleSearch}
                  onSubmitEditing={handleSearch}
                  isDarkMode={isDarkMode}
               />
            </View>

            <View style={styles.markerFixed}>
               <View style={styles.markerContainer}>
                  <View style={styles.markerDot} />
                  <Feather name="map-pin" size={40} color={Colors.primary} style={styles.pin} />
               </View>
            </View>
            
            <Pressable style={styles.myLocBtn} onPress={requestCurrentLocation}>
               <Feather name="crosshair" size={20} color={isDarkMode ? 'white' : '#111827'} />
            </Pressable>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
             <SoftCard style={[styles.addressCard, isDarkMode && { backgroundColor: '#2D3748' }]}>
                <View style={styles.addrHeader}>
                    <Feather name="navigation" size={14} color={Colors.primary} />
                    <Text style={styles.addrLabel}>DETECTED ADDRESS</Text>
                    {isReverseGeocoding && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
                </View>
                <Text style={[styles.addressText, isDarkMode && styles.darkText]} numberOfLines={2}>
                    {address}
                </Text>
                <View style={styles.coordsRow}>
                    <Text style={styles.coordsText}>{region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}</Text>
                </View>
             </SoftCard>

             <SoftButton 
                title="Use This Location" 
                onPress={handleConfirm} 
                loading={loading}
                isDarkMode={isDarkMode}
             />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  darkOverlay: { backgroundColor: 'rgba(0,0,0,0.8)' },
  container: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%' },
  darkContainer: { backgroundColor: '#1A202C' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  darkBtn: { backgroundColor: '#2D3748' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { width: '100%', height: '100%' },
  searchOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  markerFixed: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40, alignItems: 'center', justifyContent: 'center' },
  markerContainer: { alignItems: 'center' },
  markerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#111827', position: 'absolute', bottom: 0 },
  pin: { marginBottom: 4 },
  myLocBtn: { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  footer: { padding: 24, gap: 20 },
  addressCard: { padding: 20 },
  addrHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  addrLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1 },
  addressText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#111827', lineHeight: 22 },
  coordsRow: { flexDirection: 'row', marginTop: 4 },
  coordsText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#9CA3AF' },
  darkText: { color: 'white' },
  webMapFallback: { flex: 1, backgroundColor: '#F8FAFA', justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  webMapText: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827', textAlign: 'center' },
});
