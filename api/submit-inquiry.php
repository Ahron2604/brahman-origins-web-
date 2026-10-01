<?php
// =============================================================================
// POST /api/submit-inquiry.php
// Accepts JSON: { name, email, message }
// Inserts a row into the public.inquiries table via Supabase REST API.
// =============================================================================

require_once __DIR__ . '/config.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Method not allowed.', 405);
}

// Parse JSON body
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    json_response(false, 'Invalid JSON body.', 400);
}

$name    = clean($data['name']    ?? null);
$email   = clean($data['email']   ?? null);
$message = clean($data['message'] ?? null);

// Validate required fields
$errors = [];
if (!$name)    $errors[] = 'Name is required.';
if (!$email)   $errors[] = 'Email is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email is not valid.';
if (!$message) $errors[] = 'Message is required.';

if (!empty($errors)) {
    json_response(false, implode(' ', $errors), 422);
}

// Insert into Supabase
$result = supabase_request('inquiries', 'POST', [
    'name'    => $name,
    'email'   => $email,
    'message' => $message,
    'status'  => 'open'
]);

if ($result['status'] >= 200 && $result['status'] < 300) {
    json_response(true, 'Inquiry submitted successfully.');
} else {
    error_log('Supabase inquiry insert error: ' . json_encode($result['body']));
    json_response(false, 'Failed to save inquiry. Please try again.', 500);
}
