"use client";
import Link from "next/link";

const HomePage = () => {
  return (
    <main className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Bienvenue sur l’accueil
        </h1>
        <p className="text-gray-600 text-lg">
          Accédez à la page de téléversement pour ajouter vos fichiers.
        </p>
        <Link
          href="/upload"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Aller à Téléversements
        </Link>
      </section>
    </main>
  );
};

export default HomePage;
