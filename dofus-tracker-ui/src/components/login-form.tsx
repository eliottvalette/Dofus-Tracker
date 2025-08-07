import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  onSubmit,
  onGoogleSignIn,
  onToggleMode,
  isSignUp = false,
  ...props
}: React.ComponentPropsWithoutRef<"form"> & {
  onGoogleSignIn?: () => void;
  onToggleMode?: () => void;
  isSignUp?: boolean;
}) {
  return (
    <form className={cn("flex flex-col gap-2", className)} onSubmit={onSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" autoComplete="email" name="email" type="email" placeholder="m@example.com" className="rounded-[10px] border border-[#333333] bg-[#1A1A1A]" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" autoComplete="current-password" name="password" type="password" placeholder="********" className="rounded-[10px] border border-[#333333] bg-[#1A1A1A]" required />
          {!isSignUp && (
          <a
            href="#"
            className="ml-auto text-sm underline-offset-4 mt-2 mb-[-16px] hover:underline"
          >
            Mot de passe oublié ?
          </a>
        )}
        </div>
        
        <Button type="submit" className="w-full mt-2 bg-white hover:bg-gray-200 text-gray-900 h-[40px]">
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </Button>
        <div className="relative my-4 mt-[-3px]">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#111111] text-gray-400">Ou continuer avec</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-[-15px] border-[#333333] text-gray-200 hover:bg-[#1A1A1A] h-[45px] text-md rounded-[10px] mb-1" 
          onClick={onGoogleSignIn}
        >
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Google
        </Button>
      </div>
      <div className="text-sm text-gray-400 text-center">
        {isSignUp ? (
          <>
            Vous avez déjà un compte ?{" "}
            <button
              type="button"
              className="text-sm text-gray-200 font-medium hover:underline underline-offset-4"
              onClick={onToggleMode}
            >
              Se connecter
            </button>
          </>
        ) : (
          <>
            Vous n&apos;avez pas de compte ?{" "}
            <button
              type="button"
              className="text-sm text-gray-200 font-medium hover:underline underline-offset-4"
              onClick={onToggleMode}
            >
              Créer un compte
            </button>
          </>
        )}
      </div>
    </form>
  )
}