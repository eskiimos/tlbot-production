import { startBot } from './src/bot/index';
import express from 'express';

console.log('Запуск Telegram бота...');

// В продакшене создаем простой HTTP сервер для health check
if (process.env.NODE_ENV === 'production') {
  const app = express();
  const port = process.env.PORT || 3000;

  // Health check endpoint для Railway
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (req, res) => {
    res.status(200).json({ 
      status: 'Telegram Bot is running', 
      timestamp: new Date().toISOString() 
    });
  });

  app.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
  });
}

// Запускаем бота в любом случае
startBot()
  .then(() => {
    console.log('Бот успешно запущен!');
  })
  .catch((error) => {
    console.error('Ошибка при запуске бота:', error);
    process.exit(1);
  });
