#!/bin/bash

# 📦 Подготовка проекта для загрузки на VPS

echo "📦 Подготавливаем проект для загрузки на VPS..."

# Создаем директорию для деплоя
mkdir -p deploy-package

# Копируем необходимые файлы
echo "📋 Копируем файлы проекта..."

# Основные файлы проекта
cp -r src deploy-package/
cp -r prisma deploy-package/
cp -r public deploy-package/
cp -r scripts deploy-package/

# Конфигурационные файлы
cp package.json deploy-package/
cp package-lock.json deploy-package/
cp tsconfig.json deploy-package/
cp next.config.ts deploy-package/
cp tailwind.config.js deploy-package/
cp postcss.config.mjs deploy-package/
cp components.json deploy-package/
cp bot.ts deploy-package/

# Docker файлы
cp Dockerfile deploy-package/
cp docker-compose.prod.yml deploy-package/
cp .dockerignore deploy-package/ 2>/dev/null || true

# Скрипты развертывания
cp server-setup.sh deploy-package/
cp deploy.sh deploy-package/
cp quick-setup.sh deploy-package/
cp deploy-regoblako.sh deploy-package/
cp regoblako-setup-guide.sh deploy-package/
cp .env.production.example deploy-package/
cp .env.regoblako deploy-package/

# Документация
cp DEPLOYMENT_GUIDE.md deploy-package/
cp DEPLOYMENT_OPTIONS.md deploy-package/
cp README.md deploy-package/

# Создаем gitignore для сервера
cat > deploy-package/.gitignore << 'EOF'
node_modules/
.next/
.env.local
.env.production
.env
*.log
uploads/
backups/
.DS_Store
dist/
build/
EOF

# Создаем архив
echo "🗜️  Создаем архив..."
tar -czf tlbot-deploy.tar.gz -C deploy-package .

# Очищаем временную директорию
rm -rf deploy-package

echo "✅ Архив готов: tlbot-deploy.tar.gz"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите tlbot-deploy.tar.gz на ваш VPS"
echo "2. Извлеките архив: tar -xzf tlbot-deploy.tar.gz"
echo "3. Запустите настройку: chmod +x server-setup.sh && ./server-setup.sh"
echo "4. Настройте .env.production"
echo "5. Запустите деплой: ./deploy.sh"
