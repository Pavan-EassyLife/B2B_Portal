import api from "@/lib/axios";

export interface B2BQuotationItem {
    id: string;
    status: string;
    total_amount: string;
    created_at: string;
    updated_at: string;
    quotation_number: string;
    final_amount: string;
    gst_amount: string;
}

export interface QuotationData {
    id: string;
    B2BQuotation: B2BQuotationItem[];
}

export interface QuotationsResponse {
    success: boolean;
    data: QuotationData[];
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

export async function approveQuotation(quotationId: string): Promise<QuotationActionResponse> {
    try {
        const response = await api.patch<QuotationActionResponse>(`/b2b/quotations/${quotationId}/approve`);
        return response.data;
    } catch (error) {
        console.error('Error approving quotation:', error);
        throw error;
    }
}

export async function rejectQuotation(quotationId: string): Promise<QuotationActionResponse> {
    try {
        const response = await api.patch<QuotationActionResponse>(`/b2b/quotations/${quotationId}/reject`);
        return response.data;
    } catch (error) {
        console.error('Error rejecting quotation:', error);
        throw error;
    }
}