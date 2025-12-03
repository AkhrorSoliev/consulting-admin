import { useState } from "react";
import FormInput from "../components/FormInput";
import useLogin from "../hooks/useLogin";

function Login() {
  const { loginUser, isPending, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (event) => {
    event.preventDefault();
    loginUser(email, password);
    setEmail("");
    setPassword("");
  };
  return (
    <section className="bg-base-100">
      <div className="min-h-screen grid  place-items-center bg-base-200">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full max-w-sm p-5 bg-base-100 rounded-lg shadow-md"
        >
          <h1 className="text-2xl font-bold text-center ">Anmeldung</h1>
          <FormInput
            placeholder="Username"
            name="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormInput
            placeholder="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!isPending && (
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          )}
          {isPending && (
            <button type="submit" className="btn btn-primary" disabled>
              Logging in...
            </button>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </section>
  );
}

export default Login;
