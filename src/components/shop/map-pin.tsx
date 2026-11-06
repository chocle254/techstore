"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

// Nairobi city centre, used until the customer taps the map or shares their location.
const START: [number, number] = [-1.2864, 36.8172];

function Picker({ onPick }: { onPick: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/** Tap the map to drop a pin. Loaded only when the customer opens it. */
export default function MapPin({ value, onChange }: { value: [number, number] | null; onChange: (p: [number, number]) => void }) {
  const [center] = useState<[number, number]>(value ?? START);
  return (
    <MapContainer center={center} zoom={value ? 16 : 12} className="h-72 w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Picker onPick={onChange} />
      {value && <CircleMarker center={value} radius={10} pathOptions={{ color: "#050f16", fillColor: "#ff7a1f", fillOpacity: 1, weight: 3 }} />}
    </MapContainer>
  );
}
