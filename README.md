RoleReady – Job Readiness & Skill Gap Tracker

RoleReady is a web-based application designed to help students identify job-specific skill gaps, track learning progress, and prepare for their target careers through personalized skill checklists and progress tracking.

Features

- Identify skills required for target job roles
- Track learning progress and skill completion
- Identify skill gaps and areas for improvement
- Organize career preparation in one place
- Store application data using a database

Technologies Used

Frontend

- React
- Vite
- HTML
- CSS
- JavaScript

Backend

- Node.js
- Express.js

Database

- MySQL

Project Structure

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
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── database/
│   └── roleready.sql
└── README.md

Database Setup

1. Start your MySQL server.
2. Open phpMyAdmin or your preferred MySQL client.
3. Create the required database.
4. Import the provided "roleready.sql" file.
5. Configure the backend database connection using environment variables.

Running the Project

Backend

Open a terminal in the backend folder and run:

npm install
node server.js

Frontend

Open another terminal in the frontend folder and run:

npm install
npm run dev

Open the local URL displayed by Vite in your browser.

Project Purpose

RoleReady aims to help students prepare for their target careers by identifying skill gaps and making learning progress easier to organize and track.
