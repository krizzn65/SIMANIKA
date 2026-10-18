<?php

/**
 * Development router for PHP's built-in server.
 *
 * Usage: php -S 127.0.0.1:8000 -t public public/router.php
 *
 * The built-in server is single threaded, so serving every gallery/testimonial
 * image through a full Laravel bootstrap made the landing-page gallery load one
 * photo at a time (only the first image was visible for several seconds).
 * This router streams those files directly, which is a few milliseconds each.
 */

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (($method === 'GET' || $method === 'HEAD') &&
    preg_match('#^/api/public/home/images/(gallery|testimonials)/([A-Za-z0-9_-]+\.(?:jpe?g|png|webp))$#i', $path, $matches)) {
    $file = __DIR__ . '/../storage/app/public/landing/' . $matches[1] . '/' . $matches[2];

    if (is_file($file)) {
        $types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        header('Content-Type: ' . ($types[$extension] ?? 'application/octet-stream'));
        header('Content-Length: ' . (string) filesize($file));
        header('Cache-Control: public, max-age=86400');

        if ($method === 'GET') {
            readfile($file);
        }

        return true;
    }
}

// Let the built-in server serve other existing static files (if any) directly.
if (is_file(__DIR__ . $path)) {
    return false;
}

require __DIR__ . '/index.php';
