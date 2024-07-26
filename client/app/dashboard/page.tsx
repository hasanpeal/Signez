"use client";
// Changes from here
// http://127.0.0.1:5000/predict
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import "@/app/dashboard/dashboard.css";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<any>(null);

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

    // Check if the video is loaded and has valid dimensions
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
      const response = await axios.post("http://127.0.0.1:5000/predict", {
        image: frame,
      });
      if (response.data && response.data.prediction) {
        setPredictedWord(response.data.prediction);
        let word = response.data.prediction as string;
        updateScoreAtIndex(word.charCodeAt(0) - "A".charCodeAt(0));
      }
    } catch (error) {
      setPredictedWord("NO HAND DETECTED");
      console.error("Error predicting sign language", error);
    }
  };

  const updateScoreAtIndex = (index: number) => {
    if (index >= 0 && index < scores.length) {
      const newScores = [...scores];
      newScores[index] = 100;
      setScores(newScores);
    } else {
      console.error("Index out of bounds");
    }
  };

  useEffect(() => {
    // Fetch the alphabet array from the server
    const fetchAlphabetArray = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/getAlphabetArray",
          {
            params: { email: "user@example.com" }, // replace with actual email
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
  }, []);

  const calculateTotalProgress = (scoresArray: number[]) => {
    const total = scoresArray.reduce((sum, score) => sum + score, 0);
    const percentage = (total / (scoresArray.length * 100)) * 100;
    setTotalProgress(percentage);
  };

  const updateScore = async (index: number, newScore: number) => {
    // Update the score in the state
    const updatedScores = [...scores];
    updatedScores[index] = newScore;
    setScores(updatedScores);

    // Recalculate total progress
    calculateTotalProgress(updatedScores);

    // Logic goes here to trigger the update
    try {
      const response = await axios.post(
        "http://localhost:3001/updateAlphabetArray",
        {
          email: "user@example.com", // replace with actual email
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

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="relative itemLeft text-black p-4 overflow-y-auto bg-white shadow-lg">
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
      <div className="flex-grow itemRight text-black p-4 flex flex-col bg-white shadow-lg">
        <div className="flex mb-4">
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
          </div>
        </div>
        <div className="imageSection flex-1 p-4 bg-gray-100 rounded-lg shadow-inner">
          <h3 className="font-bold text-xl mb-2">Image Section:</h3>
          {/* Add your image display code here */}
        </div>
      </div>
    </div>
  );
}
