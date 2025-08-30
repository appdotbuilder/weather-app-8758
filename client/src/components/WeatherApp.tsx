import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { WeatherCard } from './WeatherCard';
import { LocationSearch } from './LocationSearch';
import { ForecastGrid } from './ForecastGrid';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';
import type { WeatherResponse } from '../../../server/src/schema';

export function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [lastLocation, setLastLocation] = useState<{lat: number, lon: number, name?: string} | null>(null);

  const getCurrentLocationWeather = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setLastLocation({ lat: latitude, lon: longitude });

      const weather = await trpc.getCurrentWeather.query({
        latitude,
        longitude
      });

      setWeatherData(weather);
    } catch (err) {
      console.error('Failed to get location or weather:', err);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location services and try again.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable. Please try searching for a city instead.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
        }
      } else {
        setError('Failed to get weather data. Please try searching for a city instead.');
        // Load default city as fallback
        handleCitySelect('London', 'UK');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCitySelect = useCallback(async (city: string, country?: string) => {
    setLoading(true);
    setError(null);
    setUseCurrentLocation(false);

    try {
      const weather = await trpc.getWeatherByCity.query({
        city,
        country
      });

      setWeatherData(weather);
      setLastLocation({ 
        lat: weather.location.latitude, 
        lon: weather.location.longitude, 
        name: `${weather.location.city}, ${weather.location.country}`
      });
    } catch (err) {
      console.error('Failed to get weather for city:', err);
      setError('Failed to get weather data for this city. Please try another location.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (useCurrentLocation || !lastLocation?.name) {
      getCurrentLocationWeather();
    } else if (lastLocation?.name) {
      const [city, country] = lastLocation.name.split(', ');
      handleCitySelect(city, country);
    }
  }, [useCurrentLocation, lastLocation, getCurrentLocationWeather, handleCitySelect]);

  const handleUseCurrentLocation = useCallback(() => {
    setUseCurrentLocation(true);
    getCurrentLocationWeather();
  }, [getCurrentLocationWeather]);

  // Auto-load weather on mount
  useEffect(() => {
    // Try geolocation first if available and secure
    if (navigator.geolocation && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      getCurrentLocationWeather();
    } else {
      // Fallback to a demo city to show the app functionality
      console.log('Geolocation not available or insecure connection, loading demo data');
      handleCitySelect('London', 'UK');
    }
  }, [getCurrentLocationWeather, handleCitySelect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            ☀️ Weather App
          </h1>
          <p className="text-white/80 text-lg">
            Beautiful weather, beautifully presented
          </p>
        </div>

        {/* Location Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
          <div className="flex-1">
            <LocationSearch onCitySelect={handleCitySelect} disabled={loading} />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUseCurrentLocation}
              disabled={loading}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <MapPin className="w-4 h-4 mr-2" />
              My Location
            </Button>
            <Button 
              onClick={handleRefresh}
              disabled={loading}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading && !weatherData && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="text-center mb-8">
            <div className="bg-yellow-500/20 backdrop-blur-sm text-white p-4 rounded-xl border border-yellow-300/30 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span>ℹ️</span>
                <span className="font-medium">Info</span>
              </div>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-white/80">
                Use the search above to find weather for any city worldwide!
              </p>
            </div>
          </div>
        )}

        {weatherData && (
          <div className="space-y-8">
            {/* Current Weather Card */}
            <div className="flex justify-center">
              <WeatherCard weather={weatherData} isLoading={loading} />
            </div>

            {/* Forecast Grid */}
            <ForecastGrid forecast={weatherData.forecast} />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/60">
          <p>Weather data updates automatically ⚡</p>
        </div>
      </div>
    </div>
  );
}