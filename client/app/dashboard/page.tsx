"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import "@/app/dashboard/dashboard.css";
import { useEmail } from "@/context/UserContext";
import Carousel from "@/components/courasel";
import CookieConsent from "@/components/cookies";

export default function Dashboard() {
  const alphabet = [
    "Dashboard",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  const [scores, setScores] = useState<number[]>(Array(26).fill(0));
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [predictedWord, setPredictedWord] =
    useState<string>("NO HAND DETECTED");
  const [selectedAlphabet, setSelectedAlphabet] = useState<string>("A");
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<any>(null);
  const selectedAlphabetRef = useRef<string>(selectedAlphabet);
  const { emailContext, setEmailContext } = useEmail();
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsLargeScreen(window.innerWidth >= 1024);
    }

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER}/check-session`,
          { withCredentials: true }
        );
        if (response.data.isAuthenticated) {
          // console.log("Authenticated:", response.data);
          const { email } = response.data;
          setEmailContext(email);
        } else {
          // console.log("Not authenticated");
        }
      } catch (error) {
        console.error("Error checking session", error);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const loadModelAndSetupCamera = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
      } catch (error) {
        console.error("WebGL backend setup failed, falling back to CPU", error);
        await tf.setBackend("cpu");
        await tf.ready();
      }

      const handposeModel = await handpose.load();
      modelRef.current = handposeModel;
      if (videoRef.current) {
        setupCamera();
        videoRef.current.addEventListener("loadeddata", () => {
          processVideo();
        });
      }
    };

    loadModelAndSetupCamera();
  }, []);

  const setupCamera = () => {
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        videoRef.current!.srcObject = stream;
      });
    }
  };

  const processVideo = useCallback(async () => {
    if (!videoRef.current || !modelRef.current) return;

    if (
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      requestAnimationFrame(processVideo);
      return;
    }

    const predictions = await modelRef.current.estimateHands(videoRef.current);
    const context = canvasRef.current!.getContext("2d")!;
    canvasRef.current!.width = videoRef.current!.videoWidth;
    canvasRef.current!.height = videoRef.current!.videoHeight;

    context.clearRect(
      0,
      0,
      canvasRef.current!.width,
      canvasRef.current!.height
    );

    if (predictions.length > 0) {
      context.strokeStyle = "red";
      context.lineWidth = 2;

      const landmarks = predictions[0].landmarks;
      for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.stroke();
      }

      const frame = await captureFrame();
      await sendFrameToServer(frame);
    } else {
      setPredictedWord("NO HAND DETECTED");
      setMatchPercentage(null);
    }

    requestAnimationFrame(processVideo);
  }, []);

  const captureFrame = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current!.videoWidth;
    canvas.height = videoRef.current!.videoHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    return dataUrl.split(",")[1];
  };

  const sendFrameToServer = async (frame: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_FLASK}/predict`,
        {
          image: frame,
        }
      );
      if (response.data && response.data.prediction) {
        setPredictedWord(response.data.prediction);
        let word = response.data.prediction as string;
        const matchPercentage = calculateMatchPercentage(word);
        // console.log(`Selected Alphabet: ${selectedAlphabetRef.current}`);
        // console.log(`Predicted Word: ${word}`);
        // console.log(`Match Percentage: ${matchPercentage}`);
        setMatchPercentage(matchPercentage);
        if (matchPercentage === 100) {
          updateScoreAtIndex(word.charCodeAt(0) - "A".charCodeAt(0));
        }
      }
    } catch (error) {
      setPredictedWord("NO HAND DETECTED");
      setMatchPercentage(null);
      console.error("Error predicting sign language", error);
    }
  };

  const calculateMatchPercentage = (predicted: string) => {
    if (predicted === selectedAlphabetRef.current) {
      return 100;
    }
    return 0;
  };

  const updateScoreAtIndex = (index: number) => {
    setScores((prevScores) => {
      if (index >= 0 && index < prevScores.length && prevScores[index] < 100) {
        const newScores = [...prevScores];
        newScores[index] = 100;
        updateScoreInServer(newScores);
        return newScores;
      }
      return prevScores;
    });
  };

  const resetScoreAtIndex = (index: number) => {
    setScores((prevScores) => {
      if (index >= 0 && index < prevScores.length) {
        const newScores = [...prevScores];
        newScores[index] = 0;
        updateScoreInServer(newScores);
        return newScores;
      }
      return prevScores;
    });
  };

  const resetAllScores = () => {
    const newScores = Array(26).fill(0);
    setScores(newScores);
    updateScoreInServer(newScores);
  };

  const updateScoreInServer = async (updatedScores: number[]) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER}/updateAlphabetArray`,
        {
          email: emailContext,
          alphabetArray: updatedScores,
        }
      );
      if (response.data.code !== 0) {
        console.error("Error updating alphabet array", response.data.message);
      }
    } catch (error) {
      console.error("Error updating alphabet array", error);
    }
  };

  useEffect(() => {
    const fetchAlphabetArray = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER}/getAlphabetArray`,
          {
            params: { email: emailContext },
          }
        );
        if (response.data.code === 0) {
          setScores(response.data.alphabetArray);
          calculateTotalProgress(response.data.alphabetArray);
        }
      } catch (error) {
        console.error("Error fetching alphabet array", error);
      }
    };

    fetchAlphabetArray();
  }, [emailContext]);

  useEffect(() => {
    calculateTotalProgress(scores);
  }, [scores]);

  const calculateTotalProgress = (scoresArray: number[]) => {
    const total = scoresArray.reduce((sum, score) => sum + score, 0);
    const percentage = (total / (scoresArray.length * 100)) * 100;
    setTotalProgress(percentage);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[300px] bg-white shadow-lg p-6 lg:h-screen lg:overflow-y-auto">
        <div
          className="cursor-pointer rounded-lg hover:bg-gray-50 transition-colors lg:cursor-default"
          onClick={() => setIsProgressExpanded(!isProgressExpanded)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <button className="text-gray-500 hover:text-gray-700 lg:hidden">
              {isProgressExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {totalProgress.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Detailed Progress - Collapsible on mobile, always shown on desktop */}
        <div
          className={`space-y-4 transition-all duration-300 ${
            isProgressExpanded || isLargeScreen
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          {alphabet.slice(1).map((letter, index) => (
            <div key={letter} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{letter}</span>
                <span className="text-sm text-gray-600">
                  {scores[index]}/100
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${scores[index]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:h-screen lg:overflow-y-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video Container */}
            <div className="flex-1 relative h-[400px] lg:h-[600px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full rounded-xl object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full rounded-xl"
              />
            </div>

            {/* Controls */}
            <div className="w-full lg:w-[300px] bg-gray-50 rounded-xl p-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Alphabet:
                  </label>
                  <select
                    value={selectedAlphabet}
                    onChange={(e) => {
                      setSelectedAlphabet(e.target.value);
                      selectedAlphabetRef.current = e.target.value;
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {alphabet.slice(1).map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Predicted Word:
                  </h3>
                  <p
                    className={`text-lg font-semibold ${
                      predictedWord === "NO HAND DETECTED"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {predictedWord}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Reset Score:
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {alphabet.slice(1).map((letter, index) => (
                      <button
                        key={letter}
                        onClick={() => resetScoreAtIndex(index)}
                        className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={resetAllScores}
                    className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Section */}
          <div className="mt-6">
            <Carousel />
          </div>
        </div>
      </div>
    </div>
  );
}
