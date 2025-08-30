import { type WeatherCondition } from '../schema';

export const getWeatherConditions = async (): Promise<WeatherCondition[]> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch all available weather conditions.
    // It should:
    // 1. Query all weather conditions from the database
    // 2. Return array of all weather condition types
    // 3. This can be used for populating dropdowns or validation
    
    const mockConditions: WeatherCondition[] = [
        {
            id: 1,
            name: "Clear",
            description: "Clear sky",
            icon_code: "01d",
            created_at: new Date()
        },
        {
            id: 2,
            name: "Partly Cloudy",
            description: "Few clouds",
            icon_code: "02d",
            created_at: new Date()
        },
        {
            id: 3,
            name: "Cloudy",
            description: "Scattered clouds",
            icon_code: "03d",
            created_at: new Date()
        },
        {
            id: 4,
            name: "Overcast",
            description: "Broken clouds",
            icon_code: "04d",
            created_at: new Date()
        },
        {
            id: 5,
            name: "Light Rain",
            description: "Light rain",
            icon_code: "09d",
            created_at: new Date()
        },
        {
            id: 6,
            name: "Rain",
            description: "Rain",
            icon_code: "10d",
            created_at: new Date()
        },
        {
            id: 7,
            name: "Thunderstorm",
            description: "Thunderstorm",
            icon_code: "11d",
            created_at: new Date()
        },
        {
            id: 8,
            name: "Snow",
            description: "Snow",
            icon_code: "13d",
            created_at: new Date()
        }
    ];

    return Promise.resolve(mockConditions);
};