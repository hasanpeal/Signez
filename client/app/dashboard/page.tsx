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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_FLASK}/predict`, {
        image: frame,
      });
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
    <div className="flex h-screen bg-gray-100">
      <div
        className="relative itemLeft text-black px-6 py-4 overflow-y-auto bg-white shadow-lg"
        style={{ width: "250px" }}
      >
        <div className="leftDiv">
          {alphabet.map((item, index) => {
            if (item === "Dashboard") {
              return (
                <div className="eachItem" key={index}>
                  <h2 className="font-bold text-lg mb-2">{item}</h2>
                  <div className="text-sm mb-2">
                    {totalProgress.toFixed(2)}%
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={totalProgress}
                    max="100"
                  ></progress>
                </div>
              );
            }
            return (
              <div className="eachItem" key={index}>
                <h3 className="font-semibold">{item}</h3>
                <div className="text-sm mb-2">{scores[index - 1]}/100</div>
                <progress
                  className="progress progress-primary w-full"
                  value={scores[index - 1]}
                  max="100"
                ></progress>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-grow itemRight text-black p-3 flex flex-col bg-white shadow-lg">
        <div className="flex mb-2">
          <div style={{ position: "relative", flex: 1 }}>
            <video
              ref={videoRef}
              style={{ width: "100%", borderRadius: "12px" }}
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                borderRadius: "12px",
              }}
            />
          </div>
          <div className="predictedWordContainer flex-1 ml-4 p-4 bg-gray-100 rounded-lg shadow-inner">
            <h3 className="font-bold text-xl mb-2">Predicted Word:</h3>
            <p
              className={`text-lg ${
                predictedWord === "NO HAND DETECTED"
                  ? "text-red-600"
                  : "text-black"
              }`}
            >
              {predictedWord}
            </p>
            {matchPercentage !== null && (
              <p className="text-sm text-black">
                Match Percentage: {matchPercentage}%
              </p>
            )}
            <div className="flex flex-row items-center mb-4">
              <label className="font-bold text-xl mr-2">Select Alphabet:</label>
              <select
                value={selectedAlphabet}
                onChange={(e) => {
                  setSelectedAlphabet(e.target.value);
                  selectedAlphabetRef.current = e.target.value;
                  console.log(`Alphabet changed to: ${e.target.value}`);
                }}
                className="p-2 border rounded-lg"
              >
                {alphabet.slice(1).map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
            <h3 className="font-bold text-lg mb-2">Reset Score:</h3>
            <div className="flex flex-wrap justify-center">
              {alphabet.slice(1).map((letter, index) => (
                <button
                  key={letter}
                  onClick={() => resetScoreAtIndex(index)}
                  className="btn btn-active btn-square btn-neutral"
                >
                  {letter}
                </button>
              ))}
              <button
                onClick={resetAllScores}
                className="m-1 p-2 bg-red-700 text-white rounded"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        <div className="imageSection flex-1 ">
          <Carousel />
        </div>
      </div>
      <CookieConsent/>
    </div>
  );
}
