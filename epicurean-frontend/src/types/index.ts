// Backend roles (from prisma schema).
export type Role = 'GERENTE' | 'BALCONISTA' | 'GARCOM' | 'COZINHA';

export interface User {
  id: string;
  userName: string;
  role: Role;
}

export interface LoginResponse {
  user: User;
  access_token: string;
}

// ---------- Product (estoque) ----------
export type UnitMeasurement = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'cx' | 'pct';

// Tipos de item de estoque:
// INGREDIENTE — entra na ficha técnica de receitas
// INSUMO — descartáveis, embalagens, limpeza (não entra na ficha)
// PRODUTO — item finalizado vendido ao cliente
export type ProductType = 'INGREDIENTE' | 'INSUMO' | 'PRODUTO';

export interface Product {
  id_product: string;
  name: string;
  unit_measurement: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_price?: number | null; // custo médio ponderado (CMP)
  selling_price?: number | null; // preço de venda definido pelo usuário
  type?: string | null;
  notes?: string | null;
  expiry_date?: string | null;
  id_supplier?: string | null;
  supplier?: Supplier | null;
  createdAt?: string;
}

// Cadastro direto / edição. Na edição, custo e saldo são preservados no
// backend; os campos de estoque inicial valem para a criação (Fluxo A).
export interface CreateProductInput {
  name: string;
  unit_measurement: string;
  minimum_quantity?: number;
  current_quantity?: number;
  unit_price?: number | null;
  selling_price?: number | null;
  type?: string | null;
  notes?: string | null;
  expiry_date?: string | null;
  id_supplier?: string | null;
}

// ---------- Supplier (fornecedor) ----------
export interface Supplier {
  id_supplier: string;
  name: string;
  cnpj: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
}

export interface CreateSupplierInput {
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
}

// ---------- Recipe / Dish (cardápio + ficha técnica) ----------
export interface DishItemInput {
  quantity: number;
  unit_measurement: string;
  id_product: string;
}

export interface DishItem extends DishItemInput {
  id_dish: string;
  id_recipe_dish: string;
  product?: Product;
}

export interface RecipeDish {
  id_recipe_dish: string;
  name_dish: string;
  description_dish: string;
  selling_price_dish: number;
  available_dish: boolean;
  image?: string | null;
  category?: string | null;
  serves?: number | null;
  control_rule?: string | null;
  dish?: DishItem[];
  createdAt?: string;
}

export interface CreateRecipeDishInput {
  name_dish: string;
  description_dish: string;
  selling_price_dish: number;
  available_dish: boolean;
  image?: string | null;
  category?: string | null;
  serves?: number | null;
  control_rule?: string | null;
  dishes: DishItemInput[];
}

// ---------- Purchase (compras / entrada de estoque) ----------
export interface PurchaseItemInput {
  name: string;
  unit_price: number;
  quantity: number;
  unit_measurement: string;
}

export interface CreatePurchaseInput {
  items: PurchaseItemInput[];
  date: string;
  id_supplier: string;
}

export interface Purchase {
  id_purchase: string;
  id_supplier: string;
  total_price: number;
  date: string;
  supplier?: Supplier;
  purchase_items?: Array<{
    id_purchase_items: string;
    name: string;
    unit_measurement: string;
    id_product?: string | null;
    unit_price: number;
    quantity: number;
    product?: Product;
  }>;
  createdAt?: string;
}

// ---------- Users (admin) ----------
export interface CreateUserInput {
  userName: string;
  passWord: string;
  name?: string;
}

export interface UserAccount {
  id: string;
  userName: string;
  name: string | null;
  role: Role;
  createdAt?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
}

// ---------- Settings (admin) ----------
export interface AppSettings {
  id?: string;
  restaurantName: string;
  tableCount: number;
  cnpj: string;
  phone: string;
  footerNotice: string;
  updatedAt?: string;
}

export type UpdateSettingsInput = Partial<Omit<AppSettings, 'id' | 'updatedAt'>>;

// ---------- Audit log (admin) ----------
export interface LogEntry {
  id: string;
  user: string;
  action: string;
  createdAt: string;
}

// ---------- Mock domain: tables & orders (no backend yet) ----------
export type TableStatus = 'free' | 'occupied';

export interface RestaurantTable {
  num: number;
  status: TableStatus;
  orderId: string | null;
}

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivered';

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
}

export interface Order {
  id: string;
  code?: string; // número curto da comanda (ex.: 3647)
  tableNum: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
}
