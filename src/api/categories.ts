// Defines the structure for a single option within an attribute dropdown or list.
export interface Option {
  value: string;
}

// Defines the structure for a service segment.
export interface ServiceSegment {
  id: string;
  category_id: string;
  subcategory_id: string;
  segment_name: string;
}

// Defines the structure for a service attribute.
export interface Attribute {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  type: "dropdown" | "list";
  title: string;
  weight: number;
  is_active: number;
  is_required: number;
  is_linked: number;
  options: Option[];
}

// Defines the structure for a subcategory of a service.
export interface Subcategory {
  id: string;
  category_id: string;
  image: string;
  name: string;
  description: string | null;
  service_time: string | null;
  exclude_heading: string | null;
  exclude_description: string | null;
  active: number;
  service_type: string;
  sac_code: string | null;
  slug: string | null;
  weightage: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

// Defines the structure for a main service category.
export interface ServiceCategory {
  id: string;
  image: string;
  name: string;
  service_time: string | null;
  active: number;
  service_type: string;
  is_home: number;
  location_type: string;
  location_method: string;
  exclude_heading: string | null;
  exclude_description: string | null;
  weight: number | null;
  sac_code: string | null;
  source_type: string;
  slug: string | null;
  meta_keyword: string | null;
  meta_description: string | null;
  meta_title: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  locations: any[]; // The structure is unknown as the array is empty.
  subcategories: Subcategory[];
  attributes: Attribute[];
  excludeItems: any[]; // The structure is unknown as the array is empty.
  excludedImages: any[]; // The structure is unknown as the array is empty.
  includeItems: any[]; // The structure is unknown as the array is empty.
  serviceSegments: ServiceSegment[];
}

// Defines the structure for an address entry.
export interface Address {
  id: string;
  b2b_customer_id: string;
  address_type: "store" | "office";
  store_name: string;
  store_code: string;
  contact_person: string;
  contact_phone: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: string | null;
  longitude: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

// Defines the top-level structure of the entire API response.
export interface ApiResponse {
  success: boolean;
  data: ServiceCategory[];
}

// Defines the structure for the address API response.
export interface AddressApiResponse {
  status: boolean;
  message: string;
  data: Address[];
}


export async function getCategories(): Promise<ApiResponse> {
    try{
        // Use fetch instead of axios to match the working login pattern
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/'}b2b/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

export async function getAddress(): Promise<AddressApiResponse> {
    try{
        // Use fetch instead of axios to match the working login pattern
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/'}b2b/get-address`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching address:', error);
        throw error;
    }
}