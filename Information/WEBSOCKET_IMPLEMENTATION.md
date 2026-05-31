# WebSocket Real-time Features Implementation

## Overview
Implementasi fitur real-time menggunakan Socket.IO untuk School Laboratory Management System.

## Tanggal Implementasi
31 Mei 2026

## Fitur yang Diimplementasikan

### 1. **Real-time Notifications**
- Notifikasi instant tanpa polling
- Toast notifications untuk user experience yang lebih baik
- Automatic unread count update
- Support untuk notification ke user, department, dan role

**Events:**
- `notification:new` - Notifikasi baru diterima user

### 2. **Real-time Loan Updates**
- Status peminjaman update secara real-time
- Notifikasi approval/rejection instant
- Update otomatis pada loan list

**Events:**
- `loan:updated` - Status loan berubah (approved, rejected, returned)

### 3. **Real-time Attendance Tracking**
- Live check-in/check-out tracking
- Lab capacity monitoring real-time
- Instant updates untuk admin

**Events:**
- `attendance:updated` - Check-in atau check-out terjadi
- `lab:capacity` - Update kapasitas lab real-time

### 4. **Online Users Tracking**
- Menampilkan jumlah user yang online
- Connection status indicator
- Automatic reconnection handling

**Events:**
- `users:online` - Update jumlah user online

## Arsitektur

### Backend (Socket.IO Server)

**File:** `backend/src/socket/socket.js`

**Fitur:**
- JWT authentication middleware
- Room-based messaging (user rooms, department rooms, role rooms)
- Connected users tracking
- Helper functions untuk emit events

**Rooms:**
- `user:{userId}` - Personal room untuk setiap user
- `department:{departmentId}` - Room untuk department
- `role:{role}` - Room berdasarkan role (SUPER_ADMIN, ADMIN_JURUSAN, USER)

### Frontend (Socket.IO Client)

**File:** `frontend/src/context/SocketContext.jsx`

**Fitur:**
- Automatic connection dengan JWT token
- Reconnection handling
- Connection state management
- Online users tracking

## Integrasi dengan Existing Features

### Notifications Service
**File:** `backend/src/modules/notifications/notification.service.js`

- `createNotification()` - Emit real-time notification setelah create
- `sendNotificationToUsers()` - Emit ke multiple users
- `sendNotificationToDepartment()` - Emit ke department room

### Loans Service
**File:** `backend/src/modules/loans/loan.service.js`

- `requestLoan()` - Notify department admins tentang request baru
- `approveLoan()` - Emit update ke requester + send notification
- `returnLoan()` - Emit update + notify department

### Attendance Service
**File:** `backend/src/modules/attendance/attendance.service.js`

- `create()` - Emit check-in event + lab capacity update
- `update()` - Emit check-out event + lab capacity update

## UI Components Updated

### 1. Navbar Component
**File:** `frontend/src/components/layout/Navbar.jsx`

**Changes:**
- Added connection status indicator
- Real-time notification listener
- Online users count display
- Automatic unread count update

### 2. Loans Page
**File:** `frontend/src/pages/Loans.jsx`

**Changes:**
- Listen for `loan:updated` events
- Auto-refresh loan list on updates
- Toast notifications untuk status changes

### 3. Attendance Page
**File:** `frontend/src/pages/Attendance.jsx`

**Changes:**
- Listen for `attendance:updated` events
- Listen for `lab:capacity` updates
- Real-time lab capacity tracking
- Auto-refresh attendance history

## Configuration

### Backend Environment Variables
```env
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5000
```

## Socket.IO Events Reference

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | `{ id, userId, title, message, type, link, createdAt, isRead }` | Notifikasi baru |
| `loan:updated` | `{ id, status, itemName, quantity, approvedBy, approvedAt, rejectionReason }` | Status loan berubah |
| `attendance:updated` | `{ type, userId, userName, teacherName, classTeaching, timestamp, labId }` | Check-in/out event |
| `lab:capacity` | `{ labId, current, capacity, percentage }` | Update kapasitas lab |
| `users:online` | `{ count, timestamp }` | Jumlah user online |

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `users:getOnline` | - | Request online users count |

## Security

### Authentication
- JWT token validation pada handshake
- User verification dari database
- Socket user data: `userId`, `userRole`, `userDepartmentId`, `userName`

### Authorization
- Room-based access control
- Department-level isolation
- Role-based event filtering

## Connection Management

### Reconnection Strategy
- Automatic reconnection enabled
- Reconnection delay: 1000ms
- Max reconnection delay: 5000ms
- Max reconnection attempts: 5

### Connection States
- `connect` - Connected to server
- `disconnect` - Disconnected (with reason)
- `connect_error` - Connection error
- `reconnect` - Successfully reconnected
- `reconnect_attempt` - Attempting to reconnect
- `reconnect_failed` - Failed to reconnect after max attempts

## Testing

### Manual Testing Steps

1. **Test Notifications:**
   - Login dengan 2 users berbeda
   - Create loan request dari user 1
   - Verify admin menerima notifikasi real-time
   - Check toast notification muncul
   - Check unread count update

2. **Test Loan Updates:**
   - Login sebagai admin
   - Approve/reject loan request
   - Verify requester menerima update real-time
   - Check loan list auto-refresh

3. **Test Attendance:**
   - Login sebagai user
   - Check-in ke lab
   - Verify admin melihat update real-time
   - Check lab capacity update
   - Check-out dan verify update

4. **Test Connection:**
   - Login dan verify connection status "online"
   - Stop backend server
   - Verify status berubah ke "offline"
   - Start backend server
   - Verify automatic reconnection

5. **Test Online Users:**
   - Login dengan multiple users
   - Verify online count bertambah
   - Logout satu user
   - Verify online count berkurang

## Performance Considerations

### Scalability
- Connected users stored in memory (Map)
- Consider Redis adapter untuk multi-server deployment
- Room-based messaging mengurangi broadcast overhead

### Optimization
- Event throttling untuk high-frequency updates
- Selective data dalam event payload
- Automatic cleanup on disconnect

## Future Enhancements

1. **Typing Indicators** - Show when admin is typing response
2. **Presence System** - Show which users are viewing specific pages
3. **Chat System** - Real-time messaging between users and admins
4. **File Upload Progress** - Real-time upload progress tracking
5. **Collaborative Editing** - Multiple users editing same resource
6. **Push Notifications** - Browser push notifications untuk offline users
7. **Activity Feed** - Real-time activity stream
8. **Redis Adapter** - Untuk horizontal scaling

## Troubleshooting

### Common Issues

**Issue:** Socket not connecting
- Check JWT token in localStorage
- Verify VITE_API_URL configuration
- Check CORS settings in backend

**Issue:** Events not received
- Verify socket connection status
- Check event listener registration
- Verify user has access to room

**Issue:** Multiple connections
- Check React StrictMode (causes double mount in dev)
- Verify cleanup in useEffect
- Check for multiple SocketProvider instances

## Dependencies

### Backend
```json
{
  "socket.io": "^4.x"
}
```

### Frontend
```json
{
  "socket.io-client": "^4.x"
}
```

## API Compatibility

WebSocket implementation tidak mengubah existing REST API. Semua endpoints tetap berfungsi normal. WebSocket hanya menambahkan real-time capabilities.

## Monitoring

### Server Logs
- Connection/disconnection logs dengan user info
- Event emission logs
- Error logs untuk debugging

### Client Logs
- Connection state changes
- Event received logs
- Reconnection attempts

## Conclusion

Implementasi WebSocket berhasil menambahkan real-time capabilities ke School Laboratory Management System tanpa breaking changes pada existing features. System sekarang lebih responsive dan memberikan user experience yang lebih baik dengan instant updates.
