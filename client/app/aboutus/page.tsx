"use client"
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import "@/app/aboutus/about.css";
export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-100 mainStart">
      {/* Navbar */}
      <header className="bg-white shadow-md">
        <div className=" py-4 px-6 flex">
          <Link href="/" className="text-xl font-bold text-gray-800 flex-grow">
            Signez
          </Link>
          <nav className="space-x-4 buttonss">
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

      {/* About Us Section */}
      <section className="py-20 bg-white-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            About Us
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Signez is an innovative platform designed to help you master sign
            language with the help of real-time machine learning predictions.
            Our app provides an interactive and engaging way to learn and
            practice sign language, ensuring you can communicate effectively and
            confidently.
          </p>
          <h3 className="text-3xl font-semibold text-gray-800 mb-6">
            Our Mission
          </h3>
          <p className="text-gray-600 text-lg mb-8">
            Our mission is to make sign language accessible and easy to learn
            for everyone. By leveraging advanced machine learning technologies,
            we aim to provide users with accurate and real-time feedback on
            their sign language gestures, making the learning process efficient
            and enjoyable.
          </p>
          <h3 className="text-3xl font-semibold text-gray-800 mb-6">
            How It Works
          </h3>
          <ul className="list-disc list-inside text-gray-600 text-lg mb-8">
            <li>Sign up and create a profile to get started.</li>
            <li>
              Access a variety of interactive practice sessions tailored to
              different skill levels.
            </li>
            <li>
              Receive real-time feedback on your gestures using our advanced ML
              model.
            </li>
            <li>Track your progress with detailed analytics and insights.</li>
            <li>Improve your skills with regular practice and guidance.</li>
          </ul>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                What is Signez?
              </h4>
              <p className="text-gray-600 text-lg">
                Signez is a platform designed to help users learn and practice
                sign language using real-time machine learning predictions.
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                How does the real-time feedback work?
              </h4>
              <p className="text-gray-600 text-lg">
                Our advanced ML model analyzes your hand gestures in real-time
                and provides instant feedback, helping you improve your sign
                language skills quickly and effectively.
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                Can I track my progress?
              </h4>
              <p className="text-gray-600 text-lg">
                Yes, Signez provides detailed analytics and insights that allow
                you to track your learning progress over time.
              </p>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                Is Signez suitable for beginners?
              </h4>
              <p className="text-gray-600 text-lg">
                Absolutely! Signez offers practice sessions tailored to
                different skill levels, making it perfect for beginners and
                advanced learners alike.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed App Functions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            App Functions
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Real-Time Gesture Recognition
              </h3>
              <p className="text-gray-600 text-lg">
                Signez uses an advanced machine learning model to recognize hand
                gestures in real-time, providing you with immediate feedback to
                help you improve your sign language skills.
              </p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Interactive Practice Sessions
              </h3>
              <p className="text-gray-600 text-lg">
                Engage in interactive practice sessions that guide you through
                various sign language gestures, ensuring you get the practice
                you need to master each gesture.
              </p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Progress Tracking and Analytics
              </h3>
              <p className="text-gray-600 text-lg">
                Monitor your progress with detailed analytics and insights.
                Track your learning journey and see how much you have improved
                over time.
              </p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Personalized Learning Experience
              </h3>
              <p className="text-gray-600 text-lg">
                Customize your learning experience based on your skill level and
                goals. Signez offers tailored practice sessions to meet your
                individual needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
