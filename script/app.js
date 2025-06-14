const CACHE_KEY = "weather_cache";

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const resultDiv = document.getElementById("weatherResult");
  const loadingText = document.getElementById("loading");

  resultDiv.innerHTML = "";
  loadingText.style.display = "block";

  if (!city) {
    loadingText.style.display = "none";
    resultDiv.textContent = "Please enter a city name.";
    return;
  }

  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  const now = Date.now();

  // Check cache
  if (
    cache[city] &&
    now - cache[city].timestamp < 60 * 60 * 1000 // 1 hour
  ) {
    loadingText.style.display = "none";
    resultDiv.innerHTML = formatResult(cache[city].data);
    return;
  }

  try {
    // Step 1: Geocoding
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1`;
    const geoRes = await fetch(geoURL);
    if (!geoRes.ok) throw new Error("Failed to get location data.");

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      loadingText.style.display = "none";
      resultDiv.textContent = "City not found. Please try another.";
      return;
    }

    const { latitude, longitude, name: resolvedCity } = geoData.results[0];

    // Step 2: Get weather
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherURL);
    if (!weatherRes.ok) throw new Error("Failed to get weather data.");

    const weatherData = await weatherRes.json();
    const { temperature, weathercode } = weatherData.current_weather;

    const descriptions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      61: "Light rain",
      63: "Moderate rain",
      65: "Heavy rain",
      80: "Rain showers",
      95: "Thunderstorm",
    };

    const result = {
      city: resolvedCity,
      temperature: `${temperature} °C`,
      description: descriptions[weathercode] || "Unknown",
    };

    // Cache result
    cache[city] = {
      data: result,
      timestamp: now,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    loadingText.style.display = "none";
    resultDiv.innerHTML = formatResult(result);
  } catch (error) {
    loadingText.style.display = "none";
    resultDiv.textContent = `Error: ${error.message}`;
  }
}

// Dark mode functionality
function toggleDarkMode() {
  const body = document.body;
  const darkModeBtn = document.getElementById("darkModeBtn");
  body.classList.toggle("dark");

  // Update button icon
  if (body.classList.contains("dark")) {
    darkModeBtn.textContent = "☀️";
    localStorage.setItem("darkMode", "enabled");
  } else {
    darkModeBtn.textContent = "🌙";
    localStorage.setItem("darkMode", "disabled");
  }
}

function formatResult(data) {
  return `
    <div class="weather-card">
      <strong>City:</strong> ${data.city}<br>
      <strong>Temperature:</strong> ${data.temperature}<br>
      <strong>Condition:</strong> ${data.description}
    </div>
  `;
}

// Initialize app settings
function initializeApp() {
  // Check for saved dark mode preference
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    document.body.classList.add("dark");
    document.getElementById("darkModeBtn").textContent = "☀️";
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
