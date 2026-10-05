// Константа URL для завантаження списку ігор
const API_URL = 'https://jsonplaceholder.typicode.com/todos?userId=1';

// Тексти повідомлень про помилки
const ERROR_NETWORK = 'Не вдалося завантажити каталог ігор. Перевірте підключення до інтернету.';
const ERROR_SERVER = 'Не вдалося завантажити каталог ігор. Спробуйте пізніше.';

// Довідники для генерації мок-даних ігор з API
const PLAYER_RANGES = [[2, 4], [1, 2], [3, 6], [2, 2], [5, 8], [2, 5], [1, 1], [4, 8]];
const GENRES = ['Стратегія', 'Для вечірок', 'Сімейна'];

// Стан завантаження, активний жанр та ігри з API
let apiGames = [];
let isLoading = false;
let activeGenre = null;

// Елементи інтерфейсу для роботи з API
const refreshButton = document.querySelector('#refresh-games-button');
const loadingIndicator = document.querySelector('#games-loading');
const errorBox = document.querySelector('#games-error');

// Видаляємо статичну картку-заглушку
const placeholderCard = document.querySelector('#game-placeholder');
if (placeholderCard) placeholderCard.remove();

// Елементи контейнера ігор та лічильника
const listContainer = document.querySelector('#games-list');
const gamesCount = document.querySelector('#games-count');

// Початковий список ігор
const games = [
    { title: 'Каркасон', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', image: 'assets/img/carcas.jpg' },
    { title: 'Квиток на поїзд', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', image: 'assets/img/train.jpg' },
    { title: 'Колонізатори', minPlayers: 3, maxPlayers: 4, genre: 'Стратегія', image: 'assets/img/nastilna_hra_catan_ua.jpg' },
    { title: 'Діксіт', minPlayers: 1, maxPlayers: 5, genre: 'Для вечірок', image: 'assets/img/dixit.jpg' },
    { title: 'Крила', minPlayers: 3, maxPlayers: 6, genre: 'Стратегія', image: 'assets/img/3d-wingspan.jpg' }
];

// Елементи форми пошуку та фільтрів
const filterForm = document.querySelector('#filters-form-games');
const searchInput = document.querySelector('#search-game');
const playerCountFilter = document.querySelector('#players-count-filter');
const playerCategoryFilters = document.querySelectorAll('input[name="playerCategory"]');
const navCategoryButtons = document.querySelectorAll('.nav-category-button');

// Елементи форми додавання гри
const addGameForm = document.querySelector('#add-game-form');
const titleInput = document.querySelector('#game-title');
const minPlayersInput = document.querySelector('#min-players');
const maxPlayersInput = document.querySelector('#max-players');
const genreInput = document.querySelector('#game-genre');
const playersRangeError = document.querySelector('#players-range-error');

// Допоміжні функції для керування інтерфейсом завантаження
function setLoading(state) {
    isLoading = state;
    loadingIndicator.hidden = !state;
    refreshButton.disabled = state;
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
}

function hideError() {
    errorBox.textContent = '';
    errorBox.hidden = true;
}

// Перетворює todo з API на об'єкт гри з мок-характеристиками
function mapTodoToGame(todo, index) {
    const [minPlayers, maxPlayers] = PLAYER_RANGES[index % PLAYER_RANGES.length];
    const genre = GENRES[index % GENRES.length];
    return {
        title: todo.title,
        minPlayers,
        maxPlayers,
        genre,
        played: Boolean(todo.completed)
    };
}

// Повертає спільний список локальних ігор та ігор з API
function getAllGames() {
    return [...games, ...apiGames];
}

// Перевірка кількості гравців для гри
const fitsPlayers = (game, playersCount) =>
    playersCount >= game.minPlayers && playersCount <= game.maxPlayers;

// Перевірка швидких категорій гравців
function fitsPlayerCategory(game, category) {
    if (category === '2') return fitsPlayers(game, 2);
    if (category === '3-4') return fitsPlayers(game, 3) || fitsPlayers(game, 4);
    return fitsPlayers(game, 5);
}

// Визначає, чи підходить гра під поточний вибір для підсвічування
function fitsCurrentPlayerSelection(game) {
    const playersCount = Number(playerCountFilter.value);
    if (playersCount) return fitsPlayers(game, playersCount);

    const playerCategory = filterForm.querySelector('input[name="playerCategory"]:checked')?.value;
    return playerCategory
        ? fitsPlayerCategory(game, playerCategory)
        : fitsPlayers(game, 4);
}

// Відображає картки ігор і оновлює лічильник списку
function renderGames(gameList) {
    if (!listContainer || !gamesCount) return;

    listContainer.replaceChildren();

    if (gameList.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = 'Ігор за вибраним фільтром не знайдено.';
        listContainer.append(emptyMessage);
        gamesCount.textContent = 'Кількість ігор у списку: 0';
        return;
    }

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
        } else {
            const placeholderImg = document.createElement('div');
            placeholderImg.classList.add('game-image-placeholder');
            placeholderImg.setAttribute('aria-hidden', 'true');
            placeholderImg.textContent = '🎲';
            card.append(placeholderImg);
        }

        const title = document.createElement('h3');
        title.textContent = game.title;

        const genre = document.createElement('p');
        genre.classList.add('game-genre');
        genre.textContent = `Жанр: ${game.genre}`;

        const players = document.createElement('p');
        players.classList.add('badge', 'game-players');
        players.textContent = `${game.minPlayers}–${game.maxPlayers} гравців`;

        const badges = document.createElement('div');
        badges.classList.add('game-badges');
        badges.append(players, genre);

        // Позначка «вже зіграно» є лише в іграх з API
        if (typeof game.played === 'boolean') {
            const played = document.createElement('p');
            played.classList.add('badge', 'game-played');
            played.classList.toggle('is-played', game.played);
            played.textContent = game.played ? 'Вже зіграно' : 'Ще не грали';
            badges.append(played);
        }

        card.append(title, badges);
        listContainer.append(card);
    });

    gamesCount.textContent = `Кількість ігор у списку: ${gameList.length}`;
}

// Застосовує комплексну фільтрацію каталогу
function applyPlayersFilter() {
    renderGames(getFilteredGames());
}

// Повертає список ігор за всіма активними критеріями (пошук, кількість гравців, швидка категорія, жанр)
function getFilteredGames() {
    const query = searchInput.value.trim().toLocaleLowerCase('uk');
    const playersCount = Number(playerCountFilter.value);
    const playerCategory = filterForm.querySelector('input[name="playerCategory"]:checked')?.value;

    return getAllGames().filter(game => {
        const matchesTitle = game.title.toLocaleLowerCase('uk').includes(query);
        const matchesPlayers = playersCount
            ? fitsPlayers(game, playersCount)
            : !playerCategory || fitsPlayerCategory(game, playerCategory);
        const matchesGenre = activeGenre ? game.genre === activeGenre : true;
        return matchesTitle && matchesPlayers && matchesGenre;
    });
}

// Перевіряє коректність діапазону гравців у формі додавання
function validatePlayersRange() {
    const minVal = Number(minPlayersInput.value);
    const maxVal = Number(maxPlayersInput.value);
    const isInvalid = Boolean(minPlayersInput.value && maxPlayersInput.value && minVal > maxVal);
    const msg = isInvalid ? 'Мінімум гравців не може бути більшим за максимум.' : '';

    playersRangeError.textContent = msg;
    maxPlayersInput.setCustomValidity(msg);
    return !isInvalid;
}

// Завантаження каталогу ігор з віддаленого API: https://jsonplaceholder.typicode.com/todos?userId=1
async function loadData() {
    if (isLoading) return;
    setLoading(true);
    hideError();
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Сервер відповів кодом ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Неочікуваний формат відповіді');
        apiGames = data.filter(todo => typeof todo?.title === 'string').map(mapTodoToGame);
        applyPlayersFilter();
    } catch (error) {
        console.error('Помилка завантаження каталогу ігор:', error);
        showError(error instanceof TypeError ? ERROR_NETWORK : ERROR_SERVER);
    } finally {
        setLoading(false);
    }
}

// Застосовує пошук і фільтр гравців без перезавантаження сторінки (кнопка «Застосувати»)
filterForm.addEventListener('submit', event => {
    event.preventDefault();
    applyPlayersFilter();
});

// Одразу фільтрує каталог при виборі кількості гравців у select
playerCountFilter.addEventListener('change', () => {
    playerCategoryFilters.forEach(input => {
        input.checked = false;
    });
    applyPlayersFilter();
});

// Зберігає швидку категорію до натискання «Застосувати» та скидає числовий селект
playerCategoryFilters.forEach(input => {
    input.addEventListener('input', () => {
        playerCountFilter.value = '';
    });
});

// Кнопки навігації фільтрують за жанром і плавно прокручують до каталогу
navCategoryButtons.forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        const genre = button.dataset.genre;
        if (activeGenre === genre) {
            activeGenre = null;
            button.classList.remove('active');
        } else {
            activeGenre = genre;
            navCategoryButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        }
        applyPlayersFilter();
        document.querySelector('#games-section')?.scrollIntoView({ behavior: 'smooth' });
    });
});

// Оновлює повідомлення про помилку під час введення значень діапазону
[minPlayersInput, maxPlayersInput].forEach(input => {
    input.addEventListener('input', validatePlayersRange);
});

// Додає нову гру до списку без перезавантаження сторінки
addGameForm.addEventListener('submit', event => {
    event.preventDefault();

    if (!validatePlayersRange()) return;

    games.push({
        title: titleInput.value.trim(),
        minPlayers: Number(minPlayersInput.value),
        maxPlayers: Number(maxPlayersInput.value),
        genre: genreInput.value
    });

    activeGenre = null;
    navCategoryButtons.forEach(b => b.classList.remove('active'));
    filterForm.reset();
    renderGames(getAllGames());
    addGameForm.reset();
    playersRangeError.textContent = '';
    maxPlayersInput.setCustomValidity('');
});

// Обробник натискання кнопки ручного оновлення каталогу
refreshButton.addEventListener('click', loadData);

// Початковий вивід локальних ігор та запуск завантаження з API
renderGames(games);
loadData();
