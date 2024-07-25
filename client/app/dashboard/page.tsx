import React from "react";
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
  return (
    <div className="flex h-screen">
      <div className="relative itemLeft text-black p-4 overflow-y-auto">
        {/* Content for the left item */}
        <div className="leftDiv">
          {/* List of items */}
          {alphabet.map((item, index) => (
            <div className="eachItem" key={index}>
              {item}
              <div className="text-sm"> 100/100</div>
              <progress
                className="progress progress-primary sm:w-4 md:w-40 lg:w-40 xl:w-40"
                value={25}
                max="100"
              ></progress>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow itemRight text-black p-4">
        {/* Content for the right item */}
        <p>Right Item</p>
      </div>
    </div>
  );
}
