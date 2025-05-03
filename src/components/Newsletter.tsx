
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Here you would typically send this to your API
    console.log('Subscribing email:', email);
    
    toast({
      title: "Thank you for subscribing!",
      description: "You'll now receive updates on our latest collections.",
    });
    
    setEmail('');
  };

  return (
    <section className="bg-flvunt-black text-flvunt-white py-16">
      <div className="flvunt-container max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-light mb-4">Sign Up for Updates</h2>
        <p className="text-sm mb-8 text-gray-300">
          Subscribe to receive updates on our new products and special promotions
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="px-4 py-2 bg-transparent border-b border-white flex-grow focus:outline-none text-white placeholder:text-gray-400"
            required
          />
          <Button type="submit" className="bg-white text-black hover:bg-gray-200 rounded-none">
            SUBSCRIBE
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
