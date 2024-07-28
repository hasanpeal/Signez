"use client";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  return (
    <header className="bg-white shadow-md">
      <div className=" py-4 px-6 flex">
        <Link href="/" className="text-xl font-bold text-gray-800 flex-grow">
          Signez
        </Link>
        <nav className="space-x-4 buttonss">
          <Link href="/aboutus" className="text-gray-800 font-semibold">
            {" "}
            About Us
          </Link>
          <button
            onClick={() => {
              const modal = document.getElementById(
                "contact_modal"
              ) as HTMLDialogElement;
              if (modal) {
                modal.showModal();
              }
            }}
            className="text-gray-800 font-semibold"
          >
            Contact Us
          </button>
          <Link href="/signin">
            <button className="text-gray-800 font-semibold sButton">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="text-gray-800 font-semibold">Sign Up</button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
