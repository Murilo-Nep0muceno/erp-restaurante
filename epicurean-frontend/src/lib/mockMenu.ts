import type { RecipeDish } from '../types';

// Demo menu used as a fallback when GET /recipe-dish is not reachable
// (e.g. a GARCOM token, or the public client page with no token). The
// backend has no public menu route yet — see ONBOARDING notes.
export const MOCK_MENU: RecipeDish[] = [
  {
    id_recipe_dish: 'mock-1',
    name_dish: 'Picanha Premium',
    description_dish: 'Corte nobre de picanha grelhada na brasa, acompanha farofa e vinagrete.',
    selling_price_dish: 145,
    available_dish: true,
  },
  {
    id_recipe_dish: 'mock-2',
    name_dish: 'Moqueca Baiana',
    description_dish: 'Autêntica moqueca de peixe e camarão no leite de coco e dendê.',
    selling_price_dish: 189,
    available_dish: true,
  },
  {
    id_recipe_dish: 'mock-3',
    name_dish: 'Feijoada Completa',
    description_dish: 'Seleção de carnes nobres, arroz, couve e laranja.',
    selling_price_dish: 98,
    available_dish: true,
  },
  {
    id_recipe_dish: 'mock-4',
    name_dish: 'Dadinhos de Tapioca',
    description_dish: 'Cubos crocantes de tapioca com queijo coalho e geleia de pimenta.',
    selling_price_dish: 42,
    available_dish: true,
  },
];
