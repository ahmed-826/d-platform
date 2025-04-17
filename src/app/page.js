"use client";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";

const page = () => {
  const { addToBreadcrumbs } = useApp();
  return (
    <div>
      Home page
      <br />
      <Link
        href="/upload"
        onClick={() => {
          addToBreadcrumbs({
            title: "Téléversements",
            href: "/upload",
          });
        }}
        className="text-blue-500 hover:text-blue-700 font-semibold"
      >
        Upload
      </Link>
    </div>
  );
};

export default page;
