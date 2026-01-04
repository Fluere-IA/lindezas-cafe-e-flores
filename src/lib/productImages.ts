// Product images mapping by product name
import tortilhaFrango from '@/assets/products/tortilha-frango.jpg';
import tortilhaVegetariana from '@/assets/products/tortilha-vegetariana.jpg';
import tortilhaPistache from '@/assets/products/tortilha-pistache.jpg';
import tortilhaNutella from '@/assets/products/tortilha-nutella.jpg';
import lanchePeru from '@/assets/products/lanche-peru.jpg';
import lancheAtum from '@/assets/products/lanche-atum.jpg';
import sucoVerde from '@/assets/products/suco-verde.jpg';
import sucoLaranja from '@/assets/products/suco-laranja.jpg';
import espressoDuplo from '@/assets/products/espresso-duplo.jpg';
import cappuccino from '@/assets/products/cappuccino.jpg';
import icedLatte from '@/assets/products/iced-latte.jpg';
import rosaVermelha from '@/assets/products/rosa-vermelha.jpg';
import lirio from '@/assets/products/lirio.jpg';
import buqueDia from '@/assets/products/buque-dia.jpg';
import orquidea from '@/assets/products/orquidea.jpg';

// Map product names to their images
const productImageMap: Record<string, string> = {
  'Tortilha Fit Frango': tortilhaFrango,
  'Tortilha Vegetariana': tortilhaVegetariana,
  'Tortilha Pistache Gold': tortilhaPistache,
  'Tortilha Nutella Supreme': tortilhaNutella,
  'Lanche Natural Peru': lanchePeru,
  'Lanche Natural Atum': lancheAtum,
  'Suco Verde Detox': sucoVerde,
  'Suco Laranja Natural': sucoLaranja,
  'Espresso Duplo': espressoDuplo,
  'Cappuccino da Casa': cappuccino,
  'Iced Latte': icedLatte,
  'Rosa Unitária Vermelha': rosaVermelha,
  'Haste de Lírio': lirio,
  'Buquê do Dia P': buqueDia,
  'Orquídea Pote 11': orquidea,
};

export function getProductImage(productName: string): string | null {
  return productImageMap[productName] || null;
}
