// app/components/RegistrationForm.tsx or similar path

"use client";

import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { registerFormSchema } from "@/lib/validation-schemas";
import { createClient } from "@/utils/supabase/client";

export default function RegistrationForm() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    // Check localStorage on initial render to set the checkbox state
    const accepted = localStorage.getItem("termsAccepted") === "true";
    setTermsAccepted(accepted);

    const draft = localStorage.getItem("registrationDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      form.reset(parsed); // restores form values
    }
  }, []);

  const handleCheckboxChange = (checked: boolean) => {
    setTermsAccepted(checked);
    localStorage.setItem("termsAccepted", String(checked));
  };

  const form = useForm<z.infer<typeof registerFormSchema>>({
    defaultValues: {
      username: "",
      full_name: "",
      age: "",
      gender: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    if (!termsAccepted) {
      toast.error("You must accept the Terms and Conditions.");
      return;
    }

    const supabase = createClient();

    try {
      // Use the built-in Supabase sign-up functionality.
      // It handles email existence checks automatically.
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${origin}/auth/login`,
          data: {
            username: values.username,
            full_name: values.full_name,
            age: values.age,
            gender: values.gender,
          },
        },
      });

      if (error) {
        // Supabase returns an error for existing emails.
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered.");
        } else {
          toast.error(error.message ?? "Registration failed");
        }
        return;
      }

      if (!error && signUpData?.user?.id) {
        // Upsert profile_details for the new user
        await supabase.from("profile_details").upsert([
          { profile_id: signUpData.user.id }
        ]);
      }

      toast.success("Check your email to confirm your account");
      localStorage.removeItem("registrationDraft");
      router.push("/auth/login");
    } catch (e) {
      console.error("Unexpected registration error", e);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  const whiteCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer",
  };

  return (
    <div
      style={whiteCursor}
      className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-5"
    >
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
      </video>

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg xl:max-w-xl p-6 sm:p-8 md:p-10 lg:p-12
                      bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">

        <div className="flex justify-center mb-5">
          <Image
            src="/images/dark-header-icon.png"
            alt="Uxhibit Logo"
            width={2280}
            height={899}
            className="w-auto h-16 sm:h-20 md:h-24"
          />
        </div>

        <p className="text-sm sm:text-base md:text-lg text-center mb-8 text-white dark:text-[#F5F5F5]/70">
          Create your account and start designing with UXhibit
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="username"
                      placeholder="Username"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="full_name"
                      placeholder="Full Name"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="Email"
                      type="email"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Age and Gender in one row */}
            <div className="flex gap-x-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="age"
                          placeholder="Age"
                          type="number"
                          className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="gender"
                          placeholder="Gender"
                          className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="Password"
                      type="password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      type="password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions Checkbox */} <div className="flex items-center space-x-2 mb-5"> <Checkbox id="terms" checked={termsAccepted} onCheckedChange={handleCheckboxChange} className="cursor-pointer" /> <label htmlFor="terms" className="text-sm text-white font-light" > I accept the{" "} <Link href="/auth/terms" onClick={() => { const values = form.getValues(); localStorage.setItem("registrationDraft", JSON.stringify(values)); router.push("/terms"); }} className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium" > Terms and Conditions</Link> </label> </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="group relative inline-flex items-center justify-center
                w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                transition-all duration-300 cursor-pointer
                text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                active:scale-[.97] focus:outline-none
                focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40"
            >
              <span aria-hidden className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]" />
              <span aria-hidden className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]" />
              <span aria-hidden className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl">
                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
              </span>
              <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50" />
              <span className="relative z-10">Sign Up</span>
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-xs sm:text-sm text-white font-light">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}