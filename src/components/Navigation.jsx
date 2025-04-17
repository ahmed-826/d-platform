"use client";

import { House, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import { useApp } from "@/contexts/AppContext";

const Navigation = () => {
  const { breadcrumbs, goBack } = useApp();

  return (
    <Breadcrumb className="px-6 py-2">
      <BreadcrumbList className="bg-gradient-to-r from-blue-50 to-gray-50 py-3 px-4 rounded-md shadow-sm">
        {breadcrumbs.map((item, index) => {
          const isLastItem = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem className="flex items-center">
                <BreadcrumbLink
                  asChild
                  className={`text-gray-700 hover:text-blue-800 font-semibold text-sm ${
                    isLastItem ? "cursor-default" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isLastItem) return;
                    goBack(index);
                  }}
                >
                  <Link href={item.href}>
                    {item.href === "/" ? (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center bg-blue-600 rounded-full p-1.5 mr-2">
                          <House className="h-3.5 w-3.5 text-white" />
                        </div>
                        {item.title}
                      </div>
                    ) : (
                      item.title
                    )}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {!isLastItem && (
                <BreadcrumbSeparator className="text-gray-400">
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Navigation;
