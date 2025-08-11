#!/bin/bash

# 🚀 Быстрая настройка TL Bot на VPS
# Этот скрипт автоматизирует весь процесс настройки

set -e

echo "🚀 Быстрая настройка TL Bot на VPS"
echo "=================================="

# Проверяем права root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Пожалуйста, запустите скрипт от имени root: sudo ./quick-setup.sh"
    exit 1
fi

# Определяем ОС
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "❌ Не удалось определить операционную систему"
    exit 1
fi

echo "🖥️  Обнаружена ОС: $OS $VER"

# Обновляем систему
echo "📦 Обновляем систему..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    apt update && apt upgrade -y
    apt install -y curl wget git nano htop ufw fail2ban
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
    yum update -y
    yum install -y curl wget git nano htop
fi

# Устанавливаем Docker
echo "🐳 Устанавливаем Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Запускаем Docker
    systemctl start docker
    systemctl enable docker
    
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

# Устанавливаем Docker Compose
echo "🔧 Устанавливаем Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

# Устанавливаем Node.js (для локальных команд)
echo "📦 Устанавливаем Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js установлен"
else
    echo "✅ Node.js уже установлен"
fi

# Создаем пользователя для приложения
echo "👤 Создаем пользователя tlbot..."
if ! id "tlbot" &>/dev/null; then
    useradd -m -s /bin/bash tlbot
    usermod -aG docker tlbot
    echo "✅ Пользователь tlbot создан"
else
    echo "✅ Пользователь tlbot уже существует"
    usermod -aG docker tlbot
fi

# Настраиваем фаервол
echo "🔥 Настраиваем фаервол..."
if command -v ufw &> /dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo "✅ Фаервол настроен"
fi

# Устанавливаем Nginx
echo "🌐 Устанавливаем Nginx..."
if ! command -v nginx &> /dev/null; then
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt install -y nginx
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum install -y nginx
    fi
    
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx установлен"
else
    echo "✅ Nginx уже установлен"
fi

# Устанавливаем Certbot для SSL
echo "🔒 Устанавливаем Certbot..."
if ! command -v certbot &> /dev/null; then
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt install -y certbot python3-certbot-nginx
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        yum install -y certbot python3-certbot-nginx
    fi
    echo "✅ Certbot установлен"
else
    echo "✅ Certbot уже установлен"
fi

# Создаем директорию проекта
echo "📁 Создаем директорию проекта..."
mkdir -p /home/tlbot/app
mkdir -p /home/tlbot/backups
mkdir -p /home/tlbot/logs
chown -R tlbot:tlbot /home/tlbot

echo ""
echo "🎉 Сервер готов к развертыванию!"
echo "================================"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте файлы проекта в /home/tlbot/app/"
echo "2. Перейдите в пользователя tlbot: su - tlbot"
echo "3. Настройте .env.production"
echo "4. Запустите деплой: ./deploy.sh"
echo ""
echo "📊 Установленные версии:"
docker --version
docker-compose --version
node --version
nginx -v
echo ""
echo "🌐 IP сервера: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
