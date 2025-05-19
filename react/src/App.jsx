import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";

// Firebase URLs
const FIREBASE_USERS_URL = "https://teluguskillhub-32c09-default-rtdb.firebaseio.com/users.json";
const FIREBASE_POLLS_URL = "https://teluguskillhub-32c09-default-rtdb.firebaseio.com/polls.json";

// Context setup
const ThemeContext = createContext();
const AuthContext = createContext();

// Utility functions
const sanitizeEmail = (email) => email.replace(/[.@]/g, "_");
const getLocalStorage = (key, defaultValue) => localStorage.getItem(key) || defaultValue;

// Shared styles
const getStyles = (theme) => ({
  app: {
    background: theme === "light" ? "#f9fafb" : "#222",
    color: theme === "light" ? "#111" : "#eee",
    minHeight: "100vh",
    padding: "1rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    transition: "all 0.3s ease",
  },
  box: {
    background: theme === "light" ? "white" : "#333",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "1rem",
    boxShadow: theme === "light" ? "0 0 8px rgba(0,0,0,0.1)" : "0 0 8px rgba(255,255,255,0.1)",
  },
  button: {
    padding: "8px 14px",
    margin: "0.2rem",
    border: "none",
    borderRadius: "8px",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  message: (isSuccess) => ({
    marginTop: 10,
    color: isSuccess ? "green" : "red",
    padding: "6px",
    borderRadius: "4px",
    background: isSuccess ? "rgba(0,255,0,0.1)" : "rgba(255,0,0,0.1)"
  })
});

// Message component
const Message = ({ message }) => {
  if (!message) return null;
  const isSuccess = message.includes("successfully");
  const theme = useContext(ThemeContext).theme;
  const styles = getStyles(theme);
  
  return <div style={styles.message(isSuccess)}>{message}</div>;
};

// Theme Provider Component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getLocalStorage("pollsAppTheme", "light"));
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("pollsAppTheme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Auth Provider Component
function AuthProvider({ children }) {
  const [loggedInUser, setLoggedInUser] = useState(() => getLocalStorage("pollsAppUser", null));
  
  useEffect(() => {
    loggedInUser 
      ? localStorage.setItem("pollsAppUser", loggedInUser)
      : localStorage.removeItem("pollsAppUser");
  }, [loggedInUser]);

  return (
    <AuthContext.Provider value={{ loggedInUser, setLoggedInUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth Form Component
function AuthForm() {
  const { setLoggedInUser } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);
  
  const [isRegister, setIsRegister] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Form validation
  const validate = (field, val) => {
    setErrors(prev => {
      const temp = { ...prev };
      if (field === "email")
        temp.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : "Invalid Email";
      else if (field === "password")
        temp.password = val.length >= 6 ? "" : "Min 6 chars";
      else if (field === "confirmPassword")
        temp.confirmPassword = val === formData.password ? "" : "Passwords do not match";
      return temp;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  // Auth handlers
  const register = async () => {
    if (Object.values(errors).some(Boolean) || 
        !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage("Please fix errors and fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(FIREBASE_USERS_URL);
      const users = res.data || {};
      if (Object.values(users).some(u => u.email === formData.email)) {
        setMessage("Email already registered");
        return;
      }
      
      await axios.post(FIREBASE_USERS_URL, {
        email: formData.email,
        password: formData.password,
        createdAt: new Date().toISOString()
      });
      setMessage("Registered successfully, please login");
      setIsRegister(false);
    } catch (error) {
      console.error("Registration failed:", error);
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!formData.email || !formData.password) {
      setMessage("Please fill email and password");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(FIREBASE_USERS_URL);
      const users = Object.values(res.data || {});
      const user = users.find(
        u => u.email === formData.email && u.password === formData.password
      );
      
      if (user) {
        setLoggedInUser(user.email);
        setMessage("");
      } else {
        setMessage("Invalid credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsRegister(prev => !prev);
    setMessage("");
    setErrors({});
    setFormData({ email: "", password: "", confirmPassword: "" });
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", ...styles.box }}>
      <h2>{isRegister ? "Register" : "Login"}</h2>
      <form onSubmit={(e) => { e.preventDefault(); isRegister ? register() : login(); }}>
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div style={{ color: "red" }}>{errors.email}</div>}

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <div style={{ color: "red" }}>{errors.password}</div>}

        {isRegister && (
          <>
            <input
              style={styles.input}
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div style={{ color: "red" }}>{errors.confirmPassword}</div>}
          </>
        )}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>
      </form>
      
      <p style={{ marginTop: 10 }}>
        {isRegister ? "Already have an account? " : "Don't have an account? "}
        <button
          style={{
            ...styles.button,
            background: "transparent",
            color: theme === "light" ? "#3b82f6" : "#90cdf4",
            padding: 0,
          }}
          onClick={toggleForm}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
      
      <Message message={message} />
    </div>
  );
}

// CreatePollForm Component
function CreatePollForm({ onPollCreated }) {
  const { theme } = useContext(ThemeContext);
  const { loggedInUser } = useContext(AuthContext);
  const styles = getStyles(theme);
  
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePollOptionChange = (index, value) => {
    setPollOptions(prev => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const createPoll = async () => {
    if (!pollQuestion.trim()) {
      setMessage("Poll question cannot be empty");
      return;
    }
    if (pollOptions.some(opt => !opt.trim())) {
      setMessage("Poll options cannot be empty");
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(FIREBASE_POLLS_URL, {
        question: pollQuestion,
        options: pollOptions.map(opt => opt.trim()),
        createdBy: loggedInUser,
        createdAt: new Date().toISOString(),
        votes: {},
      });
      
      setMessage("Poll created successfully!");
      setPollQuestion("");
      setPollOptions(["", ""]);
      onPollCreated();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to create poll:", error);
      setMessage("Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.box}>
      <h3>Create a new Poll</h3>
      <input
        style={styles.input}
        placeholder="Poll Question"
        value={pollQuestion}
        onChange={(e) => setPollQuestion(e.target.value)}
      />
      
      <h4>Options</h4>
      {pollOptions.map((option, i) => (
        <div key={i} style={{ display: "flex", marginBottom: 6 }}>
          <input
            style={{ ...styles.input, flexGrow: 1 }}
            value={option}
            onChange={(e) => handlePollOptionChange(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
          />
          {pollOptions.length > 2 && (
            <button
              style={{...styles.button, background: "#ef4444", marginLeft: 6, padding: "6px 10px"}}
              onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      
      <button style={styles.button} onClick={() => setPollOptions(prev => [...prev, ""])}>
        + Add Option
      </button>
      <br />
      <button style={styles.button} onClick={createPoll} disabled={loading}>
        {loading ? "Creating..." : "Create Poll"}
      </button>
      
      <Message message={message} />
    </div>
  );
}

// PollItem Component
function PollItem({ poll, onDelete, onVoted }) {
  const { theme } = useContext(ThemeContext);
  const { loggedInUser } = useContext(AuthContext);
  const styles = getStyles(theme);
  
  const [message, setMessage] = useState("");
  const [localPoll, setLocalPoll] = useState(poll);
  
  useEffect(() => setLocalPoll(poll), [poll]);
  
  const votes = localPoll.votes || {};
  const userVote = votes[sanitizeEmail(loggedInUser)];
  const votesCount = localPoll.options.map((_, idx) => 
    Object.values(votes).filter(v => v === idx).length
  );
  const totalVotes = Object.keys(votes).length;

  const vote = async (optionIndex) => {
    try {
      const pollUrl = `https://teluguskillhub-32c09-default-rtdb.firebaseio.com/polls/${localPoll.id}.json`;
      const { data: currentPoll } = await axios.get(pollUrl);

      if (!currentPoll) {
        setMessage("Poll not found");
        return;
      }
      
      const voterKey = sanitizeEmail(loggedInUser);
      if (currentPoll.votes?.[voterKey] !== undefined) {
        setMessage("You have already voted");
        return;
      }

      const updatedVotes = { ...(currentPoll.votes || {}), [voterKey]: optionIndex };
      await axios.patch(pollUrl, { votes: updatedVotes });

      setLocalPoll({ ...localPoll, votes: updatedVotes });
      if (onVoted) onVoted(localPoll.id, updatedVotes);
      
      setMessage("✓ Vote recorded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Vote error:", error);
      setMessage("Failed to vote. Please try again.");
    }
  };

  return (
    <div style={{
      ...styles.box,
      marginBottom: "1.5rem",
      border: localPoll.createdBy === loggedInUser ? "2px solid #3b82f6" : "1px solid #ccc",
    }}>
      <h4>{localPoll.question}</h4>
      
      {localPoll.options.map((option, idx) => {
        const percent = totalVotes === 0 ? 0 : ((votesCount[idx] / totalVotes) * 100).toFixed(1);
        return (
          <div key={idx} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              disabled={userVote !== undefined}
              style={{
                ...styles.button,
                padding: "4px 10px",
                fontSize: "0.9rem",
                backgroundColor: userVote === idx ? "#10b981" : theme === "light" ? "#3b82f6" : "#2563eb",
                cursor: userVote !== undefined ? "default" : "pointer",
              }}
              onClick={() => vote(idx)}
            >
              {option}
            </button>
            <div style={{
              flexGrow: 1,
              height: 14,
              background: theme === "light" ? "#e5e7eb" : "#4b5563",
              borderRadius: 8,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${percent}%`,
                height: "100%",
                backgroundColor: "#3b82f6",
                transition: "width 0.5s",
              }} />
            </div>
            <span style={{ minWidth: 40, textAlign: "right" }}>
              {votesCount[idx]} ({percent}%)
            </span>
          </div>
        );
      })}
      
      <div style={{ 
        marginTop: 8, 
        fontSize: "0.9rem", 
        color: theme === "light" ? "#555" : "#aaa",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span>Created by: {localPoll.createdBy}</span>
        <span>{new Date(localPoll.createdAt).toLocaleDateString()}</span>
      </div>
      
      {localPoll.createdBy === loggedInUser && (
        <button
          style={{ ...styles.button, background: "#ef4444", marginTop: 10 }}
          onClick={() => onDelete(localPoll.id)}
        >
          Delete Poll
        </button>
      )}
      
      <Message message={message} />
    </div>
  );
}

// Main App Component
function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { loggedInUser, setLoggedInUser } = useContext(AuthContext);
  const styles = getStyles(theme);
  
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loggedInUser) fetchPolls();
  }, [loggedInUser]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await axios.get(FIREBASE_POLLS_URL);
      const data = res.data || {};
      
      const formattedPolls = Object.entries(data)
        .map(([id, poll]) => ({ id, ...poll }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      setPolls(formattedPolls);
      setMessage("");
    } catch (error) {
      console.error("Failed to load polls:", error);
      setMessage("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (pollId, updatedVotes) => {
    setPolls(polls => polls.map(poll => 
      poll.id === pollId ? { ...poll, votes: updatedVotes } : poll
    ));
  };

  const deletePoll = async (pollId) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) {
      setMessage("Poll not found");
      return;
    }
    if (poll.createdBy !== loggedInUser) {
      setMessage("You can only delete your own polls");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this poll?")) return;
    
    try {
      await axios.delete(`https://teluguskillhub-32c09-default-rtdb.firebaseio.com/polls/${pollId}.json`);
      setPolls(prev => prev.filter(p => p.id !== pollId));
      setMessage("Poll deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Delete poll error:", error);
      setMessage("Failed to delete poll");
    }
  };

  return (
    <div style={styles.app}>
      {!loggedInUser ? (
        <AuthForm />
      ) : (
        <div style={{ maxWidth: 800, margin: "auto" }}>
          {/* Header */}
          <div style={{
            ...styles.box,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h2>Welcome, {loggedInUser}</h2>
            <div>
              <button style={{ ...styles.button, marginRight: 8 }} onClick={toggleTheme}>
                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>
              <button style={styles.button} onClick={() => setLoggedInUser(null)}>
                Logout
              </button>
            </div>
          </div>

          {/* Create Poll Form */}
          <CreatePollForm onPollCreated={fetchPolls} />

          {/* Polls List */}
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <h3>Available Polls</h3>
              <button 
                style={{ ...styles.button, background: "#10b981" }}
                onClick={fetchPolls}
                disabled={loading}
              >
                {loading ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>
            
            <Message message={message} />
            
            {loading ? (
              <div style={{textAlign: "center", padding: "20px"}}>Loading polls...</div>
            ) : polls.length === 0 ? (
              <div style={{textAlign: "center", padding: "20px"}}>No polls available yet.</div>
            ) : (
              polls.map(poll => (
                <PollItem 
                  key={poll.id} 
                  poll={poll} 
                  onDelete={deletePoll}
                  onVoted={handleVote}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Root App with Context Providers
export default function RootApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}