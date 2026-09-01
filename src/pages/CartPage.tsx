import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { EmptyState } from '@/components/common/SharedComponents';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart();

  const shipping = subtotal >= 99 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-8">Shopping Cart</h1>
        <EmptyState
          icon={<ShoppingBag className="w-16 h-16" />}
          title="Your cart is empty"
          description="Browse our products and add some tech to your cart!"
          action={<Button asChild><Link to="/shop">Start Shopping</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Shopping Cart ({items.length} items)</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 min-w-0 space-y-3">
          {items.map(item => (
            <div key={item.product.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
              <Link to={`/product/${item.product.slug}`} className="shrink-0">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/product/${item.product.slug}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.product.brand}</p>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 h-8 flex items-center justify-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${(item.product.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} each</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={clearCart}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
            </Button>
            <Link to="/shop" className="text-sm text-primary hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Add ${(99 - subtotal).toFixed(2)} more for free shipping</p>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full mt-5 gap-2" asChild>
              <Link to="/checkout">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
