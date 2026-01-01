import { useState } from "react";
import FormInput from "../components/FormInput";
import useLogin from "../hooks/useLogin";
import ReCAPTCHA from "react-google-recaptcha";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SeasonalBackground from "../components/SeasonalBackground";

function Login() {
  const { loginUser, isPending, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!captchaToken) {
      setEmailError("Bitte bestätigen Sie, dass Sie kein Roboter sind.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setEmailError("Bitte eine gültige E-Mail eingeben");
      return;
    }
    setEmailError("");
    loginUser(email, password);
    setEmail("");
    setPassword("");
    // Captcha reset is usually handled by the component or we can reset token
    setCaptchaToken(null);
  };
  return (
    <SeasonalBackground>
      <div className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 w-full max-w-md p-8 bg-base-100/95 backdrop-blur-sm rounded-xl shadow-2xl"
        >
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold mb-2">Anmeldung</h1>
            <p className="text-sm text-base-content/70">
              Melden Sie sich bei Ihrem Konto an
            </p>
          </div>

          <div className="space-y-1">
            <FormInput
              label="E-Mail"
              placeholder="E-Mail"
              name="email"
              type="email"
              inputClassName={emailError ? "input-error" : ""}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
            />
            {emailError && (
              <div className="flex items-center gap-2 text-error text-sm mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{emailError}</span>
              </div>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Passwort</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                className="input input-bordered w-full pr-10 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-base-content/70 hover:text-base-content transition-colors duration-200 z-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={
                import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                "6LdEVycsAAAAAJ11zB8ovl-uNIQPPI06t8Rhwow8"
              }
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          {!isPending && (
            <button
              type="submit"
              className="btn btn-primary hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              Anmelden
            </button>
          )}
          {isPending && (
            <button type="submit" className="btn btn-primary" disabled>
              <span className="loading loading-spinner loading-sm"></span>
              Anmeldung läuft...
            </button>
          )}
          {error && (
            <div className="alert alert-error animate-in fade-in slide-in-from-top-2 duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </SeasonalBackground>
  );
}

export default Login;
