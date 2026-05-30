import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PawIcon } from './icons';

// Fix Leaflet's default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom glowing marker for rescues
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color}; display: flex; align-items: center; justify-content: center;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const rescueLocations = [
  { id: 1, lat: 23.7937, lng: 90.4066, title: 'Banani Dog Rescue', type: 'Dog', status: 'Urgent', color: '#f97316' },
  { id: 2, lat: 23.7461, lng: 90.3742, title: 'Dhanmondi Kitten Shelter', type: 'Cat', status: 'Available', color: '#ec4899' },
  { id: 3, lat: 23.8103, lng: 90.4125, title: 'Gulshan Vet Clinic', type: 'Medical', status: 'Needs Foster', color: '#8b5cf6' },
  { id: 4, lat: 23.7509, lng: 90.3935, title: 'Kawran Bazar Street Dog', type: 'Dog', status: 'Feeding Needed', color: '#f97316' },
];

export const RescueMap: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[400px] bg-slate-900 rounded-3xl animate-pulse flex items-center justify-center"><PawIcon className="w-12 h-12 text-slate-700" /></div>;

  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white flex items-center gap-2 shadow-xl">
         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
         <span className="text-sm font-bold">Live Rescue Radar</span>
      </div>

      <MapContainer 
        center={[23.7704, 90.3906]} // Dhaka center
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {rescueLocations.map(loc => (
          <Marker 
            key={loc.id} 
            position={[loc.lat, loc.lng]} 
            icon={createCustomIcon(loc.color)}
          >
            <Popup className="custom-popup">
               <div className="p-1">
                 <h3 className="font-bold text-slate-800">{loc.title}</h3>
                 <div className="flex gap-2 mt-2 text-xs">
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{loc.type}</span>
                    <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded font-bold">{loc.status}</span>
                 </div>
                 <button className="mt-3 w-full bg-orange-500 text-white text-xs py-1.5 rounded font-bold hover:bg-orange-600">View Details</button>
               </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Global styles for leaflet overrides */}
      <style>{`
        .leaflet-container { font-family: inherit; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        .custom-popup .leaflet-popup-content { margin: 12px; }
        .custom-popup .leaflet-popup-tip { box-shadow: none; }
      `}</style>
    </div>
  );
};
