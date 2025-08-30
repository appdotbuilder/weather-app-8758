import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Wind } from 'lucide-react';
import type { DailyForecast, WeatherCondition } from '../../../server/src/schema';

interface DailyForecastWithCondition extends DailyForecast {
  condition: WeatherCondition;
}

interface ForecastGridProps {
  forecast: DailyForecastWithCondition[];
}

export function ForecastGrid({ forecast }: ForecastGridProps) {
  const formatTemperature = (temp: number) => `${Math.round(temp)}°`;
  const formatWindSpeed = (speed: number) => `${speed.toFixed(1)} m/s`;
  
  const getDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getWeatherEmoji = (conditionName: string) => {
    const name = conditionName.toLowerCase();
    if (name.includes('clear') || name.includes('sunny')) return '☀️';
    if (name.includes('cloud')) return '☁️';
    if (name.includes('rain') || name.includes('shower')) return '🌧️';
    if (name.includes('thunderstorm') || name.includes('storm')) return '⛈️';
    if (name.includes('snow')) return '❄️';
    if (name.includes('fog') || name.includes('mist')) return '🌫️';
    if (name.includes('wind')) return '💨';
    return '🌤️'; // partly cloudy default
  };

  const getPrecipitationColor = (chance: number) => {
    if (chance <= 20) return 'bg-green-500';
    if (chance <= 40) return 'bg-yellow-500';
    if (chance <= 60) return 'bg-orange-500';
    if (chance <= 80) return 'bg-red-500';
    return 'bg-purple-500';
  };

  if (forecast.length === 0) {
    return (
      <div className="text-center text-white/60">
        <p>No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-6 drop-shadow-lg">
        📅 7-Day Forecast
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {forecast.map((day: DailyForecastWithCondition) => (
          <Card 
            key={day.id}
            className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
          >
            <div className="p-4">
              {/* Day Header */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg mb-1">
                  {getDayName(day.date)}
                </h3>
                <p className="text-white/80 text-sm">
                  {day.date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Weather Icon and Condition */}
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">
                  {getWeatherEmoji(day.condition.name)}
                </div>
                <p className="text-white/90 font-medium text-sm">
                  {day.condition.name}
                </p>
                <p className="text-white/70 text-xs">
                  {day.condition.description}
                </p>
              </div>

              {/* Temperature Range */}
              <div className="text-center mb-4">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-2xl font-bold">
                    {formatTemperature(day.temperature_max)}
                  </span>
                  <span className="text-lg text-white/70">
                    {formatTemperature(day.temperature_min)}
                  </span>
                </div>
                <p className="text-white/60 text-xs">High / Low</p>
              </div>

              {/* Weather Details */}
              <div className="space-y-3">
                {/* Precipitation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 mr-2" />
                    <span className="text-sm">Rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {day.precipitation_chance}%
                    </span>
                    <Badge 
                      className={`${getPrecipitationColor(day.precipitation_chance)} text-white text-xs px-2 py-0 border-0`}
                    >
                      {day.precipitation_chance <= 20 ? 'Low' :
                       day.precipitation_chance <= 40 ? 'Mild' :
                       day.precipitation_chance <= 60 ? 'Mod' :
                       day.precipitation_chance <= 80 ? 'High' : 'Very High'}
                    </Badge>
                  </div>
                </div>

                {/* Wind */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="w-4 h-4 mr-2" />
                    <span className="text-sm">Wind</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatWindSpeed(day.wind_speed)}
                  </span>
                </div>

                {/* Humidity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 mr-2 opacity-70" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <span className="text-sm font-medium">
                    {day.humidity}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}