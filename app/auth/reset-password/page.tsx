"use client";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(window.location.search)
        .then(({ data: codeData, error }) => {
          console.error("Code User",codeData.user);
          console.error("Code Session",codeData.session);
          if (error) {
            console.error("Error", error.message);
            toast.error("Invalid or expired reset link.");
            router.replace("/auth/forgot-password");
          }
        });
    }
  }, [searchParams, router]);
  
  const form = useForm<{
    password: string,
    confirmPassword: string
  }>({
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (!error) {
      toast.success("Password updated successfully!");
      window.location.href = "/auth/login";
    } else {
      toast.error("There was an error updating your password.");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-[#141414] rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-4xl font-bold mt-3 mb-7 text-center text-[#0c0d0d]/90 dark:text-[#FAF8FC]/100">Set New Password</h2>
        <p className="mb-8 text-[18px] text-center">
          Enter your new password below to reset your account password.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2 mb-6">
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="Enter new password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-12 input-placeholder-lg input-lg input-colored"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2 mb-6">
                  <FormControl>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Re-enter new password"
                      type="password"
                      autoComplete="new-password"
                      className="w-full h-12 input-placeholder-lg input-lg input-colored"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 text-xl btn-login btn-login:hover cursor-pointer">
              Set New Password
            </Button>
            <div className="mt-5 text-[18px] text-[#1E1E1E]/50 text-center">
              <Link
                href="/auth/login"
                className="text-[#ED5E20]/100 hover:text-[ED5E20] transition-colors duration-200 hover:underline"
              >
                Back to Log In
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}