import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface AddressWithMapLinksProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const AddressWithMapLinks: React.FC<AddressWithMapLinksProps> = ({
  value,
  onChange,
  placeholder = "Zadejte adresu",
  className = '',
  label
}) => {
  // Generate map links
  const generateMapLinks = (address: string) => {
    if (!address.trim()) return null;
    
    const encodedAddress = encodeURIComponent(address);
    return {
      googleMaps: `https://maps.google.com/maps?q=${encodedAddress}`,
      mapyCz: `https://mapy.cz/zakladni?q=${encodedAddress}`
    };
  };

  const mapLinks = generateMapLinks(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`block w-full pl-10 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${className}`}
            placeholder={placeholder}
          />
        </div>
        <CopyButton text={value} />
      </div>

      {/* Map Links */}
      {mapLinks && (
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-500">Zobrazit na mapě:</span>
          <a
            href={mapLinks.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Google Maps
          </a>
          <a
            href={mapLinks.mapyCz}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Mapy.cz
          </a>
        </div>
      )}
    </div>
  );
};