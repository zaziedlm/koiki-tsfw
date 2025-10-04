import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailWithToken } from '../../../../lib/emailVerification';

function htmlResponse(message: string, status = 200) {
  const body = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />',
    '<title>Email verification</title>',
    '<style>body{font-family:system-ui;padding:2rem;line-height:1.6}</style>',
    '</head><body>',
    '<h1>Email verification</h1>',
    '<p>' + message + '</p>',
    '</body></html>',
  ].join('');
  return new NextResponse(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return htmlResponse('Invalid verification link.', 400);
  }

  const result = await verifyEmailWithToken(token);
  switch (result.status) {
    case 'success': {
      const redirectUrl = process.env.EMAIL_VERIFICATION_SUCCESS_URL;
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl);
      }
      return htmlResponse('Your email has been verified successfully. You can close this window and sign in.');
    }
    case 'expired':
      return htmlResponse('This verification link has expired. Please request a new verification email.', 410);
    case 'already_verified':
      return htmlResponse('Your email is already verified. You can sign in.');
    default:
      return htmlResponse('We could not verify this token. Please check the link or request a new verification email.', 404);
  }
}
