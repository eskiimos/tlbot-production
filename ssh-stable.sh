#!/bin/bash

# 🔗 SSH подключение с настройками против разрыва

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"

echo "🔗 Стабильное SSH подключение"
echo "============================"

# Подключение с настройками KeepAlive
sshpass -p "$SERVER_PASS" ssh \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o TCPKeepAlive=yes \
    -o ConnectTimeout=10 \
    root@$SERVER_IP
