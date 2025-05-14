import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [isRegister, setIsRegister] = useState(true);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [dhoniImage, setDhoniImage] = useState("");

  const FIREBASE_URL = "https://teluguskillhub-32c09-default-rtdb.firebaseio.com/users.json";

  const dhoniImages = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Mahendra_Singh_Dhoni.jpg/800px-Mahendra_Singh_Dhoni.jpg",
    "https://static.toiimg.com/thumb/msid-82112699,width-400,resizemode-4/82112699.jpg",
    "https://images.indianexpress.com/2020/08/ms-dhoni-1200.jpg",
    "https://www.cricbuzz.com/a/img/v1/600x400/i1/c244400/ms-dhoni-led-csk-to-their-fourth.jpg",
    "https://www.hindustantimes.com/ht-img/img/2023/04/02/1600x900/ms_dhoni_csk_ipl2023_1680442579041_1680442579306_1680442579306.jpg"
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedPassword = localStorage.getItem("password");
    if (savedEmail && savedPassword) {
      setFormData({ email: savedEmail, password: savedPassword, confirmPassword: "", phoneNumber: "" });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    validateForm(e.target.name, e.target.value);
  };

  const validateForm = (fieldName, value) => {
    let tempErrors = { ...errors };

    if (fieldName === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      tempErrors.email = emailRegex.test(value) ? "" : "Invalid email format";
    }

    if (fieldName === "password") {
      tempErrors.password = value.length >= 6 ? "" : "Password must be at least 6 characters";
    }

    if (fieldName === "confirmPassword") {
      tempErrors.confirmPassword = value === formData.password ? "" : "Passwords do not match";
    }

    setErrors(tempErrors);
  };

  const handleRegister = async () => {
    if (Object.values(errors).some((error) => error !== "")) {
      setMessage("Please fix the errors before submitting.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(FIREBASE_URL);
      const users = response.data || {};
      const exists = Object.values(users).some(user => user.email === formData.email);

      if (exists) {
        setMessage("Email already registered.");
        setLoading(false);
        return;
      }

      await axios.post(FIREBASE_URL, formData);
      setMessage("Registered successfully!");

      if (rememberMe) {
        localStorage.setItem("email", formData.email);
        localStorage.setItem("password", formData.password);
      }

      setFormData({ email: "", password: "", confirmPassword: "", phoneNumber: "" });
      setLoading(false);
    } catch (err) {
      setMessage("Registration failed.");
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.get(FIREBASE_URL);
      const users = response.data;

      const found = Object.values(users || {}).find(
        (user) =>
          user.email === formData.email && user.password === formData.password
      );

      if (found) {
        setMessage("Login successful!");
        setFormData({ email: "", password: "", confirmPassword: "", phoneNumber: "" });

        // Select a random Dhoni image
        const randomIndex = Math.floor(Math.random() * dhoniImages.length);
        setDhoniImage(dhoniImages[randomIndex]);

        if (rememberMe) {
          localStorage.setItem("email", formData.email);
          localStorage.setItem("password", formData.password);
        }

        setLoggedIn(true);
      } else {
        setMessage("Invalid email or password.");
      }
      setLoading(false);
    } catch (err) {
      setMessage("Login failed.");
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const handleReset = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    });
    setMessage("");
    setErrors({ email: "", password: "", confirmPassword: "" });
    setRememberMe(false);
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        background: "#f3f4f6",
        boxSizing: "border-box",
      }}
    >
      {loggedIn ? (
        <div style={{ textAlign: "center" }}>
          <h2>Welcome!</h2>
          {dhoniImage && (
            <img
              src={dhoniImage}
              alt="MS Dhoni"
              style={{
                maxWidth: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            />
          )}
          <button
            onClick={() => {
              setLoggedIn(false);
              handleReset();
            }}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "32px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px", textAlign: "center" }}>
            {isRegister ? "Register" : "Login"}
          </h2>

          <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }} />
            {errors.email && <span style={{ color: "red" }}>{errors.email}</span>}

            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }} />
              {errors.password && <span style={{ color: "red" }}>{errors.password}</span>}
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            {isRegister && (
              <div style={{ position: "relative" }}>
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }} />
                {errors.confirmPassword && <span style={{ color: "red" }}>{errors.confirmPassword}</span>}
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>
                  {showConfirmPassword ? "🙈" : "👁️"}
                </span>
              </div>
            )}

            {isRegister && (
              <input type="tel" name="phoneNumber" placeholder="Phone Number (Optional)" value={formData.phoneNumber} onChange={handleChange} style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }} />
            )}

            <label style={{ display: "block", marginBottom: "8px" }}>
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} /> Remember Me
            </label>

            <button type="submit" style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "white", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "16px" }}>
              {isRegister ? "Register" : "Login"}
            </button>

            <button type="button" onClick={handleReset} style={{ width: "100%", padding: "12px", background: "#e5e7eb", color: "black", fontWeight: "600", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "16px", marginTop: "10px" }}>
              Reset Form
            </button>
          </form>

          {loading && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <div className="loader"></div>
            </div>
          )}

          <p style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
            {isRegister ? "Already have an account?" : "Don't have an account?"} {" "}
            <button onClick={() => setIsRegister(!isRegister)} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontWeight: "500" }}>
              {isRegister ? "Login" : "Register"}
            </button>
          </p>

          {message && (
            <p style={{ marginTop: "16px", color: message.includes("success") ? "green" : "red", textAlign: "center", fontWeight: "500", opacity: 1, transition: "opacity 0.5s ease" }}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
