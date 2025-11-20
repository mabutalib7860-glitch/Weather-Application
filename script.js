const API_KEY = "318648e3ff55d43f853177e86fd9e638";

async function getWeather() {
    const cityInput = document.getElementById("city");
    const city = cityInput.value.trim() || "Muzaffarpur";

    const currentUrl =
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const forecastUrl =
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl),
        ]);

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        if (!currentRes.ok || currentData.cod !== 200) {
            showError(currentData.message || "City not found");
            return;
        }

        renderCurrent(currentData);
        renderForecast(forecastData);
        renderExtra(currentData);
        setBackground(currentData.weather[0].main);

    } catch (err) {
        console.error(err);
        showError("Network error. Please try again.");
    }
}

function showError(msg) {
    const current = document.getElementById("currentWeather");
    current.innerHTML = `<p class="placeholder">Error: ${msg}</p>`;
    document.getElementById("todayChips").innerHTML = "";
    document.getElementById("weekChips").innerHTML = "";
    document.getElementById("extraGrid").innerHTML = "";
}

function renderCurrent(data) {
    const current = document.getElementById("currentWeather");
    const icon = data.weather[0].icon;
    const desc = data.weather[0].description;

    current.innerHTML = `
        <div class="current-city">${data.name}, ${data.sys.country}</div>
        <div class="current-main">
            <div class="current-icon">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
            </div>
            <div>
                <div class="current-temp">${Math.round(data.main.temp)}°C</div>
                <div class="current-extra">
                    ${desc} · Feels like ${Math.round(data.main.feels_like)}°C
                </div>
            </div>
        </div>
        <div class="current-extra">
            Wind: ${data.wind.speed} m/s · Humidity: ${data.main.humidity}% · Pressure: ${data.main.pressure} hPa
        </div>
    `;
}

/* ----- Forecast helpers ----- */
function renderForecast(forecastData) {
    const list = forecastData.list; // 3-hour step data

    if (!Array.isArray(list) || list.length === 0) return;

    const todayChips = document.getElementById("todayChips");
    const weekChips = document.getElementById("weekChips");

    todayChips.innerHTML = "";
    weekChips.innerHTML = "";

    // Today's date
    const todayDate = list[0].dt_txt.split(" ")[0];

    // Today (next few hours)
    const todayItems = list.filter(item => item.dt_txt.startsWith(todayDate)).slice(0, 5);
    todayItems.forEach(item => {
        const time = item.dt_txt.split(" ")[1].slice(0, 5);
        todayChips.innerHTML += createChip(time, item.main.temp, item.weather[0]);
    });

    // Group by day for week forecast
    const daysMap = {};
    list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!daysMap[date]) daysMap[date] = [];
        daysMap[date].push(item);
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    Object.keys(daysMap).slice(0, 7).forEach(date => {
        const dayItems = daysMap[date];
        const midItem = dayItems[Math.floor(dayItems.length / 2)];
        const w = midItem.weather[0];
        const t = midItem.main.temp;

        const d = new Date(date);
        const label = dayNames[d.getDay()];

        weekChips.innerHTML += createChip(label, t, w);
    });
}

function createChip(label, temp, weather) {
    const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}.png`;
    return `
        <div class="chip">
            <div>${label}</div>
            <img src="${iconUrl}" alt="${weather.description}">
            <div>${Math.round(temp)}°C</div>
        </div>
    `;
}

/* ----- Extra info card ----- */
function renderExtra(data) {
    const grid = document.getElementById("extraGrid");
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    const fmt = t =>
        t.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    grid.innerHTML = `
        <div class="extra-item">
            <div class="extra-label">Sunrise</div>
            <div class="extra-value">${fmt(sunrise)}</div>
        </div>
        <div class="extra-item">
            <div class="extra-label">Sunset</div>
            <div class="extra-value">${fmt(sunset)}</div>
        </div>
        <div class="extra-item">
            <div class="extra-label">Visibility</div>
            <div class="extra-value">${(data.visibility / 1000).toFixed(1)} km</div>
        </div>
        <div class="extra-item">
            <div class="extra-label">Cloudiness</div>
            <div class="extra-value">${data.clouds.all}%</div>
        </div>
    `;
}

/* ----- Background change based on weather ----- */
function setBackground(main) {
    const body = document.body;
    body.classList.remove("clear", "clouds", "rain", "snow", "thunderstorm", "mist");

    const key = main.toLowerCase(); // "Clear", "Clouds", "Rain", etc.

    if (key.includes("clear")) body.classList.add("clear");
    else if (key.includes("cloud")) body.classList.add("clouds");
    else if (key.includes("rain") || key.includes("drizzle"))
        body.classList.add("rain");
    else if (key.includes("snow")) body.classList.add("snow");
    else if (key.includes("thunder")) body.classList.add("thunderstorm");
    else if (key.includes("mist") || key.includes("fog") || key.includes("haze"))
        body.classList.add("mist");
    else body.classList.add("clouds");
}

/* Optional: load default city on first open */
window.addEventListener("load", () => {
    document.getElementById("city").value = "Muzaffarpur";
    getWeather();
});
