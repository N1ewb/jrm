"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

interface RouteDetailMapProps {
  waypoints: [number, number][];
  className?: string;
}

export default function RouteDetailMap({ waypoints, className }: RouteDetailMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!container.current || map.current || waypoints.length < 2) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: MAP_STYLE,
      center: waypoints[0],
      zoom: 13,
    });

    instance.on("load", () => {
      instance.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: waypoints },
        },
      });

      instance.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#5000BD", "line-width": 4, "line-opacity": 0.9 },
      });

      const bounds = waypoints.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(waypoints[0], waypoints[0]),
      );
      instance.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    });

    instance.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current = instance;

    return () => { instance.remove(); map.current = null; };
  }, [waypoints]);

  return <div ref={container} className={className ?? "w-full h-full rounded-lg"} />;
}
