#!/bin/bash

# 📊 Мониторинг деплоя TL Bot

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "📊 Мониторинг деплоя TL Bot"
echo "=========================="

while true; do
    echo ""
    echo "⏰ $(date '+%H:%M:%S') - Проверяем статус..."
    
    # Получаем статус
    STATUS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$SERVER_IP 'cat /tmp/tlbot_deploy_status 2>/dev/null || echo "unknown"')
    
    echo "📋 Текущий статус: $STATUS"
    
    case $STATUS in
        "starting")
            echo "🚀 Деплой начинается..."
            ;;
        "postgres_starting")
            echo "🗄️  Запуск PostgreSQL..."
            ;;
        "building")
            echo "🔨 Сборка Docker образа..."
            ;;
        "migrating")
            echo "📊 Применение миграций..."
            ;;
        "starting_app")
            echo "🚀 Запуск приложения..."
            ;;
        "success")
            echo "🎉 ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
            echo ""
            echo "🌐 Ваше приложение доступно:"
            echo "   Основное: http://89.104.65.237:3000"
            echo "   Админка:  http://89.104.65.237:3000/admin"
            echo ""
            echo "👤 Данные для входа:"
            echo "   Email: admin@tlbot.local"
            echo "   Пароль: AdminTLBot2025!"
            echo ""
            echo "📱 Найдите вашего бота в Telegram и отправьте /start"
            break
            ;;
        "error:"*)
            echo "❌ ОШИБКА ДЕПЛОЯ: $STATUS"
            echo ""
            echo "📋 Получаем последние логи..."
            sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP 'tail -10 /tmp/tlbot_deploy.log 2>/dev/null || echo "Логи недоступны"'
            break
            ;;
        "completed")
            echo "✅ Деплой завершен!"
            break
            ;;
        "unknown")
            echo "❓ Статус неизвестен (возможно, деплой еще не начался)"
            ;;
        *)
            echo "🔄 Деплой в процессе..."
            ;;
    esac
    
    # Ждем 10 секунд перед следующей проверкой
    sleep 10
done

echo ""
echo "📊 Мониторинг завершен!"
