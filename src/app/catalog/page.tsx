'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description?: string;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single'); // single = 1 в ряд, double = 2 в ряд
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Функция для подсчета товаров в корзине
  const updateCartCount = () => {
    // Проверяем, что мы находимся в браузере
    if (typeof window === 'undefined') {
      setCartItemsCount(0);
      return;
    }
    
    try {
      const savedCart = localStorage.getItem('tlbot_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        const totalItems = cartData.reduce((total: number, item: any) => total + item.quantity, 0);
        setCartItemsCount(totalItems);
      } else {
        setCartItemsCount(0);
      }
    } catch (error) {
      console.error('Ошибка при подсчете товаров в корзине:', error);
      setCartItemsCount(0);
    }
  };

  // Категории товаров
  const categories = [
    { id: 'all', name: 'Все товары' },
    { id: 'outerwear', name: 'Верхняя одежда' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'bottoms', name: 'Низ' },
    { id: 'accessories', name: 'Аксессуары' }
  ];

  // Функция для определения категории товара
  const getCategoryForProduct = (productName: string, slug: string): string => {
    const name = productName.toLowerCase();
    const productSlug = slug.toLowerCase();
    
    if (name.includes('худи') || name.includes('халфзип') || name.includes('зип')) {
      return 'outerwear';
    }
    if (name.includes('джинсы') || name.includes('штаны') || name.includes('шорты')) {
      return 'bottoms';
    }
    if (name.includes('шоппер')) {
      return 'accessories';
    }
    // Футболка, лонгслив, свитшот - основная одежда
    return 'clothing';
  };

  // Фильтрация и сортировка товаров по категории и цене (от минимальной к максимальной)
  const filteredProducts = (selectedCategory === 'all' 
    ? products 
    : products.filter(product => getCategoryForProduct(product.name, product.slug) === selectedCategory)
  ).sort((a, b) => a.price - b.price);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Загружаем товары...');
        const response = await fetch('/api/products');
        console.log('Ответ API:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Данные товаров:', data);
        
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          console.error('Неверный формат данных:', data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    
    // Устанавливаем флаг монтирования компонента
    setIsMounted(true);
    updateCartCount();
    
    // Обновляем счетчик при изменении localStorage
    const handleStorageChange = () => {
      updateCartCount();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Хэдер с логотипом */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Иконка профиля слева */}
            <Link 
              href="/?edit=true"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Личный кабинет"
            >
              <Image
                src="/bx_user.svg"
                alt="Личный кабинет"
                width={24}
                height={24}
                className="w-6 h-6 text-[#303030]"
              />
            </Link>
            
            {/* Логотип по центру */}
            <div className="flex justify-center">
              <Image
                src="/TLlogo.svg"
                alt="TL Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            
            {/* Иконка корзины справа */}
            <button 
              onClick={() => {
                window.location.href = '/cart';
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              title="Корзина"
            >
              <Image
                src="/teenyicons_bag-outline.svg"
                alt="Корзина"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              {isMounted && cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Контент каталога */}
      <div className="max-w-md mx-auto p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
            <p className="text-gray-600 mt-4">Загружаем товары...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-center text-[#303030] mb-4">
                Создайте коммерческое предложение за пару минут! 
              </h1>
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <p className="text-gray-700 text-sm leading-relaxed text-center">
                  Всё просто и быстро: выберите товар, настройте опции (метод нанесения, упаковку, бирки и другие детали), 
                  добавьте в корзину и отправьте готовое коммерческое предложение прямо в Telegram! 📋✨
                </p>
              </div>
              <p className="text-center text-gray-500 text-sm">
                {filteredProducts.length} товар{filteredProducts.length % 10 === 1 && filteredProducts.length !== 11 ? '' : filteredProducts.length % 10 >= 2 && filteredProducts.length % 10 <= 4 && (filteredProducts.length < 10 || filteredProducts.length > 20) ? 'а' : 'ов'} в каталоге
              </p>
            </div>

            {/* Фильтры-теги */}
            <div>
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category.id
                        ? 'bg-[#303030] text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Переключатель вида отображения */}
            <div className="mb-4">
              <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex w-full">
                <button
                  onClick={() => setViewMode('single')}
                  className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    viewMode === 'single'
                      ? 'bg-gray-100 text-gray-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="1 товар в ряд"
                >
                  <Image
                    src="/si_window-line1.svg"
                    alt="1 товар в ряд"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">1 в ряд</span>
                </button>
                <button
                  onClick={() => setViewMode('double')}
                  className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    viewMode === 'double'
                      ? 'bg-gray-100 text-gray-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="2 товара в ряд"
                >
                  <Image
                    src="/si_window-line.svg"
                    alt="2 товара в ряд"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">2 в ряд</span>
                </button>
              </div>
            </div>

            {/* Сетка товаров */}
            <div className={`grid gap-4 ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isCompact={viewMode === 'double'}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">В этой категории товары не найдены</p>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="mt-2 text-[#303030] hover:underline text-sm"
                >
                  Показать все товары
                </button>
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Товары не найдены</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
