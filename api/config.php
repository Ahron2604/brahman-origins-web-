<?php
// =============================================================================
// BRAHMAN ORIGINS — Supabase API Config
// Shared by all api/*.php endpoints
// =============================================================================

define('SUPABASE_URL',     'https://xbnjmtmmclrippwoblew.supabase.co');
// Use the service_role key here so PHP can bypass RLS for server-side writes.
// NEVER expose this key in front-end JS — keep it server-side only.
define('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibmptdG1tY2xyaXBwd29ibGV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc5MzI2MywiZXhwIjoyMTA1MzY5MjYzfQ.5SeJB8ne9Xf888VkgMBjImkK71FiDElHmRyXcGSMl84');
// ^ Replace with: Supabase Dashboard → Settings → API → service_role (secret) key

/**
 * Make an authenticated request to the Supabase REST API.
 *
 * @param string $table   Table name (e.g. 'inquiries')
 * @param string $method  HTTP method: GET, POST, PATCH, DELETE
 * @param array  $body    Request body (for POST/PATCH)
 * @param string $query   Optional URL query string (e.g. 'id=eq.123')
 * @return array{status:int, body:mixed}
 */
function supabase_request(string $table, string $method = 'GET', array $body = [], string $query = ''): array {
    $url = SUPABASE_URL . '/rest/v1/' . $table . ($query ? '?' . $query : '');

    $headers = [
        'Content-Type: application/json',
        'apikey: '        . SUPABASE_SERVICE_KEY,
        'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
        'Prefer: return=minimal'
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 10,
    ]);

    if (!empty($body) && in_array(strtoupper($method), ['POST', 'PATCH', 'PUT'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $response   = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $statusCode,
        'body'   => json_decode($response, true)
    ];
}

/**
 * Send a JSON response and exit.
 */
function json_response(bool $success, string $message, int $httpCode = 200, array $data = []): void {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

/**
 * Return a sanitised string, or null if empty.
 */
function clean(?string $value): ?string {
    if ($value === null) return null;
    $v = trim(htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    return $v === '' ? null : $v;
}
