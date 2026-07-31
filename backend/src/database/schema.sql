-- ============================================================
-- Campus Resource Booking Portal (v1.0 MVP) - Database Schema
-- Database: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_booking_db;
USE campus_booking_db;

-- Drop tables if re-initialization is required (Order matters due to Foreign Keys)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS resource_types;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- 1. Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Core Roles
INSERT INTO roles (id, name) VALUES 
(1, 'ADMIN'),
(2, 'FACULTY'),
(3, 'STUDENT');

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department VARCHAR(100) DEFAULT 'General',
    roll_or_emp_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Resource Types Table
CREATE TABLE resource_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_name VARCHAR(50) DEFAULT 'building'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Resource Categories
INSERT INTO resource_types (id, name, icon_name) VALUES 
(1, 'Auditorium', 'video'),
(2, 'Seminar Hall', 'users'),
(3, 'Classroom', 'book-open'),
(4, 'Computer Lab', 'monitor'),
(5, 'Sports Ground', 'activity');

-- 4. Resources Table
CREATE TABLE resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    resource_type_id INT NOT NULL,
    building VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    capacity INT NOT NULL,
    amenities TEXT, -- Comma separated e.g. "Projector, AC, Sound System, WiFi"
    status ENUM('AVAILABLE', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Sample Campus Resources
INSERT INTO resources (name, resource_type_id, building, room_number, capacity, amenities, status) VALUES
('Main University Auditorium', 1, 'Admin Block', 'AUD-01', 500, 'Projector, AC, Sound System, Stage Lighting, Mic', 'AVAILABLE'),
('APJ Abdul Kalam Seminar Hall', 2, 'Science Block', 'SH-201', 150, 'Projector, AC, Podium, Mic', 'AVAILABLE'),
('CS High Performance Lab', 4, 'IT Block', 'LAB-304', 60, 'Computers, High Speed WiFi, AC, Projector', 'AVAILABLE'),
('Smart Classroom 101', 3, 'Academic Block A', 'CR-101', 80, 'Smart Board, AC, Projector', 'AVAILABLE'),
('Central Sports Complex Ground', 5, 'Sports Complex', 'G-01', 1000, 'Flood Lights, Seating Pavilion, Sound System', 'AVAILABLE');

-- 5. Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    resource_id INT NOT NULL,
    user_id INT NOT NULL,
    event_title VARCHAR(150) NOT NULL,
    purpose_reason TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    admin_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- High-Performance Composite Index for Conflict Overlap Searches
CREATE INDEX idx_booking_conflict ON bookings (resource_id, status, start_time, end_time);
