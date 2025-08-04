'use client';

import React from 'react';

// Определяем типы данных, как в других компонентах
interface CartItem {
  id: string;
  productName: string;
  quantity: number;
  basePrice: number;
  optionsDetails: {
    name: string;
    category: string;
    price: number;
  }[];
  totalPrice: number;
  image?: string;
}

interface UserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  inn?: string;
}

interface CommercialProposalHTMLProps {
  cartItems: CartItem[];
  userData: UserData;
}

// Функция для получения суммы доплат за опции
const getOptionsPrice = (item: CartItem) => {
  return item.optionsDetails.reduce((total, option) => total + option.price, 0);
};

// Функция для получения названий опций по категориям
const getOptionsByCategory = (item: CartItem) => {
  const categorizedOptions: { [category: string]: string[] } = {};
  item.optionsDetails.forEach(option => {
    if (!categorizedOptions[option.category]) {
      categorizedOptions[option.category] = [];
    }
    categorizedOptions[option.category].push(option.name);
  });
  return categorizedOptions;
};

// Словарь для перевода категорий опций
const categoryTranslations: { [key: string]: string } = {
  color: 'Цвет',
  design: 'Дизайн',
  print: 'Принт',
  label: 'Бирки',
  packaging: 'Упаковка',
};

export const CommercialProposalHTML = React.forwardRef<HTMLDivElement, CommercialProposalHTMLProps>(
  ({ cartItems, userData }, ref) => {
    const totalAmount = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const proposalNumber = Math.floor(Date.now() / 1000);

    return (
      <div ref={ref} className="bg-white text-black p-8" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
        {/* Шапка документа */}
        <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
          <div>
            <h1 className="text-3xl font-bold">Коммерческое предложение</h1>
            <p className="text-sm text-gray-600">№ {proposalNumber} от {currentDate}</p>
          </div>
          <div className="text-right">
            <img src="/TLlogo.svg" alt="TL Brand Logo" className="h-12 w-auto ml-auto mb-2"/>
            <p className="text-sm">Email: totallookas@yandex.ru</p>
            <p className="text-sm">Телефон: +7 (XXX) XXX-XX-XX</p>
          </div>
        </header>

        {/* Информация о клиенте и исполнителе */}
        <section className="grid grid-cols-2 gap-8 my-8 text-sm">
          <div>
            <h2 className="font-bold mb-2">Заказчик:</h2>
            <p><strong>Компания:</strong> {userData.companyName || 'Не указано'}</p>
            <p><strong>ИНН:</strong> {userData.inn || 'Не указано'}</p>
            <p><strong>Контактное лицо:</strong> {userData.firstName || ''} {userData.lastName || ''}</p>
            <p><strong>Телефон:</strong> {userData.phoneNumber || 'Не указано'}</p>
            <p><strong>Email:</strong> {userData.email || 'Не указано'}</p>
          </div>
          <div>
            <h2 className="font-bold mb-2">Исполнитель:</h2>
            <p><strong>Компания:</strong> Тotal Lookas</p>
            <p><strong>Адрес:</strong> г. Казань, Россия</p>
            <p><strong>Телефон:</strong> +7 (XXX) XXX-XX-XX</p>
            <p><strong>Email:</strong> totallookas@yandex.ru</p>
          </div>
        </section>

        {/* Таблица с товарами */}
        <section>
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">№</th>
                <th className="p-2 border">Наименование и конфигурация</th>
                <th className="p-2 border text-center">Кол-во</th>
                <th className="p-2 border text-right">Цена за ед.</th>
                <th className="p-2 border text-right">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
                const categorizedOptions = getOptionsByCategory(item);
                const unitPrice = item.totalPrice / item.quantity;
                return (
                  <tr key={item.id}>
                    <td className="p-2 border align-top">{index + 1}</td>
                    <td className="p-2 border align-top">
                      <p className="font-semibold">{item.productName}</p>
                      <ul className="text-xs text-gray-600 list-disc pl-4 mt-1">
                        {Object.entries(categorizedOptions).map(([category, names]) => (
                          <li key={category}><strong>{categoryTranslations[category] || category}:</strong> {names.join(', ')}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-2 border text-center align-top">{item.quantity}</td>
                    <td className="p-2 border text-right align-top">{unitPrice.toLocaleString('ru-RU')} ₽</td>
                    <td className="p-2 border text-right align-top">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Итоговая сумма */}
        <section className="flex justify-end mt-8 text-sm">
          <div className="w-1/3">
            <div className="flex justify-between">
              <span className="text-gray-600">Итого:</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">В том числе НДС:</span>
              <span>Без НДС</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-800 mt-2 pt-2">
              <span>Всего к оплате:</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </section>

        {/* Условия и подписи */}
        <footer className="mt-12 pt-8 border-t text-xs text-gray-600">
          <p className='mb-4 font-semibold'>* Данное коммерческое предложение носит ознакомительный характер. Подробное КП будет составлено и выслано менеджером.</p>
          <p><strong>Условия оплаты:</strong> 100% предоплата.</p>
          <p><strong>Срок поставки:</strong> 14-21 рабочих дней с момента согласования макета и оплаты.</p>
          <p><strong>Срок действия предложения:</strong> 5 рабочих дней.</p>
          <div className="flex justify-between mt-16">
            <div>
              <p>Исполнитель: ____________________ (Тotal Lookas)</p>
            </div>
            <div>
              <p>Заказчик: ____________________ ({userData.firstName || ''})</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
);

CommercialProposalHTML.displayName = 'CommercialProposalHTML';
