import express from 'express';
import { bot } from './bot';

console.log('🚀 Запуск Telegram бота в продакшене...');

// Создаем HTTP сервер для health check и webhook
const app = express();
const port = process.env.PORT || 3000;

// Middleware для обработки JSON
app.use(express.json());

// Health check endpoint для Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'telegram-bot'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Total Lookas Telegram Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint для Telegram
app.post('/webhook', (req, res) => {
  try {
    bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Запуск HTTP сервера
app.listen(port, () => {
  console.log(`Health check server running on port ${port}`);
});

// Функция для запуска бота
async function startBot() {
  try {
    console.log('Инициализация бота...');
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Бот запущен: @${botInfo.username} (ID: ${botInfo.id})`);
    
    // Устанавливаем webhook
    const webhookUrl = 'https://tlbot-production-production.up.railway.app/webhook';
    console.log('Устанавливаем webhook:', webhookUrl);
    
    await bot.telegram.setWebhook(webhookUrl);
    console.log('✅ Webhook установлен успешно!');
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при запуске бота:', error);
    process.exit(1);
  }
}

// Запуск бота
startBot();

// Обработка завершения процесса
process.on('SIGINT', async () => {
  console.log('Получен сигнал SIGINT, завершение работы...');
  await bot.telegram.deleteWebhook();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Получен сигнал SIGTERM, завершение работы...');
  await bot.telegram.deleteWebhook();
  process.exit(0);
});

export default app;
