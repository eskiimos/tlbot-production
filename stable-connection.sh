#!/bin/bash

# 🚀 Стабильное подключение к серверу с screen

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "🔗 Подключение к серверу с использованием screen"
echo "=============================================="

# Подключаемся и создаем screen сессию
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP << 'EOF'

echo "📺 Создаем screen сессию для деплоя..."
screen -S tlbot_deploy -d -m bash -c '
    echo "🚀 Запуск деплоя в screen сессии..."
    cd /home/tlbot/app
    
    echo "👤 Переключаемся на пользователя tlbot..."
    su tlbot -c "cd /home/tlbot/app && ./deploy-regoblako.sh"
    
    echo "🎉 Деплой завершен!"
    echo "Нажмите любую клавишу для выхода..."
    read
'

echo "✅ Screen сессия создана!"
echo ""
echo "📋 Для подключения к сессии выполните:"
echo "   ssh root@89.104.65.237"
echo "   screen -r tlbot_deploy"
echo ""
echo "📋 Для просмотра всех сессий:"
echo "   screen -ls"

EOF
