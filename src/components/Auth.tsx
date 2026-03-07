import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../utils/supabase'

export function Auth() {
  return (
    <div className="w-full">
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#111827', // gray-900
                brandAccent: '#000000',
                inputBackground: '#F9FAFB', // gray-50
                inputBorder: '#E5E7EB', // gray-200
                inputBorderHover: '#D1D5DB', // gray-300
                inputBorderFocus: '#D1D5DB',
              },
              radii: {
                borderRadiusButton: '9999px',
                buttonBorderRadius: '9999px',
                inputBorderRadius: '12px',
              },
            },
          },
          className: {
            container: 'flex flex-col gap-4',
            button: 'w-full flex justify-center items-center py-3 rounded-full font-bold tracking-wide transition-all shadow-md hover:scale-[1.02] active:scale-95 text-sm',
            input: 'w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 px-4 py-3 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all font-medium text-sm',
            label: 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1',
            anchor: 'text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors',
            message: 'text-xs font-medium text-red-500 bg-red-50 border border-red-100 p-3 rounded-lg mt-2',
          }
        }}
        providers={[]}
        view="sign_in"
        showLinks={false}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : undefined}
      />
    </div>
  )
}
