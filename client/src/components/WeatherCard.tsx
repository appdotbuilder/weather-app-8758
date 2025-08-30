import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Wind, Eye, Gauge, Sun } from 'lucide-react';
import type { WeatherResponse } from '../../../server/src/schema';

interface WeatherCardProps {
  weather: WeatherResponse;
  isLoading?: boolean;
}

export function WeatherCard({ weather, isLoading = false }: WeatherCardProps) {
  const { location, current } = weather;

  const formatTemperature = (temp: number) => `${Math.round(temp)}°C`;
  const formatWindSpeed = (speed: number) => `${speed.toFixed(1)} m/s`;
  const formatPressure = (pressure: number) => `${Math.round(pressure)} hPa`;
  const formatVisibility = (visibility: number) => `${visibility.toFixed(1)} km`;

  const getTemperatureColor = (temp: number) => {
    if (temp <= 0) return 'from-blue-600 to-cyan-400';
    if (temp <= 10) return 'from-blue-500 to-blue-300';
    if (temp <= 20) return 'from-green-500 to-emerald-400';
    if (temp <= 30) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-pink-400';
  };

  return (
    <Card className={`w-full max-w-md bg-gradient-to-br ${getTemperatureColor(current.temperature)} text-white border-0 shadow-2xl backdrop-blur-sm weather-card ${isLoading ? 'opacity-75 weather-pulse' : ''}`}>
      <div className="p-6">
        {/* Location Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {location.city}
          </h2>
          <p className="text-white/80 text-lg">
            {location.country}
          </p>
          <p className="text-white/60 text-sm">
            Updated: {current.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Main Temperature */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-6xl font-light mr-2">
              {formatTemperature(current.temperature)}
            </span>
            <div className="text-left">
              <div className="text-lg opacity-80">
                {current.condition.name}
              </div>
              <div className="text-sm opacity-60">
                Feels like {formatTemperature(current.feels_like)}
              </div>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            {current.condition.description}
          </p>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-1">
              <Droplets className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Humidity</span>
            </div>
            <p className="text-lg font-semibold">{current.humidity}%</p>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-1">
              <Wind className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Wind</span>
            </div>
            <p className="text-lg font-semibold">{formatWindSpeed(current.wind_speed)}</p>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-1">
              <Gauge className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Pressure</span>
            </div>
            <p className="text-lg font-semibold">{formatPressure(current.pressure)}</p>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-1">
              <Eye className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Visibility</span>
            </div>
            <p className="text-lg font-semibold">{formatVisibility(current.visibility)}</p>
          </div>
        </div>

        {/* UV Index */}
        <div className="mt-4 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sun className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">UV Index</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg font-semibold mr-2">{current.uv_index.toFixed(1)}</span>
              <Badge 
                variant="secondary" 
                className={`
                  ${current.uv_index <= 2 ? 'bg-green-500' : ''}
                  ${current.uv_index > 2 && current.uv_index <= 5 ? 'bg-yellow-500' : ''}
                  ${current.uv_index > 5 && current.uv_index <= 7 ? 'bg-orange-500' : ''}
                  ${current.uv_index > 7 && current.uv_index <= 10 ? 'bg-red-500' : ''}
                  ${current.uv_index > 10 ? 'bg-purple-500' : ''}
                  text-white border-0
                `}
              >
                {current.uv_index <= 2 ? 'Low' : 
                 current.uv_index <= 5 ? 'Moderate' :
                 current.uv_index <= 7 ? 'High' :
                 current.uv_index <= 10 ? 'Very High' : 'Extreme'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}