<?php

return [
    'default' => env('MAIL_MAILER', 'log'),
    'mailers' => [
        'smtp' => ['transport' => 'smtp', 'host' => env('MAIL_HOST', '127.0.0.1'), 'port' => env('MAIL_PORT', 587), 'encryption' => env('MAIL_ENCRYPTION', 'tls'), 'username' => env('MAIL_USERNAME'), 'password' => env('MAIL_PASSWORD'), 'timeout' => null],
        'sendmail' => ['transport' => 'sendmail', 'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs')],
        'log' => ['transport' => 'log', 'channel' => env('MAIL_LOG_CHANNEL')],
        'array' => ['transport' => 'array'],
    ],
    'from' => ['address' => env('MAIL_FROM_ADDRESS', env('ADMIN_EMAIL', 'noreply@localhost')), 'name' => env('MAIL_FROM_NAME', 'SIMANIKA')],
];
