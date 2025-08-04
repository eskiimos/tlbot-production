'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface PriceTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface ProductOption {
  id: string;
  category: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description?: string;
  priceTiers: PriceTier[];
  options: ProductOption[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(10); // Минимальный заказ 10 штук
  const [imageError, setImageError] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{[category: string]: string[]}>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
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

  // Обновляем счетчик при загрузке страницы
  useEffect(() => {
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

  // Функция для добавления товара в корзину
  const addToCart = () => {
    if (!product || typeof window === 'undefined') return;

    // Получаем выбранные опции с деталями
    const optionsDetails = Object.values(selectedOptions).flat().map(optionId => {
      const option = product.options.find(opt => opt.id === optionId);
      return option ? {
        id: option.id,
        name: option.name,
        category: option.category,
        price: option.price
      } : null;
    }).filter(Boolean);

    // Создаем объект товара для корзины
    const cartItem = {
      id: `${product.id}_${Date.now()}`, // Уникальный ID для позиции в корзине
      productName: product.name,
      productSlug: product.slug,
      quantity: quantity,
      basePrice: getPriceForQuantity(quantity) - Object.values(selectedOptions).flat().reduce((total, optionId) => {
        const option = product.options.find(opt => opt.id === optionId);
        return total + (option ? option.price : 0);
      }, 0), // Базовая цена без опций
      selectedOptions: selectedOptions,
      optionsDetails: optionsDetails,
      totalPrice: getTotalPriceWithOptions() * quantity,
      image: product.images.length > 0 ? product.images[0] : undefined
    };

    // Загружаем текущую корзину из localStorage
    let currentCart = [];
    try {
      const savedCart = localStorage.getItem('tlbot_cart');
      if (savedCart) {
        currentCart = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Ошибка при загрузке корзины:', error);
    }

    // Добавляем новый товар
    currentCart.push(cartItem);

    // Сохраняем обновленную корзину
    try {
      localStorage.setItem('tlbot_cart', JSON.stringify(currentCart));
      // Обновляем счетчик товаров
      updateCartCount();
    } catch (error) {
      console.error('Ошибка при сохранении корзины:', error);
    }
  };

  // Функция для проверки, заполнен ли шаг
  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1: // Количество
        return quantity >= 10; // Всегда завершен, если количество >= 10
      case 2: // Цвет - любой выбор считается завершением
        const selectedColors = selectedOptions.color || [];
        return selectedColors.length > 0;
      case 3: // Дизайн - любой выбор считается завершением
        const selectedDesigns = selectedOptions.design || [];
        return selectedDesigns.length > 0;
      case 4: // Принт - только платные опции считаются завершением
        const selectedPrints = selectedOptions.print || [];
        return selectedPrints.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
      case 5: // Бирки и упаковка - только платные опции считаются завершением
        const selectedLabels = selectedOptions.label || [];
        const selectedPackaging = selectedOptions.packaging || [];
        const hasPayedLabel = selectedLabels.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
        const hasPayedPackaging = selectedPackaging.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
        return hasPayedLabel || hasPayedPackaging;
      default:
        return false;
    }
  };

  // Функция для проверки, есть ли выбор в шаге (для разблокировки следующего шага)
  const hasStepSelection = (step: number): boolean => {
    switch (step) {
      case 1: // Количество
        return quantity >= 10; // Всегда разблокирован
      case 2: // Цвет
        return (selectedOptions.color || []).length > 0;
      case 3: // Дизайн
        return (selectedOptions.design || []).length > 0;
      case 4: // Принт
        return (selectedOptions.print || []).length > 0;
      case 5: // Бирки и упаковка
        return (selectedOptions.label || []).length > 0 || (selectedOptions.packaging || []).length > 0;
      default:
        return false;
    }
  };

  // Автоматический переход отключен - используем только ручную навигацию
  // useEffect(() => {
  //   if (!isInitialized || isManualNavigation) return;
  //   
  //   if (currentStep < 4 && hasStepSelection(currentStep)) {
  //     const timer = setTimeout(() => {
  //       setCurrentStep(prev => Math.min(prev + 1, 4));
  //     }, 500);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [selectedOptions, currentStep, isInitialized, isManualNavigation]);

  // Функция для ручного перехода к шагу
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      // Можем переходить назад к любому пройденному шагу
      if (step < currentStep) {
        setCurrentStep(step);
      }
      // Можем переходить вперёд только на один шаг и только если текущий заполнен
      else if (step === currentStep + 1 && hasStepSelection(currentStep)) {
        setCurrentStep(step);
      }
      // Остаёмся на текущем шаге
      else if (step === currentStep) {
        setCurrentStep(step);
      }
    }
  };

  // Закрытие подсказки при клике вне её
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTooltip(null);
    };
    
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);

  // Инициализация выбранных опций по умолчанию
  useEffect(() => {
    if (product && product.options.length > 0) {
      const defaultOptions: {[category: string]: string[]} = {};
      
      // Группируем опции по категориям
      const optionsByCategory = product.options.reduce((acc, option) => {
        if (!acc[option.category]) acc[option.category] = [];
        acc[option.category].push(option);
        return acc;
      }, {} as {[category: string]: ProductOption[]});

      // Устанавливаем опции по умолчанию
      Object.entries(optionsByCategory).forEach(([category, options]) => {
        const defaultOption = options.find(opt => opt.isDefault);
        if (defaultOption) {
          defaultOptions[category] = [defaultOption.id];
        } else {
          defaultOptions[category] = [];
        }
      });

      setSelectedOptions(defaultOptions);
      setIsInitialized(true);
    }
  }, [product]);

  // Функция для получения цены за единицу в зависимости от количества и опций
  const getPriceForQuantity = (quantity: number): number => {
    if (!product || !product.priceTiers.length) return product?.price || 0;
    
    const tier = product.priceTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    );
    
    const basePrice = tier ? tier.price : product.price;
    
    // Добавляем стоимость выбранных опций
    const optionsPrice = Object.values(selectedOptions).flat().reduce((total, optionId) => {
      const option = product.options.find(opt => opt.id === optionId);
      return total + (option ? option.price : 0);
    }, 0);
    
    return basePrice + optionsPrice;
  };

  // Функция для получения активного ценового уровня
  const getActivePriceTier = (quantity: number): PriceTier | null => {
    if (!product || !product.priceTiers.length) return null;
    
    return product.priceTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    ) || null;
  };

  // Функция для получения опций по категории
  const getOptionsByCategory = (category: string): ProductOption[] => {
    if (!product) return [];
    return product.options.filter(opt => opt.category === category && opt.isActive);
  };

  // Функция для подсчета стоимости опций в категории
  const getCategoryPrice = (category: string): number => {
    const selectedIds = selectedOptions[category] || [];
    return selectedIds.reduce((total, optionId) => {
      const option = product?.options.find(opt => opt.id === optionId);
      return total + (option ? option.price : 0);
    }, 0);
  };

  // Функция для подсчета общей цены с опциями
  const getTotalPriceWithOptions = (): number => {
    const basePrice = getPriceForQuantity(quantity);
    return basePrice;
  };

  // Функция для обработки выбора опции
  const handleOptionSelect = (category: string, optionId: string) => {
    setSelectedOptions(prev => {
      const currentOptions = prev[category] || [];
      const isSelected = currentOptions.includes(optionId);
      const selectedOption = product?.options.find(opt => opt.id === optionId);
      
      if (!selectedOption) return prev;
      
      // Для цвета и дизайна - только один выбор
      if (category === 'color' || category === 'design') {
        if (isSelected) {
          // Убираем выбор (разрешаем снять выбор)
          return {
            ...prev,
            [category]: []
          };
        } else {
          // Заменяем предыдущий выбор новым
          return {
            ...prev,
            [category]: [optionId]
          };
        }
      }
      
      // Для остальных категорий - множественный выбор с логикой бесплатных/платных
      if (isSelected) {
        // Убираем выбранную опцию
        return {
          ...prev,
          [category]: currentOptions.filter(id => id !== optionId)
        };
      } else {
        // Добавляем новую опцию
        const isFreeOption = selectedOption.price === 0;
        const hasPayedOptions = currentOptions.some(id => {
          const option = product?.options.find(opt => opt.id === id);
          return option && option.price > 0;
        });
        const hasFreeOptions = currentOptions.some(id => {
          const option = product?.options.find(opt => opt.id === id);
          return option && option.price === 0;
        });
        
        if (isFreeOption) {
          // Если выбираем бесплатную опцию и есть платные - убираем все платные
          if (hasPayedOptions) {
            const freeOptions = currentOptions.filter(id => {
              const option = product?.options.find(opt => opt.id === id);
              return option && option.price === 0;
            });
            return {
              ...prev,
              [category]: [...freeOptions, optionId]
            };
          } else {
            // Просто добавляем к существующим бесплатным
            return {
              ...prev,
              [category]: [...currentOptions, optionId]
            };
          }
        } else {
          // Если выбираем платную опцию и есть бесплатные - убираем все бесплатные
          if (hasFreeOptions) {
            const payedOptions = currentOptions.filter(id => {
              const option = product?.options.find(opt => opt.id === id);
              return option && option.price > 0;
            });
            return {
              ...prev,
              [category]: [...payedOptions, optionId]
            };
          } else {
            // Просто добавляем к существующим платным
            return {
              ...prev,
              [category]: [...currentOptions, optionId]
            };
          }
        }
      }
    });
  };

  const currentPrice = getPriceForQuantity(quantity);
  const activeTier = getActivePriceTier(quantity);

  // Маппинг размерных сеток для товаров
  const getSizeChartImage = (slug: string): string | null => {
    const sizeChartMap: {[key: string]: string | null} = {
      't-shirt': '/products/t-shirt/R_t-shirt (OS) TL.png',
      'longsleeve': '/products/t-shirt/R_t-shirt (OS) TL.png', // Используем размерную сетку футболки
      'sweatshirt': '/products/sweatshirt/R_sweatshirt (K) TL.png',
      'hoodies': '/products/hoodies/R_hoodie (K) TL.png',
      'halfzip': '/products/halfzip/R_halfzip (K) TL.png',
      'zip-hoodie': '/products/zip-hoodie/R_zip_hoodie (K) TL.png',
      'pants': '/products/pants/R_Pants TL.png',
      'shorts': '/products/shorts/R_shorts TL.png',
      'jeans': '/products/pants/R_Pants TL.png', // Используем размерную сетку штанов
      'shopper': null // Для сумки размерная сетка не нужна
    };
    
    return sizeChartMap[slug] || null;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.products) {
          const foundProduct = data.products.find((p: Product) => p.slug === params.slug);
          setProduct(foundProduct || null);
        }
      } catch (error) {
        console.error('Ошибка при загрузке товара:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 10 ? prev - 1 : 10); // Минимум 10 штук
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
          <p className="text-gray-600 mt-4">Загружаем товар...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Товар не найден</h1>
          <Link 
            href="/catalog"
            className="px-4 py-2 bg-[#303030] text-white rounded-lg hover:bg-[#404040] transition-colors"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const currentImage = product.images.length > 0 ? product.images[currentImageIndex] : '';

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Хэдер с навигацией */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-[#303030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <Image
                src="/TLlogo.svg"
                alt="TL Logo"
                width={120}
                height={40}
                className="h-10 w-auto mx-auto"
              />
            </div>
            <button 
              onClick={() => {
                router.push('/cart');
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
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

      <div className="max-w-md mx-auto p-4">
        {/* 1. Фото товара (слайдер) */}
        <div className="bg-white rounded-lg overflow-hidden mb-6">
          <div className="relative aspect-square bg-white">
            {!imageError && currentImage ? (
              <>
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                
                {/* Кнопки навигации */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Пагинация */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? 'bg-white shadow-md'
                            : 'bg-[#C4C4C4] hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Фото скоро</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Название товара */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#303030]">
            {product.name}
          </h1>
        </div>

        {/* 3. Стоимость */}
        <div className="mb-6">
          <p className="text-3xl font-bold text-[#303030]">
            {currentPrice.toLocaleString('ru-RU')}₽
          </p>
          <p className="text-gray-500 text-sm mt-1">
            за единицу товара
            {activeTier && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {activeTier.minQuantity}-{activeTier.maxQuantity || '∞'} шт
              </span>
            )}
          </p>
        </div>

        {/* Ценовые уровни */}
        {product.priceTiers.length > 0 && (
          <div className="bg-white rounded-lg p-3 shadow-sm mb-6">
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              Ценовые уровни
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.priceTiers.map((tier, index) => (
                <div 
                  key={tier.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activeTier?.id === tier.id 
                      ? 'bg-green-500 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="font-medium">
                    {tier.minQuantity}-{tier.maxQuantity || '∞'} шт
                  </span>
                  <span className="text-xs opacity-75">•</span>
                  <span className="font-bold">
                    {tier.price.toLocaleString('ru-RU')}₽
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пошаговый бриф товара */}
        {product.options.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* Шаг 1: Количество */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <h3 className="text-base font-semibold text-[#303030]">Количество</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={decrementQuantity}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 10}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="text-xl font-semibold text-[#303030] min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    
                    <button
                      onClick={incrementQuantity}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#303030]">
                      {(currentPrice * quantity).toLocaleString('ru-RU')}₽
                    </p>
                    <p className="text-sm text-gray-500">итого</p>
                    {quantity > 1 && (
                      <p className="text-xs text-gray-400">
                        {currentPrice.toLocaleString('ru-RU')}₽ × {quantity}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Минимальный заказ: 10 штук
                </p>
              </div>
            )}

            {/* Шаг 2: Выбор цвета */}
            {currentStep === 2 && getOptionsByCategory('color').length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 2 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {currentStep === 2 ? '2' : '✓'}
                  </span>
                  <h3 className="text-base font-semibold text-[#303030]">Цвет</h3>
                  {isStepCompleted(2) && <span className="text-green-500 text-sm">✓ Выбрано</span>}
                </div>
                <div className="space-y-1">
                  {getOptionsByCategory('color')
                    .sort((a, b) => {
                      // Определяем порядок: стандартные цвета, потом "Индивидуальный"
                      const order = ['Белый', 'Серый', 'Темно-синий', 'Черный', 'Индивидуальный'];
                      const indexA = order.indexOf(a.name);
                      const indexB = order.indexOf(b.name);
                      
                      // Если оба элемента в списке порядка
                      if (indexA !== -1 && indexB !== -1) {
                        return indexA - indexB;
                      }
                      // Если только один в списке, он идёт первым
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      // Если ни одного в списке, сохраняем исходный порядок
                      return 0;
                    })
                    .map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleOptionSelect('color', option.id)}
                      className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors cursor-pointer ${
                        (selectedOptions.color || []).includes(option.id)
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{option.name}</span>
                        {(selectedOptions.color || []).includes(option.id) && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            выбрано
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Подитог для цвета */}
                {getCategoryPrice('color') > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Доплата за цвет:</span>
                      <span className="font-semibold text-[#303030]">+{getCategoryPrice('color')}₽</span>
                    </div>
                  </div>
                )}
                
                {/* Итого */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого за единицу:</span>
                    <span className="font-semibold text-[#303030]">{getTotalPriceWithOptions().toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 3: Дизайн */}
            {currentStep === 3 && getOptionsByCategory('design').length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 3 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {currentStep === 3 ? '3' : '✓'}
                  </span>
                  <h3 className="text-base font-semibold text-[#303030]">Дизайн</h3>
                  {isStepCompleted(3) && <span className="text-green-500 text-sm">✓ Выбрано</span>}
                </div>
                <div className="space-y-1">
                  {getOptionsByCategory('design')
                    .sort((a, b) => {
                      // "Нужен дизайн" перемещаем в конец
                      if (a.name === 'Нужен дизайн') return 1;
                      if (b.name === 'Нужен дизайн') return -1;
                      return 0;
                    })
                    .map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleOptionSelect('design', option.id)}
                      className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors cursor-pointer ${
                        (selectedOptions.design || []).includes(option.id)
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{option.name}</span>
                        {(selectedOptions.design || []).includes(option.id) && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            выбрано
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#303030]">
                        {option.name === 'Нужен дизайн' 
                          ? 'индивидуально' 
                          : option.price > 0 ? `+${option.price}₽` : 'Бесплатно'
                        }
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Подитог для дизайна */}
                {getCategoryPrice('design') > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Доплата за дизайн:</span>
                      <span className="font-semibold text-[#303030]">+{getCategoryPrice('design')}₽</span>
                    </div>
                  </div>
                )}
                
                {/* Итого */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого за единицу:</span>
                    <span className="font-semibold text-[#303030]">{getTotalPriceWithOptions().toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 4: Принт/нанесение */}
            {currentStep === 4 && getOptionsByCategory('print').length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 4 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {currentStep === 4 ? '4' : '✓'}
                  </span>
                  <h3 className="text-base font-semibold text-[#303030]">Принт/нанесение</h3>
                  {isStepCompleted(4) && <span className="text-green-500 text-sm">✓ Выбрано</span>}
                </div>
                <div className="space-y-1">
                  {getOptionsByCategory('print').map((option) => (
                    <div
                      key={option.id}
                      className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors ${
                        (selectedOptions.print || []).includes(option.id)
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => handleOptionSelect('print', option.id)}
                      >
                        <span className="text-sm font-medium text-gray-700">{option.name}</span>
                        {(selectedOptions.print || []).includes(option.id) && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            выбрано
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#303030]">
                          {option.price > 0 ? `+${option.price}₽` : 'Бесплатно'}
                        </span>
                        {option.price > 0 && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTooltip(showTooltip === option.id ? null : option.id);
                              }}
                              className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Image
                                src="/material-symbols_info-outline.svg"
                                alt="Информация"
                                width={20}
                                height={20}
                                className="w-full h-full"
                              />
                            </button>
                            {showTooltip === option.id && (
                              <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                                <p className="text-sm text-gray-700">
                                  {option.description || `Подробное описание опции "${option.name}" будет добавлено позже.`}
                                </p>
                                <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Подитог для принта */}
                {getCategoryPrice('print') > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Доплата за принт:</span>
                      <span className="font-semibold text-[#303030]">+{getCategoryPrice('print')}₽</span>
                    </div>
                  </div>
                )}
                
                {/* Итого */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого за единицу:</span>
                    <span className="font-semibold text-[#303030]">{getTotalPriceWithOptions().toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 5: Бирки и упаковка */}
            {currentStep === 5 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</span>
                  <h3 className="text-base font-semibold text-[#303030]">Бирки и упаковка</h3>
                  {isStepCompleted(5) && <span className="text-green-500 text-sm">✓ Выбрано</span>}
                </div>
                
                {/* Бирки и этикетки */}
                {getOptionsByCategory('label').length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Бирки и этикетки</h4>
                    <div className="space-y-1">
                      {getOptionsByCategory('label').map((option) => (
                        <div
                          key={option.id}
                          className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors ${
                            (selectedOptions.label || []).includes(option.id)
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => handleOptionSelect('label', option.id)}
                          >
                            <span className="text-sm font-medium text-gray-700">{option.name}</span>
                            {(selectedOptions.label || []).includes(option.id) && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                выбрано
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#303030]">
                              {option.price > 0 ? `+${option.price}₽` : 'Бесплатно'}
                            </span>
                            {option.price > 0 && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTooltip(showTooltip === option.id ? null : option.id);
                                  }}
                                  className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Image
                                    src="/material-symbols_info-outline.svg"
                                    alt="Информация"
                                    width={20}
                                    height={20}
                                    className="w-full h-full"
                                  />
                                </button>
                                {showTooltip === option.id && (
                                  <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <p className="text-sm text-gray-700">
                                      {option.description || `Подробное описание опции "${option.name}" будет добавлено позже.`}
                                    </p>
                                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Упаковка */}
                {getOptionsByCategory('packaging').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Упаковка</h4>
                    <div className="space-y-1">
                      {getOptionsByCategory('packaging').map((option) => (
                        <div
                          key={option.id}
                          className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors ${
                            (selectedOptions.packaging || []).includes(option.id)
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => handleOptionSelect('packaging', option.id)}
                          >
                            <span className="text-sm font-medium text-gray-700">{option.name}</span>
                            {(selectedOptions.packaging || []).includes(option.id) && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                выбрано
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#303030]">
                              {option.price > 0 ? `+${option.price}₽` : 'Бесплатно'}
                            </span>
                            {option.price > 0 && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTooltip(showTooltip === option.id ? null : option.id);
                                  }}
                                  className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Image
                                    src="/material-symbols_info-outline.svg"
                                    alt="Информация"
                                    width={20}
                                    height={20}
                                    className="w-full h-full"
                                  />
                                </button>
                                {showTooltip === option.id && (
                                  <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <p className="text-sm text-gray-700">
                                      {option.description || `Подробное описание опции "${option.name}" будет добавлено позже.`}
                                    </p>
                                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Подитог для бирок и упаковки */}
                {(getCategoryPrice('label') > 0 || getCategoryPrice('packaging') > 0) && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="space-y-1 text-sm">
                      {getCategoryPrice('label') > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Доплата за бирки:</span>
                          <span className="font-semibold text-[#303030]">+{getCategoryPrice('label')}₽</span>
                        </div>
                      )}
                      {getCategoryPrice('packaging') > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Доплата за упаковку:</span>
                          <span className="font-semibold text-[#303030]">+{getCategoryPrice('packaging')}₽</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Итого */}
                <div className="mt-4 pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Итого за единицу:</span>
                    <span className="font-semibold text-[#303030]">{getTotalPriceWithOptions().toLocaleString('ru-RU')}₽</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">Общая сумма ({quantity} шт):</span>
                    <span className="font-semibold text-[#303030]">{(getTotalPriceWithOptions() * quantity).toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки навигации */}
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => goToStep(currentStep - 1)}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Назад
              </button>

              <span className="text-sm text-gray-500">
                Шаг {currentStep} из 5
              </span>

              {currentStep === 5 ? (
                <button
                  onClick={() => {
                    // Добавляем товар в корзину
                    addToCart();
                    // Показываем модальное окно подтверждения
                    setShowCartModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  В корзину
                </button>
              ) : (
                <button
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={!isInitialized || !hasStepSelection(currentStep)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    (!isInitialized || !hasStepSelection(currentStep))
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Далее →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Описание товара */}
        {product.description && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              Описание
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Размерная сетка */}
        {getSizeChartImage(product.slug) && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              Размерная сетка
            </h3>
            <div className="relative w-full">
              <Image
                src={getSizeChartImage(product.slug)!}
                alt={`Размерная сетка для ${product.name}`}
                width={400}
                height={300}
                className="w-full h-auto rounded-md"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения добавления в корзину */}
      {showCartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCartModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Иконка успеха */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#303030] mb-2">
                Товар добавлен в корзину!
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {product.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Количество: {quantity} шт.
              </p>
              <p className="text-base font-semibold text-[#303030]">
                Итого: {(getTotalPriceWithOptions() * quantity).toLocaleString('ru-RU')}₽
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowCartModal(false);
                  router.push('/cart');
                }}
                className="w-full py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
              >
                Перейти в корзину
              </button>
              
              <button
                onClick={() => {
                  setShowCartModal(false);
                  router.push('/catalog');
                }}
                className="w-full py-3 bg-gray-100 text-[#303030] rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Продолжить покупки
              </button>
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={() => setShowCartModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
