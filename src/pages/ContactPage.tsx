import React, { useState } from 'react';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  const contactInfo = [
    { icon: MapPin, label: 'Address', value: '123 Tech Avenue, San Francisco, CA 94105' },
    { icon: Mail, label: 'Email', value: 'support@techstore.com' },
    { icon: Phone, label: 'Phone', value: '+1 (800) TECHSTORE' },
    { icon: Clock, label: 'Hours', value: 'Mon–Fri: 9am–6pm PST' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Contact Us</h1>
      <p className="text-muted-foreground text-sm mb-8">Have a question? We'd love to hear from you.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-bold text-foreground mb-4">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="bg-muted border-border"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-muted border-border"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Subject</Label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="What's this about?"
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Message *</Label>
              <Textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Tell us how we can help..."
                className="bg-muted border-border resize-none"
                rows={5}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-4">Get in Touch</h2>
            <div className="space-y-4">
              {contactInfo.map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                    <p className="text-sm text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-2">FAQ</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Shipping time?</span><br />Standard 3–5 business days. Free on orders over $99.</p>
              <p><span className="text-foreground font-medium">Return policy?</span><br />7-day hassle-free returns on all items.</p>
              <p><span className="text-foreground font-medium">Warranty?</span><br />All products include manufacturer warranty.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
