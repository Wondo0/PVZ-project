const placeholderCard = document.querySelector('#games-list .game-card');
if (placeholderCard) placeholderCard.remove();

const listContainer = document.querySelector('#games-list');
const gamesCount = document.querySelector('#games-count');

const games = [
    { title: 'Каркасон', minPlayers: 2, maxPlayers: 5, image: 'assets/img/carcas.jpg' },
    { title: 'Кодові імена', minPlayers: 4, maxPlayers: 8, image: 'assets/img/train.jpg' },
    { title: 'Колонізатори', minPlayers: 3, maxPlayers: 4, image: 'assets/img/nastilna_hra_catan_ua.jpg' },
    { title: 'Діксіт', minPlayers: 1, maxPlayers: 5, image: 'assets/img/dixit.jpg' },
    { title: 'Крила', minPlayers: 3, maxPlayers: 6, image: 'assets/img/3d-wingspan.jpg' }
];

const fitsPlayers = (game, playersCount) =>
    playersCount >= game.minPlayers && playersCount <= game.maxPlayers;

// Рендерить каталог ігор.
function renderGames(gameList) {
    if (!listContainer || !gamesCount) return;

    listContainer.replaceChildren();

    gameList.forEach(game => {
        const card = document.createElement('article');
        card.classList.add('game-card');
        card.dataset.players = `${game.minPlayers}-${game.maxPlayers}`;

        if (fitsPlayers(game, 4)) {
            card.classList.add('fits');
        }

        const image = document.createElement('img');
        image.src = game.image;
        image.alt = `Ілюстрація до гри «${game.title}»`;

        const title = document.createElement('h3');
        title.textContent = game.title;

        const players = document.createElement('p');
        players.classList.add('badge', 'game-players');
        players.textContent = `${game.minPlayers}–${game.maxPlayers} гравців`;

        card.append(image, title, players);
        listContainer.append(card);
    });

    gamesCount.textContent = `Кількість ігор у списку: ${gameList.length}`;
}

renderGames(games);
