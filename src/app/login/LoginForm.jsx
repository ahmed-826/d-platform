"use client";

export function LoginForm() {
  const handleLogin = () => {};

  return (
    <form className="flex max-w-[300px] flex-col gap-2">
      <div className="flex flex-col gap-2">
        <input id="username" name="username" placeholder="username" />
      </div>
      {state?.errors?.username && (
        <p className="text-red-500">{state.errors.username}</p>
      )}

      <div className="flex flex-col gap-2">
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
        />
      </div>
      {state?.errors?.password && (
        <p className="text-red-500">{state.errors.password}</p>
      )}
      <button onClick={handleLogin} type="submit">
        Login
      </button>
    </form>
  );
}
