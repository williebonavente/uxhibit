'use client'

import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { login } from "@/app/auth/login/action";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  // FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { loginFormSchema } from '@/lib/validation-schemas'
import MiddleHeaderIcon from './middle-header-icon'
import { useRouter } from 'next/navigation'
import Image from "next/image"

const formSchema = loginFormSchema;

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Assuming an async login function

      // Convert values to FormData for the Supabase action
      const formData = new FormData();
      formData.append("email", values.email);;
      formData.append("password", values.password);

      const result = await login(formData);
      if (result?.error) {
        toast.error(
          result.error === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : result.error === "User not found"
              ? "No account found with this email."
              : result.error === "Email not confirmed"
                ? "Please Confirm Your Email!"
                : result.error
        );
        return;
      }
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error('Form submission error', error)
      // toast.error('Failed to submit the form. Please try again.')
    }
  }

  return (
    <>
      <MiddleHeaderIcon href="/" />
      <div className="flex flex-col-reverse lg:flex-row min-h-[50vh] w-full items-center justify-center px-4 py-8 lg:justify-end lg:px-70 lg:py-10">
        {/* Image  */}
        <div className="hidden 2xl:block mr-[116px] w-full 2xl:w-[640px] 2xl:h-[857px] flex-shrink-0 relative">
          <Image
            src="/images/bg-front-page_2.png"
            alt="Login Illustration"
            fill
            // width={654}
            // height={366}
            className="object-cover rounded-xl"
            style={{ borderRadius: "50px" }}
          />
          <span className="absolute inset-0 flex items-center justify-center 
          image-overlay-text z-10 mb-120 ml-5">
            Welcome back! <br /> Xhibit your greatness.
          </span>
        </div>
        {/* End of Image */}

        {/* Login Form Content  */}
        <div className="flex flex-col w-full max-w-full lg:max-w-[513px]">
          <h2
            className=" title-regsiter-login text-5xl text-center lg:text-left lg:text-[60px]  mb-4 
                        mt-5 w-full flex justify-center lg:justify-start dark"
          >
            Log In
          </h2>
          <p className="text-lg mb-4 text-[24px] text-[#1E1E1E]/50 dark:text-[#F5F5F5]/60 text-center pb-8 lg:text-left lg:pb-10">
            Welcome back to UXhibit — Xhibit your edge!
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" >
              <div className="grid gap-4">
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <div className="flex justify-between items-center">
                      </div>
                      <FormControl>
                        <PasswordInput
                          id="password"
                          placeholder="Password"
                          autoComplete="current-password"
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-xl btn-login btn-login:hover cursor-pointer lg:w-[513px] lg:h-[62px]">
                  Log In
                </Button>

                {/* Service Provider */}
                {/* <Button variant="outline" className="w-full h-12 text-xl cursor-pointer lg:w-[513px] lg:h-[62px]">
                  <Image
                    src="/google_logo.png"
                    alt="Google Logo"
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  Continue with Google
                  </Button> */}
                {/* TODO: Follow up */}
                {/* <Button variant="outline" className="w-full h-12 text-xl cursor-pointer lg:w-[513px] lg:h-[62px]">
                  <Image
                    src="/figma_logo.png"
                    alt="Google Logo"
                    width={22}
                    height={22}
                    className="mr-2"
                  />
                  Continue with Figma
                </Button> */}
              </div>
            </form>
          </Form>
          <div className="mt-8 text-center text-[18px] text-[#1E1E1E]/50 dark:text-[#F5F5F5]/40">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup"
              className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium">
              Sign Up
            </Link>
            <div className="mt-4 text-[18px] text-[#1E1E1E]/50 text-middle">
              <Link href="/auth/forgot-password"
                className="text-[#1E1E1E]/50 dark:text-[#F5F5F5]/40 hover:text-[#ED5E20] transition-colors duration-200 hover:underline">
                Forgot Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>


  )
}

