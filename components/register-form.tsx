"use client";

import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "react-datepicker/dist/react-datepicker.css";

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
import ReCAPTCHA from "react-google-recaptcha";
import type { User } from "@supabase/supabase-js";

type RegistrationFormProps = {
  user: User | null;
};

export default function RegistrationForm({ user }: RegistrationFormProps) {
  const router = useRouter();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const captchaRef = useRef<ReCAPTCHA | null>(null);

  const handleCheckboxChange = (checked: boolean) => {
    setTermsAccepted(checked);
    localStorage.setItem("termsAccepted", String(checked));
  };

  useEffect(() => {
    if (!siteKey) console.warn("Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  }, [siteKey]);

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
    if (isSubmitting) return; // prevent double click
    if (!termsAccepted) {
      toast.error("You must accept the Terms and Conditions.");
      return;
    }

    if (!captchaToken) {
      toast.error("Complete CAPTCHA");
      return;
    }

    let verifyJson: { success: boolean } = { success: false };
    try {
      const verifyResp = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
      });
      verifyJson = await verifyResp.json();
    } catch {
      toast.error("CAPTCHA verification network error.");
      captchaRef.current?.reset();
      setCaptchaToken(null);
      return;
    }

    if (!verifyJson.success) {
      toast.error("CAPTCHA failed.");
      captchaRef.current?.reset();
      setCaptchaToken(null);
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
            toast.error(
              detailsError.message || "Failed to create profile details."
            );
          }
          return;
        }

        if (profileDetails && profileDetails.id) {
          await supabase.from("profile_contacts").insert({
            profile_details_id: profileDetails.id,
            email: "",
            website: "",
            open_to: "",
            extra_fields: "[]",
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
      captchaRef.current?.reset();
      setCaptchaToken(null);
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
  }, [form]);

  return (
    <div style={whiteCursor} className="relative h-screen flex items-start justify-center w-full overflow-hidden px-5 pb-0 md:px-6">
      <BackgroundVideo
        src="/images/uxhibit-gif-3(webm).webm"
        type="video/webm"
        overlay={true}
        disabled={true}
      />

      <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 transform scale-90 origin-center -translate-y-2 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg xl:max-w-2xl p-6 sm:p-8 md:p-10 lg:p-12 bg-[#1E1E1E]/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
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
          Create your account and start evaluating with UXhibit
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
                  render={({ field }) => {
                    // Helpers: display as MM/DD/YYYY, store as yyyy-MM-dd
                    const toDisplay = (val: string | null) => {
                      if (!val) return "";
                      // val is ISO yyyy-MM-dd
                      const [y, m, d] = val.split("-");
                      if (!y || !m || !d) return "";
                      return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y}`;
                    };

                    const toISO = (mmddyyyy: string) => {
                      const digits = mmddyyyy.replace(/[^\d]/g, "");
                      if (digits.length !== 8) return "";
                      const mm = digits.slice(0, 2);
                      const dd = digits.slice(2, 4);
                      const yyyy = digits.slice(4, 8);
                      // Basic range checks
                      const mNum = Number(mm);
                      const dNum = Number(dd);
                      const yNum = Number(yyyy);
                      if (yNum < 1900 || yNum > new Date().getFullYear())
                        return "";
                      if (mNum < 1 || mNum > 12) return "";
                      // construct date and validate
                      const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
                      if (Number.isNaN(dt.getTime())) return "";
                      // Prevent future dates
                      const today = new Date();
                      if (dt > today) return "";
                      return `${yyyy}-${mm}-${dd}`;
                    };

                    const formatTyping = (raw: string) => {
                      // Keep only digits and build MM/DD/YYYY progressively
                      const digits = raw.replace(/[^\d]/g, "").slice(0, 8);
                      if (digits.length <= 2) return digits;
                      if (digits.length <= 4)
                        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
                      return `${digits.slice(0, 2)}/${digits.slice(
                        2,
                        4
                      )}/${digits.slice(4)}`;
                    };

                    // New: readable helper for default month
                    const yearsAgo = (n: number) => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() - n, d.getMonth(), 1); // snap to month start for consistency
                      return d;
                    };

                    const [localDisplay, setLocalDisplay] = useState(
                      toDisplay(field.value || "")
                    );

                    useEffect(() => {
                      setLocalDisplay(toDisplay(field.value || ""));
                    }, [field.value]);

                    const handleChange = (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => {
                      const next = formatTyping(e.target.value);
                      setLocalDisplay(next);
                      const iso = toISO(next);
                      // Only update form value when we have a valid ISO date or the field is being cleared
                      if (iso || next === "") {
                        field.onChange(iso);
                      }
                    };

                    const handleBlur = () => {
                      // On blur, try to coerce to ISO; if invalid, clear
                      const iso = toISO(localDisplay);
                      field.onChange(iso || "");
                      setLocalDisplay(toDisplay(iso || ""));
                    };

                    return (
                      <FormItem className="h-full">
                        <label
                          htmlFor="birthday"
                          className="block text-white text-sm opacity-60"
                        >
                          Birthday <span className="text-[#ED5E20]">*</span>
                        </label>
                        <FormControl>
                          <div className="flex gap-2 items-center">
                            <Input
                              id="birthday"
                              inputMode="numeric"
                              placeholder="MM/DD/YYYY"
                              className="w-full h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                              value={localDisplay}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              autoComplete="bday"
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="h-12 px-3 border text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                                  aria-label="Open calendar"
                                >
                                  <CalendarIcon className="h-5 w-5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    const iso = date
                                      ? format(date, "yyyy-MM-dd")
                                      : "";
                                    field.onChange(iso);
                                    setLocalDisplay(toDisplay(iso));
                                  }}
                                  captionLayout="dropdown"
                                  hidden={{
                                    before: new Date(1900, 0, 1),
                                    after: new Date(
                                      new Date().getFullYear(),
                                      11,
                                      31
                                    ),
                                  }}
                                  disabled={[
                                    {
                                      from: new Date(),
                                      to: new Date(2100, 0, 1),
                                    },
                                  ]}
                                  defaultMonth={
                                    field.value
                                      ? new Date(field.value)
                                      : yearsAgo(18)
                                  }
                                  autoFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Gender Field */}
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);
                    const [query, setQuery] = useState("");

                    const options = [
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non-binary", label: "Non-binary" },
                      {
                        value: "prefer-not-to-say",
                        label: "Prefer not to say",
                      },
                    ];

                    const currentLabel =
                      options.find((o) => o.value === field.value)?.label ||
                      field.value ||
                      "";

                    // Derive filtered options based on the query
                    const filtered = query
                      ? options.filter((o) =>
                          o.label.toLowerCase().includes(query.toLowerCase())
                        )
                      : options;

                    const commitValue = (val: string) => {
                      field.onChange(val);
                      setOpen(false);
                      setQuery("");
                    };

                    return (
                      <FormItem className="h-full">
                        <label
                          htmlFor="gender"
                          className="block text-white text-sm opacity-60"
                        >
                          Gender <span className="text-[#ED5E20]">*</span>
                        </label>
                        <FormControl>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="gender"
                                variant="outline"
                                type="button"
                                className="w-full h-12 justify-between text-left border text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A] rounded-lg px-3 shadow-sm"
                              >
                                {currentLabel ? (
                                  <span className="truncate">
                                    {currentLabel}
                                  </span>
                                ) : (
                                  <span className="text-gray-600 dark:text-gray-400 opacity-60">
                                    Select or type your gender
                                  </span>
                                )}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="ml-2 opacity-70"
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[var(--radix-popover-trigger-width)] p-2"
                              align="start"
                            >
                              {/* Search/Free text input */}
                              <Input
                                autoFocus
                                placeholder="Type or pick an option"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const text = query.trim();
                                    if (text.length > 0) commitValue(text);
                                  }
                                }}
                                className="h-10 mb-2 text-sm border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A]"
                              />

                              {/* Suggested options */}
                              <div className="max-h-44 overflow-y-auto rounded-md border border-white/10">
                                {filtered.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = query.trim();
                                      if (text.length > 0) commitValue(text);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                                  >
                                    Use “{query}”
                                  </button>
                                ) : (
                                  filtered.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => commitValue(opt.value)}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${
                                        field.value === opt.value
                                          ? "bg-white/10"
                                          : ""
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))
                                )}
                              </div>

                              {/* Clear selection */}
                              {field.value && (
                                <div className="mt-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-9 px-2 text-xs"
                                    onClick={() => commitValue("")}
                                  >
                                    Clear selection
                                  </Button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const value = field.value || "";
                const [isFocused, setIsFocused] = useState(false);
                const rules = [
                  { ok: value.length >= 6, label: "6+ chars" },
                  { ok: /[A-Z]/.test(value), label: "Uppercase" },
                  { ok: /[a-z]/.test(value), label: "Lowercase" },
                  { ok: /\d/.test(value), label: "Number" },
                  { ok: /[^A-Za-z0-9]/.test(value), label: "Symbol" },
                  { ok: !/\s/.test(value), label: "No spaces" },
                ];
                const passed = rules.filter((r) => r.ok).length;
                const allPassed = passed === rules.length;

                const showRequirements =
                  (isFocused || value.length > 0) && !allPassed;

                return (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="password"
                        className="block text-white text-sm opacity-60"
                      >
                        Password <span className="text-[#ED5E20]">*</span>
                      </label>
                      {/* {allPassed && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-green-600/20 text-green-200 border border-green-600/40">
                          Strong
                        </span>
                      )} */}
                    </div>
                    <FormControl>
                      <div>
                        <PasswordInput
                          id="password"
                          placeholder=""
                          type="password"
                          className="w-full h-11 sm:h-12 text-sm sm:text-base border-white/20 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#1A1A1A] cursor-pointer"
                          {...field}
                          onFocus={(e) => {
                            setIsFocused(true);
                            field.onFocus?.(e);
                          }}
                          onBlur={(e) => {
                            setIsFocused(false);
                            field.onBlur?.(e);
                          }}
                        />

                        {showRequirements && (
                          <div className="mt-2 text-xs">
                            <div
                              className={`font-medium ${
                                allPassed
                                  ? "text-green-400"
                                  : passed >= 4
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {/* Strength: {strength} */}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {rules.map((r) => (
                                <span
                                  key={r.label}
                                  className={`px-2 py-1 rounded border text-[11px] ${
                                    r.ok
                                      ? "bg-green-600/20 border-green-600/40 text-green-200"
                                      : "bg-red-600/15 border-red-600/40 text-red-200"
                                  }`}
                                >
                                  {r.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {/* <FormMessage /> */}
                  </FormItem>
                );
              }}
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

            <div className="mt-2 w-full flex justify-center cursor-pointer">
              {siteKey ? (
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={siteKey}
                  theme="dark"
                  onChange={(t) => setCaptchaToken(t)}
                  onExpired={() => setCaptchaToken(null)}
                />
              ) : (
                <p className="text-xs text-red-400">CAPTCHA misconfigured.</p>
              )}
            </div>

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
                  Terms and Conditions
                  <span className="text-[#ED5E20]"></span>
                </Link>
                <span className="mx-1">&</span>
                <Link
                  href="/auth/privacy-policy"
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
                  Privacy Policy <span className="text-[#ED5E20]"></span>
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting || !isValid || !termsAccepted || !captchaToken
              }
              aria-disabled={isSubmitting || !isValid || !termsAccepted}
              // inline cursor fallback (guaranteed)
              style={{
                cursor:
                  isSubmitting || !isValid || !termsAccepted
                    ? "not-allowed"
                    : undefined,
              }}
              className={`group relative inline-flex items-center justify-center
                w-full h-11 sm:h-12 rounded-xl text-base tracking-wide
                transition-all duration-300
                text-white shadow-[0_4px_18px_-4px_rgba(237,94,32,0.55)]
                hover:shadow-[0_6px_26px_-6px_rgba(237,94,32,0.65)]
                active:scale-[.97] focus:outline-none
                focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                ${
                  !isValid || !termsAccepted ? "opacity-60" : "cursor-pointer"
                }`}
            >
              <span
                aria-hidden
                // add pointer-events-none when disabled so overlay doesn't intercept cursor
                className={`absolute inset-0 rounded-xl ${
                  !isValid || !termsAccepted
                    ? "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600"
                    : "bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                } ${!isValid || !termsAccepted ? "pointer-events-none" : ""}`}
              />
              <span
                aria-hidden
                className={`absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px] ${
                  !isValid || !termsAccepted ? "pointer-events-none" : ""
                }`}
              />
              <span
                aria-hidden
                className={`absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl ${
                  !isValid || !termsAccepted ? "pointer-events-none" : ""
                }`}
              >
                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
              </span>
              <span
                aria-hidden
                className={`absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50 ${
                  !isValid || !termsAccepted ? "pointer-events-none" : ""
                }`}
              />
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin h-5 w-5" />}
                {isSubmitting ? "Signing Up..." : "Sign Up"}
              </span>
            </button>
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
