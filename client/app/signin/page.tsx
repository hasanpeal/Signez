"use client";
import React from "react";
import { useRef, useState, KeyboardEvent } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import "@/app/signin/signin.css";
import eye from "@/public/eye.svg";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forget, setForget] = useState(true);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [passFlag, setPassFlag] = useState(false);
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [load, setLoad] = useState(false);
  const [load2, setLoad2] = useState(false);
  const [username, setUserName] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });
  const [emailErrors, setEmailErrors] = useState({
    email: "",
  });
  const [newPasswordError, setNewPasswordError] = useState({
    confirmPassword: "",
    nPass: "",
    cnPass: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);

  const form = useRef<HTMLFormElement>(null);

  //   React.useEffect(() => {
  //     const checkSession = async () => {
  //       try {
  //         const response = await axios.get(
  //           `${process.env.VITE_SERVER}/check-session`,
  //           { withCredentials: true }
  //         );
  //         if (response.data.isAuthenticated) {
  //           // console.log("Authenticated:", response.data);
  //           const { email, newUser } = response.data;
  //           if (newUser) navigate("/newuser", { state: { email } });
  //           else navigate("/dashboard", { state: { email } });
  //         } else {
  //           // console.log("Not authenticated");
  //         }
  //       } catch (error) {
  //         console.error("Error checking session", error);
  //       }
  //     };
  //     checkSession();
  //   }, [navigate]);

  //   React.useEffect(() => {
  //     const params = new URLSearchParams(window.location.search);
  //     const code = params.get("code");
  //     const message = params.get("message");
  //     const capturedEmail = params.get("email");
  //     const capturedUsername = params.get("screen_name");
  //     document.title = "Tweetipy | Login";
  //     if (code) {
  //       if (parseInt(code) === 0) {
  //         setEmail(capturedEmail || "");
  //         setUserName(capturedUsername || "");
  //         setLoad(true);
  //         toast.success(message, {
  //           id: "success1",
  //         });
  //         const fetchData = async () => {
  //           const res = await axios.get(
  //             `${import.meta.env.VITE_SERVER}/isNewUser`,
  //             {
  //               params: { email: email },
  //             }
  //           );
  //           // console.log(res.data.bool);
  //           if (res.data.bool)
  //             navigate("/newuser", { state: { email, username } });
  //           else navigate("/dashboard", { state: { email, username } });
  //         };
  //         fetchData();
  //       } else {
  //         toast.error(message || "Authentication failed", {
  //           id: "success3",
  //         });
  //       }
  //     }
  //   }, [email, navigate, username]);

  async function emailDoesntExist() {
    try {
      const result = await axios.get(
        `${process.env.VITE_SERVER}/validateEmail`,
        {
          params: { email: email },
        }
      );
      const code = result.data.code;
      // console.log("Email exist code: ", code);
      if (code === 0) return false;
      else true;
    } catch (err) {
      // console.log("Error in emailAlreadyExist function");
    }
  }

  const handleLogin = async () => {
    if (await validateForm()) {
      try {
        const result = await axios.post(`${process.env.VITE_SERVER}/login`, {
          email,
          password,
        });
        const { code, message } = result.data;
        if (code === 0) {
          toast.success(message);
          setLoad(true);
          
          navigate("/newuser", { state: { email } });
          
        } else {
          toast.error(message);
        }
        
      } catch (err) {
        console.error("Error in handleLogin function in Login.tsx");
      }
    } else {
      setTimeout(() => {
        setFormErrors({
          email: "",
          password: "",
        });
      }, 3000);
    }
  };

  const generateOtp = async () => {
    try {
      const result = await axios.post(`${process.env.VITE_SERVER}/sentOTP`, {
        email: email,
      });
      setGeneratedOtp(result.data.otp);
    } catch (error) {
      // console.log("Error calling http://localhost:3000/sentOTP on login.tsx");
    }
    // console.log("OTP generated");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (/^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const validateForm = async () => {
    const errors = {
      email: "",
      password: "",
    };
    let isValid = true;

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Not a valid email";
      isValid = false;
    } else if (await emailDoesntExist()) {
      errors.email = "Email isn't registered";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, email: "" }));
      }, 3000);
    }
    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  async function validateEmail() {
    const errors = {
      email: "",
    };
    let isValid = true;
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, email: "" }));
      }, 3000);
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Not a valid email";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, email: "" }));
      }, 3000);
    } else if (await emailDoesntExist()) {
      errors.email = "Email isn't registered";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, email: "" }));
      }, 3000);
    }
    setEmailErrors(errors);
    return isValid;
  }

  function validateNewPassword() {
    const errors = {
      confirmPassword: "",
      nPass: "",
      cnPass: "",
    };
    let isValid = true;

    if (!newPassword) {
      errors.nPass = "Password is required";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, nPass: "" }));
      }, 5000);
    } else if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      errors.nPass =
        "Password must be at least 8 characters long and include a letter and a number";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, nPass: "" }));
      }, 5000);
    }

    if (!confirmNewPassword) {
      errors.cnPass = "Password is required";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, cnPass: "" }));
      }, 5000);
    } else if (
      confirmNewPassword.length < 8 ||
      !/[a-zA-Z]/.test(confirmNewPassword) ||
      !/[0-9]/.test(confirmNewPassword)
    ) {
      errors.cnPass =
        "Password must be at least 8 characters long and include a letter and a number";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({ ...prevErrors, cnPass: "" }));
      }, 5000);
    }

    if (newPassword !== confirmNewPassword) {
      errors.confirmPassword = "Password doesn't match";
      isValid = false;
      setTimeout(() => {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "",
        }));
      }, 5000);
    }
    setNewPasswordError(errors);
    return isValid;
  }

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpVerify = async () => {
    if (otp.includes("")) {
      setOtpError(true);
    } else {
      setOtpError(false);

      if (generatedOtp === otp.join("")) {
        setPassFlag(true);
        setForget(true);
      } else {
        setVerified(true);
        setTimeout(() => {
          setVerified(false);
        }, 3000);
      }
      // console.log("OTP entered:", otp.join(""));
    }
  };

  const handleForgetPass = () => {
    setForget(false);
  };

  async function handleSend() {
    // console.log("Handle send function triggered");
    // console.log(formErrors);
    if (await validateEmail()) {
      generateOtp();
      setShowOtp(true);
    } else {
      setTimeout(() => {
        setEmailErrors({
          email: "",
        });
      }, 3000);
    }
  }

  async function resetPassword() {
    if (validateNewPassword()) {
      try {
        const result = await axios.post(
          `${process.env.VITE_SERVER}/resetPassword`,
          {
            email: email,
            newPassword: confirmNewPassword,
          }
        );
        if (result.data.code === 0) {
          // console.log("Success resetting password");
          toast.success("Password reset successful");
          setLoad2(true);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (err) {
        // console.log("Error resetting password in Login.tsx");
      }
    } else {
      setTimeout(() => {
        setNewPasswordError({
          confirmPassword: "",
          nPass: "",
          cnPass: "",
        });
      }, 3000);
    }
  }
  function googleOauth(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div>
      <div className="mainContainer pb-40 mt-36">
        <div className="card bg-base-100 w-96 shadow-xl cardDiv">
          {/* <Toaster /> */}
          <article className="text-center text-xl text-bold mt-4">
            {" "}
            Login
          </article>
          <div>
            {forget && !passFlag && (
              <label className="input input-bordered flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                  <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                </svg>
                <input
                  type="email"
                  className={`grow ${formErrors.email ? "border-red-500" : ""}`}
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            {formErrors.email && !passFlag && forget && !showOtp && (
              <p className="alertText text-red-500">{formErrors.email}</p>
            )}
          </div>

          <div>
            {forget && !passFlag && (
              <label className="input input-bordered flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`grow ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="btn btn-ghost showBtn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Image
                    src={eye}
                    alt="eye-twotone"
                    className="showIcon"
                    width={10}
                    height={10}
                  />
                </button>
              </label>
            )}
            {formErrors.password && !passFlag && (
              <p className="alertText text-red-500">{formErrors.password}</p>
            )}
          </div>

          {forget && !passFlag && (
            <a
              className="link link-primary forgetLink"
              onClick={handleForgetPass}
            >
              Forget Password
            </a>
          )}

          {forget && !passFlag && (
            <button className="btn btn-primary btnSubmit" onClick={handleLogin}>
              Login
            </button>
          )}
          {forget && !passFlag && (
            <button
              className="btn btn-outline btn-primary whiteText"
              onClick={googleOauth}
            >
              Login with{" "}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 128 128">
                <path
                  fill="#fff"
                  d="M44.59 4.21a63.28 63.28 0 004.33 120.9 67.6 67.6 0 0032.36.35 57.13 57.13 0 0025.9-13.46 57.44 57.44 0 0016-26.26 74.33 74.33 0 001.61-33.58H65.27v24.69h34.47a29.72 29.72 0 01-12.66 19.52 36.16 36.16 0 01-13.93 5.5 41.29 41.29 0 01-15.1 0A37.16 37.16 0 0144 95.74a39.3 39.3 0 01-14.5-19.42 38.31 38.31 0 010-24.63 39.25 39.25 0 019.18-14.91A37.17 37.17 0 0176.13 27a34.28 34.28 0 0113.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0087.2 4.59a64 64 0 00-42.61-.38z"
                />
                <path
                  fill="#e33629"
                  d="M44.59 4.21a64 64 0 0142.61.37 61.22 61.22 0 0120.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 00-13.64-8 37.17 37.17 0 00-37.46 9.74 39.25 39.25 0 00-9.18 14.91L8.76 35.6A63.53 63.53 0 0144.59 4.21z"
                />
                <path
                  fill="#f8bd00"
                  d="M3.26 51.5a62.93 62.93 0 015.5-15.9l20.73 16.09a38.31 38.31 0 000 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 01-5.5-40.9z"
                />
                <path
                  fill="#587dbd"
                  d="M65.27 52.15h59.52a74.33 74.33 0 01-1.61 33.58 57.44 57.44 0 01-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0012.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"
                />
                <path
                  fill="#319f43"
                  d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0044 95.74a37.16 37.16 0 0014.08 6.08 41.29 41.29 0 0015.1 0 36.16 36.16 0 0013.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 01-25.9 13.47 67.6 67.6 0 01-32.36-.35 63 63 0 01-23-11.59A63.73 63.73 0 018.75 92.4z"
                />
              </svg>
            </button>
          )}

          {!forget && (
            <label className="input input-bordered flex items-center gap-2 resetEmail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
              </svg>
              <input
                type="email"
                className={`grow ${formErrors.email ? "border-red-500" : ""}`}
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                className="btn btn-active btn-primary otpBtn"
                onClick={handleSend}
              >
                Send
              </button>
            </label>
          )}
          {emailErrors.email && !forget && (
            <p className="custoText text-red-500">{emailErrors.email}</p>
          )}

          {!forget && showOtp && (
            <div id="otpSection">
              <p>Please enter the 6-digit OTP sent to your email</p>
              <div className="otpBox">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    value={digit}
                    className={`otpInput w-12 h-12 ${
                      otpError && !digit ? "border-red-500" : ""
                    }`}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                  />
                ))}
              </div>

              {verified && (
                <p className="alertText text-red-500 customAlertLogin">
                  {" "}
                  Wrong OTP
                </p>
              )}

              {!forget && (
                <div className="verifyBtn">
                  <button
                    className="btn btn-active btn-primary"
                    onClick={handleOtpVerify}
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
          )}

          {passFlag && (
            <div className="resetDiv">
              <label className="input input-bordered flex items-center gap-2 resetBox">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type={showPassword2 ? "text" : "password"}
                  className={`grow ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  className="btn btn-ghost showBtn"
                  onClick={() => setShowPassword2(!showPassword2)}
                >
                  <Image
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJjb2xvcjojODA1MkY2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJoLWZ1bGwgdy1mdWxsIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgcng9IjMwIiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlPSJ0cmFuc3BhcmVudCIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2Utb3BhY2l0eT0iMTAwJSIgcGFpbnQtb3JkZXI9InN0cm9rZSI+PC9yZWN0Pjxzdmcgd2lkdGg9IjI1NnB4IiBoZWlnaHQ9IjI1NnB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSIjODA1MkY2IiB4PSIxMjgiIHk9IjEyOCIgcm9sZT0iaW1nIiBzdHlsZT0iZGlzcGxheTppbmxpbmUtYmxvY2s7dmVydGljYWwtYWxpZ246bWlkZGxlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9IiM4MDUyRjYiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZmlsbC1vcGFjaXR5PSIuMTUiIGQ9Ik04MS44IDUzNy44YTYwLjMgNjAuMyAwIDAgMSAwLTUxLjVDMTc2LjYgMjg2LjUgMzE5LjggMTg2IDUxMiAxODZjLTE5Mi4yIDAtMzM1LjQgMTAwLjUtNDMwLjIgMzAwLjNhNjAuMyA2MC4zIDAgMCAwIDAgNTEuNUMxNzYuNiA3MzcuNSAzMTkuOSA4MzggNTEyIDgzOGMtMTkyLjEgMC0zMzUuNC0xMDAuNS00MzAuMi0zMDAuMnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iLjE1IiBkPSJNNTEyIDI1OGMtMTYxLjMgMC0yNzkuNCA4MS44LTM2Mi43IDI1NEMyMzIuNiA2ODQuMiAzNTAuNyA3NjYgNTEyIDc2NmMxNjEuNCAwIDI3OS41LTgxLjggMzYyLjctMjU0Qzc5MS40IDMzOS44IDY3My4zIDI1OCA1MTIgMjU4em0tNCA0MzBjLTk3LjIgMC0xNzYtNzguOC0xNzYtMTc2czc4LjgtMTc2IDE3Ni0xNzZzMTc2IDc4LjggMTc2IDE3NnMtNzguOCAxNzYtMTc2IDE3NnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik05NDIuMiA0ODYuMkM4NDcuNCAyODYuNSA3MDQuMSAxODYgNTEyIDE4NmMtMTkyLjIgMC0zMzUuNCAxMDAuNS00MzAuMiAzMDAuM2E2MC4zIDYwLjMgMCAwIDAgMCA1MS41QzE3Ni42IDczNy41IDMxOS45IDgzOCA1MTIgODM4YzE5Mi4yIDAgMzM1LjQtMTAwLjUgNDMwLjItMzAwLjNjNy43LTE2LjIgNy43LTM1IDAtNTEuNXpNNTEyIDc2NmMtMTYxLjMgMC0yNzkuNC04MS44LTM2Mi43LTI1NEMyMzIuNiAzMzkuOCAzNTAuNyAyNTggNTEyIDI1OHMyNzkuNCA4MS44IDM2Mi43IDI1NEM3OTEuNSA2ODQuMiA2NzMuNCA3NjYgNTEyIDc2NnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik01MDggMzM2Yy05Ny4yIDAtMTc2IDc4LjgtMTc2IDE3NnM3OC44IDE3NiAxNzYgMTc2czE3Ni03OC44IDE3Ni0xNzZzLTc4LjgtMTc2LTE3Ni0xNzZ6bTAgMjg4Yy02MS45IDAtMTEyLTUwLjEtMTEyLTExMnM1MC4xLTExMiAxMTItMTEyczExMiA1MC4xIDExMiAxMTJzLTUwLjEgMTEyLTExMiAxMTJ6Ij48L3BhdGg+PC9nPjwvc3ZnPjwvc3ZnPg=="
                    alt="eye-twotone"
                    className="showIcon"
                  />
                </button>
              </label>

              {newPasswordError.nPass && (
                <p className="newPassText text-red-500">
                  {newPasswordError.nPass}
                </p>
              )}

              <label className="input input-bordered flex items-center gap-2 resetBox">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type={showPassword3 ? "text" : "password"}
                  className={`grow ${
                    formErrors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(event.target.value)
                  }
                />
                <button
                  className="btn btn-ghost showBtn"
                  onClick={() => setShowPassword3(!showPassword3)}
                >
                  <Image
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJjb2xvcjojODA1MkY2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJoLWZ1bGwgdy1mdWxsIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgcng9IjMwIiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlPSJ0cmFuc3BhcmVudCIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2Utb3BhY2l0eT0iMTAwJSIgcGFpbnQtb3JkZXI9InN0cm9rZSI+PC9yZWN0Pjxzdmcgd2lkdGg9IjI1NnB4IiBoZWlnaHQ9IjI1NnB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSIjODA1MkY2IiB4PSIxMjgiIHk9IjEyOCIgcm9sZT0iaW1nIiBzdHlsZT0iZGlzcGxheTppbmxpbmUtYmxvY2s7dmVydGljYWwtYWxpZ246bWlkZGxlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9IiM4MDUyRjYiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZmlsbC1vcGFjaXR5PSIuMTUiIGQ9Ik04MS44IDUzNy44YTYwLjMgNjAuMyAwIDAgMSAwLTUxLjVDMTc2LjYgMjg2LjUgMzE5LjggMTg2IDUxMiAxODZjLTE5Mi4yIDAtMzM1LjQgMTAwLjUtNDMwLjIgMzAwLjNhNjAuMyA2MC4zIDAgMCAwIDAgNTEuNUMxNzYuNiA3MzcuNSAzMTkuOSA4MzggNTEyIDgzOGMtMTkyLjEgMC0zMzUuNC0xMDAuNS00MzAuMi0zMDAuMnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iLjE1IiBkPSJNNTEyIDI1OGMtMTYxLjMgMC0yNzkuNCA4MS44LTM2Mi43IDI1NEMyMzIuNiA2ODQuMiAzNTAuNyA3NjYgNTEyIDc2NmMxNjEuNCAwIDI3OS41LTgxLjggMzYyLjctMjU0Qzc5MS40IDMzOS44IDY3My4zIDI1OCA1MTIgMjU4em0tNCA0MzBjLTk3LjIgMC0xNzYtNzguOC0xNzYtMTc2czc4LjgtMTc2IDE3Ni0xNzZzMTc2IDc4LjggMTc2IDE3NnMtNzguOCAxNzYtMTc2IDE3NnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik05NDIuMiA0ODYuMkM4NDcuNCAyODYuNSA3MDQuMSAxODYgNTEyIDE4NmMtMTkyLjIgMC0zMzUuNCAxMDAuNS00MzAuMiAzMDAuM2E2MC4zIDYwLjMgMCAwIDAgMCA1MS41QzE3Ni42IDczNy41IDMxOS45IDgzOCA1MTIgODM4YzE5Mi4yIDAgMzM1LjQtMTAwLjUgNDMwLjItMzAwLjNjNy43LTE2LjIgNy43LTM1IDAtNTEuNXpNNTEyIDc2NmMtMTYxLjMgMC0yNzkuNC04MS44LTM2Mi43LTI1NEMyMzIuNiAzMzkuOCAzNTAuNyAyNTggNTEyIDI1OHMyNzkuNCA4MS44IDM2Mi43IDI1NEM3OTEuNSA2ODQuMiA2NzMuNCA3NjYgNTEyIDc2NnoiPjwvcGF0aD48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik01MDggMzM2Yy05Ny4yIDAtMTc2IDc4LjgtMTc2IDE3NnM3OC44IDE3NiAxNzYgMTc2czE3Ni03OC44IDE3Ni0xNzZzLTc4LjgtMTc2LTE3Ni0xNzZ6bTAgMjg4Yy02MS45IDAtMTEyLTUwLjEtMTEyLTExMnM1MC4xLTExMiAxMTItMTEyczExMiA1MC4xIDExMiAxMTJzLTUwLjEgMTEyLTExMiAxMTJ6Ij48L3BhdGg+PC9nPjwvc3ZnPjwvc3ZnPg=="
                    alt="eye-twotone"
                    className="showIcon"
                  />
                </button>
              </label>

              {newPasswordError.cnPass && (
                <p className="newPassText text-red-500">
                  {newPasswordError.cnPass}
                </p>
              )}

              {newPasswordError.confirmPassword && (
                <p className="newPassText text-red-500">
                  {newPasswordError.confirmPassword}
                </p>
              )}

              <button
                className="btn btn-outline btn-primary resetBtn"
                onClick={resetPassword}
              >
                Set Password
              </button>
            </div>
          )}

          <p>
            {" "}
            Dont have an account?{" "}
            <Link href="/signup" className="links">
              Sign up
            </Link>
          </p>
          {load && (
            <span className="loading loading-spinner text-primary Load1"></span>
          )}

          {load2 && (
            <span className="loading loading-spinner text-primary Load1"></span>
          )}
        </div>
      </div>
    </div>
  );
}
