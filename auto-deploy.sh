#!/bin/bash

# 🚀 Автоматическая загрузка и деплой на рег.облако
# IP: 89.104.65.237
# Логин: root
# Пароль: Pji3PYKLpeOFgUoF

set -e

SERVER_IP="89.104.65.237"
SERVER_USER="root"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "🚀 Автоматическая загрузка TL Bot на рег.облако"
echo "================================================"
echo "🌐 Сервер: $SERVER_IP"
echo ""

# Проверяем наличие архива
if [ ! -f "tlbot-deploy.tar.gz" ]; then
    echo "❌ Архив tlbot-deploy.tar.gz не найден. Создаем..."
    ./prepare-deploy.sh
fi

# Проверяем наличие sshpass для автоматического ввода пароля
if ! command -v sshpass &> /dev/null; then
    echo "📦 Устанавливаем sshpass для автоматического подключения..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install sshpass
        else
            echo "❌ Установите Homebrew или sshpass вручную"
            echo "Или выполните команды вручную:"
            echo "scp tlbot-deploy.tar.gz root@89.104.65.237:/root/"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y sshpass || \
        sudo yum install -y sshpass || \
        echo "❌ Не удалось установить sshpass"
    fi
fi

echo "📤 Загружаем архив на сервер..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no tlbot-deploy.tar.gz $SERVER_USER@$SERVER_IP:/root/

echo "🔧 Подключаемся к серверу и запускаем настройку..."

# Создаем скрипт для выполнения на сервере
cat > remote_setup.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Настройка сервера начата..."

# Переходим в корневую директорию
cd /root

# Извлекаем архив
echo "📦 Извлекаем архив..."
tar -xzf tlbot-deploy.tar.gz

# Запускаем автонастройку сервера
echo "⚙️ Запускаем автонастройку сервера..."
chmod +x quick-setup.sh
./quick-setup.sh

echo "✅ Автонастройка сервера завершена"

# Переходим в пользователя tlbot и настраиваем проект
echo "👤 Настраиваем проект для пользователя tlbot..."
su - tlbot << 'TLBOT_EOF'
set -e

# Создаем директорию приложения
mkdir -p /home/tlbot/app

# Копируем файлы проекта
sudo cp -r /root/* /home/tlbot/app/ 2>/dev/null || true
cd /home/tlbot/app

# Устанавливаем права
sudo chown -R tlbot:tlbot /home/tlbot/app

# Делаем скрипты исполняемыми
chmod +x *.sh 2>/dev/null || true

echo "📋 Файлы проекта скопированы в /home/tlbot/app"
echo "🚀 Готов к деплою!"

TLBOT_EOF

echo "🎉 Настройка завершена!"
echo "======================================="
echo "📁 Файлы проекта находятся в: /home/tlbot/app"
echo "👤 Для продолжения выполните:"
echo "   su - tlbot"
echo "   cd /home/tlbot/app"
echo "   ./deploy-regoblako.sh"

EOF

# Загружаем и выполняем скрипт на сервере
echo "📤 Загружаем скрипт настройки на сервер..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no remote_setup.sh $SERVER_USER@$SERVER_IP:/root/

echo "⚙️ Выполняем настройку на сервере..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP 'chmod +x remote_setup.sh && ./remote_setup.sh'

echo ""
echo "🎉 Автоматическая настройка завершена!"
echo "======================================"
echo ""
echo "📋 Следующие шаги:"
echo "1. Подключитесь к серверу:"
echo "   ssh root@89.104.65.237"
echo "   (пароль: Pji3PYKLpeOFgUoF)"
echo ""
echo "2. Перейдите в пользователя tlbot:"
echo "   su - tlbot"
echo ""
echo "3. Запустите деплой:"
echo "   cd /home/tlbot/app"
echo "   ./deploy-regoblako.sh"
echo ""
echo "🤖 После деплоя не забудьте настроить webhook:"
echo "curl -F \"url=http://89.104.65.237:3000/api/bot\" \\"
echo "     \"https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook\""

# Очищаем временный файл
rm -f remote_setup.sh
