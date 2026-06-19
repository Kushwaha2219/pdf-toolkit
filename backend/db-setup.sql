-- Run this once in MySQL Workbench (connected as root) to set up PDFVish.
-- It creates the database and a dedicated app user with a known password,
-- so the app never needs the root password.
--
-- mysql_native_password is used so the Python driver (PyMySQL) connects
-- without needing the extra `cryptography` package.

CREATE DATABASE IF NOT EXISTS pdfvish
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pdfvish_app'@'localhost'
  IDENTIFIED WITH mysql_native_password BY 'PdfVish#2026';

GRANT ALL PRIVILEGES ON pdfvish.* TO 'pdfvish_app'@'localhost';

FLUSH PRIVILEGES;
