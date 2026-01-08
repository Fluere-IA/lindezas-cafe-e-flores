import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

interface VipSupportButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// WhatsApp number for VIP support (Brazil format)
const WHATSAPP_NUMBER = '5511999999999'; // Replace with actual support number
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Sou assinante Pro e preciso de suporte.');

export function VipSupportButton({ 
  className, 
  variant = 'outline',
  size = 'sm' 
}: VipSupportButtonProps) {
  const { hasAccess } = useSubscriptionContext();
  const isPro = hasAccess('pro');

  if (!isPro) return null;

  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Suporte VIP
    </Button>
  );
}
