import { useState, useEffect, useRef, useCallback } from "react";
import { haversineDistance, findClosestPointOnRoute } from "@/lib/route-calc";

export interface TripPosition {
  lat: number;
  lng: number;
}

interface UseTripTrackingOptions {
  waypoints: [number, number][];
  alightingIndex: number;
  arrivalThresholdKm?: number;
  onArrival?: () => void;
}

interface UseTripTrackingResult {
  currentPosition: TripPosition | null;
  progress: number;
  closestWaypointIndex: number;
  distanceToAlightingKm: number;
  error: string | null;
  isTracking: boolean;
  requestPermission: () => void;
}

export function useTripTracking({
  waypoints,
  alightingIndex,
  arrivalThresholdKm = 0.1,
  onArrival,
}: UseTripTrackingOptions): UseTripTrackingResult {
  const [currentPosition, setCurrentPosition] = useState<TripPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [closestWaypointIndex, setClosestWaypointIndex] = useState(0);
  const [distanceToAlightingKm, setDistanceToAlightingKm] = useState(Infinity);
  const watchIdRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);
  const onArrivalRef = useRef(onArrival);
  onArrivalRef.current = onArrival;

  const requestPermission = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available");
      return;
    }

    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const posObj = { lat: latitude, lng: longitude };
        setCurrentPosition(posObj);

        const { index } = findClosestPointOnRoute(
          [longitude, latitude],
          waypoints,
        );
        setClosestWaypointIndex(index);

        const alightingCoord = waypoints[alightingIndex];
        const dist = haversineDistance(
          [longitude, latitude],
          alightingCoord,
        );
        setDistanceToAlightingKm(dist);

        if (
          !notifiedRef.current &&
          index >= alightingIndex &&
          dist <= arrivalThresholdKm
        ) {
          notifiedRef.current = true;
          onArrivalRef.current?.();
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied");
        } else {
          setError("Failed to get location");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    setIsTracking(true);
  }, [waypoints, alightingIndex, arrivalThresholdKm]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const totalSteps = waypoints.length - 1;
  const progress =
    totalSteps > 0 ? Math.min(closestWaypointIndex / totalSteps, 1) : 0;

  return {
    currentPosition,
    progress,
    closestWaypointIndex,
    distanceToAlightingKm,
    error,
    isTracking,
    requestPermission,
  };
}
