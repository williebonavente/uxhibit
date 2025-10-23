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
import "react-datepicker/dist/react-datepicker.css";
// import DatePicker from "react-datepicker";


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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import BackgroundVideo from "./background_video/backgroundVideo";

export default function RegistrationForm() {
  const router = useRouter();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setTermsAccepted(checked);
    localStorage.setItem("termsAccepted", String(checked));
  };

  const form = useForm<z.infer<typeof registerFormSchema>>({
    defaultValues: {
      username: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      birthday: "",
      gender: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(registerFormSchema),
    // validate on change so formState.isValid updates as the user types
    mode: "onChange",
  });

  const { isValid } = form.formState;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    if (!termsAccepted) {
      toast.error("You must accept the Terms and Conditions.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${origin}/auth/login`,
          data: {
            username: values.username,
            first_name: values.first_name,
            middle_name: values.middle_name,
            last_name: values.last_name,
            birthday: values.birthday,
            gender: values.gender,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered.");
        } else {
          toast.error(error.message ?? "Registration failed");
        }
        return;
      }

      if (!signUpData?.user?.id) {
        toast.error("Registration failed. Please try again.");
        return;
      }

      if (!error && signUpData?.user?.id) {
        const { data: profileDetails, error: detailsError } = await supabase
          .from("profile_details")
          .upsert([{ profile_id: signUpData.user.id }])
          .select()
          .single();

        if (detailsError) {
          if (
            detailsError.message?.includes("violates foreign key constraint") ||
            detailsError.message?.includes("profile_details_profile_id_fkey")
          ) {
            toast.error("This email is already registered.");
          } else {
            toast.error(detailsError.message || "Failed to create profile details.");
          }
          return;
        }

        if (profileDetails && profileDetails.id) {
          await supabase.from("profile_contacts").insert({
            profile_details_id: profileDetails.id,
            email: "",         // or initial value
            website: "",
            open_to: "",
            extra_fields: "[]"
          });
        }

        toast.success("Check your email to confirm your account");
        localStorage.removeItem("registrationDraft");
        router.push("/auth/login");
        return;
      }
    } catch (e) {
      console.error("Unexpected registration error", e);
      toast.error("Failed to submit the form. Please try again.");
    } finally {
      setTimeout(() => setIsSubmitting(false), 400);
    }
  }

  const whiteCursor: React.CSSProperties = {
    cursor:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' stroke='%23ffffff' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3l7 17 2-7 7-2-16-8Z'/></svg>\") 2 2, pointer",
  };
  useEffect(() => {
    const accepted = localStorage.getItem("termsAccepted") === "true";
    setTermsAccepted(accepted);

    const draft = localStorage.getItem("registrationDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      // Merge with default values to ensure all fields are present
      form.reset({
        username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        birthday: "",
        gender: "",
        email: "",
        password: "",
        confirmPassword: "",
        ...parsed,
      });
    }
  }, [form])

  return (
    <div
      style={whiteCursor}
      className="relative min-h-screen flex items-center justify-center w-full overflow-hidden p-5"
    >

      <BackgroundVideo
        src="/images/uxhibit-gif-3(webm).webm"
        type="video/webm"
        overlay={true}
        disabled={true}
      />

      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg xl:max-w-2xl p-6 sm:p-8 md:p-10 lg:p-12
                      bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20"
      >
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Fields: First, Middle, Last Name in one row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <label
                        htmlFor="first_name"
                        className="block text-white text-sm opacity-60"
                      >
                        First Name <span className="text-[#ED5E20]">*</span>
                      </label>
                      <FormControl>
                        <Input
                          id="first_name"
                          placeholder=""
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
                  name="middle_name"
                  render={({ field }) => (
                    <FormItem>
                      <label
                        htmlFor="middle_name"
                        className="block text-white text-sm opacity-60"
                      >
                        Middle Name <span className="text-[#ED5E20]"></span>
                      </label>
                      <FormControl>
                        <Input
                          id="middle_name"
                          placeholder=""
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
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <label
                        htmlFor="last_name"
                        className="block text-white text-sm opacity-60"
                      >
                        Last Name <span className="text-[#ED5E20]">*</span>
                      </label>
                      <FormControl>
                        <Input
                          id="last_name"
                          placeholder=""
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

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <label
                    htmlFor="username"
                    className="block text-white text-sm opacity-60"
                  >
                    Username <span className="text-[#ED5E20]">*</span>
                  </label>
                  <FormControl>
                    <Input
                      id="username"
                      placeholder=""
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
                  <label
                    htmlFor="email"
                    className="block text-white text-sm opacity-60"
                  >
                    Email <span className="text-[#ED5E20]">*</span>
                  </label>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder=""
                      type="email"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Birthday and Gender in one row */}
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Birthday Field */}
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <label
                        htmlFor="birthday"
                        className="block text-white text-sm opacity-60"
                      >
                        Birthday <span className="text-[#ED5E20]">*</span>
                      </label>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-12 text-sm sm:text-base border text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A] rounded-lg px-3 pr-10 shadow-sm flex justify-between items-center"
                              id="birthday"
                              type="button"
                            >
                              <span className={field.value ? "" : "text-gray-400 dark:text-gray-500 opacity-60"}>
                                {field.value
                                  ? format(new Date(field.value), "MM/dd/yyyy")
                                  : "MM/DD/YYYY"}
                              </span>
                              <CalendarIcon className="ml-2 h-5 w-5 text-gray-700 dark:text-white" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={date =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                )
                              }
                              captionLayout="dropdown"
                              hidden={{
                                before: new Date(1900, 0, 1),
                                after: new Date(new Date().getFullYear(), 11, 31),
                              }}
                              disabled={[
                                { from: new Date(), to: new Date(2100, 0, 1) }
                              ]}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender Field */}
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <label
                        htmlFor="gender"
                        className="block text-white text-sm opacity-60"
                      >
                        Gender <span className="text-[#ED5E20]">*</span>
                      </label>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <SelectTrigger
                            id="gender"
                            className="w-full h-12 text-sm sm:text-base border text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A] 
                              rounded-lg px-3 shadow-sm focus:outline-none focus:ring-2 
                              focus:ring-white/50 transition appearance-none flex items-center cursor-pointer
                              [&_[data-placeholder]]:text-gray-400 [&_[data-placeholder]]:opacity-60"
                            style={{ minHeight: "48px", lineHeight: "1.25rem" }}
                          >
                            {!field.value ? (
                              <span className="text-gray-600 dark:text-gray-400 opacity-60">Select gender</span>
                            ) : (
                              <SelectValue />
                            )}

                          </SelectTrigger>
                          <SelectContent
                            className="w-full min-w-full"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to Say</SelectItem>
                          </SelectContent>
                        </Select>
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
                  <label
                    htmlFor="password"
                    className="block text-white text-sm opacity-60"
                  >
                    Password <span className="text-[#ED5E20]">*</span>
                  </label>
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder=""
                      type="password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A] cursor-pointer"
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
                  <label
                    htmlFor="confirmPassword"
                    className="block text-white text-sm opacity-60"
                  >
                    Confirm Password <span className="text-[#ED5E20]">*</span>
                  </label>
                  <FormControl>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder=""
                      type="password"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-center space-x-2 mb-5">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={handleCheckboxChange}
                className="cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-white font-light">
                I accept the{" "}
                <Link
                  href="/auth/terms"
                  onClick={() => {
                    const values = form.getValues();
                    localStorage.setItem(
                      "registrationDraft",
                      JSON.stringify(values)
                    );
                    router.push("/terms");
                  }}
                  className="text-[#ff7f3f] hover:text-[#ED5E20] transition-colors duration-200 hover:underline font-medium"
                >
                  Terms and Conditions & Privacy Policy{" "}
                  <span className="text-[#ED5E20]"></span>
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !isValid || !termsAccepted}
              aria-disabled={isSubmitting || !isValid || !termsAccepted}
              className={`group relative inline-flex items-center justify-center
              w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
              transition-all duration-300
              text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
              hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
              active:scale-[.97] focus:outline-none
              focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
              ${(!isValid || !termsAccepted) ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"}`}
            >
              <span
                aria-hidden
                className={`absolute inset-0 rounded-xl ${(!isValid || !termsAccepted) ? "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600" : "bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"}`}
              />
              <span
                aria-hidden
                className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]"
              />
              <span
                aria-hidden
                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
              >
                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
              />
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin h-5 w-5" />}
                {isSubmitting ? "Signing Up..." : "Sign Up"}
              </span>
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
