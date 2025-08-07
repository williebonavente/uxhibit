'use client'

import Link from 'next/link'
import { file, z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { registerFormSchema } from '@/lib/validation-schemas'
import MiddleHeaderIcon from './middle-header-icon'
import Image from 'next/image'
import { createClient } from "@/utils/supabase/client";
import { type User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { Avatar } from '@radix-ui/react-avatar'


export default function RegistrationForm({ user }: { user: User | null }) {
  const router = useRouter();
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [fullname, setFullName] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [age, setAge] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const form = useForm<z.infer<typeof registerFormSchema>>({
    defaultValues: {
      username: '',
      full_name: '',
      age: '',
      gender: '',
      email: '',
      avatar_url: '',
      password: '',
      confirmPassword: '',
      website_url: '',
      bio: ''
    },

  })

  // const getProfile = useCallback(async () => {
  //   try {
  //     setLoading(true)

  //     const { data, error, status } = await supabase
  //       .from('profiles')
  //       .select('username, full_name, age, avatar_url')
  //       .eq('id', user?.id)
  //       .single()
  //     if (error && status !== 406) {
  //       console.log(error)
  //       throw error;
  //     }
  //   } catch (error) {
  //     toast.error("Error loading user data.");
  //   } finally {
  //     setLoading(false);
  //   }

  // }, [user, supabase])

  // useEffect(() => {
  //   getProfile()
  // }, [user, getProfile])


  async function updateProfile({
    username,
    website,
    age,
    avatar_url,
  }: {
    username: string | null
    fullname: string | null
    age: number
    website: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id as string,
          username,
          full_name: fullname,
          age,
          website,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      alert('Profile updated!')
    } catch (error) {
      alert('Error updating the data!')
    } finally {
      setLoading(false)
    }
  }
  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            avatar_url: values.avatar_url,
            age: values.age,
            gender: values.gender,
            username: values.username,
            website: values.website_url,
          }
        }
      });

      if (error) {
        toast.error(error.message || "Registration failed");
        return;
      }

      toast.success('Registered successfully!');
      router.push('/auth/login');
    } catch (error) {
      console.error('Form submission error', error);
      toast.error('Failed to submit the form. Please try again.');
    }
  }

  return (
    <>
      <MiddleHeaderIcon href="/auth/signup" />
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
          image-overlay-text z-10 mb-120">
            Convert your ideas <br /> into successful UX.
          </span>
        </div>
        {/* End of Image */}

        {/* Register Form Cotent */}
        <div className="flex flex-col w-full max-w-full lg:max-w-[513px]">
          <h2
            className=" title-regsiter-login text-5xl text-center lg:text-left lg:text-[60px] 
                         w-full flex justify-center lg:justify-start dark mb-4"
          >
            Get Started
          </h2>
          <p className="text-lg mb-4 text-[#1E1E1E]/50 dark:text-[#F5F5F5]/60 text-[24px] text-center lg:text-left lg:pb-10">
            Welcome to Uxhibit - Let&apos;s get started
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
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
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Website Field (optional)
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="website_url"
                          placeholder="Website (optional)"
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* Avatar URL Field (optional) */}
                {/* <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormControl>
                        <Input
                          id="avatar_url"
                          placeholder="Avatar URL (optional)"
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <Button type="submit" className="w-full h-12 text-xl btn-login btn-login:hover cursor-pointer lg:w-[513px] lg:h-[62px]">
                  Register
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-4 text-center text-[18px] text-[#1E1E1E]/50 dark:text-[#F5F5F5]/40">
            Already have an account? {''}
            <Link href="/auth/login" className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}