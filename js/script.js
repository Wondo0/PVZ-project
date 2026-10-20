// Обрав Vue 3, бо він простіший для старту: шаблон схожий на звичайний HTML і не потрібен Babel.

// Компонент картки гри: дані приходять через props, а клік по жанру передає подію filter батьку
const GameCard = {
    props: ['title', 'minPlayers', 'maxPlayers', 'genre', 'image', 'fits'],
    emits: ['filter'],
    template: `
        <article class="game-card" :class="{ fits }" :data-players="minPlayers + '-' + maxPlayers">
            <img v-if="image" :src="image" :alt="'Ілюстрація до гри «' + title + '»'">
            <h3>{{ title }}</h3>
            <button type="button" class="game-genre" @click="$emit('filter', genre)">Жанр: {{ genre }}</button>
            <p class="badge game-players">{{ minPlayers }}–{{ maxPlayers }} гравців</p>
        </article>`
};

// Функцію renderGames() з практикуму 7 прибрано: тепер список малює компонент GameCard через v-for
Vue.createApp({
    components: { GameCard },
    data() {
        return {
            games: [
                { id: 1, title: 'Каркасон', minPlayers: 2, maxPlayers: 5, genre: 'Стратегія', image: 'assets/img/carcas.jpg' },
                { id: 2, title: 'Кодові імена', minPlayers: 4, maxPlayers: 8, genre: 'Для вечірок', image: 'assets/img/train.jpg' },
                { id: 3, title: 'Колонізатори', minPlayers: 3, maxPlayers: 4, genre: 'Стратегія', image: 'assets/img/nastilna_hra_catan_ua.jpg' },
                { id: 4, title: 'Діксіт', minPlayers: 1, maxPlayers: 5, genre: 'Для вечірок', image: 'assets/img/dixit.jpg' },
                { id: 5, title: 'Крила', minPlayers: 3, maxPlayers: 6, genre: 'Стратегія', image: 'assets/img/3d-wingspan.jpg' }
            ],
            search: '',
            playersCount: '',
            playerCategory: '',
            genreFilter: '',
            newGame: { title: '', minPlayers: '', maxPlayers: '', genre: '' }
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
        playersRangeError() {
            const { minPlayers, maxPlayers } = this.newGame;
            return minPlayers && maxPlayers && minPlayers > maxPlayers
                ? 'Мінімум гравців не може бути більшим за максимум.'
                : '';
        }
    },
    methods: {
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
        addGame() {
            if (this.playersRangeError) return;

            this.games.push({
                id: Math.max(...this.games.map(game => game.id)) + 1,
                title: this.newGame.title,
                minPlayers: this.newGame.minPlayers,
                maxPlayers: this.newGame.maxPlayers,
                genre: this.newGame.genre
            });

            // скидаємо фільтри, щоб нова гра точно була видна
            this.search = '';
            this.playersCount = '';
            this.playerCategory = '';
            this.genreFilter = '';
            this.newGame = { title: '', minPlayers: '', maxPlayers: '', genre: '' };
        }
    }
}).mount('#app');
