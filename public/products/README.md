# Папка для фотографий товаров

Эта папка предназначена для хранения изображений товаров.

## Структура папок:
- Создавайте подпапки для каждого товара по названию (например: `dzhinsy-tl/`)
- В каждой подпапке размещайте все фото товара
- Используйте понятные названия файлов (например: `front.jpg`, `back.jpg`, `detail1.jpg`)

## Рекомендации по изображениям:
- Формат: JPG или PNG
- Размер: оптимально 800x800px для квадратных фото
- Качество: высокое, но сжатое для веб-использования
- Названия файлов: на английском языке, без пробелов

## Пример структуры:
```
products/
├── dzhinsy-tl/
│   ├── front.jpg
│   ├── back.jpg
│   └── detail1.jpg
├── futbolka-classic/
│   ├── white-front.jpg
│   ├── white-back.jpg
│   ├── black-front.jpg
│   └── black-back.jpg
```

## Использование в базе данных:
В поле `images` продукта указывайте пути относительно `/images/products/`:
```json
[
  "/images/products/dzhinsy-tl/front.jpg",
  "/images/products/dzhinsy-tl/back.jpg",
  "/images/products/dzhinsy-tl/detail1.jpg"
]
```
