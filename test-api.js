const fetch = require('node-fetch');

async function testAPI() {
    const testData = {
        items: [
            {
                productName: 'Тестовый товар',
                quantity: 2,
                basePrice: 1000,
                selectedOptions: {
                    'Размер': ['L'],
                    'Цвет': ['Черный']
                }
            }
        ],
        customerName: 'Тест Пользователь',
        customerEmail: 'test@example.com'
    };

    try {
        const response = await fetch('http://localhost:3000/api/proposals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();
