"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard after successful login
      router.push("/dashboard")
    }, 2000)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Column - Login Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex items-center justify-center rounded-md">
              <svg className="size-8" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M941.4 188.6c10.7 0 19.3 8.7 19.3 19.3 0 55.5-15.3 109.7-44.1 156.9-47.7 77.9-128.4 130-218.2 141.6-0.5 3.8-1.1 7.5-1.9 11.2C683 579.9 626.8 625.1 563 625.1c-7.7 0-15.5-0.7-23.3-2-7-1.2-12.8-6.2-15.1-13-2.3-6.8-0.6-14.2 4.3-19.4 17.3-18.3 26.9-42.2 26.9-67.4 0-4.8-0.3-9.6-1-14.3H440.9c-5.3 33.1-22.7 63.1-49.4 84.2-5.8 4.5-12.1 8.7-19 12.5-3 1.7-6.2 2.5-9.5 2.5-3.7 0-7.3-1-10.6-3.1-6-3.9-8.3-10.9-8.7-18-1.3-20.8-6.2-40.1-7.5-43.3-3.4 2.8-5.5 4.8-8.6 7.9 0 0 0 0.1-0.1 0.1-30.5 30.6-45.6 72.4-42.1 114.8 66.8-9.2 135 11.3 185.6 56.7 5.4 4.9 10.4 9.8 15.3 15.1 5.9 6.4 6.7 16 2.1 23.4-4.7 7.4-13.7 10.7-22.1 8.1-46.4-14.4-97.5-10.2-141.3 11.3-16.7 45.8-15.4 97.1 3.9 141.7 3.5 8 1.1 17.4-5.7 22.8-3.5 2.8-7.8 4.2-12 4.2-11 0-22.7-12.5-28.1-17.3-52.4-47.1-80.3-115.9-75.8-186-89.1-54.5-144-151.8-144-256.8 0-165.9 135-300.9 300.9-300.9h65.7c-13.4-29.8-32.1-57.4-55-80.8-7.5-7.6-7.3-19.9 0.3-27.3 3.2-3.1 7.1-4.9 11.2-5.4 12.2-1.5 24.9-2.2 37.8-2.2 95.8 0 184.4 42 244.9 115.8h272.3z" fill="#663333" />
                <path d="M660.4 228.2l260.9-0.9c-3 40.8-15.5 80.2-36.4 115.2h-110c-10.3 0-19.3 7.8-20 18.1-0.7 11.3 8.2 20.6 19.3 20.6h82.3c-44.8 50.8-108.1 83-176.4 88.3-10.6 0-19.2 8.6-19.3 19.3 0 7-0.8 13.9-2.3 20.6-8.5 39-40.3 68.7-78.8 75.5 9.6-18.9 14.6-39.9 14.6-61.6 0-13.4-1.9-26.6-5.7-39.2-2.5-8.4-10.2-13.8-18.5-13.8l-147.7 0.2c-10.1 0.4-18.3 8.6-18.5 18.9-0.5 23.1-13 50.1-27.9 66.9-5.5-26.9-15-51.6-16.1-53.2-6.1-8.8-18.1-11-26.9-4.9-11.9 7.4-22.9 16.2-32.8 26.1-44.3 44.3-63 107.5-49.9 168.9 2 9.1 10 15.3 18.9 15.3 1.4 0 5.6-0.8 6.4-1.1 43.2-9.5 87.9-3.8 126.6 15.4-35.3 1.2-70.3 10.4-101.7 27.3-5.8 3.1-8.3 8.5-8.9 9.9-13.4 33.1-18.9 68.9-16.3 104-23.3-36.7-33.8-80.8-28.8-124.9 0.1-0.8 0.1-1.6 0.1-2.4 0.3-7.1-3.3-14.1-9.9-17.8-83.2-46.3-134.9-134.2-134.9-229.4 0-144.6 117.6-262.3 262.3-262.3 0 0 95.4 1.4 100.1-1 9.6-4.8 15.6-14.3 12.2-24.4-10.8-32.3-27-62.9-47.6-90.2 85.4 1.4 164 41 216.2 109 3.9 5 9.6 7.6 15.4 7.6z" fill="#4EC8D8" />
                <path d="M818.7 263.8c10 0 18.2 8.1 18.2 18.2s-8.1 18.2-18.2 18.2c-10 0-18.2-8.1-18.2-18.2s8.2-18.2 18.2-18.2zM674.9 277.3c9.1 5.6 12 17.5 6.4 26.6-9.3 15.1-9.3 34.6 0 49.7 5.6 9.1 2.7 21-6.4 26.6-3.2 1.9-6.7 2.9-10.1 2.9-6.5 0-12.9-3.3-16.5-9.2-17-27.8-17-62.3 0-90.1 5.6-9.2 17.5-12.1 26.6-6.5zM601.3 277.3c9.1 5.6 12 17.5 6.4 26.6-9.3 15.1-9.3 34.6 0 49.7 5.6 9.1 2.7 21-6.4 26.6-3.2 1.9-6.6 2.9-10.1 2.9-6.5 0-12.9-3.3-16.5-9.2-17-27.8-17-62.3 0-90.1 5.6-9.2 17.5-12.1 26.6-6.5zM329 295.6c2.9 10.3-3 21-13.3 23.9-60.7 17.3-107.4 66.2-123.2 127.2-4.5 17.3-21.9 14.5-23.4 14.1-10.4-2.6-16.7-13.1-14.1-23.5 18.6-74.5 76.2-133.9 150.1-155 10.2-2.9 20.9 3 23.9 13.3z" fill="#663333" />
              </svg>
            </div>
            SolutionShark
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Card className="w-full border-0 shadow-none">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                  Login to your SolutionShark account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={onSubmit}>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a href="#" className="text-sm text-muted-foreground hover:underline">
                          Forgot your password?
                        </a>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        disabled={isLoading}
                      />
                    </div>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading && (
                        <div className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                  </div>
                </form>
                
                {/* Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                {/* Social Login Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415 1.078-3.96 1.04-2.04-.024-2.9 1.115-3.6 2.16-1.548 2.67-.376 6.582 1.116 8.732.752.9 1.644 1.868 2.82 1.792 1.104-.076 1.52-.696 2.856-.696 1.336 0 1.752.696 2.856.696 1.176.076 2.068-.892 2.82-1.792.48-.576.84-1.224 1.2-2.04-3.24-1.056-3.72-4.08-2.88-5.28-.72-.24-1.44-.36-2.16-.36z" fill="currentColor"/>
                      <path d="M15.53 3.53c.24-1.2.96-2.16 1.92-2.16.12 1.2-.24 2.4-1.2 3.12-.72.48-1.44.72-2.16.48.24-.96.72-1.68 1.44-1.44z" fill="currentColor"/>
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"/>
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Right Column - Placeholder Graphic */}
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-muted-foreground/10 rounded-full flex items-center justify-center">
            <div className="w-32 h-32 bg-muted-foreground/20 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 