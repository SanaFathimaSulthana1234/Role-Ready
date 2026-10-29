
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "RoleReady backend is running!" });
});

// 2. Fetch career roles
app.get("/api/roles", async (req, res) => {
  try {
    const [roles] = await db.query(
      "SELECT id, role_name FROM roles ORDER BY id"
    );

    res.json(roles);
  } catch (error) {
    console.error("Roles error:", error.message);
    res.status(500).json({ error: "Could not fetch roles" });
  }
});

// 3. Fetch skills for a career
app.get("/api/roles/:id/skills", async (req, res) => {
  try {
    const roleId = Number(req.params.id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return res.status(400).json({ error: "Invalid role ID" });
    }

    const [skills] = await db.query(
      `SELECT s.id, s.skill_name, FALSE AS known
       FROM skills s
       JOIN role_skills rs ON rs.skill_id = s.id
       WHERE rs.role_id = ?
       ORDER BY s.skill_name`,
      [roleId]
    );

    res.json(skills);
  } catch (error) {
    console.error("Skills error:", error.message);
    res.status(500).json({ error: "Could not fetch skills" });
  }
});

// 4. Student registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Name, email, and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length > 100 || cleanEmail.length > 255) {
      return res.status(400).json({
        error: "Name or email is too long"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address"
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM students WHERE email = ?",
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO students (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash]
    );

    res.status(201).json({
      message: "Student registered successfully",
      student: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Could not register student" });
  }
});

// 5. Student login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [students] = await db.query(
      `SELECT id, name, email, password_hash
       FROM students
       WHERE email = ?`,
      [cleanEmail]
    );

    if (students.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const student = students[0];
    const passwordMatches = await bcrypt.compare(
      password,
      student.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Authentication is not configured"
      });
    }

    const token = jwt.sign(
      { studentId: student.id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Could not log in" });
  }
});

// 6. Verify the student's token
app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication token required"
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Authentication is not configured"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [students] = await db.query(
      "SELECT id, name, email FROM students WHERE id = ?",
      [decoded.studentId]
    );

    if (students.length === 0) {
      return res.status(401).json({
        error: "Student account not found"
      });
    }

    res.json({ student: students[0] });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    console.error("Authentication error:", error.message);
    res.status(500).json({ error: "Could not verify account" });
  }
});


/* 7. Verify a student token */
function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = authHeader.slice(7);
    req.student = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* 8. Fetch saved progress for a career */
app.get("/api/progress/:roleId", authenticateStudent, async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return res.status(400).json({ error: "Invalid role ID" });
    }

    const [rows] = await db.query(
      `SELECT s.id AS skill_id, s.skill_name,
              COALESCE(p.status, 'Learning') AS status
       FROM role_skills rs
       JOIN skills s ON s.id = rs.skill_id
       LEFT JOIN student_skill_progress p
         ON p.skill_id = s.id AND p.student_id = ?
       WHERE rs.role_id = ?
       ORDER BY s.skill_name`,
      [req.student.studentId, roleId]
    );

    res.json(rows.map((row) => ({
      id: row.skill_id,
      skill_name: row.skill_name,
      known: row.status === "Completed"
    })));
  } catch (error) {
    console.error("Progress fetch error:", error.message);
    res.status(500).json({ error: "Could not fetch progress" });
  }
});

/* 9. Save progress for one skill */
app.put(
  "/api/progress/:roleId/:skillId",
  authenticateStudent,
  async (req, res) => {
    try {
      const roleId = Number(req.params.roleId);
      const skillId = Number(req.params.skillId);
      const { known } = req.body;

      if (
        !Number.isInteger(roleId) || roleId <= 0 ||
        !Number.isInteger(skillId) || skillId <= 0 ||
        typeof known !== "boolean"
      ) {
        return res.status(400).json({ error: "Invalid progress data" });
      }

      const [mapping] = await db.query(
        `SELECT 1 FROM role_skills
         WHERE role_id = ? AND skill_id = ?`,
        [roleId, skillId]
      );

      if (mapping.length === 0) {
        return res.status(400).json({
          error: "This skill does not belong to the selected career"
        });
      }

      const status = known ? "Completed" : "Learning";

      const [existing] = await db.query(
        `SELECT id FROM student_skill_progress
         WHERE student_id = ? AND skill_id = ?`,
        [req.student.studentId, skillId]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE student_skill_progress
           SET status = ?, student_name = (
             SELECT name FROM students WHERE id = ?
           )
           WHERE student_id = ? AND skill_id = ?`,
          [status, req.student.studentId, req.student.studentId, skillId]
        );
      } else {
        await db.query(
          `INSERT INTO student_skill_progress
           (student_id, student_name, skill_id, status)
           SELECT id, name, ?, ?
           FROM students WHERE id = ?`,
          [skillId, status, req.student.studentId]
        );
      }

      res.json({
        message: "Progress saved successfully",
        skillId,
        status
      });
    } catch (error) {
      console.error("Progress save error:", error.message);
      res.status(500).json({ error: "Could not save progress" });
    }
  }
);

/* 10. Get the logged-in student's learning plan */
app.get("/api/learning-plan", authenticateStudent, async (req, res) => {
  try {
    const [tasks] = await db.query(
      `SELECT
         lp.id,
         lp.role_id,
         r.role_name,
         lp.skill_id,
         s.skill_name,
         DATE_FORMAT(lp.target_date, '%Y-%m-%d') AS target_date,
         lp.status,
         lp.created_at
       FROM learning_plan_tasks lp
       JOIN roles r ON r.id = lp.role_id
       JOIN skills s ON s.id = lp.skill_id
       WHERE lp.student_id = ?
       ORDER BY lp.created_at DESC`,
      [req.student.studentId]
    );

    res.json(tasks);
  } catch (error) {
    console.error("Learning plan fetch error:", error.message);
    res.status(500).json({ error: "Could not load learning plan" });
  }
});


/* 11. Add a skill to the learning plan */
app.post("/api/learning-plan", authenticateStudent, async (req, res) => {
  try {
    const roleId = Number(req.body.role_id);
    const skillId = Number(req.body.skill_id);

    if (
      !Number.isInteger(roleId) || roleId <= 0 ||
      !Number.isInteger(skillId) || skillId <= 0
    ) {
      return res.status(400).json({ error: "Invalid role or skill" });
    }

    // Ensure this skill belongs to the selected role.
    const [mapping] = await db.query(
      `SELECT 1 FROM role_skills
       WHERE role_id = ? AND skill_id = ?`,
      [roleId, skillId]
    );

    if (!mapping.length) {
      return res.status(400).json({
        error: "This skill does not belong to the selected career"
      });
    }

    // Avoid adding the same skill twice for the same student and role.
    await db.query(
      `INSERT IGNORE INTO learning_plan_tasks
       (student_id, role_id, skill_id)
       VALUES (?, ?, ?)`,
      [req.student.studentId, roleId, skillId]
    );

    const [tasks] = await db.query(
      `SELECT id, role_id, skill_id, target_date, status
       FROM learning_plan_tasks
       WHERE student_id = ? AND role_id = ? AND skill_id = ?`,
      [req.student.studentId, roleId, skillId]
    );

    res.status(200).json({
      message: "Skill added to your learning plan",
      task: tasks[0]
    });
  } catch (error) {
    console.error("Learning plan add error:", error.message);
    res.status(500).json({ error: "Could not add skill to learning plan" });
  }
});

/* 12. Remove a skill from the learning plan */
app.delete("/api/learning-plan/:id", authenticateStudent, async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid learning task ID" });
    }

    // Delete only a task belonging to the logged-in student.
    const [result] = await db.query(
      `DELETE FROM learning_plan_tasks
       WHERE id = ? AND student_id = ?`,
      [taskId, req.student.studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Learning task not found or already removed"
      });
    }

    res.json({ message: "Skill removed from your learning plan" });
  } catch (error) {
    console.error("Learning plan delete error:", error.message);
    res.status(500).json({
      error: "Could not remove skill from learning plan"
    });
  }
});


/* 12. Update a learning task's status or target date */
app.patch(
  "/api/learning-plan/:id",
  authenticateStudent,
  async (req, res) => {
    try {
      const taskId = Number(req.params.id);
      const { status, target_date } = req.body;

      if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const validStatuses = [
        "Not Started",
        "In Progress",
        "Completed"
      ];

      if (
        status !== undefined &&
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({ error: "Invalid task status" });
      }

      if (
        target_date !== undefined &&
        target_date !== null &&
        (
          typeof target_date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(target_date) ||
          !Number.isFinite(Date.parse(target_date)) ||
          new Date(`${target_date}T00:00:00.000Z`)
            .toISOString().slice(0, 10) !== target_date
        )
      ) {
        return res.status(400).json({ error: "Invalid target date" });
      }

      if (status === undefined && target_date === undefined) {
        return res.status(400).json({
          error: "Provide a status or target date to update"
        });
      }

      const [existing] = await db.query(
        `SELECT id FROM learning_plan_tasks
         WHERE id = ? AND student_id = ?`,
        [taskId, req.student.studentId]
      );

      if (!existing.length) {
        return res.status(404).json({ error: "Learning task not found" });
      }

      const updates = [];
      const values = [];

      if (status !== undefined) {
        updates.push("status = ?");
        values.push(status);
      }

      if (target_date !== undefined) {
        updates.push("target_date = ?");
        values.push(target_date);
      }

      values.push(taskId, req.student.studentId);

      await db.query(
        `UPDATE learning_plan_tasks
         SET ${updates.join(", ")}
         WHERE id = ? AND student_id = ?`,
        values
      );

      res.json({ message: "Learning task updated successfully" });
    } catch (error) {
      console.error("Learning plan update error:", error.message);
      res.status(500).json({ error: "Could not update learning task" });
    }
  }
);



// 7. Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RoleReady backend running at http://localhost:${PORT}`);
});
