"use client"
import React from 'react'
import { useEmail } from "@/context/UserContext";
export default function Dashboard() {
  const { emailContext } = useEmail();
  return (
    <div>Successfully registeres to dashboard. Email is {emailContext}</div>
  )
}
