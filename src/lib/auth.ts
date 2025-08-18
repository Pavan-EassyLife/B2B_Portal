import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "email-password",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}b2b/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // This ensures cookies are received and sent
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            })
          })

          const result = await response.json()

          console.log('Login response:', result)
          if (response.ok && result.status) {
            // The backend automatically sets the b2b_customer_token cookie
            // No need to manually set a cookie here
            return {
              id: result.data.user.id,
              mobile: result.data.user.phone || '',
              email: result.data.user.email,
              name: result.data.user.contact_person,
              company_name: result.data.user.company_name,
              image: result.data.user.image || '',
              token: result.data.user.id, // Use user ID as token identifier
              phone: result.data.user.phone,
              role: result.data.user.role,
              contact_person: result.data.user.contact_person,
              ...result.data.user
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Handle Google OAuth user
        if (account?.provider === 'google') {
          token.id = user.id
          token.name = user.first_name
          token.email = user.email
          token.image = user.image
          token.mobile = '' // Google doesn't provide mobile
          token.accessToken = account.access_token || ''
          token.last_name = user.name?.split(' ').slice(1).join(' ') || ''
          token.country_code = ''
          token.wallet = ''
          token.referral_code = ''
          token.is_es_gold = 0
          token.vip_subscription_status = ''
        } else {
          // Handle Email/Password user
          token.mobile = user.phone || user.mobile || ''
          token.id = user.id
          token.name = user.contact_person || user.name
          token.image = user.image || ''
          token.email = user.email
          token.accessToken = user.token || ''
          token.company_name = user.company_name || ''
          token.phone = user.phone || ''
          token.role = user.role || ''
          token.contact_person = user.contact_person || ''
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {}

        session.user.id = token.id as string
        session.user.mobile = token.mobile as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.accessToken = token.accessToken as string
        session.user.first_name = token.first_name as string
        session.user.last_name = token.last_name as string
        session.user.country_code = token.country_code as string
        session.user.wallet = token.wallet as string
        session.user.referral_code = token.referral_code as string
        session.user.is_es_gold = token.is_es_gold as number
        session.user.vip_subscription_status = token.vip_subscription_status as string
        // B2B specific fields
        session.user.phone = token.phone as string
        session.user.company_name = token.company_name as string
        session.user.contact_person = token.contact_person as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  jwt: {
    // JWT configuration - encryption is handled automatically by NextAuth
  },
  secret: process.env.NEXTAUTH_SECRET,
}
