const express = require('express');
const path = require('path');
const games = require('./games.json');

const app = express();
const PORT = 3000;
const root = path.join(__dirname, '..');

// Роздаємо тільки файли сайту, а не весь корінь проєкту разом з кодом сервера
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));
app.use('/assets', express.static(path.join(root, 'assets')));

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
