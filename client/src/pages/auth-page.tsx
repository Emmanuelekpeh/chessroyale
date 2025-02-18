import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Crown } from "lucide-react";
import { z } from "zod";
import React from "react";

// Extended schema for login form with remember me
const loginSchema = insertUserSchema.extend({
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, guestLoginMutation } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    }
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (data: LoginFormData) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const handleGuestLogin = () => {
    guestLoginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <Crown className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">Chess Puzzle Battle</h1>
            <p className="text-sm text-muted-foreground">Train your tactical vision with challenging puzzles</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input id="login-username" {...loginForm.register("username")} />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        type="password" 
                        id="login-password" 
                        {...loginForm.register("password")} 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember-me" 
                        checked={loginForm.watch("rememberMe")}
                        onCheckedChange={(checked) => 
                          loginForm.setValue("rememberMe", checked === true)
                        }
                      />
                      <label 
                        htmlFor="remember-me" 
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember me for 30 days
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="register-username">Username</Label>
                      <Input id="register-username" {...registerForm.register("username")} />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        type="password" 
                        id="register-password" 
                        {...registerForm.register("password")} 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : "Register"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleGuestLogin}
                disabled={guestLoginMutation.isPending}
              >
                {guestLoginMutation.isPending ? "Creating guest account..." : "Continue as Guest"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 to-primary/10 items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-4">Challenge Your Chess Skills</h2>
          <p className="text-lg text-muted-foreground">
            Compete against other players in solving chess puzzles. Race against time, improve your tactical vision, and climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}