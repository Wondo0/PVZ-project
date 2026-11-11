// Обрав Vue 3, бо він простіший для старту: шаблон схожий на звичайний HTML і не потрібен Babel.

const DB_NAME = 'BoardGamesDB';
const STORE_NAME = 'games';
const STORAGE_KEY = 'boardGames';

const API_URL = '/api/games';
const ERROR_NETWORK = 'Не вдалося завантажити каталог ігор. Перевірте підключення до інтернету.';
const ERROR_SERVER = 'Не вдалося завантажити каталог ігор. Спробуйте пізніше.';

// Читає масив ігор із localStorage, при пошкоджених даних повертає порожній список
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Пошкоджені дані в localStorage:', error);
        return [];
    }
}

// Відкриває базу BoardGamesDB і створює object store games з ключем id при першому запуску
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Додає гру або оновлює наявну з тим самим id
async function addItem(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Оновлює запис гри, put замінює запис з тим самим id і не створює дубліката
async function updateItem(item) {
    return addItem(item);
}

// Повертає всі ігри з object store
async function getAllItems() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Видаляє гру за id
async function deleteItem(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Одноразово переносить дані з localStorage в IndexedDB, якщо store порожній, і ставить прапорець migrated
async function migrateFromLocalStorage() {
    if (localStorage.getItem('migrated') === 'true') return;

    const items = await getAllItems();
    if (items.length === 0) {
        for (const game of loadFromLocalStorage()) {
            await addItem(game);
        }
    }
    localStorage.setItem('migrated', 'true');
}

function renderHome(app) {
    app.page = 'list';
    app.ownedOnly = false;
}

function renderGameDetails(app, params) {
    app.page = 'game';
    app.gameId = Number(params.id);
}

function renderOwned(app) {
    app.page = 'list';
    app.ownedOnly = true;
}

// Таблиця маршрутів, кожен шлях має свою view-функцію
const routes = [
    { path: '/', view: renderHome },
    { path: '/games/:id', view: renderGameDetails },
    { path: '/owned', view: renderOwned }
];

function matchRoute(path) {
    const pathParts = path.split('/').filter(Boolean);
    for (const route of routes) {
        const routeParts = route.path.split('/').filter(Boolean);
        if (routeParts.length !== pathParts.length) continue;
        const params = {};
        const isMatch = routeParts.every((part, i) => {
            if (part.startsWith(':')) {
                params[part.slice(1)] = pathParts[i];
                return true;
            }
            return part === pathParts[i];
        });
        if (isMatch) return { view: route.view, params };
    }
    return null;
}

function navigate(path) {
    location.hash = path;
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;
    event.preventDefault();
    navigate(link.getAttribute('href').slice(1));
});

// Компонент картки гри: дані приходять через props, а клік по жанру передає подію filter батьку
const GameCard = {
    props: ['id', 'title', 'minPlayers', 'maxPlayers', 'duration', 'owned', 'played', 'genre', 'image', 'fits', 'featured'],
    emits: ['filter', 'toggle-played', 'remove'],
    template: `
        <article class="game-card" :class="{ fits, 'game-card--featured': featured }" :data-players="minPlayers + '-' + maxPlayers">
            <img v-if="image" :src="image" :alt="'Ілюстрація до гри «' + title + '»'">
            <p v-if="featured" class="badge game-of-day-badge">Гра дня</p>
            <h3><a class="game-link" :href="'#/games/' + id" data-link>{{ title }}</a></h3>
            <button type="button" class="game-genre" @click="$emit('filter', genre)">Жанр: {{ genre }}</button>
            <p class="badge game-players">{{ minPlayers }}–{{ maxPlayers }} гравців</p>
            <p class="game-info">Тривалість: {{ duration }} хв</p>
            <p class="game-info">{{ owned ? 'Є в колекції' : 'Немає в колекції' }}</p>
            <label class="game-played">
                <input type="checkbox" :checked="played" @change="$emit('toggle-played')">
                Зіграно
            </label>
            <button type="button" class="game-delete" @click="$emit('remove')">Видалити</button>
        </article>`
};

Vue.createApp({
    components: { GameCard },
    data() {
        return {
            games: [],
            page: '',
            gameId: null,
            ownedOnly: false,
            loading: false,
            loadError: '',
            dbError: '',
            search: '',
            playersCount: '',
            playerCategory: '',
            genreFilter: '',
            highlightPaused: false,
            newGame: { title: '', minPlayers: '', maxPlayers: '', duration: '', owned: false, genre: '' }
        };
    },
    computed: {
        filteredGames() {
            const query = this.search.trim().toLocaleLowerCase('uk');
            const playersCount = Number(this.playersCount);

            return this.games.filter(game => {
                const matchesTitle = game.title.toLocaleLowerCase('uk').includes(query);
                const matchesPlayers = playersCount
                    ? this.fitsPlayers(game, playersCount)
                    : !this.playerCategory || this.fitsPlayerCategory(game, this.playerCategory);
                const matchesGenre = !this.genreFilter || game.genre === this.genreFilter;
                const matchesOwned = !this.ownedOnly || game.owned;
                return matchesTitle && matchesPlayers && matchesGenre && matchesOwned;
            });
        },
        currentGame() {
            return this.games.find(game => game.id === this.gameId);
        },
        // «Гра дня» береться з масиву ігор за числом поточного дня
        gameOfDay() {
            if (!this.games.length) return null;
            return this.games[new Date().getDate() % this.games.length];
        },
        playersRangeError() {
            const { minPlayers, maxPlayers } = this.newGame;
            return minPlayers && maxPlayers && minPlayers > maxPlayers
                ? 'Мінімум гравців не може бути більшим за максимум.'
                : '';
        }
    },
    async mounted() {
        try {
            await migrateFromLocalStorage();
            this.games = await getAllItems();
        } catch (error) {
            this.showDbError(error);
        }
        window.addEventListener('hashchange', this.render);
        this.render();
        if (this.games.length === 0) {
            this.loadData();
        }
    },
    methods: {
        async loadData() {
            if (this.loading) return;
            this.loading = true;
            this.loadError = '';
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`Сервер відповів кодом ${response.status}`);
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('Неочікуваний формат відповіді');
                for (const game of data) {
                    await addItem(game);
                }
                this.games = await getAllItems();
            } catch (error) {
                console.error('Помилка завантаження каталогу ігор:', error);
                this.loadError = error instanceof TypeError ? ERROR_NETWORK : ERROR_SERVER;
            } finally {
                this.loading = false;
            }
        },
        render() {
            const match = matchRoute(location.hash.slice(1) || '/');
            if (match) {
                match.view(this, match.params);
            } else {
                this.page = 'not-found';
            }
        },
        showDbError(error) {
            console.error('Помилка IndexedDB:', error);
            this.dbError = 'Не вдалося відкрити базу IndexedDB. Можливо, браузер блокує сховище, наприклад у режимі приватного перегляду. Зміни не будуть збережені.';
        },
        fitsPlayers(game, playersCount) {
            return playersCount >= game.minPlayers && playersCount <= game.maxPlayers;
        },
        fitsPlayerCategory(game, category) {
            if (category === '2') return this.fitsPlayers(game, 2);
            if (category === '3-4') return this.fitsPlayers(game, 3) || this.fitsPlayers(game, 4);
            return this.fitsPlayers(game, 5);
        },
        fitsCurrentPlayerSelection(game) {
            const playersCount = Number(this.playersCount);
            if (playersCount) return this.fitsPlayers(game, playersCount);
            return this.playerCategory
                ? this.fitsPlayerCategory(game, this.playerCategory)
                : this.fitsPlayers(game, 4);
        },
        async addGame() {
            if (this.playersRangeError) return;

            const game = {
                id: Math.max(0, ...this.games.map(game => game.id)) + 1,
                title: this.newGame.title,
                players: this.newGame.minPlayers + '–' + this.newGame.maxPlayers,
                minPlayers: this.newGame.minPlayers,
                maxPlayers: this.newGame.maxPlayers,
                duration: this.newGame.duration,
                owned: this.newGame.owned,
                played: false,
                genre: this.newGame.genre
            };

            try {
                await addItem(game);
                this.games = await getAllItems();
            } catch (error) {
                this.showDbError(error);
                return;
            }

            // скидаємо фільтри, щоб нова гра точно була видна
            this.search = '';
            this.playersCount = '';
            this.playerCategory = '';
            this.genreFilter = '';
            this.newGame = { title: '', minPlayers: '', maxPlayers: '', duration: '', owned: false, genre: '' };
        },
        async togglePlayed(game) {
            try {
                await updateItem({ ...game, played: !game.played });
                this.games = await getAllItems();
            } catch (error) {
                this.showDbError(error);
            }
        },
        async removeGame(game) {
            try {
                await deleteItem(game.id);
                this.games = await getAllItems();
            } catch (error) {
                this.showDbError(error);
            }
        }
    }
}).mount('#app');
