import { formatProposal } from './src/lib/formatProposal.js';

const testOrderData = {
  customerName: "Тест Пользователь",
  customerEmail: "test@example.com", 
  customerCompany: "Test Company",
  items: [
    {
      productName: "Футболка Base",
      quantity: 2,
      basePrice: 1500,
      selectedOptions: {
        design: ["Классический логотип"],
        print: ["DTG печать"]
      }
    }
  ],
  totalAmount: 3000
};

console.log("=== Тест форматирования КП ===");
console.log(formatProposal(testOrderData));
console.log("=== Конец теста ===");
