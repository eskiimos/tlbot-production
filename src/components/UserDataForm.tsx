'use client';

import { useState, useEffect } from 'react';

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

interface UserDataFormProps {
  onSubmit: (userData: UserData) => void;
  onCancel: () => void;
  initialData: UserData;
}

export default function UserDataForm({ onSubmit, onCancel, initialData }: UserDataFormProps) {
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    inn: '',
    ...initialData // Применяем начальные данные
  });

  // Загружаем сохраненные данные пользователя при монтировании, если нет начальных
  useEffect(() => {
    if (Object.values(initialData).every(v => !v)) {
      if (typeof window !== 'undefined') {
        try {
          const savedData = localStorage.getItem('tlbot_user_data');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setUserData(prev => ({ ...prev, ...parsedData }));
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
        }
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сохраняем данные в localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tlbot_user_data', JSON.stringify(userData));
      } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
      }
    }
    
    onSubmit(userData);
  };

  const handleChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-center text-[#303030]">
          Данные для коммерческого предложения
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              value={userData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия
            </label>
            <input
              type="text"
              value={userData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название компании
            </label>
            <input
              type="text"
              value={userData.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ИНН *
            </label>
            <input
              type="text"
              value={userData.inn || ''}
              onChange={(e) => handleChange('inn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон *
            </label>
            <input
              type="tel"
              value={userData.phoneNumber || ''}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (XXX) XXX-XX-XX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={userData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram username
            </label>
            <input
              type="text"
              value={userData.username || ''}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="@username"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
            >
              Создать КП
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-[#303030] rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          * Обязательные поля. Данные сохраняются для удобства при повторном использовании.
        </p>
      </div>
    </div>
  );
}
