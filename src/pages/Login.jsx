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
      <div className="min-h-screen flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full max-w-sm p-5 bg-base-100 rounded-lg shadow-md"
        >
          <h1 className="text-2xl font-bold text-center ">Anmeldung</h1>
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
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Passwort</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Passwort"
                className="input input-bordered w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-base-content/70 hover:text-base-content z-10"
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
            <button type="submit" className="btn btn-primary">
              Anmelden
            </button>
          )}
          {isPending && (
            <button type="submit" className="btn btn-primary" disabled>
              Anmeldung läuft...
            </button>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </SeasonalBackground>
  );
}

export default Login;
