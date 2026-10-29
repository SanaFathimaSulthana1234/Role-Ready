# RoleReady – Job Readiness & Skill Gap Tracker

RoleReady is a full-stack web application that helps students identify job-specific skill gaps, track their learning progress, and prepare for their target careers through personalized skill checklists and progress tracking.

## Features

- Identify skills required for target job roles.
- Track learning progress and skill completion.
- Identify skill gaps and areas for improvement.
- Organize career preparation in one place.
- Store application data using a database.

## Technologies Used

**Frontend**
- React.js
- JavaScript
- HTML
- CSS
- Vite

**Backend**
- Node.js
- Express.js

**Database**
- MySQL / SQL

## Project Structure

```text
Role-Ready/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── package-lock.json
├── database/
│   └── roleready.sql
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- MySQL
- A code editor such as Visual Studio Code

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/SanaFathimaSulthana1234/Role-Ready.git
   ```

2. Install frontend dependencies:

   ```bash
   cd Role-Ready/frontend
   npm install
   ```

3. Install backend dependencies:

   ```bash
   cd ../backend
   npm install
   ```

4. Configure your database connection using environment variables.

5. Import `database/roleready.sql` into MySQL.

6. Start the frontend and backend using the commands configured in their respective `package.json` files.

## Purpose

RoleReady aims to help students prepare for software engineering and other technology careers by making skill development more organized and measurable.

