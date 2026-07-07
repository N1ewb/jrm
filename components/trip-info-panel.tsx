import { Footprints, Route, Clock, DollarSign, MapPin, Navigation } from "lucide-react";

interface TripInfoPanelProps {
  destinationName: string;
  lineName: string;
  vehicleType: string;
  boardingDistanceKm: number;
  alightingDistanceKm: number;
  routeDistanceKm: number;
  progress: number;
  etaMin: number;
  farePhp: number;
  distanceToAlightingKm: number;
  isArriving: boolean;
  onEndTrip: () => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function TripInfoPanel({
  destinationName,
  lineName,
  vehicleType,
  boardingDistanceKm,
  alightingDistanceKm,
  routeDistanceKm,
  progress,
  etaMin,
  farePhp,
  distanceToAlightingKm,
  isArriving,
  onEndTrip,
}: TripInfoPanelProps) {
  const remainingKm = routeDistanceKm * (1 - progress);
  const remainingEta = Math.max(1, Math.round(etaMin * (1 - progress)));

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      {/* Arrival banner */}
      {isArriving && (
        <div className="bg-green-500 text-white px-4 py-3 text-sm font-medium text-center animate-pulse">
          You&apos;re arriving at {destinationName}. Get ready to alight!
        </div>
      )}

      {/* Steps */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
            <Footprints size={12} className="text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Walk to {lineName} stop
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistance(boardingDistanceKm)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Route size={12} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Ride {lineName} {vehicleType.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistance(remainingKm)} remaining · {remainingEta} min
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={12} className="text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Walk to {destinationName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistance(alightingDistanceKm)} from stop
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Navigation size={12} />
          {formatDistance(distanceToAlightingKm)} to destination
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {remainingEta} min
        </span>
        <span className="flex items-center gap-1">
          <DollarSign size={12} />
          ₱{farePhp}
        </span>
      </div>

      {/* End trip */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onEndTrip}
          className="w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
        >
          End Trip
        </button>
      </div>
    </div>
  );
}
