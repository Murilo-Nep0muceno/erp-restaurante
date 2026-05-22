export interface CreateRecipeDishRepository {
  nameDish: string;
  descriptionDish: string;
  sellingPriceDish: number;
  availableDish: boolean;
  image?: string | null;
  category?: string | null;
  serves?: number | null;
  controlRule?: string | null;
}
