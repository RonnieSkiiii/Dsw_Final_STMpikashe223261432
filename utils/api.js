const FAKE_STORE_API = 'https://fakestoreapi.com';
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || 'YOUR_API_KEY';
const cache = {
  recommendedHotels: null,
  weather: {},
  cacheTime: 5 * 60 * 1000,
};

export const fetchRecommendedHotels = async (forceRefresh = false) => {
  try {
    if (!forceRefresh && cache.recommendedHotels) {
      const cacheAge = Date.now() - cache.recommendedHotels.timestamp;
      if (cacheAge < cache.cacheTime) {
        return cache.recommendedHotels.data;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${FAKE_STORE_API}/products?limit=10`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      throw new Error('Invalid response format from API');
    }

    const hotels = products.map((product) => {
      const cleanTitle = product.title
        .replace(/[^\w\s]/g, '')
        .substring(0, 40)
        .trim();
      const hotelName = cleanTitle + (cleanTitle.length < 30 ? ' Hotel' : '');

      const categoryMap = {
        "men's clothing": 'Cape Town, Western Cape',
        "women's clothing": 'Johannesburg, Gauteng',
        electronics: 'Durban, KwaZulu-Natal',
        jewelry: 'Pretoria, Gauteng',
      };
      const location = categoryMap[product.category] || 'South Africa';
      const basePrice = Math.round(product.price * 200 + 2000);
      const originalPrice = Math.round(product.price * 250 + 2500);
      const discount = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
      
      return {
        id: `recommended-${product.id}`,
        name: hotelName,
        location: location,
        price: basePrice,
        rating: parseFloat((product.rating?.rate || 4.5).toFixed(1)),
        image: { uri: product.image },
        description: product.description || `Beautiful ${product.category} hotel with excellent amenities.`,
        isRecommended: true,
        originalPrice: originalPrice,
        discount: discount,
      };
    });

    cache.recommendedHotels = {
      data: hotels,
      timestamp: Date.now(),
    };

    return hotels;
  } catch (error) {
    console.error('Error fetching recommended hotels:', error);
    
    if (cache.recommendedHotels?.data) {
      console.warn('Using cached data due to API error');
      return cache.recommendedHotels.data;
    }
    throw new Error(
      error.name === 'AbortError'
        ? 'Request timed out. Please check your connection.'
        : 'Failed to load deals. Please try again later.'
    );
  }
};

export const fetchWeather = async (city) => {
  if (!city) {
    return null;
  }

  try {
    const cityName = city.split(',')[0].trim();

    const cacheKey = cityName.toLowerCase();
    if (cache.weather[cacheKey]) {
      const cacheAge = Date.now() - cache.weather[cacheKey].timestamp;
      if (cacheAge < cache.cacheTime) {
        return cache.weather[cacheKey].data;
      }
    }

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_API_KEY') {
      console.warn('OpenWeatherMap API key not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`,
      {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please configure OpenWeatherMap API key.');
      } else if (response.status === 404) {
        throw new Error(`City "${cityName}" not found`);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();

    if (!data || !data.main || !data.weather || !data.weather[0]) {
      throw new Error('Invalid response format from weather API');
    }

    const weatherData = {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      feelsLike: Math.round(data.main.feels_like),
    };

    cache.weather[cacheKey] = {
      data: weatherData,
      timestamp: Date.now(),
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);

    const cacheKey = city.split(',')[0].trim().toLowerCase();
    if (cache.weather[cacheKey]?.data) {
      console.warn('Using cached weather data due to API error');
      return cache.weather[cacheKey].data;
    }

    return null;
  }
};

export const clearApiCache = () => {
  cache.recommendedHotels = null;
  cache.weather = {};
};

