import { startBot } from './src/bot/index';

console.log('Запуск Telegram бота...');

// Этот файл используется только для локального запуска бота
if (process.env.NODE_ENV !== 'production') {
  startBot()
    .then(() => {
      console.log('Бот успешно запущен!');
    })
    .catch((error) => {
      console.error('Ошибка при запуске бота:', error);
      process.exit(1);
    });
}
