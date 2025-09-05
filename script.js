const key = "cab70cb1a862b4f0054100a318fd5ccc"; // Sua chave da API


function showLoadingSpinner() {
    const spinnerElement = document.getElementById("loading-spinner");
    if (spinnerElement) {
        spinnerElement.style.display = "flex"; 
    }
}

function hideLoadingSpinner() {
    const spinnerElement = document.getElementById("loading-spinner");
    if (spinnerElement) {
        spinnerElement.style.display = "none";
    }
}


function renderCurrentWeather(dados) { 
    console.log(dados);

    const mensagemErroElement = document.querySelector(".mensagem-erro");
    if (mensagemErroElement) {
        mensagemErroElement.style.display = "none";
    }

    document.querySelector(".cidade").innerHTML = "Tempo em " + dados.name;
    document.querySelector(".temp").innerHTML = Math.floor(dados.main.temp) + "°C";
    document.querySelector(".texto-previsao").innerHTML = dados.weather[0].description;
    document.querySelector(".umidade").innerHTML = `Umidade: ${dados.main.humidity}%`;

    document.querySelector(".img-previsao").src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`;
    document.querySelector(".img-previsao").alt = dados.weather[0].description;

    const sensacaoTermicaElement = document.querySelector(".sensacao-termica");
    if (sensacaoTermicaElement) sensacaoTermicaElement.innerHTML = `Sensação térmica: ${Math.floor(dados.main.feels_like)}°C`;

    const velocidadeVentoElement = document.querySelector(".velocidade-vento");
    if (velocidadeVentoElement) velocidadeVentoElement.innerHTML = `Vento: ${dados.wind.speed} m/s`;

    const pressaoAtmElement = document.querySelector(".pressao-atm");
    if (pressaoAtmElement) pressaoAtmElement.innerHTML = `Pressão: ${dados.main.pressure} hPa`;
}

// Função para exibir a PREVISÃO ESTENDIDA (5 dias) na tela
async function renderDailyForecasts(forecastData) {
    const containerCardsPrevisao = document.querySelector(".container-cards-previsao");
    if (!containerCardsPrevisao) return;
    containerCardsPrevisao.innerHTML = '';

    const dailyData = {};

    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' });

        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                iconCounts: {},
                mainIcon: ''
            };
        } else {
            dailyData[dayKey].minTemp = Math.min(dailyData[dayKey].minTemp, item.main.temp_min);
            dailyData[dayKey].maxTemp = Math.max(dailyData[dayKey].maxTemp, item.main.temp_max);
        }

        const icon = item.weather[0].icon;
        dailyData[dayKey].iconCounts[icon] = (dailyData[dayKey].iconCounts[icon] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let countDays = 0;
    const daysToShow = [];

    for (const dayKey in dailyData) {
        const [dayName, dateString] = dayKey.split(', ');
        const [day, month] = dateString.split('/').map(Number);
        const date = new Date(today.getFullYear(), month - 1, day);

        if (date.getTime() > today.getTime() && countDays < 5) {
            daysToShow.push(dayKey);
            countDays++;
        }
        if (countDays >= 5) break;
    }

    daysToShow.forEach(dayKey => {
        const data = dailyData[dayKey];
        let maxCount = 0;
        let dominantIcon = '';
        for (const icon in data.iconCounts) {
            if (data.iconCounts[icon] > maxCount) {
                maxCount = data.iconCounts[icon];
                dominantIcon = icon;
            }
        }
        data.mainIcon = dominantIcon;

        const forecastCard = document.createElement('div');
        forecastCard.classList.add('card-previsao-diaria');

        forecastCard.innerHTML = `
            <h3>${dayKey.split(',')[0]}</h3>
            <p class="forecast-date">${dayKey.split(',')[1]}</p>
            <img src="https://openweathermap.org/img/wn/${data.mainIcon}@2x.png" alt="Ícone do tempo">
            <p class="temp-min-max">
                Min: ${Math.round(data.minTemp)}°C / Max: ${Math.round(data.maxTemp)}°C
            </p>
        `;
        containerCardsPrevisao.appendChild(forecastCard);
    });
}


async function buscarCidade(cidade) {
    const mensagemErroElement = document.querySelector(".mensagem-erro");
    if (mensagemErroElement) {
        mensagemErroElement.style.display = "none";
    }
    showLoadingSpinner(); 

    try {
        const currentWeatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${key}&lang=pt_br&units=metric`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Cidade não encontrada. Verifique o nome.');
                    throw new Error(`Erro ao carregar dados atuais: ${response.statusText}`);
                }
                return response.json();
            });
        renderCurrentWeather(currentWeatherData); 
        const forecastData = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${key}&lang=pt_br&units=metric`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Cidade não encontrada para previsão estendida.');
                    throw new Error(`Erro ao carregar previsão estendida: ${response.statusText}`);
                }
                return response.json();
            });
        renderDailyForecasts(forecastData);

    } catch (error) {
        console.error("Erro na busca da cidade:", error);
        if (mensagemErroElement) {
            mensagemErroElement.textContent = error.message;
            mensagemErroElement.style.display = "block";
        }

      
        document.querySelector(".cidade").innerHTML = "Cidade não encontrada";
        document.querySelector(".temp").innerHTML = " ";
        document.querySelector(".texto-previsao").innerHTML = " ";
        document.querySelector(".img-previsao").src = "";
        document.querySelector(".umidade").innerHTML = " ";
        const sensacaoTermicaElement = document.querySelector(".sensacao-termica");
        if (sensacaoTermicaElement) sensacaoTermicaElement.innerHTML = " ";
        const velocidadeVentoElement = document.querySelector(".velocidade-vento");
        if (velocidadeVentoElement) velocidadeVentoElement.innerHTML = " ";
        const pressaoAtmElement = document.querySelector(".pressao-atm");
        if (pressaoAtmElement) pressaoAtmElement.innerHTML = " ";
        const containerCardsPrevisao = document.querySelector(".container-cards-previsao");
        if (containerCardsPrevisao) containerCardsPrevisao.innerHTML = "";

    } finally {
        hideLoadingSpinner(); 
    }
}


function cliqueiNoBotao() {
    const cidade = document.querySelector(".input-cidade").value.trim();
    if (cidade) {
        buscarCidade(cidade);
    } else {
        const mensagemErroElement = document.querySelector(".mensagem-erro");
        if (mensagemErroElement) {
            mensagemErroElement.textContent = "Por favor, digite o nome de uma cidade.";
            mensagemErroElement.style.display = "block";
        }
    }
}


function getLocalizacaoAutomatica() {
    const mensagemErroElement = document.querySelector(".mensagem-erro");
    if (mensagemErroElement) {
        mensagemErroElement.style.display = "none";
    }
    showLoadingSpinner(); 

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const reverseGeocodeUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&lang=pt_br&units=metric`;
                const response = await fetch(reverseGeocodeUrl);
                if (!response.ok) {
                    throw new Error(`Erro ao obter nome da cidade: ${response.statusText}`);
                }
                const data = await response.json();
                if (data && data.name) {
                    buscarCidade(data.name);
                    const inputCidadeElement = document.querySelector(".input-cidade");
                    if (inputCidadeElement) inputCidadeElement.value = data.name;
                } else {
                    throw new Error("Não foi possível obter o nome da cidade para sua localização.");
                }
            } catch (error) {
                console.error("Erro na localização automática:", error);
                if (mensagemErroElement) {
                    mensagemErroElement.textContent = `Erro ao obter localização: ${error.message}. Por favor, digite sua cidade.`;
                    mensagemErroElement.style.display = "block";
                }
                buscarCidade("São Paulo");
            }
        }, (error) => {
            console.error("Erro ao obter geolocalização:", error);
            let errorMessage = "Erro ao obter sua localização.";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += " Permissão negada. Por favor, digite sua cidade.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += " Localização indisponível. Por favor, digite sua cidade.";
                    break;
                case error.TIMEOUT:
                    errorMessage += " Tempo esgotado ao tentar obter localização. Por favor, digite sua cidade.";
                    break;
                default:
                    errorMessage += " Erro desconhecido. Por favor, digite sua cidade.";
                    break;
            }
            if (mensagemErroElement) {
                mensagemErroElement.textContent = errorMessage;
                mensagemErroElement.style.display = "block";
            }
            buscarCidade("São Paulo");
        });
    } else {
        if (mensagemErroElement) {
            mensagemErroElement.textContent = "Geolocalização não é suportada por este navegador. Por favor, digite sua cidade.";
            mensagemErroElement.style.display = "block";
        }
        buscarCidade("São Paulo");
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    getLocalizacaoAutomatica(); 

    const searchButton = document.querySelector(".botao-busca");
    const cityInput = document.querySelector(".input-cidade");

    if (searchButton) {
        searchButton.addEventListener('click', cliqueiNoBotao);
    }

    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                cliqueiNoBotao();
            }
        });
    }
});
