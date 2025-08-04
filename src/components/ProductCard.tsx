'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description?: string;
}

interface ProductCardProps {
  product: Product;
  isCompact?: boolean; // для режима 2 товара в ряд
}

export default function ProductCard({ product, isCompact = false }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Fallback изображение если основное не загружается
  const defaultImage = '/products/placeholder.jpg';
  const currentImage = product.images.length > 0 ? product.images[currentImageIndex] : defaultImage;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Слайдер изображений с квадратным соотношением сторон */}
      <div className="relative aspect-square bg-white">
        {!imageError ? (
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
            
            {/* Пагинация внутри изображения */}
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

      {/* Информация о товаре */}
      <div className={`${isCompact ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-[#303030] mb-2 ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {product.name}
        </h3>
        
        <div className={`flex items-center ${isCompact ? 'flex-col gap-2' : 'justify-between'}`}>
          <span className={`font-bold text-[#303030] ${isCompact ? 'text-lg' : 'text-xl'}`}>
            от {product.price.toLocaleString('ru-RU')}₽
          </span>
          
          <Link 
            href={`/product/${product.slug}`}
            className={`bg-[#303030] text-white rounded-lg hover:bg-[#404040] transition-colors font-medium text-center inline-block ${
              isCompact 
                ? 'px-3 py-1.5 text-xs w-full' 
                : 'px-4 py-2 text-sm'
            }`}
          >
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
}
