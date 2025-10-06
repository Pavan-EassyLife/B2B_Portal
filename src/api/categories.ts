
import api from "@/lib/axios";

// Defines the structure for a single option within an attribute dropdown or list.
export interface Option {
  id?: number;
  value: string | number;
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
  address_type: "store" | "branch" | "warehouse" | "office" | "service_location";
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

// Defines the structure for adding a new address.
export interface AddAddressRequest {
  addressType: "store" | "branch" | "warehouse" | "office" | "service_location";
  storeName: string;
  storeCode: string;
  contactPerson: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  b2b_customer_id: string;
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

// Defines the structure for the add address API response.
export interface AddAddressResponse {
  status: boolean;
  message: string;
  data?: Address;
}

// Defines the structure for slot timing data.
export interface SlotTimingData {
  currentDayAvailable: boolean;
  availableStartSlotHour: number;
  timeSlotStartDate: number;
  timeSlotStartMonth: number;
  nextslotstart: number;
  nextslotend: number;
  timeSlotEndHour: number;
  timeSlotStartYear: number;
  timeSlotEndDateString: string;
}



// Defines the structure for the slot timing API response.
export interface SlotTimingApiResponse {
  status: boolean;
  message: string;
  data: SlotTimingData;
}


export async function getCategories(): Promise<ApiResponse> {
    try{
        // Use fetch instead of axios to match the working login pattern
        const response = await api.get('b2b/categories');

        const data = await response.data;
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

export async function getAddress(): Promise<AddressApiResponse> {
    try{
        // Use fetch instead of axios to match the working login pattern
        const response = await api.get('b2b/get-address');

        const data = await response.data;
        return data;
    } catch (error) {
        console.error('Error fetching address:', error);
        throw error;
    }
}

export async function slotTiming(): Promise<SlotTimingApiResponse> {
    try{
        // Use fetch instead of axios to match the working login pattern
        const response = await api.get('b2b/provider/slots');

        const data = await response.data;
        return data;
    } catch (error) {
        console.error('Error fetching slot timing:', error);
        throw error;
    }
}

export async function addAddress(addressData: AddAddressRequest): Promise<AddAddressResponse> {
    try {
        const response = await api.post<AddAddressResponse>('b2b/add-address', addressData);
        return response.data;
    } catch (error) {
        console.error('Error adding address:', error);
        throw error;
    }
}

// Approval Flow Interfaces
export interface B2BBooking {
    id: string;
    order_number: string;
    service_name: string;
    locationId: number | null;
}

export interface ApprovalFlowItem {
    id: number;
    orderId: number;
    step_number: number;
    current_assignee_user_id: number;
    status: "pending" | "approved" | "rejected";
    escalation_level: number;
    due_at: string;
    acted_by_user_id: number | null;
    acted_at: string | null;
    remarks: string | null;
    policy_id: number;
    locationId: number;
    createdAt: string;
    updatedAt: string;
    B2BBooking: B2BBooking;
}

export interface ApprovalFlowResponse {
    success: boolean;
    data: ApprovalFlowItem[];
}

export interface ApprovalActionRequest {
    action: "approve" | "reject";
    remarks: string; // Made mandatory
}

export interface ApprovalActionResponse {
    success: boolean;
    message: string;
}

// Get pending approvals
export async function getApprovalFlow(): Promise<ApprovalFlowResponse> {
    try {
        const response = await api.get<ApprovalFlowResponse>('b2b/start-approval-flow');
        return response.data;
    } catch (error) {
        console.error('Error fetching approval flow:', error);
        throw error;
    }
}

// Approve or reject an approval using the specific approval ID in URL
export async function handleApprovalAction(approvalId: string, actionData: ApprovalActionRequest): Promise<ApprovalActionResponse> {
    try {
        const response = await api.post<ApprovalActionResponse>(`b2b/take-approval-action/${approvalId}`, actionData);
        return response.data;
    } catch (error) {
        console.error('Error handling approval action:', error);
        throw error;
    }
}

// Orders Interfaces
export interface B2BApproval {
    id: number;
    orderId: number;
    step_number: number;
    current_assignee_user_id: number;
    status: "pending" | "approved" | "rejected";
    escalation_level: number;
    due_at: string;
    acted_by_user_id: number | null;
    acted_at: string | null;
    remarks: string | null;
    policy_id: number;
    locationId: number;
    createdAt: string;
    updatedAt: string;
}

export interface B2BOrder {
    id: string;
    order_number: string;
    service_name: string;
    service_description: string;
    service_type: string;
    custom_price: string;
    quantity: number;
    total_amount: string;
    service_date: string;
    service_time: string;
    service_address: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    payment_status: "pending" | "paid" | "failed";
    payment_method: string;
    invoice_status: "pending" | "generated" | "sent";
    b2b_status: "draft" | "submitted" | "approved" | "rejected";
    notes: string;
    created_at: number;
    updated_at: number;
    b2b_approvals: B2BApproval | null;
}

export interface OrdersResponse {
    success: boolean;
    data: B2BOrder[];
}

// Get B2B orders
export async function getOrders(): Promise<OrdersResponse> {
    try {
        const response = await api.get<OrdersResponse>('b2b/booking/get-order');
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

// Current User Interfaces
export interface CurrentUser {
    id: string;
    roleId: string;
    locationId: string;
    manager_user_id: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gst_number: string;
    pan_number: string | null;
    credit_days: number;
    payment_terms: string;
    payment_method_preference: string;
    late_payment_fee_percentage: string;
    credit_limit: string;
    status: string;
    created_at: string;
    updated_at: string;
    createdAt: string;
    updatedAt: string;
}

export interface CurrentUserResponse {
    status: boolean;
    message: string;
    data?: CurrentUser; // Make data optional since it won't be present when status is false
}

// Get current user from token
export async function getCurrentUserToken(): Promise<CurrentUserResponse> {
    try {
        const response = await api.get<CurrentUserResponse>('b2b/get-current-token');
        return response.data;
    } catch (error) {
        console.error('Error fetching current user:', error);
        throw error;
    }
}

// Order Details Interfaces
export interface OrderAttachment {
    id: string;
    b2b_booking_id: string;
    provider_id: string;
    attachment_type: "before_image" | "after_image";
    file_name: string;
    file_url: string;
    file_key: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
    expires_at: string;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface OrderDetailsResponse {
    success: boolean;
    data: OrderAttachment[];
}

// Get order details with attachments
export async function getOrderDetails(orderId: string): Promise<OrderDetailsResponse> {
    try {
        const response = await api.get<OrderDetailsResponse>(`b2b/order/details?id=${orderId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
}

// Invoice Download Interfaces
export interface InvoiceData {
    id: string;
    b2b_booking_id: number;
    invoice_file_path: string;
    invoice_number: string;
    payment_status: string;
    payment_terms: string;
}

export interface InvoiceDownloadResponse {
    success: boolean;
    data: InvoiceData;
}

// Download invoice for order
export async function downloadInvoice(orderId: string): Promise<InvoiceDownloadResponse> {
    try {
        const response = await api.get<InvoiceDownloadResponse>(`b2b/order/download-invoice?id=${orderId}`);
        return response.data;
    } catch (error) {
        console.error('Error downloading invoice:', error);
        throw error;
    }
}
