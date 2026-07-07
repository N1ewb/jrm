import { Locate, LocateFixed } from "lucide-react";

interface Props {
  onRequestLocation: () => void;
}

export default function LocationDeniedOverlay({ onRequestLocation }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center border border-border">
        <Locate size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Location Access Denied
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Enable location access to see your position on the map and find nearby jeepney routes.
        </p>
        <button
          type="button"
          onClick={onRequestLocation}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
        >
          <LocateFixed size={18} />
          Allow Location Access
        </button>
      </div>
    </div>
  );
}
