'use client'

import Link from 'next/link'
import { z } from 'zod'
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
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'



const formSchema = registerFormSchema

export default function RegistrationForm() {
  const router = useRouter();
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [age, setAge] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      age: '',
      email: '',
      password: '',
      confirmPassword: '',
    },

  })
  // const getProfile = useCallback(async (userId: string) => {
  //   try {
  //     setLoading(true)
  //     const { data, error, status } = await supabase
  //       .from('learner_profile')
  //       .select('name, email ,age')
  //       .eq('id', userId)
  //       .single()

  //     if (error && status !== 406) {
  //       console.log(error);
  //       throw error;
  //     }
  //     if (data) {
  //       setName(data.name);
  //       setAge(data.age);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast.error('Error laoding user data!');
  //   } finally {
  //     setLoading(false)
  //   }
  // }, [supabase])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Assuming an async registration function
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Registration failed");
        return;
      }
      const userId = data.user?.id;
      console.log("userId after signUp: ", userId);

      // 2. Insert additional user info into 'profiles' table
      if (userId) {
        const { error: profileError } = await supabase
          .from('learner_profile')
          .upsert(
            {
              id: userId,
              name: values.name,
              email: values.email,
              age: values.age,
            }
          );

        if (profileError) {
          console.error(profileError);
          toast.error(profileError.message || "Failed to save profile.");
          console.log(profileError);
          return;
        }
        // await getProfile(userId);
      } else {
        toast.error("User ID is undefined. Email confirmation must be disabled");
        return;
      }
      console.log(values)
      toast.success('Registered successfully!');
      router.push('/auth/login');
      // toast(
      //   <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
      //     <code className="text-white">{JSON.stringify(values, null, 2)}</code>
      //   </pre>,
      // )
    } catch (error) {
      console.error('Form submission error', error)
      toast.error('Failed to submit the form. Please try again.')
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
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      {/* <FormLabel htmlFor="name">Full Name</FormLabel> */}
                      <FormControl>
                        <Input id="name" placeholder="Name"
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field} />
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
                      {/* <FormLabel htmlFor="email">Email</FormLabel> */}
                      <FormControl>
                        <Input
                          id="email"
                          placeholder="Email"
                          type="email"
                          autoComplete="email"
                          className='w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]'
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
                      {/* <FormLabel htmlFor="phone">Age </FormLabel> */}
                      <FormControl>
                        <Input id="age" placeholder='Age'
                          className="w-full h-12 input-placeholder-lg input-lg input-colored lg:w-[513px] lg:h-[62px]"
                          {...field}
                        />
                        {/* <Input
                          id="phone"
                          placeholder="555-123-4567"
                          type="tel"
                          autoComplete="tel"
                          {...field}
                          /> */}
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
                      {/* <FormLabel htmlFor="password">Password</FormLabel> */}
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
                      {/* <FormLabel htmlFor="confirmPassword">
                        Confirm Password
                      </FormLabel> */}
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
