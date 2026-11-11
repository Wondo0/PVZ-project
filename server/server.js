const express = require('express');
const path = require('path');
const games = require('./games.json');

const app = express();
const PORT = 3000;

// Роздаємо index.html, css, js і assets з кореня проєкту, тому сайт і API на одному порту
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/games', (req, res) => {
    res.json(games);
});

app.get('/api/games/:id', (req, res) => {
    const game = games.find(game => String(game.id) === req.params.id);
    if (!game) return res.status(404).json({ error: 'Не знайдено' });
    res.json(game);
});

// Будь-який інший шлях повертає 404 з JSON-повідомленням
app.use((req, res) => {
    res.status(404).json({ error: 'Не знайдено' });
});

app.listen(PORT, () => console.log(`Сервер запущено на http://localhost:${PORT}`));
