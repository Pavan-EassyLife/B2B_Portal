'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

// Location interface
interface Location {
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
interface Role {
    id: string;
    name: string;
}

// API Response interface for single user
interface UserResponse {
    status: boolean;
    message: string;
    data: Employee;
}

// API Response interface for multiple employees
interface EmployeesResponse {
    status: boolean;
    message: string;
    data: Employee[];
    meta: Meta;
}

// Meta information interface
interface Meta {
    currentUserRole: string;
    totalEmployees: number;
    allowedRoles: string[];
}

// Roles API Response interface
interface RolesResponse {
    status: boolean;
    message: string;
    data: Role[];
}

// Employee Role Update Request interface
interface EmployeeRoleUpdateRequest {
    employeeId: string;
    roleId: string;
}

// Role Update Response interface (from /b2b/roles/update)
interface RoleUpdateResponse {
    status: boolean;
    message: string;
    data: {
        id: string;
        name: string;
        hierarchy_level: number;
        created_at: number;
        updated_at: number;
    };
    meta: {
        updatedBy: string;
        updatedFields: string[];
    };
}

// Employee interface (simplified based on new API response)
interface Employee {
    id: string;
    roleId: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    role: Role;
}

const RolesPage = () => {
    const router = useRouter()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]) // Store all employees for filtering
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(true)
    const [rolesLoading, setRolesLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Employee role update state
    const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null)

    // Fetch employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true)
                const response = await api.get<EmployeesResponse>('/b2b/employees')

                console.log('API Response:', response.data) // Debug log

                if (response.data.status && Array.isArray(response.data.data)) {
                    setEmployees(response.data.data)
                    setAllEmployees(response.data.data) // Store all employees for filtering
                    setMeta(response.data.meta)
                    console.log('Employees set:', response.data.data)
                    console.log('Meta set:', response.data.meta)
                } else {
                    setError(response.data.message || 'Failed to fetch employees')
                    toast.error(response.data.message || 'Failed to fetch employees')
                }
            } catch (err: any) {
                console.error('Error fetching employees:', err)

                let errorMessage = 'Error loading employees'
                if (err?.response?.data?.message) {
                    errorMessage = err.response.data.message
                } else if (err?.message) {
                    errorMessage = err.message
                }

                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        fetchEmployees()
    }, [])

    // Fetch roles
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setRolesLoading(true)
                const response = await api.get<RolesResponse>('/b2b/roles/all')

                console.log('Roles API Response:', response.data) // Debug log

                if (response.data.status && Array.isArray(response.data.data)) {
                    setRoles(response.data.data)
                    console.log('Roles set:', response.data.data)
                } else {
                    console.error('Failed to fetch roles:', response.data.message)
                    toast.error(response.data.message || 'Failed to fetch roles')
                }
            } catch (err: any) {
                console.error('Error fetching roles:', err)

                let errorMessage = 'Error loading roles'
                if (err?.response?.data?.message) {
                    errorMessage = err.response.data.message
                } else if (err?.message) {
                    errorMessage = err.message
                }

                toast.error(errorMessage)
            } finally {
                setRolesLoading(false)
            }
        }

        fetchRoles()
    }, [])

    // Filter employees by role
    useEffect(() => {
        if (selectedRole === 'all') {
            setEmployees(allEmployees)
        } else {
            const filtered = allEmployees.filter(employee => employee.role.id === selectedRole)
            setEmployees(filtered)
        }
    }, [selectedRole, allEmployees])

    // Handle role selection change
    const handleRoleChange = (roleId: string) => {
        setSelectedRole(roleId)
    }

    // Update employee role
    const updateEmployeeRole = async (employeeId: string, newRoleId: string) => {
        try {
            setUpdatingEmployeeId(employeeId)

            const updateData: EmployeeRoleUpdateRequest = {
                employeeId: employeeId,
                roleId: newRoleId
            }

            const response = await api.put<RoleUpdateResponse>('/b2b/roles/user-role', updateData)

            console.log('Role Update Response:', response.data)

            if (response.data.status) {
                // Find the new role from the roles list
                const newRole = roles.find(role => role.id === newRoleId)

                if (newRole) {
                    // Update the employee in both arrays with the new role
                    const updateEmployee = (emp: Employee) =>
                        emp.id === employeeId
                            ? { ...emp, role: newRole, roleId: newRoleId }
                            : emp

                    setAllEmployees(prev => prev.map(updateEmployee))
                    setEmployees(prev => prev.map(updateEmployee))

                    toast.success(response.data.message || 'Employee role updated successfully')
                } else {
                    toast.error('Role not found in available roles')
                }
            } else {
                toast.error(response.data.message || 'Failed to update employee role')
            }
        } catch (err: any) {
            console.error('Error updating employee role:', err)

            let errorMessage = 'Error updating employee role'
            if (err?.response?.data?.message) {
                errorMessage = err.response.data.message
            } else if (err?.message) {
                errorMessage = err.message
            }

            toast.error(errorMessage)
        } finally {
            setUpdatingEmployeeId(null)
        }
    }



    if (loading) {
        return (
            // <AuthGuard>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-32 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            // </AuthGuard>
        )
    }

    if (error) {
        return (
            <AuthGuard>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="text-center">
                            <div className="text-red-600 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Employees</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Header */}
                    <div className='flex justify-between items-center mb-6'>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
                            <p className="text-gray-600 mt-1">
                                {meta ? (
                                    <>Your role: <span className="font-medium">{meta.currentUserRole}</span> • {meta.totalEmployees} team members</>
                                ) : (
                                    'Manage your team and their roles'
                                )}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Role Filter Dropdown */}
                            <div className="relative">
                                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                    Filter by Role:
                                </label>
                                <div className="flex items-center space-x-2">
                                    <select
                                        id="role-filter"
                                        value={selectedRole}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        disabled={rolesLoading}
                                        className="block w-48 px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="all" className="text-black">All Roles</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id} className="text-black">
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                                {rolesLoading && (
                                    <div className="absolute right-3 top-8 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Filter Summary */}
                    {!loading && (
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedRole === 'all' ? (
                                    `Showing all ${employees.length} team members`
                                ) : (
                                    `Showing ${employees.length} team members with role: ${roles.find(r => r.id === selectedRole)?.name || 'Unknown'}`
                                )}
                            </div>
                            {selectedRole !== 'all' && (
                                <button
                                    onClick={() => handleRoleChange('all')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    )}

                    {/* Employees List */}
                    {!Array.isArray(employees) || employees.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {!Array.isArray(employees) ? 'Invalid data format received.' : 'No employees found under your management.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {employees.map((employee) => (
                                <div key={employee.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {employee.contact_person}
                                                    </h3>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </div>

                                                {/* Role Dropdown */}
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-sm font-medium text-black">Role:</label>
                                                    {roles.length > 0 ? (
                                                        <select
                                                            value={employee.role?.id || ''}
                                                            onChange={(e) => updateEmployeeRole(employee.id, e.target.value)}
                                                            disabled={updatingEmployeeId === employee.id || rolesLoading}
                                                            className="px-3 py-1 text-sm border text-black border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                        >
                                                            {roles.map((role) => (
                                                                <option key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">
                                                            {employee.role?.name || 'Loading roles...'}
                                                        </span>
                                                    )}
                                                    {updatingEmployeeId === employee.id && (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Company:</p>
                                                    <p className="text-sm text-gray-900">{employee.company_name}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Email:</p>
                                                    <p className="text-sm text-gray-900">{employee.email}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Phone:</p>
                                                    <p className="text-sm text-gray-900">{employee.phone}</p>
                                                </div>

                                               

                                               
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </AuthGuard>
    )
}

export default RolesPage
