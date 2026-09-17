console.log('script.js підключено');

// масив настільних ігор
const games = [
    { title: 'Каркасон', minPlayers: 2, maxPlayers: 5 },
    { title: 'Кодові імена', minPlayers: 4, maxPlayers: 8 },
    { title: 'Колонізатори', minPlayers: 3, maxPlayers: 4 },
    { title: 'Діксіт', minPlayers: 1, maxPlayers: 5 },
    { title: 'Крила', minPlayers: 3, maxPlayers: 6 }
];

// стрілкова функція для перевірки діапазону гравців
const fitsPlayers = (game, n) => n >= game.minPlayers && n <= game.maxPlayers;

// функція для фільтрації та виведення ігор у консоль
function showGamesForPlayers(gameList, playersCount) {
    let matchingCount = 0;
    console.log(`Ігри для ${playersCount} гравців:`);
    for (const game of gameList) {
        if (fitsPlayers(game, playersCount)) {
            console.log(`Підходить: ${game.title} (${game.minPlayers}–${game.maxPlayers} гравців)`);
            matchingCount++;
        } else {
            console.log(`Не підходить: ${game.title} (${game.minPlayers}–${game.maxPlayers} гравців)`);
        }
    }
    console.log(`Підсумкова кількість підходящих ігор: ${matchingCount}`);
}

// перевірка роботи стрілкової функції
console.log(fitsPlayers(games[0], 4));
console.log(fitsPlayers(games[1], 2));

// виклик основної функції
showGamesForPlayers(games, 2);
