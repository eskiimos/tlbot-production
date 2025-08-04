#!/bin/bash

# Скрипт настройки сервера для Telegram Mini App
echo "🚀 Начинаем настройку сервера..."

# Обновление системы
echo "📦 Обновляем систему..."
apt update && apt upgrade -y

# Установка основных пакетов
echo "🔧 Устанавливаем необходимые пакеты..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Установка Node.js 18
echo "📱 Устанавливаем Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установка Docker
echo "🐳 Устанавливаем Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Установка Docker Compose
echo "🔗 Устанавливаем Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Настройка UFW (файрвол)
echo "🔒 Настраиваем файрвол..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Создание пользователя для приложения
echo "👤 Создаем пользователя для приложения..."
useradd -m -s /bin/bash tlbot
usermod -aG docker tlbot

# Создание SSH ключа для безопасности
echo "🔑 Настраиваем SSH ключи..."
mkdir -p /home/tlbot/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOjGg1iv5caXtmoptPU3lVbysJxsFYlw7+xuHPwdxzYz tlbot-server" > /home/tlbot/.ssh/authorized_keys
chmod 700 /home/tlbot/.ssh
chmod 600 /home/tlbot/.ssh/authorized_keys
chown -R tlbot:tlbot /home/tlbot/.ssh

echo "✅ Базовая настройка сервера завершена!"
echo "📝 Проверим установленные версии:"
node --version
npm --version
docker --version
docker-compose --version

echo "🎯 Сервер готов для развертывания приложения!"
