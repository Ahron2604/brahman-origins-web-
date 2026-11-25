<?php
// =============================================================================
// GET /api/get-inquiries.php
// Returns all inquiries ordered by newest first.
// Optional query param: ?status=open
// =============================================================================

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(false, 'Method not allowed.', 405);
}

$statusFilter = clean($_GET['status'] ?? null);
$query = 'order=created_at.desc&select=*';
if ($statusFilter) {
    $query .= '&status=eq.' . urlencode($statusFilter);
}

$result = supabase_request('inquiries', 'GET', [], $query);

if ($result['status'] >= 200 && $result['status'] < 300) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    echo json_encode(['success' => true, 'data' => $result['body'] ?? []]);
} else {
    json_response(false, 'Failed to fetch inquiries.', 500);
}
