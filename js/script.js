// Обрав Vue 3, бо він простіший для старту: шаблон схожий на звичайний HTML і не потрібен Babel.

const DB_NAME = 'BoardGamesDB';
const STORE_NAME = 'games';
const STORAGE_KEY = 'boardGames';

const defaultGames = [
    { id: 1, title: 'Каркасон', players: '2–5', minPlayers: 2, maxPlayers: 5, duration: 45, owned: true, played: true, genre: 'Стратегія', image: 'assets/img/carcas.jpg' },
    { id: 2, title: 'Кодові імена', players: '4–8', minPlayers: 4, maxPlayers: 8, duration: 15, owned: true, played: false, genre: 'Для вечірок', image: 'assets/img/train.jpg' },
    { id: 3, title: 'Колонізатори', players: '3–4', minPlayers: 3, maxPlayers: 4, duration: 90, owned: true, played: false, genre: 'Стратегія', image: 'assets/img/nastilna_hra_catan_ua.jpg' },
    { id: 4, title: 'Діксіт', players: '1–5', minPlayers: 1, maxPlayers: 5, duration: 30, owned: false, played: false, genre: 'Для вечірок', image: 'assets/img/dixit.jpg' },
    { id: 5, title: 'Крила', players: '3–6', minPlayers: 3, maxPlayers: 6, duration: 60, owned: true, played: false, genre: 'Стратегія', image: 'assets/img/3d-wingspan.jpg' }
];

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
        const oldGames = loadFromLocalStorage();
        const games = oldGames.length ? oldGames : defaultGames;
        for (const game of games) {
            await addItem(game);
        }
    }
    localStorage.setItem('migrated', 'true');
}

// Компонент картки гри: дані приходять через props, а клік по жанру передає подію filter батьку
const GameCard = {
    props: ['title', 'minPlayers', 'maxPlayers', 'duration', 'owned', 'played', 'genre', 'image', 'fits', 'featured'],
    emits: ['filter', 'toggle-played', 'remove'],
    template: `
        <article class="game-card" :class="{ fits, 'game-card--featured': featured }" :data-players="minPlayers + '-' + maxPlayers">
            <img v-if="image" :src="image" :alt="'Ілюстрація до гри «' + title + '»'">
            <p v-if="featured" class="badge game-of-day-badge">Гра дня</p>
            <h3>{{ title }}</h3>
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
                return matchesTitle && matchesPlayers && matchesGenre;
            });
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
    },
    methods: {
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
