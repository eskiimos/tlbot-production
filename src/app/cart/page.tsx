'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import UserDataForm from '@/components/UserDataForm';
import usePDFGenerator from '@/components/PDFGenerator';

interface CartItem {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  basePrice: number;
  selectedOptions: {[category: string]: string[]};
  optionsDetails: {
    id: string;
    name: string;
    category: string;
    price: number;
  }[];
  totalPrice: number;
  image?: string;
}

interface UserData {
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  inn?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletedItem, setDeletedItem] = useState<CartItem | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 1. Устанавливаем флаг, что компонент смонтирован
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Загружаем корзину и данные пользователя после монтирования
  useEffect(() => {
    if (!isMounted) return;

    // Загрузка корзины
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('tlbot_cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          setCartItems(cartData);
        }
      } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();

    // Mock Telegram WebApp для разработки
    if (process.env.NODE_ENV === 'development') {
          // @ts-expect-error Mock Telegram WebApp для разработки
    window.Telegram = {
        WebApp: {
          initDataUnsafe: {
            user: {
              id: 123456789,
              first_name: 'Тестовый',
              last_name: 'Пользователь',
              username: 'testuser',
              language_code: 'ru'
            }
          },
          initData: '',
          ready: () => console.log('Telegram WebApp ready'),
          expand: () => console.log('Telegram WebApp expanded'),
          close: () => console.log('Telegram WebApp closed'),
          MainButton: { text: '', show: () => {}, hide: () => {}, onClick: () => {} },
          sendData: () => {}
        }
      };
      console.log('🔧 Mock Telegram WebApp инициализирован для разработки');
    }
    loadUserData();
  }, [isMounted]);

  // Функция для загрузки данных пользователя
  const loadUserData = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Проверяем, доступен ли Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('Telegram пользователь найден:', tgUser);
        setIsLoadingUserData(true);
        
        // Получаем данные пользователя из API
        const response = await fetch(`/api/users?telegramId=${tgUser.id}`);
        if (response.ok) {
          const apiUserData = await response.json();
          console.log('Данные из API:', apiUserData);
          
          // Формируем объект данных пользователя
          const completeUserData: UserData = {
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            phoneNumber: apiUserData?.organization?.phone,
            email: apiUserData?.organization?.email,
            companyName: apiUserData?.organization?.contactName,
            inn: apiUserData?.organization?.inn
          };
          
          console.log('Сформированные данные пользователя:', completeUserData);
          setUserData(completeUserData);
        } else {
          console.log('API вернул ошибку:', response.status);
        }
      } else {
        console.log('Telegram WebApp недоступен, пробуем localStorage');
        // Fallback - пытаемся загрузить из localStorage
        const savedData = localStorage.getItem('tlbot_user_data');
        if (savedData) {
          console.log('Данные найдены в localStorage:', savedData);
          setUserData(JSON.parse(savedData));
        } else {
          console.log('Данные в localStorage не найдены');
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const { generatePdfBlob, ProposalComponent } = usePDFGenerator({ 
    cartItems, 
    userData: userData || {
      telegramId: '123456789',
      firstName: '',
      lastName: '',
      username: '',
      phoneNumber: '',
      email: '',
      companyName: '',
      inn: ''
    }
  });

  const handleSendProposal = async () => {
    if (!userData?.telegramId) {
      console.error("ID пользователя не доступен.");
      alert("Ошибка: ID пользователя не найден");
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        console.error("Не удалось создать PDF файл");
        alert("Не удалось создать PDF файл.");
        setIsSending(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', pdfBlob, `commercial-proposal-${userData.telegramId}.pdf`);
      formData.append('telegramId', userData.telegramId);

      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.mode === 'development') {
          alert('🧪 Коммерческое предложение создано! (Тестовый режим - отправка в Telegram пропущена)');
        } else {
          alert('Коммерческое предложение успешно отправлено в ваш Telegram!');
        }
        // Опционально: очистить корзину или перенаправить пользователя
        // setCartItems([]);
        // localStorage.removeItem('tlbot_cart');
        // router.push('/thank-you');
      } else {
        const errorData = await response.json();
        alert(`Ошибка при отправке: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error("Ошибка при отправке КП:", error);
      alert("Произошла ошибка при отправке коммерческого предложения.");
    } finally {
      setIsSending(false);
    }
  };

  // Таймер для отмены удаления
  useEffect(() => {
    if (undoTimer) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Время истекло - окончательно удаляем товар
            setDeletedItem(null);
            setUndoTimer(null);
            clearInterval(timer);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [undoTimer]);

  // Функция для удаления товара из корзины с возможностью отмены
  const removeFromCart = (itemId: string) => {
    const itemToDelete = cartItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    // Убираем товар из отображения
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));

    // Сохраняем удаленный товар для возможности восстановления
    setDeletedItem(itemToDelete);
    setTimeLeft(10);
    setUndoTimer(Date.now());
  };

  // Функция для восстановления удаленного товара
  const undoDelete = () => {
    if (deletedItem) {
      const updatedCart = [...cartItems, deletedItem];
      setCartItems(updatedCart);
      localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));
      
      // Сбрасываем состояние отмены
      setDeletedItem(null);
      setUndoTimer(null);
      setTimeLeft(10);
    }
  };

  // Функция для изменения количества товара
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 10) return; // Минимум 10 штук

    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const unitPrice = item.totalPrice / item.quantity;
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity
        };
      }
      return item;
    });

    setCartItems(updatedCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));
  };

  // Подсчет общей суммы корзины
  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Подсчет общего количества товаров
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Функция для получения названий выбранных опций по категориям
  const getOptionsByCategory = (item: CartItem) => {
    const categorizedOptions: {[category: string]: string[]} = {};
    
    item.optionsDetails.forEach(option => {
      if (!categorizedOptions[option.category]) {
        categorizedOptions[option.category] = [];
      }
      categorizedOptions[option.category].push(option.name);
    });

    return categorizedOptions;
  };

  // Функция для получения суммы доплат за опции
  const getOptionsPrice = (item: CartItem) => {
    return item.optionsDetails.reduce((total, option) => total + option.price, 0);
  };

  // Функция для обработки создания коммерческого предложения
  const handleCreateCommercialOffer = async () => {
    try {
      if (!userData) {
        setShowUserDataForm(true);
        return;
      }
      
      // Проверяем наличие всех обязательных полей
      const { firstName, phoneNumber, email, companyName, inn } = userData;
      
      if (!firstName || !phoneNumber || !email || !companyName || !inn) {
        setShowUserDataForm(true);
        return;
      }
      
      await handleSendProposal();
    } catch (error) {
      console.error("Ошибка в handleCreateCommercialOffer:", error);
      alert("Произошла ошибка: " + error);
    }
  };

  const handleFormSubmit = (data: UserData) => {
    const updatedUserData = { ...userData, ...data };
    setUserData(updatedUserData);
    // Сохраняем в localStorage на случай перезагрузки страницы
    localStorage.setItem('tlbot_user_data', JSON.stringify(updatedUserData));
    setShowUserDataForm(false);
    // После успешного сохранения данных, инициируем отправку КП
    // Оборачиваем в setTimeout, чтобы дать React время обновить state и DOM
    setTimeout(() => {
      handleSendProposal();
    }, 100);
  };

  const handleFormCancel = () => {
    setShowUserDataForm(false);
  };

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
          <p className="text-gray-600 mt-4">Загружаем корзину...</p>
        </div>
      </div>
    );
  }

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Скрытый компонент для рендеринга HTML для PDF */}
      {isMounted && userData && ProposalComponent}

      {/* Хэдер */}
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
                // TODO: Переход в профиль
                alert('Профиль - в разработке');
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Image
                src="/bx_user.svg"
                alt="Профиль"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* Заголовок корзины */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#303030] mb-2">Корзина</h1>
          {cartItems.length > 0 && (
            <p className="text-gray-600 text-sm">
              {getTotalItems()} товара на сумму {getTotalAmount().toLocaleString('ru-RU')}₽
            </p>
          )}
        </div>

        {cartItems.length === 0 ? (
          // Пустая корзина
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/teenyicons_bag-outline.svg"
                alt="Пустая корзина"
                width={32}
                height={32}
                className="w-8 h-8 text-gray-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#303030] mb-2">
              Корзина пуста
            </h3>
            <p className="text-gray-600 mb-6">
              Добавьте товары из каталога, чтобы начать оформление заказа
            </p>
            <Link
              href="/catalog"
              className="inline-block px-6 py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            {/* Список товаров в корзине */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => {
                const categorizedOptions = getOptionsByCategory(item);
                const optionsPrice = getOptionsPrice(item);
                const unitPrice = item.totalPrice / item.quantity;

                return (
                  <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                    {/* Основная информация о товаре */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#303030] mb-1">{item.productName}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Артикул: {item.productSlug.toUpperCase()}
                        </p>
                        
                        {/* Количество */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 10}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="font-medium text-[#303030] min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Детализация конфигурации */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-medium text-gray-700">Конфигурация товара:</h4>
                      
                      {/* Цвет */}
                      {categorizedOptions.color && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Цвет:</span>
                          <span className="font-medium">{categorizedOptions.color.join(', ')}</span>
                        </div>
                      )}

                      {/* Дизайн */}
                      {categorizedOptions.design && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Дизайн:</span>
                          <span className="font-medium">{categorizedOptions.design.join(', ')}</span>
                        </div>
                      )}

                      {/* Принт */}
                      {categorizedOptions.print && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Принт:</span>
                          <span className="font-medium">{categorizedOptions.print.join(', ')}</span>
                        </div>
                      )}

                      {/* Бирки */}
                      {categorizedOptions.label && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Бирки:</span>
                          <span className="font-medium">{categorizedOptions.label.join(', ')}</span>
                        </div>
                      )}

                      {/* Упаковка */}
                      {categorizedOptions.packaging && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Упаковка:</span>
                          <span className="font-medium">{categorizedOptions.packaging.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Детализация цены */}
                    <div className="space-y-2 border-t border-gray-100 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Расчет стоимости:</h4>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Базовая цена за единицу:</span>
                        <span className="font-medium">{item.basePrice.toLocaleString('ru-RU')}₽</span>
                      </div>

                      {optionsPrice > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Доплата за опции:</span>
                          <span className="font-medium">+{optionsPrice.toLocaleString('ru-RU')}₽</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                        <span className="text-gray-600">Цена за единицу:</span>
                        <span className="font-semibold text-[#303030]">{unitPrice.toLocaleString('ru-RU')}₽</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Количество:</span>
                        <span className="font-medium">{item.quantity} шт</span>
                      </div>

                      <div className="flex justify-between items-center text-base border-t border-gray-300 pt-2">
                        <span className="font-semibold text-gray-700">Итого за товар:</span>
                        <span className="font-bold text-[#303030] text-lg">{item.totalPrice.toLocaleString('ru-RU')}₽</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Итоговая сумма заказа */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-[#303030] mb-4">Итого по заказу</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Товары ({getTotalItems()} шт):</span>
                  <span className="font-medium">{getTotalAmount().toLocaleString('ru-RU')}₽</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Доставка:</span>
                  <span className="font-medium text-gray-500">уточняется</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">К оплате:</span>
                    <span className="text-2xl font-bold text-[#303030]">
                      {getTotalAmount().toLocaleString('ru-RU')}₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Статус данных пользователя */}
              {userData && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Данные для КП загружены из профиля</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {userData.companyName && `${userData.companyName} • `}
                    {userData.firstName} {userData.lastName}
                  </p>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              <button
                onClick={handleCreateCommercialOffer}
                disabled={isGeneratingPDF || isSending}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                  isGeneratingPDF || isSending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#303030] text-white hover:bg-[#404040]'
                }`}
              >
                {isLoadingUserData 
                  ? 'Загружаем данные...' 
                  : isGeneratingPDF 
                    ? 'Создается КП...' 
                    : 'Отправить КП в Telegram'
                }
              </button>
              
              <Link
                href="/catalog"
                className="block w-full py-3 bg-gray-100 text-[#303030] rounded-lg font-medium text-center hover:bg-gray-200 transition-colors"
              >
                Продолжить покупки
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Уведомление об удалении с возможностью отмены */}
      {deletedItem && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-gray-800 text-white rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Товар удален из корзины
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {deletedItem.productName}
                </p>
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                <div className="text-xs text-gray-300">
                  {timeLeft}с
                </div>
                
                <button
                  onClick={undoDelete}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Отменить
                </button>
                
                <button
                  onClick={() => {
                    setDeletedItem(null);
                    setUndoTimer(null);
                    setTimeLeft(10);
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Прогресс-бар */}
            <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода данных пользователя */}
      {showUserDataForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <UserDataForm
              onSubmit={handleFormSubmit}
              onCancel={() => setShowUserDataForm(false)}
              initialData={userData || {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
