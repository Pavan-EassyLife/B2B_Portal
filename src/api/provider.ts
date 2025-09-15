import api from "@/lib/axios";

// Interface for provider information
export interface Provider {
  id: string;
  image: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string;
}

// Interface for provider card attributes
export interface ProviderCardAttribute {
  id: string;
  ratecard_id: string;
  filter_attribute_id: string;
  filter_option_id: string;
  created_at: number;
  updated_at: number;
}

// Interface for individual provider card/service
export interface ProviderCard {
  id: string;
  category_id: string;
  subcategory_id: string;
  segment_id: string | null;
  user_id: string | null;
  provider_id: string;
  name: string;
  price: string;
  strike_price: string;
  weight: string | null;
  recommended: boolean;
  best_deal: boolean;
  active: number;
  service_type: "both" | "online" | "offline";
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
  provider: Provider;
  attributes: ProviderCardAttribute[];
  eassyliferecomndeedd: boolean;
  bestdeal: boolean;
}

// Interface for the complete API response
export interface ProviderCardsApiResponse {
  status: boolean;
  data: ProviderCard[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}


export async function providerCards({
  categoryId,
  subcategoryId,
  filterAttributeId,
  segmentOption,
}: {
  categoryId: string;
  subcategoryId: string;
  filterAttributeId: Array<{attribute_id: string, option_id: string}>;
  segmentOption: string;
}) : Promise<ProviderCardsApiResponse> {
  try {
    const response = await api.post('b2b/provider/service-providers', {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      attributes: filterAttributeId,
      segment_id: segmentOption || "",
    });
    const data = await response.data;
    return data;
  } catch (error) {
    console.error('Error fetching provider cards:', error);
    throw error;
  }
}