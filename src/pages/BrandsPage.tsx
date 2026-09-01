import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const BRANDS = [
  { name: 'Apple', slug: 'Apple', description: 'iPhone, MacBook, iPad, Apple Watch', color: '#555' },
  { name: 'Samsung', slug: 'Samsung', description: 'Galaxy phones, 4K monitors, SSDs', color: '#1428A0' },
  { name: 'Sony', slug: 'Sony', description: 'PlayStation, headphones, cameras', color: '#003087' },
  { name: 'ASUS', slug: 'ASUS', description: 'ROG gaming laptops & accessories', color: '#D00027' },
  { name: 'Bose', slug: 'Bose', description: 'Premium audio equipment', color: '#231F20' },
  { name: 'Dell', slug: 'Dell', description: 'Laptops, monitors & workstations', color: '#007DB8' },
  { name: 'LG', slug: 'LG', description: 'OLED TVs, monitors & appliances', color: '#A50034' },
  { name: 'Microsoft', slug: 'Microsoft', description: 'Surface devices & Xbox', color: '#00A4EF' },
];

export default function BrandsPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Shop by Brand</h1>
      <p className="text-muted-foreground text-sm mb-8">Discover products from the world's leading technology brands.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BRANDS.map(brand => (
          <Link
            key={brand.slug}
            to={`/shop?brand=${brand.slug}`}
            className="product-card p-5 flex flex-col justify-between min-h-[120px]"
          >
            <div>
              <div
                className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${brand.color}22`, border: `1px solid ${brand.color}44` }}
              >
                <span className="text-lg font-black" style={{ color: brand.color }}>
                  {brand.name[0]}
                </span>
              </div>
              <h3 className="font-bold text-foreground">{brand.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{brand.description}</p>
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-medium mt-3">
              Shop <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
