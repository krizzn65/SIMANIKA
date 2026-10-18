<?php

return [
    'default' => env('DB_CONNECTION', 'pgsql'),
    'connections' => [
        'mysql' => [
            'driver' => 'mysql', 'url' => env('DB_URL'), 'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'), 'database' => env('DB_DATABASE', 'simanika'),
            'username' => env('DB_USERNAME', 'root'), 'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''), 'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci', 'prefix' => '', 'prefix_indexes' => true,
            'strict' => true, 'engine' => 'InnoDB', 'timezone' => '+07:00',
        ],
        'pgsql' => [
            'driver' => 'pgsql', 'url' => env('DB_URL'), 'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'), 'database' => env('DB_DATABASE', 'simanika'),
            'username' => env('DB_USERNAME', 'postgres'), 'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8', 'prefix' => '', 'prefix_indexes' => true, 'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
        'sqlite' => ['driver' => 'sqlite', 'url' => env('DB_URL'), 'database' => env('DB_DATABASE', database_path('database.sqlite')), 'prefix' => '', 'foreign_key_constraints' => true],
    ],
    'migrations' => 'migrations',
    'redis' => ['client' => env('REDIS_CLIENT', 'phpredis'), 'default' => ['host' => env('REDIS_HOST', '127.0.0.1'), 'port' => env('REDIS_PORT', 6379)]],
];
