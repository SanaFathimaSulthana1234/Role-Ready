-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 04:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `roleready`
--

-- --------------------------------------------------------

--
-- Table structure for table `learning_plan_tasks`
--

CREATE TABLE `learning_plan_tasks` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `target_date` date DEFAULT NULL,
  `status` enum('Not Started','In Progress','Completed') NOT NULL DEFAULT 'Not Started',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `learning_plan_tasks`
--

INSERT INTO `learning_plan_tasks` (`id`, `student_id`, `role_id`, `skill_id`, `target_date`, `status`, `created_at`) VALUES
(1, 2, 1, 4, NULL, 'In Progress', '2026-10-27 15:48:23'),
(7, 2, 1, 2, NULL, 'Not Started', '2026-10-27 17:11:06'),
(8, 2, 1, 9, NULL, 'Completed', '2026-10-27 17:11:09'),
(20, 2, 6, 10, NULL, 'Not Started', '2026-10-29 14:01:01'),
(23, 2, 3, 9, NULL, 'Not Started', '2026-10-29 14:29:46');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'Frontend Developer'),
(2, 'Backend Developer'),
(3, 'Java Developer'),
(4, 'Data Analyst'),
(5, 'Full Stack Developer'),
(6, 'C++ Developer');

-- --------------------------------------------------------

--
-- Table structure for table `role_skills`
--

CREATE TABLE `role_skills` (
  `role_id` int(11) NOT NULL,
  `skill_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_skills`
--

INSERT INTO `role_skills` (`role_id`, `skill_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 9),
(2, 3),
(2, 5),
(2, 6),
(2, 7),
(2, 9),
(2, 16),
(3, 7),
(3, 8),
(3, 9),
(3, 11),
(3, 15),
(4, 7),
(4, 12),
(4, 13),
(4, 14),
(5, 1),
(5, 2),
(5, 3),
(5, 4),
(5, 5),
(5, 6),
(5, 7),
(5, 9),
(5, 16),
(6, 7),
(6, 9),
(6, 10),
(6, 11),
(6, 15);

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `skill_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `skill_name`) VALUES
(1, 'HTML'),
(2, 'CSS'),
(3, 'JavaScript'),
(4, 'React'),
(5, 'Node.js'),
(6, 'Express'),
(7, 'SQL'),
(8, 'Java'),
(9, 'Git'),
(10, 'C++'),
(11, 'Data Structures and Algorithms'),
(12, 'Excel'),
(13, 'Python'),
(14, 'Power BI'),
(15, 'OOP'),
(16, 'REST APIs');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `email`, `password_hash`, `created_at`) VALUES
(1, 'Test Student', 'teststudent@example.com', '$2b$10$TyX7svUz/zEi40uCfHXHjOSOcyzD8Aj5vtBr42xUOAiE8Jfi3ONgS', '2026-10-26 14:45:48'),
(2, 'Shaik Sabiha', 'sksabiha678@gmail.com', '$2b$10$IStXFyHJpG4WN7ihnzXELeIkEe3Ye/OdeLtKjxQQaPND70lrPSy/6', '2026-10-26 15:09:16');

-- --------------------------------------------------------

--
-- Table structure for table `student_skill_progress`
--

CREATE TABLE `student_skill_progress` (
  `id` int(11) NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `skill_id` int(11) NOT NULL,
  `status` enum('Learning','Completed') DEFAULT 'Learning',
  `student_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_skill_progress`
--

INSERT INTO `student_skill_progress` (`id`, `student_name`, `skill_id`, `status`, `student_id`) VALUES
(1, 'Shaik Sabiha', 2, 'Completed', 2),
(2, 'Shaik Sabiha', 3, 'Completed', 2),
(3, 'Shaik Sabiha', 1, 'Completed', 2),
(4, 'Shaik Sabiha', 6, 'Learning', 2),
(5, 'Shaik Sabiha', 9, 'Learning', 2),
(6, 'Shaik Sabiha', 12, 'Learning', 2),
(7, 'Shaik Sabiha', 10, 'Learning', 2),
(8, 'Shaik Sabiha', 11, 'Completed', 2),
(9, 'Shaik Sabiha', 8, 'Completed', 2),
(10, 'Shaik Sabiha', 15, 'Completed', 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `learning_plan_tasks`
--
ALTER TABLE `learning_plan_tasks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_role_skill` (`student_id`,`role_id`,`skill_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `role_skills`
--
ALTER TABLE `role_skills`
  ADD PRIMARY KEY (`role_id`,`skill_id`),
  ADD KEY `skill_id` (`skill_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `student_skill_progress`
--
ALTER TABLE `student_skill_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skill_id` (`skill_id`),
  ADD KEY `fk_progress_student` (`student_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `learning_plan_tasks`
--
ALTER TABLE `learning_plan_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `student_skill_progress`
--
ALTER TABLE `student_skill_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `learning_plan_tasks`
--
ALTER TABLE `learning_plan_tasks`
  ADD CONSTRAINT `learning_plan_tasks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `learning_plan_tasks_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `learning_plan_tasks_ibfk_3` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`);

--
-- Constraints for table `role_skills`
--
ALTER TABLE `role_skills`
  ADD CONSTRAINT `role_skills_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `role_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`);

--
-- Constraints for table `student_skill_progress`
--
ALTER TABLE `student_skill_progress`
  ADD CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_skill_progress_ibfk_1` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
