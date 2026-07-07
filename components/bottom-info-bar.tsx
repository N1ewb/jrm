import { MapPin, Navigation, X } from "lucide-react";
import type { PlaceResult } from "@/lib/geocoding";

interface DefaultProps {
  mode: "default";
  label: string;
  description: string;
  position?: { lat: number; lng: number } | null;
}

interface PlaceSelectedProps {
  mode: "place-selected";
  place: PlaceResult;
  onClear: () => void;
}

type Props = DefaultProps | PlaceSelectedProps;

export default function BottomInfoBar(props: Props) {
  if (props.mode === "place-selected") {
    return (
      <div className="bg-card rounded-xl shadow-lg px-4 py-3 border border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
          <MapPin size={18} className="text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Selected Place</p>
          <p className="text-sm font-medium text-foreground truncate">
            {props.place.displayName.split(",")[0]}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClear}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Clear selection"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-lg px-4 py-3 border border-border flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <MapPin size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{props.label}</p>
        <p className="text-sm font-medium text-foreground truncate">
          {props.description}
        </p>
      </div>
      <button
        type="button"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0"
        aria-label="Navigate"
      >
        <Navigation size={16} />
      </button>
    </div>
  );
}
