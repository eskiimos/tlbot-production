import { NextRequest, NextResponse } from 'next/server';
import { generateProposalHTML } from '@/lib/generateProposalHTML';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API Called');
    console.log('📁 Import check:', Boolean(generateProposalHTML));
    console.log('🔍 generateProposalHTML type:', typeof generateProposalHTML);
    
    // Пробуем создать тестовое КП
    const testData = {
      orderData: {},
      cartItems: [{
        productName: 'Test Product',
        productSlug: 'test',
        quantity: 1,
        basePrice: 1000,
        selectedOptions: {},
        optionsDetails: [],
        totalPrice: 1000
      }],
      userData: {
        firstName: 'Test',
        lastName: 'User'
      }
    };
    
    const html = generateProposalHTML(testData);
    console.log('✅ HTML Generated, length:', html.length);
    
    return NextResponse.json({
      status: 'success',
      importExists: Boolean(generateProposalHTML),
      functionType: typeof generateProposalHTML,
      htmlLength: html.length
    });
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
    return NextResponse.json({
      status: 'error',
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
