// Cookie utility functions for managing authentication tokens

export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof window !== 'undefined') {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  }
}

export const getCookie = (name: string): string | null => {
  if (typeof window !== 'undefined') {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}

export const deleteCookie = (name: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}

// Specific functions for the B2B customer token
export const setB2BCustomerToken = (token: string) => {
  setCookie('b2b_customer_token', token, 7) // 7 days expiry
}

export const getB2BCustomerToken = (): string | null => {
  return getCookie('b2b_customer_token')
}

export const deleteB2BCustomerToken = () => {
  deleteCookie('b2b_customer_token')
}
