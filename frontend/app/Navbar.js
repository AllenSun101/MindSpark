'use client'

import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: session } = useSession()

  const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
  };

  const path = usePathname();

  return (
    <div className="bg-blue-500">
      <nav className="relative px-4 py-4 flex justify-between items-center bg-white">
        <a className="text-3xl font-bold leading-none" href="/">
          <Image
            src="/Logo.png"
            width={200}
            height={50}
            alt="MindSpark Logo"
          />
        </a>
        <div className="lg:hidden">
          <button
            className="navbar-burger flex items-center text-blue-600 p-3"
            onClick={toggleMenu}
          >
            <svg
              className="block h-4 w-4 fill-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Mobile menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
            </svg>
          </button>
        </div>
        <ul className="hidden absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 lg:flex lg:mx-auto lg:flex lg:items-center lg:w-auto lg:space-x-6">
          <li>
            <a className={path == "/MyCourses" ? "text-sm font-semibold text-blue-600" : "text-sm text-gray-700"} href="/MyCourses">
              My Courses
            </a>
          </li>
          <li className="text-gray-500">
            <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            className="w-4 h-4 current-fill"
            viewBox="0 0 24 24"
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v0m0 7v0m0 7v0m0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </li>
          <li>
            <a className={path == "/BuildCourse" ? "text-sm font-semibold text-blue-600" : "text-sm text-gray-700"} href="/BuildCourse">
              Build Course
            </a>
          </li>
          <li className="text-gray-500">
              <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4 current-fill"
              viewBox="0 0 24 24"
              >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v0m0 7v0m0 7v0m0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
              </svg>
          </li>
          <li>
            <a className={path == "/Profile" ? "text-sm font-semibold text-blue-600" : "text-sm text-gray-700"} href="/Profile">
              Profile
            </a>
          </li>
          <li className="text-gray-500">
              <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              className="w-4 h-4 current-fill"
              viewBox="0 0 24 24"
              >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v0m0 7v0m0 7v0m0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
              </svg>
          </li>
          <li>
              <a className={path == "/Pricing" ? "text-sm font-semibold text-blue-600" : "text-sm text-gray-700"} href="/Pricing">
              Pricing
              </a>
          </li>
        </ul>
        {
          session == undefined ? 
            <button className="hidden lg:inline-block lg:ml-auto lg:mr-3 py-2 px-6 bg-gray-200 hover:bg-gray-100 text-sm text-gray-900 font-bold rounded-xl transition duration-200" 
              onClick={() => signIn("google")}>
                Sign In
            </button>
          :
          <button className="hidden lg:inline-block lg:ml-auto lg:mr-3 py-2 px-6 bg-gray-200 hover:bg-gray-100 text-sm text-gray-900 font-bold rounded-xl transition duration-200" 
            onClick={() => signOut("google")}>
              Sign Out
          </button>
        }
      </nav>
      {isMenuOpen && (
        <div className="navbar-menu relative z-50">
          <div className="navbar-backdrop fixed inset-0 bg-gray-800 opacity-25"></div>
          <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-5/6 max-w-sm py-6 px-6 bg-white border-r overflow-y-auto">
            <div className="flex items-center mb-8">
              <a className="mr-auto text-3xl font-bold leading-none" href="/">
                <Image
                  src="/Logo.png"
                  width={200}
                  height={50}
                  alt="MindSpark Logo"
                />
              </a>
              <button
                className="navbar-close"
                onClick={toggleMenu}
              >
                <svg
                  className="h-6 w-6 text-gray-400"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.225 4.811a1 1 0 011.415 0L12 9.172l4.36-4.36a1 1 0 011.415 1.415l-4.36 4.36 4.36 4.36a1 1 0 01-1.415 1.415l-4.36-4.36-4.36 4.36a1 1 0 01-1.415-1.415l4.36-4.36-4.36-4.36a1 1 0 010-1.415z"
                  />
                </svg>
              </button>
            </div>
            <ul>
              <li>
                <a 
                  className= {path == "/MyCourses" ? "block px-4 py-2 hover:bg-gray-50 font-semibold text-blue-600" : "block px-4 py-2 hover:bg-gray-50 text-gray-700"}
                  href="/MyCourses"
                >
                  My Courses
                </a>
              </li>
              <li>
                <a
                  className={path == "/BuildCourse" ? "block px-4 py-2 hover:bg-gray-50 font-semibold text-blue-600" : "block px-4 py-2 hover:bg-gray-50 text-gray-700"}
                  href="/BuildCourse"
                >
                  Build Course
                </a>
              </li>
              <li>
                <a
                  className={path == "/Profile" ? "block px-4 py-2 hover:bg-gray-50 font-semibold text-blue-600" : "block px-4 py-2 hover:bg-gray-50 text-gray-700"}
                  href="/Profile"
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  className={path == "/Pricing" ? "block px-4 py-2 hover:bg-gray-50 font-semibold text-blue-600" : "block px-4 py-2 hover:bg-gray-50 text-gray-700"}
                  href="/Pricing"
                >
                  Pricing
                </a>
              </li>
            </ul>
            {
              session == undefined ? 
                <button className="inline-block mr-auto ml-3 py-2 px-6 bg-gray-200 hover:bg-gray-100 text-sm text-gray-900 font-bold rounded-xl transition duration-200" 
                  onClick={() => signIn("google")}>
                    Sign In
                </button>
              :
              <button className="inline-block mr-auto ml-3 py-2 px-6 bg-gray-200 hover:bg-gray-100 text-sm text-gray-900 font-bold rounded-xl transition duration-200" 
                onClick={() => signOut("google")}>
                  Sign Out
              </button>
            }
          </nav>
        </div>
      )}
    </div>
  );
};
