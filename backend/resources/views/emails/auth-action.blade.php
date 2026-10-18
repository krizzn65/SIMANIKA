<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $eyebrow }} - SIMANIKA</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;color:#0a1020;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{ $body }}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f7fb;">
    <tr>
        <td align="center" style="padding:36px 16px 48px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;">
                <tr>
                    <td style="padding:0 0 18px;">
                        <span style="display:inline-block;width:11px;height:11px;background:#155eef;vertical-align:middle;"></span>
                        <span style="padding-left:8px;vertical-align:middle;color:#0a1020;font-size:19px;font-weight:800;letter-spacing:-0.7px;">SIMANIKA</span>
                        <span style="display:block;padding-top:7px;color:#4a5568;font-size:11px;font-weight:700;letter-spacing:1.5px;">SISTEM INFORMASI HIMANIKA</span>
                    </td>
                </tr>
                <tr>
                    <td style="background:#07111f;padding:17px 28px;color:#ffffff;font-family:Courier New,Courier,monospace;font-size:11px;font-weight:700;letter-spacing:1.3px;">
                        <span style="color:#5b9cff;">//</span> AKUN SIMANIKA &nbsp; / &nbsp; {{ $eyebrow }}
                    </td>
                </tr>
                <tr>
                    <td style="background:#ffffff;border:1px solid #cad5e5;border-top:0;padding:34px 32px 32px;">
                        <p style="margin:0 0 10px;color:#4a5568;font-size:14px;line-height:22px;">Halo, {{ $recipientName }}.</p>
                        <h1 style="margin:0 0 18px;color:#0a1020;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-1px;">{{ $title }}</h1>
                        <p style="margin:0 0 26px;color:#4a5568;font-size:16px;line-height:25px;">{{ $body }}</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="background:#155eef;">
                                    <a href="{{ $actionUrl }}" style="display:inline-block;padding:15px 23px;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">{{ $actionLabel }} &rarr;</a>
                                </td>
                            </tr>
                        </table>
                        <p style="margin:18px 0 0;color:#4a5568;font-size:13px;line-height:21px;">Tautan ini berlaku selama <strong>{{ $expiresMinutes }} menit</strong>.</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:30px;border-top:1px solid #cad5e5;">
                            <tr>
                                <td style="padding-top:20px;">
                                    <p style="margin:0 0 9px;color:#0a1020;font-size:13px;font-weight:700;line-height:20px;">Tombol tidak berfungsi?</p>
                                    <p style="margin:0 0 8px;color:#4a5568;font-size:13px;line-height:21px;">Salin dan buka tautan berikut di browser:</p>
                                    <a href="{{ $actionUrl }}" style="color:#0f4bcb;font-size:12px;line-height:19px;word-break:break-all;overflow-wrap:anywhere;">{{ $actionUrl }}</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 2px 0;color:#4a5568;font-size:12px;line-height:19px;">
                        {{ $securityNote }}<br>
                        &copy; {{ date('Y') }} HIMANIKA &middot; SIMANIKA
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
