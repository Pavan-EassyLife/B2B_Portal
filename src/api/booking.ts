import api from "@/lib/axios"

export interface BookingData {
    id: string
    order_number: string
    b2b_customer_id: string
    service_name: string
    custom_price: number
    total_amount: number
    service_date: string
    service_time: string
    status: string
    payment_status: string
    created_at: number

}

export interface BookingDetails {
    success : boolean
    message : string
    data : BookingData
}

export interface OrderForm {
    categoryId: string;
    subcategoryId: string;
    description: string;
    filterAttributeId: string;
    address: string;    
    addressId: string;
    preferredDate: string;
    preferredTime: string;
    priority: string;
    filterOption: string;
    segmentOption: string;
}

export interface LocationDetailsResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        parent_location_id: string;
        name: string;
        code: string;
    }[];
}


export const createOrder = async (orderData: OrderForm) => {
    try {
        const response = await api.post<BookingDetails>('b2b/booking/create-order', orderData)
        return response.data
    } catch (error) {
        throw new Error('Error creating order')
    }
}

export const getLocationDetails = async (
    cityZone: string
) => {
    try {
        const response = await api.get<LocationDetailsResponse>(`b2b/booking/get-location?id=${cityZone}`)
        console.log('Location Details Response:', response.data)
        return response.data
    } catch (error) {
        throw new Error('Error fetching location details')
    }
}