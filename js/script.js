const placeholderCard = document.querySelector('#games-list .game-card');
if (placeholderCard) placeholderCard.remove();

const listContainer = document.querySelector('#games-list');
const gamesCount = document.querySelector('#games-count');

const games = [
    { title: 'Каркасон', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', image: 'assets/img/carcas.jpg' },
    { title: 'Кодові імена', minPlayers: 4, maxPlayers: 8, genre: 'Для вечірок', image: 'assets/img/train.jpg' },
    { title: 'Колонізатори', minPlayers: 3, maxPlayers: 4, genre: 'Стратегія', image: 'assets/img/nastilna_hra_catan_ua.jpg' },
    { title: 'Діксіт', minPlayers: 1, maxPlayers: 5, genre: 'Для вечірок', image: 'assets/img/dixit.jpg' },
    { title: 'Крила', minPlayers: 3, maxPlayers: 6, genre: 'Стратегія', image: 'assets/img/3d-wingspan.jpg' }
];

const filterForm = document.querySelector('#filters-form-games');
const searchInput = document.querySelector('#search-game');
const playersFilter = document.querySelector('#players-count-filter');
const playerCategoryFilters = document.querySelectorAll('input[name="playerCategory"]');
const addGameForm = document.querySelector('#add-game-form');
const titleInput = document.querySelector('#game-title');
const minPlayersInput = document.querySelector('#min-players');
const maxPlayersInput = document.querySelector('#max-players');
const genreInput = document.querySelector('#game-genre');
const playersRangeError = document.querySelector('#players-range-error');

const fitsPlayers = (game, playersCount) =>
    playersCount >= game.minPlayers && playersCount <= game.maxPlayers;

function fitsPlayerCategory(game, category) {
    if (category === '2') return fitsPlayers(game, 2);
    if (category === '3-4') return fitsPlayers(game, 3) || fitsPlayers(game, 4);
    return fitsPlayers(game, 5);
}

function fitsCurrentPlayerSelection(game) {
    const playersCount = Number(playersFilter.value);
    if (playersCount) return fitsPlayers(game, playersCount);

    const playerCategory = filterForm.querySelector('input[name="playerCategory"]:checked')?.value;
    return playerCategory
        ? fitsPlayerCategory(game, playerCategory)
        : fitsPlayers(game, 4);
}

// Відображає картки ігор і оновлює кількість ігор у поточному списку.
function renderGames(gameList) {
    if (!listContainer || !gamesCount) return;

    listContainer.replaceChildren();

    gameList.forEach(game => {
        const card = document.createElement('article');
        card.classList.add('game-card');
        card.classList.toggle('fits', fitsCurrentPlayerSelection(game));
        card.dataset.players = `${game.minPlayers}-${game.maxPlayers}`;

        if (game.image) {
            const image = document.createElement('img');
            image.src = game.image;
            image.alt = `Ілюстрація до гри «${game.title}»`;
            card.append(image);
        }

        const title = document.createElement('h3');
        title.textContent = game.title;

        const genre = document.createElement('p');
        genre.classList.add('game-genre');
        genre.textContent = `Жанр: ${game.genre}`;

        const players = document.createElement('p');
        players.classList.add('badge', 'game-players');
        players.textContent = `${game.minPlayers}–${game.maxPlayers} гравців`;

        card.append(title, genre, players);
        listContainer.append(card);
    });

    gamesCount.textContent = `Кількість ігор у списку: ${gameList.length}`;
}

function getFilteredGames() {
    const query = searchInput.value.trim().toLocaleLowerCase('uk');
    const playersCount = Number(playersFilter.value);
    const playerCategory = filterForm.querySelector('input[name="playerCategory"]:checked')?.value;

    return games.filter(game => {
        const matchesTitle = game.title.toLocaleLowerCase('uk').includes(query);
        const matchesPlayers = playersCount
            ? fitsPlayers(game, playersCount)
            : !playerCategory || fitsPlayerCategory(game, playerCategory);
        return matchesTitle && matchesPlayers;
    });
}

// Перевіряє діапазон гравців: показує помилку в тексті та через setCustomValidity().
function validatePlayersRange() {
    const minVal = Number(minPlayersInput.value);
    const maxVal = Number(maxPlayersInput.value);
    const isInvalid = Boolean(minPlayersInput.value && maxPlayersInput.value && minVal > maxVal);
    const msg = isInvalid ? 'Мінімум гравців не може бути більшим за максимум.' : '';

    playersRangeError.textContent = msg;
    maxPlayersInput.setCustomValidity(msg);
    return !isInvalid;
}

// Застосовує пошук і фільтр гравців без перезавантаження сторінки.
filterForm.addEventListener('submit', event => {
    event.preventDefault();
    renderGames(getFilteredGames());
});

// Одразу фільтрує список за вибраною кількістю гравців (через fitsPlayers).
playersFilter.addEventListener('change', () => {
    playerCategoryFilters.forEach(input => {
        input.checked = false;
    });
    renderGames(getFilteredGames());
});

// Зберігає швидкий фільтр до натискання кнопки застосування.
playerCategoryFilters.forEach(input => {
    input.addEventListener('change', () => {
        playersFilter.value = '';
    });
});

// Оновлює повідомлення про некоректний діапазон під час введення.
[minPlayersInput, maxPlayersInput].forEach(input => {
    input.addEventListener('input', validatePlayersRange);
});

// Додає валідну гру до каталогу без перезавантаження сторінки.
addGameForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!validatePlayersRange()) return;

    games.push({
        title: titleInput.value.trim(),
        minPlayers: Number(minPlayersInput.value),
        maxPlayers: Number(maxPlayersInput.value),
        genre: genreInput.value
    });

    filterForm.reset();
    renderGames(games);
    addGameForm.reset();
    playersRangeError.textContent = '';
    maxPlayersInput.setCustomValidity('');
});

renderGames(games);
