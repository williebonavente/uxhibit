"use client";

import Link from "next/link";
import { email, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { registerFormSchema } from "@/lib/validation-schemas";
import MiddleHeaderIcon from "./middle-header-icon";
import Image from "next/image";
import { type User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
// import { Avatar } from '@radix-ui/react-avatar'

export default function RegistrationForm({ user }: { user: User | null }) {
  const router = useRouter();

  // const [loading, setLoading] = useState(true);
  // const [fullname, setFullName] = useState<string | null>(null);
  // const [username, setUsername] = useState<string | null>(null);
  // const [website, setWebsite] = useState<string | null>(null);
  // const [age, setAge] = useState<string | null>(null);
  // const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  // const [isCheck, setCheck] = useState<string | null>(null);

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

  // async function updateProfile({
  //   username,
  //   website,
  //   age,
  //   avatar_url,
  // }: {
  //   username: string | null
  //   fullname: string | null
  //   age: number
  //   website: string | null
  //   avatar_url: string | null
  // }) {
  //   try {
  //     setLoading(true)

  //     const { error } = await supabase
  //       .from('profiles')
  //       .upsert({
  //         id: user?.id as string,
  //         username,
  //         full_name: fullname,
  //         age,
  //         website,
  //         avatar_url,
  //         updated_at: new Date().toISOString(),
  //       })
  //     if (error) throw error
  //     alert('Profile updated!')
  //   } catch (error) {
  //     alert('Error updating the data!')
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    const supabase = createClient();

    try {

      const res = await fetch("/api/check_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      console.log("Raw response:", res);
      const emailCheck = await res.json();
      console.log(emailCheck)
      if (emailCheck.exists) {
        toast.error("This email is already registered.");
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=/auth/login`,
          data: {
            username: values.username,
            full_name: values.full_name,
            age: values.age,
            gender: values.gender,
          },
        },
      });
      console.log('signUp response', { signUpData, error });

      if (error) {
        toast.error(error.message ?? "Registration failed");
        console.log("Sign-up error details:", error);
        return;
      }

      toast.success('Check your email to confirm your account');
      // router.push('/auth/login');
    } catch (e) {
      console.error('Unexpected registration error', e);
      toast.error(`Failed to submit the form. Please try again.${e}`);
    }
  }


  return (
    <>
      <MiddleHeaderIcon href="/" />

      {/* Responsive wrapper */}
      <div className="flex flex-col lg:flex-row min-h-screen w-full justify-center items-center px-4 py-8 lg:px-20 lg:py-12">
        {/* Video + Text Container */}
        <div className="hidden 2xl:block relative mr-[116px] w-full 2xl:w-[640px] 2xl:h-[857px] flex-shrink-0 rounded-xl overflow-hidden">
          {/* Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full rounded-4xl"
          >
            <source src="/images/uxhibit-gif-3(webm).webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>

          {/* Overlay Text */}
          <span
            className="absolute inset-0 flex items-center justify-center 
                      text-white z-10 mb-150 leading-tight 
                      text-2xl sm:text-3xl lg:text-3xl xl:text-5xl font-medium"
          >
            Convert your ideas <br /> into successful UX.
          </span>
        </div>
        {/* End of Video + Text */}

        {/* Register Form Content */}
        <div className="flex flex-col w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-lg self-center">
          <h2
            className="title-regsiter-login text-4xl sm:text-5xl lg:text-[60px] 
                      text-center lg:text-left mb-4"
          >
            Get Started
          </h2>
          <p className="text-base sm:text-lg lg:text-[24px] mb-4 text-[#1E1E1E]/50 dark:text-[#F5F5F5]/60 text-center lg:text-left lg:pb-6">
            Welcome to Uxhibit - Let&apos;s get started
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 sm:space-y-8"
            >
              <div className="grid gap-4">
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="username"
                          placeholder="Username"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="full_name"
                          placeholder="Full Name"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="email"
                          placeholder="Email"
                          type="email"
                          autoComplete="email"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age Field */}
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="age"
                          min={0}
                          placeholder="Age"
                          type="number"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender Field */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="gender"
                          placeholder="Gender"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <PasswordInput
                          id="password"
                          placeholder="Password"
                          autoComplete="new-password"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="Confirm Password"
                          autoComplete="new-password"
                          className="w-full h-12 
                                    sm:h-[45px] sm:text-sm 
                                    lg:h-[55px] lg:text-md 
                                    xl:h-[55px] xl:text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Register Button */}
                <Button
                  type="submit"
                  className={`
                      group relative inline-flex items-center justify-center
                      w-full h-12 lg:w-[513px] lg:h-[62px]
                      rounded-xl text-lg font-semibold tracking-wide
                      transition-all duration-300 cursor-pointer
                      text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                      hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                      active:scale-[.97]
                      focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                    `}
                >
                  {/* Glow / gradient base */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                  />

                  {/* Inner glass layer */}
                  <span
                    aria-hidden
                    className="absolute inset-[2px] rounded-[10px] 
                                bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))]
                                backdrop-blur-[2px]"
                  />

                  {/* Animated sheen */}
                  <span
                    aria-hidden
                    className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                  >
                    <span
                      className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                                      bg-gradient-to-r from-transparent via-white/50 to-transparent
                                      opacity-0 transition-all duration-700
                                      group-hover:translate-x-[220%] group-hover:opacity-70"
                    />
                  </span>

                  {/* Border ring */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
                  />

                  {/* Label */}
                  <span className="relative z-10 flex items-center gap-2">
                    Sign Up
                  </span>
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm sm:text-base lg:text-[18px] text-[#1E1E1E]/50 dark:text-[#F5F5F5]/40">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline"
            >
              Log in
            </Link>
            {/* TODO: Checkbox for terms and agreemnt  */}
            {/* Checkbox */}
          </div>
        </div>
      </div>
    </>
  );
}
