<?php
// =============================================================================
// POST /api/submit-ticket.php
// Accepts JSON: { title, description, tag, player_id? }
// Inserts a row into the public.tickets table via Supabase REST API.
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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    json_response(false, 'Invalid JSON body.', 400);
}

$title       = clean($data['title']       ?? null);
$description = clean($data['description'] ?? null);
$tag         = clean($data['tag']         ?? 'Technical Issue');
$player_id   = clean($data['player_id']   ?? null);

$allowedTags = ['Technical Issue', 'Gameplay Feedback', 'XP / Progress Bug', 'Other'];
if (!in_array($tag, $allowedTags, true)) {
    $tag = 'Technical Issue';
}

if (!$title) {
    json_response(false, 'Title is required.', 422);
}

$payload = [
    'title'       => $title,
    'description' => $description,
    'tag'         => $tag,
    'status'      => 'open'
];

if ($player_id) {
    $payload['player_id'] = $player_id;
}

$result = supabase_request('tickets', 'POST', $payload);

if ($result['status'] >= 200 && $result['status'] < 300) {
    json_response(true, 'Report submitted successfully.');
} else {
    error_log('Supabase ticket insert error: ' . json_encode($result['body']));
    json_response(false, 'Failed to save report. Please try again.', 500);
}
