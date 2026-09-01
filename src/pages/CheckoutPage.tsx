import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 'shipping' | 'payment' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
];

interface ShippingForm {
  full_name: string; email: string; phone: string;
  address: string; city: string; state: string;
  postal: string; country: string;
}

interface PaymentForm {
  method: 'credit_card' | 'paypal';
  card_number: string; card_expiry: string; card_cvv: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('shipping');
  const [placing, setPlacing] = useState(false);

  const [shipping, setShipping] = useState<ShippingForm>({
    full_name: '', email: user?.email || '', phone: '',
    address: '', city: '', state: '', postal: '', country: 'US',
  });

  const [payment, setPayment] = useState<PaymentForm>({
    method: 'credit_card', card_number: '', card_expiry: '', card_cvv: '',
  });

  const shippingCost = subtotal >= 99 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return; }
    if (items.length === 0) { navigate('/cart'); return; }
    setPlacing(true);
    try {
      const order = await createOrder({
        subtotal,
        shipping: shippingCost,
        tax,
        total,
        shipping_name: shipping.full_name,
        shipping_email: shipping.email,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal: shipping.postal,
        shipping_country: shipping.country,
        payment_method: payment.method,
        items: items.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          product_image: i.product.image_url,
          price: i.product.price,
          quantity: i.quantity,
        })),
      });
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/account?tab=orders`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && step !== 'review') {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button asChild><Link to="/shop">Shop Now</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                i < currentStepIdx ? 'bg-green-500 text-white' :
                i === currentStepIdx ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {i < currentStepIdx ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block', i === currentStepIdx ? 'text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3', i < currentStepIdx ? 'bg-green-500' : 'bg-border')} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="flex-1 min-w-0">
          {step === 'shipping' && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'full_name', placeholder: 'John Doe' },
                  { label: 'Email', key: 'email', placeholder: 'john@example.com' },
                  { label: 'Phone', key: 'phone', placeholder: '+1 555 000 0000' },
                  { label: 'Address', key: 'address', placeholder: '123 Main St' },
                  { label: 'City', key: 'city', placeholder: 'New York' },
                  { label: 'State / Province', key: 'state', placeholder: 'NY' },
                  { label: 'Postal Code', key: 'postal', placeholder: '10001' },
                ].map(field => (
                  <div key={field.key} className={field.key === 'address' ? 'md:col-span-2' : ''}>
                    <Label className="text-sm text-muted-foreground mb-1 block">{field.label}</Label>
                    <Input
                      value={shipping[field.key as keyof ShippingForm]}
                      onChange={e => setShipping(s => ({ ...s, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="bg-muted border-border"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-sm text-muted-foreground mb-1 block">Country</Label>
                  <Select value={shipping.country} onValueChange={v => setShipping(s => ({ ...s, country: v }))}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-2 gap-2" onClick={() => setStep('payment')}>
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['credit_card', 'paypal'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPayment(p => ({ ...p, method: m }))}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                      payment.method === m ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <CreditCard className={cn('w-5 h-5', payment.method === m ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium capitalize">{m === 'credit_card' ? 'Credit Card' : 'PayPal'}</span>
                  </button>
                ))}
              </div>

              {payment.method === 'credit_card' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">Card Number</Label>
                    <Input
                      value={payment.card_number}
                      onChange={e => setPayment(p => ({ ...p, card_number: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      className="bg-muted border-border"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">Expiry Date</Label>
                      <Input
                        value={payment.card_expiry}
                        onChange={e => setPayment(p => ({ ...p, card_expiry: e.target.value }))}
                        placeholder="MM/YY"
                        className="bg-muted border-border"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">CVV</Label>
                      <Input
                        value={payment.card_cvv}
                        onChange={e => setPayment(p => ({ ...p, card_cvv: e.target.value }))}
                        placeholder="123"
                        className="bg-muted border-border"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {payment.method === 'paypal' && (
                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                  You will be redirected to PayPal to complete your payment after placing the order.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 border border-border gap-2" onClick={() => setStep('shipping')}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep('review')}>
                  Review Order <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Order Review</h2>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Shipping to</p>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                  <p>{shipping.full_name}</p>
                  <p>{shipping.address}, {shipping.city}, {shipping.state} {shipping.postal}</p>
                  <p>{shipping.email} · {shipping.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground shrink-0">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 border border-border gap-2" onClick={() => setStep('payment')}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handlePlaceOrder}
                  disabled={placing || !user}
                >
                  {placing ? 'Placing Order...' : user ? 'Place Order' : 'Sign In to Order'}
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">Sign in</Link> or <Link to="/register" className="text-primary hover:underline">create an account</Link> to place your order
                </p>
              )}
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
            <h3 className="text-base font-bold text-foreground mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center gap-2">
                  <img src={item.product.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  </div>
                  <p className="text-xs font-medium shrink-0">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator className="bg-border mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <span className="text-green-400">Free</span> : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span><span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
