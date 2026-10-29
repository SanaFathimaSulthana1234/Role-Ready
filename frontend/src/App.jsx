import { useEffect, useState, useRef } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [student, setStudent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("roleready_student")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("roleready_token") || ""
  );
  const [authMode, setAuthMode] = useState("login");
  const [authPage, setAuthPage] = useState("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const [activePage, setActivePage] = useState("Overview");
  const pageHistory = useRef([]);

function navigateToPage(page) {
  if (page !== activePage) {
    pageHistory.current.push(activePage);
    setActivePage(page);
  }
}

function goBack() {
  const previousPage = pageHistory.current.pop();

  if (previousPage) {
    setActivePage(previousPage);
  }
}
  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("Loading job roles...");
  const [skills, setSkills] = useState([]);
  const [savingSkills, setSavingSkills] = useState([]);
  
  const [learningTasks, setLearningTasks] = useState([]);
  const [learningPlanMessage, setLearningPlanMessage] = useState("");
  const [addingTaskIds, setAddingTaskIds] = useState([]);


  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => {
        setStudent(data.student);
        localStorage.setItem("roleready_student", JSON.stringify(data.student));
      })
      .catch(() => {
        localStorage.removeItem("roleready_token");
        localStorage.removeItem("roleready_student");
        setToken("");
        setStudent(null);
      });
  }, [token]);

  useEffect(() => {
    fetch(`${API}/roles`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load roles");
        return response.json();
      })
      .then((data) => {
        setRoles(data);
        setMessage(data.length ? "" : "No job roles found.");
      })
      .catch(() => setMessage("Unable to connect. Make sure the backend is running."));
  }, []);

  useEffect(() => {
    if (!selectedRole || !token) {
      setSkills([]);
      return;
    }
    setMessage("");
    fetch(`${API}/progress/${selectedRole}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load saved progress");
        return response.json();
      })
      .then(setSkills)
      .catch(() => setMessage("Could not load saved progress for this role."));
  }, [selectedRole, token]);
  
useEffect(() => {
  if (!token) {
    setLearningTasks([]);
    return;
  }

  fetch(`${API}/learning-plan`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not load learning plan");
      }
      return response.json();
    })
    .then(setLearningTasks)
    .catch((error) => {
      console.error("Learning plan error:", error);
      setLearningPlanMessage("Could not load your learning plan.");
    });
}, [token]);


  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);
    try {
      const endpoint = authMode === "register" ? "register" : "login";
      const body = authMode === "register" ? { name, email, password } : { email, password };
      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");

      if (authMode === "register") {
        setAuthMode("login");
        setName("");
        setPassword("");
        setAuthMessage("Account created! Please log in.");
        return;
      }

      localStorage.setItem("roleready_token", data.token);
      localStorage.setItem("roleready_student", JSON.stringify(data.student));
      setToken(data.token);
      setStudent(data.student);
      setPassword("");
      setAuthMessage("");
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("roleready_token");
    localStorage.removeItem("roleready_student");
    setToken("");
    setStudent(null);
    setSelectedRole("");
    setSkills([]);
    setPassword("");
    setAuthMessage("");
    setMessage("");
  }

  async function toggleSkill(id) {
    const skill = skills.find((item) => item.id === id);
    if (!skill || savingSkills.includes(id)) return;
    const newKnown = !skill.known;

    setSkills((current) =>
      current.map((item) => item.id === id ? { ...item, known: newKnown } : item)
    );
    setSavingSkills((current) => [...current, id]);

    try {
      const response = await fetch(`${API}/progress/${selectedRole}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ known: newKnown }),
      });
      if (!response.ok) throw new Error("Could not save progress");
      setMessage("");
    } catch {
      setSkills((current) =>
        current.map((item) => item.id === id ? { ...item, known: !newKnown } : item)
      );
      setMessage("Could not save progress. Please try again.");
    } finally {
      setSavingSkills((current) => current.filter((skillId) => skillId !== id));
    }
  }
  
async function addToLearningPlan(skill) {
  if (!selectedRole || addingTaskIds.includes(skill.id)) return;

  setAddingTaskIds((current) => [...current, skill.id]);
  setLearningPlanMessage("");

  try {
    const response = await fetch(`${API}/learning-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        role_id: Number(selectedRole),
        skill_id: skill.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not add skill");
    }

    setLearningTasks((current) => {
      if (current.some((task) => task.id === data.task.id)) {
        return current;
      }
      return [data.task, ...current];
    });

    setLearningPlanMessage(`${skill.skill_name} added to your plan!`);
    setActivePage("Learning Plan");
  } catch (error) {
    setLearningPlanMessage(error.message);
  } finally {
    setAddingTaskIds((current) =>
      current.filter((id) => id !== skill.id)
    );
  }
}
  
async function updateLearningTask(taskId, changes) {
  try {
    const response = await fetch(`${API}/learning-plan/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(changes)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not update task");
    }

    setLearningTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task
      )
    );

    setLearningPlanMessage("Learning plan saved!");
  } catch (error) {
    setLearningPlanMessage(error.message);
  }
}

async function removeLearningTask(taskId) {
  const confirmed = window.confirm(
    "Are you sure you want to remove this skill from your learning plan?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API}/learning-plan/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not remove skill");
    }

    setLearningTasks((current) =>
      current.filter((task) => task.id !== taskId)
    );

    setLearningPlanMessage("Skill removed from your learning plan.");
  } catch (error) {
    setLearningPlanMessage(error.message);
  }
}

async function removeLearningTask(taskId) {
  const confirmed = window.confirm(
    "Are you sure you want to remove this skill from your learning plan?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API}/learning-plan/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not remove skill");
    }

    setLearningTasks((current) =>
      current.filter((task) => task.id !== taskId)
    );

    setLearningPlanMessage("Skill removed from your learning plan!");
  } catch (error) {
    setLearningPlanMessage(error.message);
  }
}



  const completed = skills.filter((skill) => skill.known).length;
  const total = skills.length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const remainingSkills = skills.filter((skill) => !skill.known);
  const selectedRoleName = roles.find((role) => String(role.id) === String(selectedRole))?.role_name;

  if (!student && authPage === "welcome") {
    return (
      <main className="landing-page">
        <header className="landing-nav">
          <a className="brand" href="#home" aria-label="RoleReady home">
            <span className="brand-icon">R</span><span>RoleReady</span>
          </a>
          <nav className="landing-nav-actions" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <button className="landing-signin" type="button" onClick={() => { setAuthMode("login"); setAuthPage("auth"); }}>Sign in</button>
          </nav>
        </header>

        <section className="landing-hero" id="home">
          <div className="landing-copy">
            <span className="intro-pill"><span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE</span>
            <p className="eyebrow landing-overline">CAREER CLARITY. ONE SKILL AT A TIME.</p>
            <h1>Turn your ambition<br />into a <span>career plan.</span></h1>
            <p className="landing-description">Know what your target role requires, track the skills you build, and make your next career move with confidence.</p>
            <div className="landing-actions">
              <button className="primary-button landing-primary" type="button" onClick={() => { setAuthMode("register"); setAuthPage("auth"); }}>Build my career plan <span aria-hidden="true">→</span></button>
              <button className="landing-secondary" type="button" onClick={() => { setAuthMode("login"); setAuthPage("auth"); }}>I already have an account</button>
            </div>
            <div className="landing-trust"><span>✓</span> Your skills and progress stay connected to your account.</div>
          </div>

          <div className="landing-preview" aria-label="RoleReady career progress preview">
            <div className="preview-topline"><span className="preview-dot" /><span>YOUR CAREER WORKSPACE</span><span className="preview-menu">•••</span></div>
            <div className="preview-heading"><div><p className="eyebrow">YOUR PROGRESS</p><h2>A plan you can act on.</h2></div><span className="preview-star">✦</span></div>
            <div className="preview-stats">
              <div><span>01</span><strong>Choose a role</strong><small>Set your direction</small></div>
              <div><span>02</span><strong>Track your skills</strong><small>See your progress</small></div>
              <div><span>03</span><strong>Close skill gaps</strong><small>Know what to learn next</small></div>
            </div>
            <div className="preview-progress-card"><div className="preview-progress-label"><span>Career growth</span><span>STEP BY STEP</span></div><div className="preview-progress-track"><span /></div><p>Small steps. Strong skills. Better opportunities.</p></div>
            <div className="preview-watermark">R</div>
          </div>
        </section>

        <section className="landing-features" id="how-it-works">
          <div className="landing-section-heading"><p className="eyebrow">A CLEARER WAY FORWARD</p><h2>Make your next step a focused one.</h2></div>
          <div className="landing-feature-grid">
            <article><span className="feature-number">01</span><h3>Choose your direction</h3><p>Pick a career path and see the skills connected to your goal.</p></article>
            <article><span className="feature-number">02</span><h3>Make progress visible</h3><p>Mark skills as you develop them and track your progress over time.</p></article>
            <article><span className="feature-number">03</span><h3>Focus on the gaps</h3><p>Identify the skills you still need to work on and plan your next move.</p></article>
          </div>
        </section>
        <footer className="landing-footer"><span>© 2026 RoleReady</span><span>Built for your next step.</span><button type="button" onClick={() => { setAuthMode("register"); setAuthPage("auth"); }}>Get started <span>→</span></button></footer>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="auth-page auth-page-centered">
        <header className="auth-brandbar">
          <a className="brand" href="#welcome" onClick={(event) => { event.preventDefault(); setAuthPage("welcome"); }}>
            <span className="brand-icon">R</span><span>RoleReady</span>
          </a>
          <button className="auth-back-button" type="button" onClick={() => setAuthPage("welcome")}>← Back to home</button>
        </header>
        <div className="auth-centered-content">
          <section className="auth-panel">
            <div className="auth-heading">
              <p className="eyebrow">{authMode === "login" ? "WELCOME BACK" : "YOUR NEXT CHAPTER"}</p>
              <h2>{authMode === "login" ? "Sign in to RoleReady" : "Create your account"}</h2>
              <p>{authMode === "login" ? "Continue building your career plan." : "Start turning your career goal into clear next steps."}</p>
            </div>
            <form onSubmit={handleAuth}>
              {authMode === "register" && <>
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" maxLength={100} autoComplete="name" required />
              </>}
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" maxLength={255} autoComplete="email" required />
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={authMode === "login" ? "current-password" : "new-password"} required />
              {authMessage && <p className="auth-message" role="status">{authMessage}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={authLoading}>
                {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"} <span aria-hidden="true">→</span>
              </button>
            </form>
            <p className="auth-switch">
              {authMode === "login" ? "New to RoleReady?" : "Already have an account?"}
              <button type="button" className="text-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthMessage(""); }}>
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <div className="secure-note"><span>▣</span> Your account and progress stay private.</div>
          </section>
          <p className="auth-bottom-note">A clearer path to your next opportunity.</p>
        </div>
        <footer className="auth-footer"><span>© 2026 RoleReady</span><span>Small steps. Strong skills. Better opportunities.</span></footer>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#overview">
          <span className="brand-icon">R</span><span>RoleReady</span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <button
  type="button"
  className={`nav-link ${activePage === "Overview" ? "active" : ""}`}
  onClick={() => navigateToPage("Overview")}
><span className="nav-icon">▦</span>Overview</button>
          <button
  type="button"
  className={`nav-link ${activePage === "Career Path" ? "active" : ""}`}
  onClick={() => navigateToPage("Career Path")}
>
            <span className="nav-icon">◎</span>Career path</button>
          <button
  type="button"
  className={`nav-link ${activePage === "My Skills" ? "active" : ""}`}
  onClick={() => navigateToPage("My Skills")}
><span className="nav-icon">✓</span>My skills</button>
          <button
  type="button"
  className={`nav-link ${activePage === "Skill Gaps" ? "active" : ""}`}
  onClick={() => navigateToPage("Skill Gaps")}
><span className="nav-icon">↗</span>Skill gaps</button>
          <button
            type="button"
            className={`nav-link ${activePage === "Learning Plan" ? "active" : ""}`}
            onClick={() => navigateToPage("Learning Plan")}
          >
            <span className="nav-icon">✦</span>Learning plan
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>Keep moving forward</strong>
            <p>Every skill you build brings your next opportunity closer.</p>
          </div>
          <div className="sidebar-user">
            <div className="avatar">{(student.name || "S").trim().charAt(0).toUpperCase()}</div>
            <div className="user-details"><strong>{student.name}</strong><span>Career explorer</span></div>
            <button className="logout-icon" type="button" onClick={logout} aria-label="Log out" title="Log out">↗</button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-topbar">
  <button
    type="button"
    className="dashboard-back-button"
    onClick={goBack}
    disabled={pageHistory.current.length === 0}
    aria-label="Go to previous page"
  >
    ← Back
  </button>

  <div className="breadcrumb">
    Workspace <span>/</span> <strong>{activePage}</strong>
  </div>

  <div className="topbar-user">
    <span className="online-dot" />
    Your progress is saved to your account
  </div>
</header>

        {activePage === "Overview" && <>
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR PERSONAL CAREER WORKSPACE</p>
              <h1>Welcome back, {student.name.split(" ")[0]} <span className="wave">✦</span></h1>
              <p className="welcome-copy">Build the skills. Close the gaps. Get closer to your career goals.</p>
            </div>
            <div className="welcome-date"><span className="date-mark">✧</span><span><strong>{selectedRoleName || "Your next opportunity"}</strong><small>{selectedRoleName ? "Current target role" : "Choose a target role to get started"}</small></span></div>
          </section>

          <section className="stat-grid" aria-label="Skill statistics">
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon purple">▦</span><span className="stat-caption">YOUR PLAN</span></div>
              <div className="stat-value">{selectedRole ? total : "—"}</div>
              <div className="stat-label">Skills tracked</div>
              <p className="stat-foot">{selectedRole ? "Skills for your selected career" : "Select a career to begin"}</p>
            </article>
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon green">✓</span><span className="stat-caption">COMPLETED</span></div>
              <div className="stat-value">{selectedRole ? completed : "—"}</div>
              <div className="stat-label">Skills you know</div>
              <p className="stat-foot positive">{selectedRole ? `${percentage}% of your current skill plan` : "Your achievements will appear here"}</p>
            </article>
            <article className="stat-card">
              <div className="stat-card-top"><span className="stat-icon amber">↗</span><span className="stat-caption">NEXT STEPS</span></div>
              <div className="stat-value">{selectedRole ? remainingSkills.length : "—"}</div>
              <div className="stat-label">Skills to develop</div>
              <p className="stat-foot">{selectedRole ? (remainingSkills.length ? "Your opportunities to grow" : "All listed skills marked known!") : "We'll help you identify your gaps"}</p>
            </article>
          </section>

          <section className="content-card journey-card">
            <div className="section-title-row">
              <div className="section-title-group"><span className="section-icon">✦</span><div><p className="eyebrow">YOUR NEXT STEP</p><h2>Continue your career journey</h2></div></div>
            </div>
            <p className="card-description">Move from choosing a target role to tracking skills, identifying gaps, and building a practical learning plan.</p>
            <div className="journey-actions">
              <button type="button" className="primary-button" onClick={() => navigateToPage(selectedRole ? "My Skills" : "Career Path")}>
                {selectedRole ? "View your skills →" : "Choose your career path →"}
              </button>
              {selectedRole && <button type="button" className="secondary-button" onClick={() => navigateToPage("Skill Gaps")}>Explore skill gaps</button>}
            </div>
          </section>
        </>}

        {activePage === "Career Path" && <section className="content-card career-card" id="career">
          <div className="section-title-row">
            <div className="section-title-group"><span className="section-icon">◎</span><div><p className="eyebrow">STEP 01 · SET YOUR DIRECTION</p><h2>Choose your career path</h2></div></div>
            <span className="subtle-tag">CAREER GOAL</span>
          </div>
          <p className="card-description">Select the role you're aiming for. RoleReady will map the skills associated with that career.</p>
          <label className="field-label" htmlFor="role">Target job role</label>
          <select id="role" value={selectedRole} onChange={(event) => { setSelectedRole(event.target.value); setMessage(""); }}>
            <option value="">Select a career path</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.role_name}</option>)}
          </select>
          {message && <p className="inline-message" role="status">{message}</p>}
          {selectedRoleName && <>
            <p className="save-hint"><span>✓</span> Current target: {selectedRoleName}</p>
            <div className="journey-next-step">
              <div><strong>Your career path is selected.</strong><p>Next, review the skills for this role and mark the ones you already know.</p></div>
              <button type="button" className="primary-button" onClick={() => navigateToPage("My Skills")}>See your skills →</button>
            </div>
          </>}
        </section>}

        {activePage === "My Skills" && (selectedRole ? <section className="content-card progress-section" id="skills">
          <div className="section-title-row">
            <div className="section-title-group"><span className="section-icon">◉</span><div><p className="eyebrow">STEP 02 · TRACK YOUR GROWTH</p><h2>Your skill progress</h2></div></div>
            <span className="subtle-tag">{completed} OF {total} COMPLETED</span>
          </div>
          <div className="progress-overview">
            <div className="progress-copy"><span>Overall readiness progress</span><strong>{percentage}%</strong></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>
            <div className="progress-meta"><span>{completed} skills completed</span><span>{remainingSkills.length} remaining</span></div>
          </div>
          {skills.length ? <div className="skills-grid">
            {skills.map((skill) => <label className={`skill-row ${skill.known ? "is-complete" : ""}`} key={skill.id}>
              <input type="checkbox" checked={Boolean(skill.known)} disabled={savingSkills.includes(skill.id)} onChange={() => toggleSkill(skill.id)} />
              <span className="custom-check" aria-hidden="true">{skill.known ? "✓" : ""}</span>
              <span className="skill-name">{skill.skill_name}</span>
              <span className={`skill-status ${skill.known ? "complete" : ""}`}>{savingSkills.includes(skill.id) ? "Saving…" : skill.known ? "Completed" : "To learn"}</span>
            </label>)}
          </div> : <div className="empty-state"><span className="empty-icon">◎</span><strong>No skills are linked to this role yet</strong><p>Add role-to-skill mappings in your database to display a checklist here.</p></div>}
          <p className="save-hint"><span>✓</span> Your changes are saved to your account automatically.</p>
          <div className="journey-next-step">
            <div><strong>Ready for your next step?</strong><p>Find the skills you still need to develop and add them to your learning plan.</p></div>
            <button type="button" className="primary-button" onClick={() => navigateToPage("Skill Gaps")}>View skill gaps →</button>
          </div>
        </section> : <div className="content-card empty-state"><span className="empty-icon">◎</span><strong>Choose a career path first</strong><p>Open Career Path and select a target role to see and track its skills.</p><button type="button" className="primary-button" onClick={() => navigateToPage("Career Path")}>Choose career path →</button></div>)}

        {activePage === "Skill Gaps" && (selectedRole ? <section className="content-card gaps-section" id="skill-gaps">
          <div className="section-title-row">
            <div className="section-title-group"><span className="section-icon gap-icon">↗</span><div><p className="eyebrow">STEP 03 · FOCUS YOUR EFFORT</p><h2>Your skill gaps</h2></div></div>
            <span className="subtle-tag">{remainingSkills.length} TO DEVELOP</span>
          </div>
          {remainingSkills.length ? <>
            <p className="card-description">These are the skills you haven't marked as known yet. Use this list to decide what to learn next.</p>
            <div className="gap-list">{remainingSkills.map((skill, index) => <div className="gap-row" key={skill.id}><span className="gap-number">{String(index + 1).padStart(2, "0")}</span><span className="gap-skill-name">{skill.skill_name}</span>
              <button type="button" className="gap-action" onClick={() => addToLearningPlan(skill)} disabled={addingTaskIds.includes(skill.id)}>
                {addingTaskIds.includes(skill.id) ? "Adding..." : "Add to learning plan"}<span>↗</span>
              </button>
            </div>)}</div>
          </> : <div className="complete-state"><span className="complete-mark">✓</span><div><strong>Excellent progress!</strong><p>You've marked every listed skill as known for this career. Keep practising to maintain your edge.</p></div></div>}
          <div className="journey-next-step">
            <div><strong>Turn these gaps into action.</strong><p>Add skills to your learning plan, set target dates, and track each task until completion.</p></div>
            <button type="button" className="primary-button" onClick={() =>navigateToPage("Learning Plan")}>Open learning plan →</button>
          </div>
        </section> : <div className="content-card empty-state"><span className="empty-icon">↗</span><strong>Choose a career path first</strong><p>Select a target role to identify the skills you still need to develop.</p><button type="button" className="primary-button" onClick={() => navigateToPage("Career Path")}>Choose career path →</button></div>)}

        {activePage === "Learning Plan" && (selectedRole ? <section className="content-card learning-plan-section" id="learning-plan">
          <div className="section-title-row">
            <div className="section-title-group"><span className="section-icon">✦</span><div><p className="eyebrow">STEP 04 · TAKE ACTION</p><h2>My learning plan</h2></div></div>
            <span className="subtle-tag">{learningTasks.filter((task) => String(task.role_id) === String(selectedRole) && task.status === "Completed").length} / {learningTasks.filter((task) => String(task.role_id) === String(selectedRole)).length} COMPLETED</span>
          </div>
          {learningPlanMessage && <p className="inline-message" role="status">{learningPlanMessage}</p>}
          {learningTasks.filter((task) => String(task.role_id) === String(selectedRole)).length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✦</span><strong>Your learning plan starts here</strong><p>Add a skill from Skill Gaps to create your first learning task.</p><button type="button" className="primary-button" onClick={() => navigateToPage("Skill Gaps")}>Explore skill gaps →</button></div>
          ) : (
            <div className="learning-task-list">
              {learningTasks.filter((task) => String(task.role_id) === String(selectedRole)).map((task) => (
                <article className="learning-task" key={task.id}>
                  <div className="learning-task-progress"><span className={`learning-task-progress-fill ${task.status === "Completed" ? "is-complete" : ""}`} style={{ width: task.status === "Completed" ? "100%" : task.status === "In Progress" ? "50%" : "0%" }} /></div>
                  <div className="learning-task-info"><strong>{task.skill_name || `Skill #${task.skill_id}`}</strong><span>{selectedRoleName}</span></div>
                  <label className="learning-task-date">Target date<input type="date" value={task.target_date || ""} onChange={(event) => updateLearningTask(task.id, { target_date: event.target.value || null })} /></label>
                  <label className="learning-task-status">Status<select value={task.status} onChange={(event) => updateLearningTask(task.id, { status: event.target.value })}><option>Not Started</option><option>In Progress</option><option>Completed</option></select></label>
                   
<button
  type="button"
  className="remove-task-button"
  onClick={() => removeLearningTask(task.id)}
>
  <span aria-hidden="true">✕</span> Remove
</button>

                </article>
                
              ))}
            </div>
          )}
          <div className="journey-next-step">
            <div><strong>Keep your plan moving.</strong><p>You can return to your skills anytime to update your progress or add another skill.</p></div>
            <button type="button" className="secondary-button" onClick={() => navigateToPage("My Skills")}>Back to my skills</button>
          </div>
        </section> : <div className="content-card empty-state"><span className="empty-icon">✦</span><strong>Choose a career path first</strong><p>Your learning plan is organized around your selected target role.</p><button type="button" className="primary-button" onClick={() => navigateToPage("Career Path")}>Choose career path →</button></div>)}

        <footer className="dashboard-footer"><span>© 2026 RoleReady</span><span>Small steps. Strong skills. Better opportunities.</span><a href="#overview" onClick={(event) => { event.preventDefault(); navigateToPage("Overview"); }}>Back to overview ↑</a></footer>
      </main>
    </div>
  );
}

export default App;
