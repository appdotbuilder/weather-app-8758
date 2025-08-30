export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {/* Main spinner */}
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        
        {/* Inner spinner */}
        <div className="absolute inset-2 w-8 h-8 border-2 border-white/50 border-b-transparent rounded-full animate-spin" 
             style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}>
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>
      
      {/* Loading text */}
      <div className="mt-4 text-white/80 text-lg font-medium">
        Getting weather data...
      </div>
      
      {/* Animated dots */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}