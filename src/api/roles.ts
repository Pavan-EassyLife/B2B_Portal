import api from "@/lib/axios";

// Location interface
export interface Location {
    id: string;
    name: string;
    code: string;
    parent: {
        id: string;
        name: string;
        code: string;
    };
}

// Role interface
export interface Role {
    id: string;
    name: string;
}

// Employee interface
export interface Employee {
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
    gst_number: string | null;
    pan_number: string | null;
    credit_days: number;
    payment_terms: string;
    payment_method_preference: string;
    late_payment_fee_percentage: string;
    credit_limit: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
    createdAt: string;
    updatedAt: string;
    location: Location;
    role: Role;
}

// API Response interface
export interface EmployeesResponse {
    status: boolean;
    message: string;
    data: Employee[];
}

// Single employee response interface
export interface EmployeeResponse {
    status: boolean;
    message: string;
    data: Employee;
}

// Get employees under current user
export async function getEmployees(): Promise<EmployeesResponse> {
    try {
        const response = await api.get<EmployeesResponse>('/b2b/get-user-details');
        return response.data;
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }
}

// Get single employee details
export async function getEmployee(employeeId: string): Promise<EmployeeResponse> {
    try {
        const response = await api.get<EmployeeResponse>(`/b2b/employees/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching employee:', error);
        throw error;
    }
}

// Update employee status
export interface UpdateEmployeeStatusRequest {
    status: "active" | "inactive";
}

export interface UpdateEmployeeStatusResponse {
    status: boolean;
    message: string;
}

export async function updateEmployeeStatus(
    employeeId: string, 
    statusData: UpdateEmployeeStatusRequest
): Promise<UpdateEmployeeStatusResponse> {
    try {
        const response = await api.patch<UpdateEmployeeStatusResponse>(
            `/b2b/employees/${employeeId}/status`, 
            statusData
        );
        return response.data;
    } catch (error) {
        console.error('Error updating employee status:', error);
        throw error;
    }
}
