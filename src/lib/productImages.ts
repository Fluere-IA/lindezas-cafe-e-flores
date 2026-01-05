// Product images mapping - AI generated illustrative images
import espresso from '@/assets/products/espresso.jpg';
import cappuccinoAi from '@/assets/products/cappuccino-ai.jpg';
import sucoLaranjaAi from '@/assets/products/suco-laranja-ai.jpg';
import sucoVerdeAi from '@/assets/products/suco-verde-ai.jpg';
import icedLatteAi from '@/assets/products/iced-latte-ai.jpg';
import coxinha from '@/assets/products/coxinha.jpg';
import croissant from '@/assets/products/croissant.jpg';
import paoQueijo from '@/assets/products/pao-queijo.jpg';
import quiche from '@/assets/products/quiche.jpg';
import boloChocolate from '@/assets/products/bolo-chocolate.jpg';
import cheesecake from '@/assets/products/cheesecake.jpg';
import brownie from '@/assets/products/brownie.jpg';
import rosasVermelhas from '@/assets/products/rosas-vermelhas.jpg';
import orquideaAi from '@/assets/products/orquidea-ai.jpg';
import girassois from '@/assets/products/girassois.jpg';
import arranjoMisto from '@/assets/products/arranjo-misto.jpg';

// Map product names (lowercase) to their images
const productImageMap: Record<string, string> = {
  // Bebidas
  'espresso': espresso,
  'espresso duplo': espresso,
  'cappuccino': cappuccinoAi,
  'cappuccino da casa': cappuccinoAi,
  'latte': cappuccinoAi,
  'chá verde': sucoVerdeAi,
  'suco de laranja': sucoLaranjaAi,
  'suco laranja natural': sucoLaranjaAi,
  'suco verde detox': sucoVerdeAi,
  'iced latte': icedLatteAi,
  
  // Comidas
  'croissant': croissant,
  'pão de queijo': paoQueijo,
  'torrada integral': croissant,
  
  // Salgados
  'coxinha': coxinha,
  'empada de palmito': coxinha,
  'quiche de queijo': quiche,
  'lanche natural atum': quiche,
  'lanche natural peru': quiche,
  'tortilha fit frango': quiche,
  'tortilha vegetariana': quiche,
  
  // Sobremesas
  'bolo de chocolate': boloChocolate,
  'cheesecake': cheesecake,
  'brownie': brownie,
  'tortilha nutella supreme': brownie,
  'tortilha pistache gold': brownie,
  
  // Flores
  'bouquet rosas vermelhas': rosasVermelhas,
  'rosa unitária vermelha': rosasVermelhas,
  'orquídea phalaenopsis': orquideaAi,
  'orquídea pote 11': orquideaAi,
  'girassóis': girassois,
  'arranjo misto': arranjoMisto,
  'buquê do dia p': arranjoMisto,
  'haste de lírio': orquideaAi,
};

export function getProductImage(productName: string): string | null {
  const normalizedName = productName.toLowerCase().trim();
  
  // Try exact match first
  if (productImageMap[normalizedName]) {
    return productImageMap[normalizedName];
  }
  
  // Try partial match
  for (const [key, image] of Object.entries(productImageMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return image;
    }
  }
  
  return null;
}
