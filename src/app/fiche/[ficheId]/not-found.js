import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 font-sans text-center">
      <h1 className="text-9xl font-bold text-slate-800">404</h1>

      <p className="text-2xl mt-4 text-slate-700">Page Not Found</p>

      <p className="text-lg text-slate-500 mt-2">
        The page you are looking for does not exist.
      </p>

      <Link
        href="/"
        className="mt-6 px-6 py-2 bg-slate-800 text-slate-50 rounded-lg text-lg transition-colors duration-200 hover:bg-slate-700"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
