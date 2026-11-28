import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../components/LanguageToggle";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoogleSignIn = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/oauth/google`;
  };

  const handleGithubSignIn = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/oauth/github`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const regRes = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (!regRes?.success) {
        setErrorMsg(regRes?.message || t("auth.registerFailed"));
        return;
      }

      // Auto-login immediately after successful registration
      const loginRes = await login({
        email: formData.email,
        password: formData.password,
      });

      if (loginRes?.success) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
      
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative z-10 w-full lg:w-1/2 overflow-y-auto">
        <div className="absolute top-8 left-8 sm:left-12 flex items-center gap-4 z-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
          </Link>
        </div>
        
        <div className="absolute top-8 right-8 sm:right-12 z-20">
          <LanguageToggle />
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-[400px] mt-12 sm:mt-0">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {t("auth.registerTitle")}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors">
                {t("auth.signIn")}
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t("auth.username")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      className="appearance-none block w-full px-4 py-3 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t("auth.email")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="appearance-none block w-full px-4 py-3 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t("auth.password")}
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      className="appearance-none block w-full px-4 py-3 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white transition-all duration-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-9 0-1.056.187-2.07.53-3M6.228 6.228A8.955 8.955 0 0112 3c5 0 9 2.943 9 7 0 1.056-.187 2.07-.53 3M6.228 6.228L3 3m3.228 3.228l11.544 11.544M9.88 9.88a3 3 0 104.24 4.24" /></svg>
                      ) : (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7C20.268 16.057 16.477 19 12 19c-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      className="appearance-none block w-full px-4 py-3 border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white transition-all duration-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showConfirmPassword ? (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-9 0-1.056.187-2.07.53-3M6.228 6.228A8.955 8.955 0 0112 3c5 0 9 2.943 9 7 0 1.056-.187 2.07-.53 3M6.228 6.228L3 3m3.228 3.228l11.544 11.544M9.88 9.88a3 3 0 104.24 4.24" /></svg>
                      ) : (
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7C20.268 16.057 16.477 19 12 19c-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {loading ? "Creating account..." : t("auth.signUp")}
                  </button>
                </div>
              </form>

              {/* Social Login Buttons */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white dark:bg-[#0a0a0a] text-zinc-500 font-medium">
                      Or register with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGithubSignIn}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-zinc-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    <span>GitHub</span>
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-zinc-500">
                By clicking "Sign Up", you agree to our <a href="#" className="underline hover:text-zinc-800 dark:hover:text-white">Terms of Service</a> and <a href="#" className="underline hover:text-zinc-800 dark:hover:text-white">Privacy Policy</a>.
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Image Cover */}
      <div className="hidden lg:block relative w-0 flex-1 bg-zinc-900">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80"
          alt="Data Analysis"
        />
        <div className="absolute inset-0 bg-violet-900/60 dark:bg-zinc-900/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-16 xl:p-24 w-full">
           <blockquote className="max-w-2xl">
              <p className="text-3xl font-medium text-white leading-snug mb-6">
                "Getting started with TaskFlow took exactly three minutes. By the end of the day, my entire organization was onboarded."
              </p>
              <footer className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-800 flex items-center justify-center text-white font-bold text-xl">
                    J
                 </div>
                 <div>
                   <div className="text-white font-semibold text-lg">James Chen</div>
                   <div className="text-white/70">Operations Director</div>
                 </div>
              </footer>
           </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Register;
