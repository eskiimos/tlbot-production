// Тест API для организаций
async function testOrganizationAPI() {
  console.log('🧪 Тестируем API организаций...');
  
  const testData = {
    contactName: 'Новое имя',
    inn: '7777777777',
    phone: '+7 (999) 888-77-66',
    email: 'new@test.com',
    user: {
      id: 12345,
      first_name: 'Тестовый',
      username: 'test_user'
    }
  };
  
  try {
    console.log('📤 Отправляем POST запрос на /api/organizations');
    console.log('📋 Данные:', testData);
    
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Статус ответа:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Успешный ответ:', result);
    } else {
      const error = await response.text();
      console.error('❌ Ошибка:', response.status, error);
    }
    
  } catch (error) {
    console.error('❌ Сетевая ошибка:', error);
  }
}

// Запускаем тест
testOrganizationAPI();
