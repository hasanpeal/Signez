"use client";
import Link from "next/link";
import "@/app/home.css";
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 homeMain">
      {/* Navbar */}
      <Navbar/>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <h1 className="text-5xl font-bold mb-4">Welcome to Signez</h1>
        <p className="text-xl mb-8">
          Practice and master sign language with real-time ML model predictions
        </p>
        <div className="flex space-x-4">
          <Link href="/signin">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-md transition-transform transform hover:scale-105">
              Get Started
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-gray-800 text-white px-6 py-3 rounded-md shadow-md transition-transform transform hover:scale-105">
              Sign Up
            </button>
          </Link>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-800 mt-4">
                  Step 1
                </h3>
                <p className="text-gray-600 mt-2">
                  Sign up and set up your profile. Fill in your details to
                  create a personalized learning experience
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-800 mt-4">
                  Step 2
                </h3>
                <p className="text-gray-600 mt-2">
                  Practice sign language with our ML model. Get real-time
                  feedback on your gestures and improve your skills
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-800 mt-4">
                  Step 3
                </h3>
                <p className="text-gray-600 mt-2">
                  Track your progress and improve. Monitor your learning journey
                  with detailed analytics and insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Features
          </h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Real-Time Recognition
              </h3>
              <p className="text-gray-600">
                Our advanced ML model provides real-time hand gesture
                recognition, making your learning experience seamless and
                effective
              </p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Interactive Practice
              </h3>
              <p className="text-gray-600">
                Practice various sign language gestures interactively with
                instant feedback to ensure you are getting it right
              </p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Progress Tracking
              </h3>
              <p className="text-gray-600">
                Track your learning progress over time with detailed analytics
                and insights to keep you motivated and improving
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Testimonials
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <p className="text-gray-600">
                Signez has transformed the way I learn sign language. The
                real-time recognition is spot on!
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mt-4">
                - Avishek Sharma
              </h3>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <p className="text-gray-600">
                I love the interactive practice sessions. They make learning so
                much fun! I can reset my practice activity anytime and start
                again
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mt-4">
                - Jaden Ray
              </h3>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <p className="text-gray-600">
                Tracking my progress has never been easier. I can see how much I
                have improved over time. Real time gesture detection
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mt-4">
                - Emily Chen
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-10">Ready to Start Learning?</h2>
          <p className="text-xl mb-8">
            Join Signez today and become proficient in sign language with our
            interactive and engaging platform
          </p>
          <div className="space-x-4">
            <Link href="/signup">
              <button className="bg-white text-green-600 px-6 py-3 rounded-md shadow-md transition-transform transform hover:scale-105">
                Get Started
              </button>
            </Link>
            <Link href="/signin">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-md shadow-md transition-transform transform hover:scale-105">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
}
