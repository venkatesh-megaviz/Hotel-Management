import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronLeft, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useAuth, ApiError } from "@/context/AuthContext";

type Mode = "signup" | "signin";

interface AccountData {
  fullName: string;
  email: string;
  password: string;
}

interface RestaurantData {
  restaurantName: string;
  businessType: string;
  city: string;
  phone: string;
  gstin: string;
}

const businessTypes = ["Restaurant", "Café", "Cloud Kitchen", "Bar & Lounge", "Bakery", "Food Truck", "Other"];

const steps = ["Create Account", "Restaurant Setup"];

export default function Login() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState(1);

  const [account, setAccount] = useState<AccountData>({ fullName: "", email: "", password: "" });
  const [restaurant, setRestaurant] = useState<RestaurantData>({
    restaurantName: "",
    businessType: "",
    city: "",
    phone: "",
    gstin: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinishSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        fullName: account.fullName,
        email: account.email,
        password: account.password,
        restaurantName: restaurant.restaurantName,
        businessType: restaurant.businessType,
        city: restaurant.city,
        phone: restaurant.phone,
        gstin: restaurant.gstin,
        plan: "Standard",
        billingCycle: "Monthly",
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (mode === "signin") {
    return <SignIn onSwitch={() => setMode("signup")} onSuccess={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Back to site
        </button>
        <span className="text-lg font-bold text-slate-900">HotelLite</span>
        <span className="text-sm text-slate-500">
          Already have an account?{" "}
          <button onClick={() => setMode("signin")} className="font-semibold text-brand-600 hover:underline">
            Sign in
          </button>
        </span>
      </header>

      <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-surface px-4 py-5 sm:gap-3">
        {steps.map((label, i) => {
          const idx = i + 1;
          const isDone = idx < step;
          const isActive = idx === step;
          return (
            <div key={label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isDone || isActive ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500",
                  )}
                >
                  {isDone ? <Check size={13} /> : idx}
                </span>
                <span
                  className={clsx(
                    "hidden text-sm sm:inline",
                    isActive ? "font-semibold text-brand-600" : isDone ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length && <span className="h-px w-6 bg-slate-200 sm:w-10" />}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center px-4 py-10 sm:py-14">
        {step === 1 && (
          <div className="w-full max-w-md">
            <div className="card p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              <p className="mt-1 text-sm text-slate-500">Start your free 14-day trial. No credit card needed.</p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
              >
                <Field
                  label="Full Name"
                  placeholder="Arjun Mehta"
                  value={account.fullName}
                  onChange={(v) => setAccount((a) => ({ ...a, fullName: v }))}
                />
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="arjun@spicegarden.com"
                  value={account.email}
                  onChange={(v) => setAccount((a) => ({ ...a, email: v }))}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={account.password}
                      onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-9 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Continue →
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              By continuing you agree to our{" "}
              <a href="#" className="text-brand-600 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-brand-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-md">
            <div className="card p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900">Set up your restaurant</h1>
              <p className="mt-1 text-sm text-slate-500">Tell us about your business so we can set things up for you.</p>

              {error && (
                <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleFinishSetup}>
                <Field
                  label="Restaurant Name"
                  placeholder="Spice Garden Restaurant"
                  value={restaurant.restaurantName}
                  onChange={(v) => setRestaurant((r) => ({ ...r, restaurantName: v }))}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Business Type</label>
                  <select
                    required
                    value={restaurant.businessType}
                    onChange={(e) => setRestaurant((r) => ({ ...r, businessType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="" disabled>
                      Select business type
                    </option>
                    {businessTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" placeholder="Mumbai" value={restaurant.city} onChange={(v) => setRestaurant((r) => ({ ...r, city: v }))} />
                  <Field
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    value={restaurant.phone}
                    onChange={(v) => setRestaurant((r) => ({ ...r, phone: v }))}
                  />
                </div>

                <Field
                  label={
                    <>
                      GSTIN <span className="font-normal text-slate-400">(Optional)</span>
                    </>
                  }
                  required={false}
                  placeholder="22AAAAA0000A1Z5"
                  value={restaurant.gstin}
                  onChange={(v) => setRestaurant((r) => ({ ...r, gstin: v }))}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Setting up your account…" : "Continue →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

function SignIn({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="text-lg font-bold text-slate-900">HotelLite</span>
          <p className="text-sm text-slate-500">Sign in to manage your restaurant</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                placeholder="arjun@spicegarden.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-9 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
                Remember me
              </label>
              <a href="#" className="font-medium text-brand-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <button onClick={onSwitch} className="font-semibold text-brand-600 hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
