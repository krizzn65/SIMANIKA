<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $eyebrow }} - SIMANIKA</title>
</head>
@php($site = rtrim(config('app.frontend_url', config('app.url')), '/'))
<body style="margin:0;padding:0;background:#eef3fa;color:#0a1020;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{ $body }}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#eef3fa;background-image:linear-gradient(#e2eaf6 1px,transparent 1px),linear-gradient(90deg,#e2eaf6 1px,transparent 1px);background-size:32px 32px;">
    <tr>
        <td align="center" style="padding:40px 16px 48px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;">
                {{-- Brand --}}
                <tr>
                    <td style="padding:0 0 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="vertical-align:middle;padding-right:12px;">
                                    <img src="{{ $site }}/images/logos/logo-mif-256.png" width="40" height="40" alt="HIMANIKA" style="display:block;border:0;width:40px;height:40px;">
                                </td>
                                <td style="vertical-align:middle;">
                                    <div style="color:#0a1020;font-size:19px;font-weight:800;letter-spacing:-0.6px;line-height:22px;">SIMANIKA</div>
                                    <div style="color:#155eef;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:1.6px;line-height:16px;">SISTEM INFORMASI HIMANIKA</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Card --}}
                <tr>
                    <td style="background:#ffffff;border:1px solid #d3deef;border-top:4px solid #155eef;box-shadow:8px 8px 0 #dbe6f8;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="padding:32px 34px 0;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;background:#155eef;background-image:linear-gradient(145deg,#3b82f6,#155eef);color:#ffffff;font-size:26px;line-height:56px;">&#9993;</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:22px 34px 0;">
                                    <div style="color:#155eef;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:1.4px;line-height:18px;">SIMANIKA / {{ $eyebrow }}</div>
                                    <p style="margin:14px 0 6px;color:#4a5568;font-size:15px;line-height:22px;">Halo, <strong style="color:#0a1020;">{{ $recipientName }}</strong></p>
                                    <h1 style="margin:0 0 14px;color:#0a1020;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-1px;">{{ $title }}</h1>
                                    <p style="margin:0;color:#4a5568;font-size:16px;line-height:26px;">{{ $body }}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px 34px 0;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td align="center" style="background:#155eef;border-radius:8px;box-shadow:4px 4px 0 #c9dafc;">
                                                <a href="{{ $actionUrl }}" style="display:block;padding:16px 24px;color:#ffffff;font-size:16px;font-weight:700;line-height:20px;text-decoration:none;border-radius:8px;">{{ $actionLabel }} &rarr;</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:16px 34px 0;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding:12px 14px;background:#f5f8fe;border:1px dashed #b9cbe8;color:#4a5568;font-size:13px;line-height:20px;">
                                                &#9201;&nbsp; Tautan ini berlaku selama <strong style="color:#0a1020;">{{ $expiresMinutes }} menit</strong>.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px 34px 32px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px solid #e1e8f3;">
                                        <tr>
                                            <td style="padding-top:20px;">
                                                <p style="margin:0 0 6px;color:#0a1020;font-size:13px;font-weight:700;line-height:20px;">Tombol tidak berfungsi?</p>
                                                <p style="margin:0 0 8px;color:#4a5568;font-size:13px;line-height:20px;">Salin dan buka tautan berikut di browser:</p>
                                                <a href="{{ $actionUrl }}" style="color:#0f4bcb;font-size:12px;line-height:19px;word-break:break-all;overflow-wrap:anywhere;">{{ $actionUrl }}</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="padding:24px 4px 0;color:#667085;font-size:12px;line-height:19px;">
                        {{ $securityNote }}<br>
                        &copy; {{ date('Y') }} HIMANIKA &middot; Politeknik Negeri Jember &middot; <a href="{{ $site }}" style="color:#155eef;text-decoration:none;">{{ preg_replace('~^https?://~', '', $site) }}</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
