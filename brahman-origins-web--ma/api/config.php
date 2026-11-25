<?php
// =============================================================================
// BRAHMAN ORIGINS — Supabase API Config
// Shared by all api/*.php endpoints
// =============================================================================

$envPath = dirname(__DIR__) . '/.env';
$envValues = is_file($envPath) ? parse_ini_file($envPath, false, INI_SCANNER_RAW) : [];

function app_env(string $name, array $envValues): string {
    $value = getenv($name);
    if ($value === false) {
        $value = $envValues[$name] ?? '';
    }
    return trim((string) $value, " \\\t\\\n\\\r\\\0\\\x0B\\\"'");
}

define('SUPABASE_URL', app_env('SUPABASE_URL', $envValues));
define('SUPABASE_SERVICE_KEY', app_env('SUPABASE_SERVICE_KEY', $envValues));

if (SUPABASE_URL === '' || SUPABASE_SERVICE_KEY === '') {
    error_log('Missing required Supabase environment variables.');
    http_response_code(500);
    exit('Server configuration error.');
}

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
