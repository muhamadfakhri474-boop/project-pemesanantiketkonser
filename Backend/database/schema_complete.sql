-- ============================================================
-- KONser Ticket - Complete Database Schema
-- MySQL 8.0+
-- Fresh install: run this file on a new database.
-- Do not run on an existing production database without backup.
-- ============================================================

CREATE DATABASE IF NOT EXISTS konser_ticket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE konser_ticket;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_seats;
DROP TABLE IF EXISTS event_seats;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS password_reset_otps;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE TABLE artists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  genre VARCHAR(50) NULL,
  photo VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artist_id INT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  venue VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  genre VARCHAR(50) NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  poster VARCHAR(255) NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  payment_deadline_minutes INT NOT NULL DEFAULT 30,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
  INDEX idx_events_date (event_date),
  INDEX idx_events_status (status),
  INDEX idx_events_genre (genre)
) ENGINE=InnoDB;

-- ============================================================
-- EVENT ARTISTS (Relasi multi-artist untuk konser)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_artists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  artist_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ea_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  UNIQUE KEY uq_event_artist (event_id, artist_id),
  INDEX idx_ea_event (event_id),
  INDEX idx_ea_artist (artist_id)
) ENGINE=InnoDB;

-- ============================================================
-- PASSWORD RESET OTP
-- ============================================================
CREATE TABLE password_reset_otps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email (email),
  INDEX idx_otp_expiry (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- TICKET CATEGORIES
-- ============================================================
CREATE TABLE ticket_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  benefits TEXT NULL,
  price DECIMAL(12,2) NOT NULL,
  quota INT UNSIGNED NOT NULL,
  remaining_quota INT UNSIGNED NOT NULL,
  CONSTRAINT fk_category_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT uq_category_event_name UNIQUE (event_id, name),
  CONSTRAINT chk_category_price CHECK (price >= 0),
  CONSTRAINT chk_category_quota CHECK (remaining_quota <= quota),
  INDEX idx_categories_event (event_id)
) ENGINE=InnoDB;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  event_id INT UNSIGNED NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  payment_status ENUM('pending','paid','failed','rejected','cancelled','expired') NOT NULL DEFAULT 'pending',
  payment_proof VARCHAR(255) NULL,
  snap_token VARCHAR(255) NULL,
  payment_url VARCHAR(255) NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_deadline DATETIME NULL,
  quota_released_at DATETIME NULL,
  ticket_token CHAR(36) NULL,
  redeemed_at DATETIME NULL,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_order_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT uq_orders_ticket_token UNIQUE (ticket_token),
  CONSTRAINT chk_order_total CHECK (total_price >= 0),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_event (event_id),
  INDEX idx_orders_status (payment_status),
  INDEX idx_orders_deadline (payment_status, payment_deadline)
) ENGINE=InnoDB;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  ticket_category_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id),
  CONSTRAINT chk_item_quantity CHECK (quantity > 0),
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_category (ticket_category_id)
) ENGINE=InnoDB;

-- ============================================================
-- PAYMENTS / MIDTRANS
-- ============================================================
CREATE TABLE payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  payment_method VARCHAR(50) NULL,
  transaction_id VARCHAR(255) NULL,
  transaction_status VARCHAR(50) NULL,
  payment_proof VARCHAR(255) NULL,
  verified_by INT UNSIGNED NULL,
  verified_at DATETIME NULL,
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_admin FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_transaction (transaction_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- INDIVIDUAL SEATS
-- ============================================================
CREATE TABLE event_seats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED NOT NULL,
  ticket_category_id INT UNSIGNED NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  row_label VARCHAR(20) NOT NULL,
  seat_number INT UNSIGNED NOT NULL,
  seat_label VARCHAR(80) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  status ENUM('available','held','sold','blocked') NOT NULL DEFAULT 'available',
  held_until DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seat_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_seat_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id) ON DELETE RESTRICT,
  CONSTRAINT uq_event_seat_label UNIQUE (event_id, seat_label),
  CONSTRAINT chk_seat_price CHECK (price >= 0),
  INDEX idx_seat_event_status (event_id, status),
  INDEX idx_seat_held_until (held_until)
) ENGINE=InnoDB;

CREATE TABLE order_seats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  event_seat_id INT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  redeemed_at DATETIME NULL,
  CONSTRAINT fk_order_seat_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_seat_seat FOREIGN KEY (event_seat_id) REFERENCES event_seats(id),
  CONSTRAINT uq_order_event_seat UNIQUE (event_seat_id),
  INDEX idx_order_seats_order (order_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEED ADMIN
-- Password hash existing in the project seed. Change it after login.
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- ============================================================
-- SEED ARTISTS
-- ============================================================
INSERT INTO artists (id, name, description, genre, photo) VALUES
(1, 'I Prevail', 'I Prevail is an American rock band known for blending post-hardcore, metalcore, and alternative rock.', 'Post-Hardcore', 'uploads/artists/i_prevail-artist.jpg'),
(2, 'Avenged Sevenfold', 'Avenged Sevenfold is an American heavy metal band recognized for their dynamic guitar work and theatrical sound.', 'Heavy Metal', 'uploads/artists/avenged_sevenfold-artist.jpg'),
(3, 'Dewa 19', 'Band rock legendaris Indonesia yang dibentuk tahun 1986 di Surabaya.', 'Pop Rock', 'uploads/artists/dewa19-artist.jpg'),
(4, 'Slipknot', 'Slipknot is an American heavy metal band known for their aggressive sound and intense live performances.', 'Heavy Metal', 'uploads/artists/slipknot-artist.jpg'),
(5, 'Cigarettes After Sex', 'Cigarettes After Sex is an American ambient pop band known for their dreamy, atmospheric sound.', 'Ambient Pop', 'uploads/artists/cigarettes_as-artist.jpg');

-- ============================================================
-- SEED EVENTS
-- ============================================================
INSERT INTO events (id, artist_id, title, description, venue, city, genre, event_date, event_time, poster, status) VALUES
(1, 3, 'Dewa 19 Reunion Concert', 'Reuni bersejarah Dewa 19 bersama Ahmad Dhani, Once, dan seluruh personel legendaris.', 'Gelora Bung Karno', 'Jakarta', 'Pop Rock', '2026-11-15', '19:00:00', 'uploads/events/dewa19.jpg', 'open'),
(2, 2, 'HAIL TO THE KING LIVE', 'Witness Avenged Sevenfold deliver a massive live performance featuring powerful riffs and legendary stage energy.', 'Indonesia Arena', 'Jakarta', 'Heavy Metal', '2026-12-01', '18:30:00', 'uploads/events/avenged_sevenfold.jpg', 'open'),
(3, 1, 'TRUE POWER LIVE', 'Experience the raw energy of I Prevail in a powerful live performance filled with explosive guitar riffs and intense vocals.', 'Stadion Utama GBK', 'Jakarta', 'Post-Hardcore', '2026-10-20', '20:00:00', 'uploads/events/i_prevail.jpg', 'open'),
(4, 5, 'Cigarettes After Sex: XS LIVE', 'Step into an atmospheric night with Cigarettes After Sex. Enjoy their dreamy melodies and intimate soundscape.', 'Stadion Utama GBK', 'Jakarta', 'Ambient Pop', '2026-10-20', '20:00:00', 'uploads/events/cigarettes_as.jpg', 'open'),
(5, 4, 'KNOTFEST LIVE', 'Prepare for an intense night with Slipknot. Experience their signature heavy sound and unforgettable stage presence.', 'Stadion Utama GBK', 'Jakarta', 'Heavy Metal', '2026-10-20', '20:00:00', 'uploads/events/slipknot.jpg', 'open'),
(6, 4, 'Violent Nature', 'Violent Nature captures intense emotions, inner chaos, and the uncontrollable wild side of human nature.', 'Jakarta Internasional Stadion', 'Jakarta', 'Heavy Metal', '2026-10-28', '21:00:00', 'uploads/events/violent_nature.jpg', 'open'),
(7, 4, 'Psychosocial', 'Psychosocial portrays inner conflict, social pressure, and the struggle against manipulation and chaos.', 'Jakarta Internasional Stadion', 'Jakarta', 'Heavy Metal', '2026-10-30', '22:00:00', 'uploads/events/psychosocial.jpg', 'open');

-- ============================================================
-- SEED TICKET CATEGORIES
-- ============================================================
INSERT INTO ticket_categories (event_id, name, benefits, price, quota, remaining_quota) VALUES
(1, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1500000, 5000, 5000),
(1, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 2500000, 2000, 2000),
(1, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 5000000, 500, 500),
(1, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 30000000, 100, 100),
(2, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1290000, 4000, 4000),
(2, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 2720000, 1500, 1500),
(2, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 4500000, 300, 300),
(2, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 50000000, 100, 100),
(3, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 350000, 8000, 8000),
(3, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 750000, 3000, 3000),
(3, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 1500000, 500, 500),
(3, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 3250000, 100, 100),
(4, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1200000, 4000, 4000),
(4, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 3400000, 1500, 1500),
(4, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 4500000, 300, 300),
(4, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 4300000, 200, 200),
(5, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1200000, 4000, 4000),
(5, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 1100000, 1500, 1500),
(5, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 3500000, 300, 300),
(5, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 4600000, 150, 150),
(6, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1800000, 4000, 3800),
(6, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 2400000, 700, 500),
(6, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 3500000, 300, 250),
(6, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 4600000, 200, 100),
(7, 'Reguler', 'Concert entry access|Standard seating|Standard viewing area', 1200000, 4000, 3700),
(7, 'Premium', 'Concert entry access|Premium seating|Closer field of view', 1100000, 800, 789),
(7, 'VIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free snack|Special toilet|Exclusive ID Pass', 3500000, 600, 500),
(7, 'VVIP', 'Concert entry access|Exclusive seating|The viewing area is very close.|Exclusive merchandise|Exclusive lounge|Free all snack|Special toilet|Priority Parking|Meet & Greet|Exclusive ID Pass|Take a photo in the designated area.', 4600000, 400, 350);

-- ============================================================
-- COMPATIBILITY / MAINTENANCE HELPERS
-- ============================================================
UPDATE orders
SET payment_deadline = DATE_ADD(order_date, INTERVAL 30 MINUTE)
WHERE payment_deadline IS NULL;

-- Example verification queries:
-- SELECT * FROM users;
-- SELECT e.id, e.title, a.name AS artist_name, e.status FROM events e JOIN artists a ON a.id = e.artist_id;
-- SELECT * FROM ticket_categories;
-- SELECT * FROM orders ORDER BY id DESC;

-- Generate seats only through the backend seat generation endpoint,
-- because each seat must be linked to an existing ticket category.
