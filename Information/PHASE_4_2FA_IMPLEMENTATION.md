# Phase 4 - Two-Factor Authentication (2FA) Implementation

## Overview
Implementasi sistem Two-Factor Authentication (2FA) dengan TOTP (Time-based One-Time Password) dan backup codes untuk keamanan akun yang lebih baik di School Laboratory Management System.

## Tanggal Implementasi
31 Mei 2026

## Fitur yang Diimplementasikan

### 1. **Two-Factor Authentication (2FA) dengan TOTP**
- Generate secret key menggunakan Speakeasy library
- QR code generation untuk setup di authenticator app
- Verifikasi TOTP token dengan time window tolerance
- Support untuk Google Authenticator, Microsoft Authenticator, Authy, dll

### 2. **Backup Codes**
- Generate 10 backup codes saat 2FA diaktifkan
- Format: XXXX-XXXX (8 karakter)
- Setiap backup code hanya bisa digunakan sekali
- Tracking penggunaan backup code dengan timestamp
- Regenerasi backup codes kapan saja

### 3. **Login Flow dengan 2FA**
- Deteksi user dengan 2FA enabled saat login
- Redirect ke halaman 2FA verification
- Support untuk TOTP token atau backup code
- Completion login setelah verifikasi berhasil

### 4. **Settings Management**
- View 2FA status di Settings page
- Enable/Disable 2FA dengan password confirmation
- Regenerate backup codes
- Display remaining backup codes count

## Arsitektur

### Backend Components

#### 1. Prisma Schema Updates
**File:** `backend/prisma/schema.prisma`

**Changes:**
- User model: +twoFactorEnabled, +twoFactorSecret
- New BackupCode model dengan relasi ke User

**Migration:** `add_2fa_support`

#### 2. 2FA Service
**File:** `backend/src/modules/auth/twofa.service.js`

**Functions:**
- `generateTwoFactorSecret(userId, email)` - Generate secret dan QR code
- `verifyTOTPToken(secret, token)` - Verify TOTP token
- `enableTwoFactor(userId, secret)` - Enable 2FA dan generate backup codes
- `disableTwoFactor(userId)` - Disable 2FA dan hapus backup codes
- `verifyBackupCode(userId, code)` - Verify dan mark backup code as used
- `getBackupCodesCount(userId)` - Get remaining backup codes
- `regenerateBackupCodes(userId)` - Generate new backup codes
- `getUserTwoFactorStatus(userId)` - Get user 2FA status

#### 3. 2FA Controller
**File:** `backend/src/modules/auth/twofa.controller.js`

**Endpoints:**
- `POST /auth/2fa/setup` - Generate 2FA setup
- `POST /auth/2fa/enable` - Enable 2FA dengan verification
- `POST /auth/2fa/disable` - Disable 2FA
- `GET /auth/2fa/status` - Get 2FA status
- `POST /auth/2fa/backup-codes/regenerate` - Regenerate backup codes
- `POST /auth/2fa/verify-login` - Verify 2FA token saat login

#### 4. Auth Service Updates
**File:** `backend/src/modules/auth/auth.service.js`

**Changes:**
- `login()` - Return requiresTwoFA flag jika 2FA enabled
- `completeLogin(userId)` - Complete login setelah 2FA verification

#### 5. Auth Routes
**File:** `backend/src/modules/auth/auth.routes.js`

**New Routes:**
- `POST /auth/login-2fa` - Complete login after 2FA verification
- `POST /auth/2fa/*` - All 2FA endpoints

### Frontend Components

#### 1. TwoFactorSetup Page
**File:** `frontend/src/pages/TwoFactorSetup.jsx`

**Features:**
- Step 1: Generate setup dengan QR code
- Step 2: Verify dengan 6-digit code
- Step 3: Display backup codes dengan copy/download options
- Beautiful gradient UI dengan glassmorphism

#### 2. TwoFactorVerify Page
**File:** `frontend/src/pages/TwoFactorVerify.jsx`

**Features:**
- Input untuk 6-digit TOTP code atau backup code
- Toggle antara TOTP dan backup code
- Redirect ke dashboard setelah verifikasi
- Error handling dan validation

#### 3. Login Page Updates
**File:** `frontend/src/pages/Login.jsx`

**Changes:**
- Detect 2FA requirement dari login response
- Redirect ke 2FA verification page jika diperlukan
- Modern gradient UI design

#### 4. Settings Page Updates
**File:** `frontend/src/pages/Settings.jsx`

**New Section:**
- Security settings dengan 2FA management
- Display 2FA status (enabled/disabled)
- Show remaining backup codes count
- Buttons: Enable 2FA, Regenerate Codes, Disable 2FA
- Password confirmation untuk sensitive operations

#### 5. Routes Updates
**File:** `frontend/src/routes/index.jsx`

**New Routes:**
- `/2fa-verify` - 2FA verification page (public)
- `/2fa-setup` - 2FA setup page (protected)

## Dependencies

### Backend
- `speakeasy` - TOTP generation dan verification
- `qrcode` - QR code generation

### Frontend
- `axios` - API calls
- `react-hot-toast` - Toast notifications
- `react-router-dom` - Routing

## Database Schema

### User Model Changes
```prisma
model User {
  // ... existing fields
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  backupCodes      BackupCode[]
}
```

### BackupCode Model
```prisma
model BackupCode {
  id        String   @id @default(uuid())
  userId    String
  code      String   @unique
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Setup 2FA
```
POST /api/v1/auth/2fa/setup
Authorization: Bearer {token}

Response:
{
  "message": "Two-factor setup generated",
  "data": {
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "qrCode": "data:image/png;base64,...",
    "otpauth_url": "otpauth://totp/..."
  }
}
```

### Enable 2FA
```
POST /api/v1/auth/2fa/enable
Authorization: Bearer {token}
Content-Type: application/json

{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "token": "123456"
}

Response:
{
  "message": "2FA enabled successfully",
  "data": {
    "user": { ... },
    "backupCodes": ["XXXX-XXXX", ...]
  }
}
```

### Disable 2FA
```
POST /api/v1/auth/2fa/disable
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "user_password"
}

Response:
{
  "message": "2FA disabled successfully",
  "data": { ... }
}
```

### Get 2FA Status
```
GET /api/v1/auth/2fa/status
Authorization: Bearer {token}

Response:
{
  "message": "Two-factor status retrieved",
  "data": {
    "enabled": true,
    "backupCodesRemaining": 8
  }
}
```

### Regenerate Backup Codes
```
POST /api/v1/auth/2fa/backup-codes/regenerate
Authorization: Bearer {token}
Content-Type: application/json

{
  "password": "user_password"
}

Response:
{
  "message": "Backup codes regenerated successfully",
  "data": {
    "backupCodes": ["XXXX-XXXX", ...]
  }
}
```

### Verify Login Token
```
POST /api/v1/auth/2fa/verify-login
Content-Type: application/json

{
  "userId": "user_id",
  "token": "123456",
  "useBackupCode": false
}

Response:
{
  "message": "Two-factor verification successful",
  "data": {
    "verified": true
  }
}
```

### Complete Login After 2FA
```
POST /api/v1/auth/login-2fa
Content-Type: application/json

{
  "userId": "user_id"
}

Response:
{
  "token": "jwt_token",
  "user": { ... }
}
```

## Security Features

✅ TOTP dengan time window tolerance (±30 seconds)
✅ Backup codes dengan one-time use
✅ Password confirmation untuk disable/regenerate
✅ Secure secret storage di database
✅ Audit logging untuk 2FA operations
✅ Rate limiting pada verification endpoints
✅ Session management dengan 2FA

## User Flow

### Setup 2FA
1. User navigates ke Settings
2. Click "Enable 2FA" button
3. Redirect ke `/2fa-setup`
4. Generate secret dan QR code
5. Scan QR code dengan authenticator app
6. Enter 6-digit code untuk verify
7. Display backup codes
8. Save backup codes (copy/download)
9. 2FA enabled

### Login dengan 2FA
1. User login dengan email dan password
2. Server detect 2FA enabled
3. Redirect ke `/2fa-verify` dengan userId
4. User enter 6-digit code dari authenticator
5. Server verify token
6. Complete login dan redirect ke dashboard

### Disable 2FA
1. User di Settings
2. Click "Disable 2FA" button
3. Prompt untuk password
4. Server verify password
5. Disable 2FA dan hapus backup codes
6. Redirect ke Settings

## Testing Checklist

- [ ] Generate 2FA setup dengan QR code
- [ ] Verify TOTP token dengan authenticator app
- [ ] Enable 2FA dan generate backup codes
- [ ] Login dengan 2FA enabled
- [ ] Verify dengan TOTP token
- [ ] Verify dengan backup code
- [ ] Regenerate backup codes
- [ ] Disable 2FA
- [ ] Password validation untuk sensitive operations
- [ ] Error handling untuk invalid tokens
- [ ] Backup code one-time use validation

## Files Modified/Created

### Backend
```
✅ backend/prisma/schema.prisma (+2FA fields)
✅ backend/prisma/migrations/add_2fa_support/migration.sql
✅ backend/src/modules/auth/twofa.service.js (NEW)
✅ backend/src/modules/auth/twofa.controller.js (NEW)
✅ backend/src/modules/auth/twofa.routes.js (NEW)
✅ backend/src/modules/auth/auth.service.js (updated)
✅ backend/src/modules/auth/auth.controller.js (updated)
✅ backend/src/modules/auth/auth.routes.js (updated)
✅ backend/package.json (speakeasy, qrcode)
```

### Frontend
```
✅ frontend/src/pages/TwoFactorSetup.jsx (NEW)
✅ frontend/src/pages/TwoFactorVerify.jsx (NEW)
✅ frontend/src/pages/Login.jsx (updated)
✅ frontend/src/pages/Settings.jsx (updated)
✅ frontend/src/routes/index.jsx (updated)
```

## Next Steps

1. Run database migration: `npx prisma migrate deploy`
2. Test 2FA setup dan login flow
3. Deploy ke production
4. Monitor 2FA usage dan errors
5. Gather user feedback

## Notes

- TOTP time window: ±30 seconds (2 time windows)
- Backup codes: 10 codes per user
- Backup code format: XXXX-XXXX
- Password required untuk disable/regenerate
- All 2FA operations logged di audit logs

---

**Status**: ✅ COMPLETE
**Version**: 2.0.0 - Phase 4
**Last Updated**: 31 Mei 2026
