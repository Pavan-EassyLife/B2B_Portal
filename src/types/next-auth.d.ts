import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      mobile: string
      email: string
      name: string
      image: string
      first_name: string
      last_name: string
      country_code: string
      wallet: string
      referral_code: string
      is_es_gold: number
      vip_subscription_status: string
      accessToken: string
      // B2B specific fields
      phone: string
      company_name: string
      contact_person: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    mobile: string
    email: string
    name: string
    image: string
    token: string
    first_name: string
    last_name: string
    country_code: string
    wallet: string
    referral_code: string
    is_es_gold: number
    vip_subscription_status: string
    // B2B specific fields
    phone: string
    company_name: string
    contact_person: string
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    mobile: string
    email: string
    name: string
    image: string
    accessToken: string
    first_name: string
    last_name: string
    country_code: string
    wallet: string
    referral_code: string
    is_es_gold: number
    vip_subscription_status: string
    // B2B specific fields
    phone: string
    company_name: string
    contact_person: string
    role: string
  }
}
