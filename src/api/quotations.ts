import api from "@/lib/axios";

export interface QuotationItem {
    rate: number;
    amount: number;
    service: string;
    quantity: number;
    description: string;
}

export interface BookingInfo {
    id: string;
    order_number: string;
    service_name: string;
    service_description: string;
}

export interface B2BQuotationItem {
    id: string;
    b2b_booking_id: string | null;
    b2b_customer_id: string;
    quotation_number: string;
    service_name: string;
    service_description: string | null;
    quotation_type: string;
    initial_amount: string;
    negotiated_amount: string | null;
    final_amount: string;
    gst_amount: string;
    total_amount: string;
    status: "draft" | "sent" | "approved" | "rejected";
    version: number;
    quotation_items: QuotationItem[] | null;
    terms_and_conditions: string | null;
    validity_days: number;
    valid_until: string;
    sp_notes: string | null;
    admin_notes: string | null;
    client_notes: string | null;
    rejection_reason: string | null;
    sent_at: string | null;
    sent_via: string | null;
    viewed_at: string | null;
    responded_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    pdf_file_path: string | null;
    attachments: string | null;
    created_at: string;
    updated_at: string;
    createdAt: string;
    updatedAt: string;
    booking: BookingInfo | null;
}

export interface QuotationsResponse {
    success: boolean;
    data: B2BQuotationItem[];
}

export async function getQuotations(): Promise<QuotationsResponse> {
    try {
        const response = await api.get<QuotationsResponse>('/b2b/quotations');
        return response.data;
    } catch (error) {
        console.error('Error fetching quotations:', error);
        throw error;
    }
}

export interface QuotationActionResponse {
    success: boolean;
    message: string;
}

export interface QuotationActionRequest {
    action: 'approve' | 'reject';
    remarks?: string;
}

export async function quotationAction(quotationId: string, actionData: QuotationActionRequest): Promise<QuotationActionResponse> {
    try {
        const response = await api.post<QuotationActionResponse>(`/b2b/quotations/action/${quotationId}`, actionData);
        return response.data;
    } catch (error) {
        console.error('Error performing quotation action:', error);
        throw error;
    }
}

// Legacy functions for backward compatibility
export async function approveQuotation(quotationId: string, remarks?: string): Promise<QuotationActionResponse> {
    return quotationAction(quotationId, { action: 'approve', remarks });
}

export async function rejectQuotation(quotationId: string, remarks: string): Promise<QuotationActionResponse> {
    return quotationAction(quotationId, { action: 'reject', remarks });
}