import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Location } from '../../../server/src/schema';

interface LocationSearchProps {
  onCitySelect: (city: string, country?: string) => void;
  disabled?: boolean;
}

export function LocationSearch({ onCitySelect, disabled = false }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await trpc.searchLocations.query(searchQuery.trim());
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to search locations:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleLocationSelect = useCallback((location: Location) => {
    onCitySelect(location.city, location.country);
    setSearchQuery(`${location.city}, ${location.country}`);
    setShowResults(false);
  }, [onCitySelect]);

  const handleDirectSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    // Parse city and country from input
    const parts = searchQuery.split(',').map(part => part.trim());
    const city = parts[0];
    const country = parts[1];
    
    onCitySelect(city, country);
    setShowResults(false);
  }, [searchQuery, onCitySelect]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDirectSearch();
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  }, [handleDirectSearch]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search for a city... (e.g., London, UK)"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            disabled={disabled}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={disabled || isSearching || !searchQuery.trim()}
          variant="secondary"
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          <Search className={`w-4 h-4 ${isSearching ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-sm border-white/30 shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {searchResults.map((location: Location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-gray-800 transition-colors"
                disabled={disabled}
              >
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">
                    {location.city}
                  </div>
                  <div className="text-sm text-gray-500">
                    {location.country}
                  </div>
                </div>
              </button>
            ))}
            
            {/* Direct search option */}
            <button
              onClick={handleDirectSearch}
              className="w-full text-left p-3 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-blue-600 transition-colors border-t border-gray-200 mt-2 pt-3"
              disabled={disabled}
            >
              <Search className="w-4 h-4" />
              <div>
                <div className="font-medium">
                  Search for "{searchQuery}"
                </div>
                <div className="text-sm text-blue-500">
                  Press Enter or click to search directly
                </div>
              </div>
            </button>
          </div>
        </Card>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}