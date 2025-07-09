'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check for error in URL params
    const urlError = searchParams.get('error')
    
    if (urlError) {
      console.error('Authentication error:', urlError)
      // Handle authentication errors
    }
  }, [searchParams])

  const handleMicrosoftLogin = async () => {
    try {
      await signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">NotifyIT</h1>
          <p className="mt-2 text-gray-400">OnCall Alert Manager</p>
        </div>
        
        <div className="space-y-4">
          {/* Microsoft Login Button */}
          <button
            onClick={handleMicrosoftLogin}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zM6.75 18.75H3.75v-6h3v6zm-1.5-6.75c-.966 0-1.75-.784-1.75-1.75S4.284 8.25 5.25 8.25s1.75.784 1.75 1.75-.784 1.75-1.75 1.75zM20.25 18.75h-3v-2.906c0-1.121-.021-2.564-1.563-2.564-1.566 0-1.806 1.223-1.806 2.481v2.989h-3v-6h2.884v.816h.041c.401-.762 1.382-1.566 2.845-1.566 3.041 0 3.602 2.003 3.602 4.61v2.64z"/>
            </svg>
            Sign in with Microsoft
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Secure authentication powered by NextAuth.js</p>
            <p>Sign in with your Azure AD account to access the dashboard</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}