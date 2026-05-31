# Advanced Analytics & Reporting Implementation

## Overview
Implementasi sistem analytics dan reporting yang comprehensive untuk School Laboratory Management System dengan fitur export ke Excel dan PDF.

## Tanggal Implementasi
31 Mei 2026

---

## 🎯 Fitur yang Diimplementasikan

### 1. **Overview Statistics**
Dashboard statistik umum dengan metrics:
- Total Labs
- Total Items
- Total Attendance
- Total Loans
- Pending Loans
- Active Check-ins

**Endpoint:** `GET /api/v1/analytics/overview`

---

### 2. **Lab Utilization Analytics**
Analisis penggunaan laboratorium dengan metrics:
- Total visits per lab
- Average occupancy hours
- Utilization rate (%)
- Capacity analysis
- Department-based filtering

**Endpoint:** `GET /api/v1/analytics/lab-utilization`

**Metrics Calculated:**
```javascript
utilizationRate = (totalVisits / (capacity * 30)) * 100
avgOccupancyHours = totalOccupancyHours / totalAttendances
```

---

### 3. **Equipment Usage Analytics**
Analisis penggunaan equipment dengan metrics:
- Total loans per item
- Approved/Pending/Returned loans
- Average loan duration (days)
- Return rate (%)
- Category-based analysis

**Endpoint:** `GET /api/v1/analytics/equipment-usage`

**Metrics Calculated:**
```javascript
avgLoanDuration = totalDuration / returnedLoans
returnRate = (returnedLoans / totalLoans) * 100
```

---

### 4. **Department Comparison** (Super Admin Only)
Perbandingan antar department dengan metrics:
- Total labs per department
- Total users per department
- Total items per department
- Total loans per department
- Total attendance per department
- Average lab utilization

**Endpoint:** `GET /api/v1/analytics/department-comparison`

---

### 5. **Attendance Trends**
Analisis trend attendance dari waktu ke waktu:
- Daily attendance count
- Time series data
- Trend visualization

**Endpoint:** `GET /api/v1/analytics/attendance-trends`

---

### 6. **Peak Hours Analysis**
Analisis jam-jam sibuk laboratorium:
- Hourly attendance distribution
- Peak hours identification
- 24-hour breakdown

**Endpoint:** `GET /api/v1/analytics/peak-hours`

---

### 7. **Loan Status Distribution**
Distribusi status peminjaman:
- Pending loans count
- Approved loans count
- Returned loans count
- Rejected loans count

**Endpoint:** `GET /api/v1/analytics/loan-status`

---

### 8. **Excel Export**
Export comprehensive analytics ke Excel dengan multiple sheets:
- Overview sheet
- Lab Utilization sheet
- Equipment Usage sheet
- Department Comparison sheet (Super Admin)

**Endpoint:** `GET /api/v1/analytics/export/excel`

**Features:**
- Multiple worksheets
- Styled headers (purple background, white text)
- Auto-sized columns
- Professional formatting

---

### 9. **PDF Export**
Export analytics report ke PDF:
- Overview statistics
- Top 10 lab utilization
- Top 10 equipment usage
- Professional layout

**Endpoint:** `GET /api/v1/analytics/export/pdf`

**Features:**
- Professional PDF layout
- Multiple pages
- Formatted text
- Date range information

---

## 📊 Frontend Implementation

### **AdvancedAnalytics Page**
Comprehensive analytics dashboard dengan:

#### **Date Range Filter**
- Custom date range picker
- Quick filters: Last 7/30/90 days
- Real-time data refresh on date change

#### **Overview Stats Cards**
6 gradient cards menampilkan key metrics:
- Blue gradient: Total Labs
- Purple gradient: Total Items
- Green gradient: Total Attendance
- Orange gradient: Total Loans
- Yellow gradient: Pending Loans
- Indigo gradient: Active Check-ins

#### **Tab-based Interface**
5 tabs untuk different analytics views:

**1. Overview Tab:**
- Attendance trends (Area chart)
- Loan status distribution (Pie chart)
- Peak hours analysis (Bar chart)

**2. Labs Tab:**
- Lab utilization bar chart
- Detailed table with:
  - Lab name
  - Department
  - Capacity
  - Total visits
  - Avg occupancy hours
  - Utilization rate (color-coded)

**3. Equipment Tab:**
- Equipment usage bar chart
- Detailed table with:
  - Item name
  - Category
  - Lab
  - Total loans
  - Approved loans
  - Avg duration
  - Return rate (color-coded)

**4. Trends Tab:**
- Attendance trends line chart
- Peak hours distribution bar chart

**5. Departments Tab:** (Super Admin only)
- Department comparison bar chart
- Detailed comparison table
- Access restriction message for non-super admins

#### **Export Buttons**
- Export to Excel (green button)
- Export to PDF (red button)
- Download with timestamp filename

---

## 🔧 Technical Implementation

### **Backend Architecture**

#### **Analytics Service** (`analytics.service.js`)
Core business logic untuk semua analytics calculations:

```javascript
// Main functions:
- getOverviewStats(user, startDate, endDate)
- getLabUtilization(user, startDate, endDate)
- getEquipmentUsage(user, startDate, endDate)
- getDepartmentComparison(user, startDate, endDate)
- getAttendanceTrends(user, startDate, endDate)
- getPeakHours(user, startDate, endDate)
- getLoanStatusDistribution(user, startDate, endDate)
```

**Features:**
- Role-based data filtering (ADMIN_JURUSAN sees only their department)
- Date range filtering
- Complex aggregations using Prisma
- Efficient database queries

#### **Analytics Controller** (`analytics.controller.js`)
Request handlers dan export functionality:

```javascript
// Export functions:
- exportToExcel() - Uses ExcelJS
- exportToPDF() - Uses PDFKit
```

**Excel Export Implementation:**
```javascript
const workbook = new ExcelJS.Workbook();
// Multiple sheets with styled headers
// Professional formatting
// Auto-sized columns
```

**PDF Export Implementation:**
```javascript
const doc = new PDFDocument({ margin: 50 });
// Professional layout
// Multiple pages
// Formatted sections
```

#### **Analytics Routes** (`analytics.routes.js`)
RESTful API endpoints dengan authentication:

```javascript
router.use(authenticate); // All routes protected
router.get('/overview', controller.getOverviewStats);
router.get('/lab-utilization', controller.getLabUtilization);
// ... more routes
router.get('/export/excel', controller.exportToExcel);
router.get('/export/pdf', controller.exportToPDF);
```

---

### **Frontend Architecture**

#### **AdvancedAnalytics Component**
React component dengan hooks:

**State Management:**
```javascript
const [dateRange, setDateRange] = useState({...});
const [overviewStats, setOverviewStats] = useState(null);
const [labUtilization, setLabUtilization] = useState([]);
const [equipmentUsage, setEquipmentUsage] = useState([]);
// ... more states
```

**Data Fetching:**
```javascript
useEffect(() => {
  fetchAnalyticsData();
}, [dateRange]); // Refetch on date change
```

**Charts Library:** Recharts
- AreaChart for trends
- BarChart for comparisons
- PieChart for distributions
- LineChart for time series

---

## 📈 Chart Types & Usage

### **1. Area Chart**
**Used for:** Attendance trends over time
**Features:**
- Gradient fill
- Smooth curves
- Tooltip on hover
- Date-based X-axis

### **2. Bar Chart**
**Used for:** Lab utilization, Equipment usage, Peak hours
**Features:**
- Multiple bars for comparison
- Color-coded bars
- Angled labels for readability
- Legend for multiple datasets

### **3. Pie Chart**
**Used for:** Loan status distribution
**Features:**
- Color-coded segments
- Labels with values
- Legend
- Tooltip

### **4. Line Chart**
**Used for:** Attendance trends (alternative view)
**Features:**
- Smooth line
- Data points
- Grid lines
- Tooltip

---

## 🎨 UI/UX Features

### **Color Coding**
- **Green:** Good performance (>70% utilization, >80% return rate)
- **Yellow:** Medium performance (40-70% utilization, 50-80% return rate)
- **Red:** Low performance (<40% utilization, <50% return rate)

### **Gradient Cards**
6 different gradient combinations untuk visual appeal:
- Blue to Cyan
- Purple to Pink
- Green to Teal
- Orange to Red
- Yellow to Orange
- Indigo to Purple

### **Responsive Design**
- Grid layout adapts to screen size
- Horizontal scroll for tables on mobile
- Responsive charts
- Mobile-friendly date pickers

### **Loading States**
- Spinner during data fetch
- Smooth transitions
- No layout shift

---

## 🔐 Security & Access Control

### **Role-Based Access**
1. **All Authenticated Users:**
   - Overview stats
   - Lab utilization (filtered by department for ADMIN_JURUSAN)
   - Equipment usage (filtered by department for ADMIN_JURUSAN)
   - Attendance trends
   - Peak hours
   - Loan status

2. **Super Admin Only:**
   - Department comparison
   - Cross-department analytics

### **Data Filtering**
```javascript
// ADMIN_JURUSAN sees only their department
const departmentFilter = user.role === 'ADMIN_JURUSAN' 
  ? { departmentId: user.departmentId } 
  : {};
```

---

## 📊 Sample Analytics Queries

### **Lab Utilization Calculation**
```sql
-- Pseudo SQL for understanding
SELECT 
  lab.name,
  COUNT(attendance.id) as totalVisits,
  AVG(TIMESTAMPDIFF(HOUR, checkInTime, checkOutTime)) as avgOccupancy,
  (COUNT(attendance.id) / (lab.capacity * 30)) * 100 as utilizationRate
FROM labs
LEFT JOIN attendances ON lab.id = attendance.labId
WHERE attendance.checkInTime BETWEEN startDate AND endDate
GROUP BY lab.id
ORDER BY totalVisits DESC
```

### **Equipment Usage Calculation**
```sql
-- Pseudo SQL
SELECT 
  item.name,
  COUNT(loan.id) as totalLoans,
  COUNT(CASE WHEN loan.status = 'returned' THEN 1 END) as returnedLoans,
  AVG(DATEDIFF(loan.returnedAt, loan.createdAt)) as avgDuration,
  (returnedLoans / totalLoans) * 100 as returnRate
FROM items
LEFT JOIN loans ON item.id = loan.itemId
WHERE loan.createdAt BETWEEN startDate AND endDate
GROUP BY item.id
ORDER BY totalLoans DESC
```

---

## 📦 Dependencies

### **Backend**
```json
{
  "exceljs": "^4.x",
  "pdfkit": "^0.x"
}
```

### **Frontend**
```json
{
  "date-fns": "^2.x",
  "recharts": "^2.x" (already installed)
}
```

---

## 🚀 Usage Guide

### **For Users**

1. **Navigate to Analytics**
   - Click "Analytics" in sidebar
   - Page loads with last 30 days data

2. **Select Date Range**
   - Use date pickers for custom range
   - Or click quick filters (7/30/90 days)
   - Data refreshes automatically

3. **Explore Different Views**
   - Click tabs to switch views
   - Hover over charts for details
   - Scroll tables for more data

4. **Export Reports**
   - Click "Export Excel" for spreadsheet
   - Click "Export PDF" for document
   - Files download automatically

### **For Admins**

1. **Monitor Lab Performance**
   - Check utilization rates
   - Identify underutilized labs
   - Plan resource allocation

2. **Track Equipment Usage**
   - See most borrowed items
   - Monitor return rates
   - Plan equipment purchases

3. **Analyze Trends**
   - Identify peak hours
   - Plan staffing accordingly
   - Optimize lab schedules

4. **Compare Departments** (Super Admin)
   - See department performance
   - Allocate resources fairly
   - Identify best practices

---

## 🧪 Testing Checklist

### **Backend Tests**
- ✅ Overview stats calculation
- ✅ Lab utilization metrics
- ✅ Equipment usage metrics
- ✅ Department comparison (Super Admin)
- ✅ Date range filtering
- ✅ Role-based data filtering
- ✅ Excel export generation
- ✅ PDF export generation

### **Frontend Tests**
- ✅ Date range picker functionality
- ✅ Quick filter buttons
- ✅ Tab switching
- ✅ Chart rendering
- ✅ Table display
- ✅ Export button functionality
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

---

## 📝 API Reference

### **Get Overview Stats**
```http
GET /api/v1/analytics/overview?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer {token}

Response:
{
  "message": "Overview statistics retrieved successfully",
  "data": {
    "totalLabs": 20,
    "totalItems": 150,
    "totalAttendance": 450,
    "totalLoans": 89,
    "pendingLoans": 12,
    "activeCheckIns": 8
  }
}
```

### **Get Lab Utilization**
```http
GET /api/v1/analytics/lab-utilization?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer {token}

Response:
{
  "message": "Lab utilization retrieved successfully",
  "data": [
    {
      "labId": "uuid",
      "labName": "Lab TKJ 1",
      "department": "TKJ",
      "capacity": 40,
      "totalVisits": 125,
      "avgOccupancyHours": 2.5,
      "utilizationRate": 75.5
    },
    ...
  ]
}
```

### **Export to Excel**
```http
GET /api/v1/analytics/export/excel?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer {token}

Response: Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
```

### **Export to PDF**
```http
GET /api/v1/analytics/export/pdf?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer {token}

Response: PDF file (application/pdf)
```

---

## 🎯 Key Insights Provided

### **1. Lab Performance**
- Which labs are most/least utilized
- Optimal capacity planning
- Resource allocation insights

### **2. Equipment Management**
- Most popular equipment
- Return rate tracking
- Purchase planning data

### **3. Usage Patterns**
- Peak hours identification
- Daily/weekly trends
- Seasonal patterns

### **4. Department Efficiency**
- Cross-department comparison
- Best practices identification
- Fair resource distribution

---

## 🔮 Future Enhancements

1. **Predictive Analytics**
   - ML-based usage forecasting
   - Maintenance prediction
   - Demand forecasting

2. **Real-time Dashboard**
   - Live updates via WebSocket
   - Real-time occupancy
   - Live notifications

3. **Custom Reports**
   - User-defined metrics
   - Scheduled reports
   - Email delivery

4. **Advanced Visualizations**
   - Heatmaps
   - Sankey diagrams
   - Network graphs

5. **Benchmarking**
   - Compare with historical data
   - Industry benchmarks
   - Goal tracking

---

## 📊 Performance Considerations

### **Database Optimization**
- Indexed fields for fast queries
- Efficient aggregations
- Date range filtering at DB level

### **Frontend Optimization**
- Lazy loading for charts
- Memoization for expensive calculations
- Debounced date range updates

### **Export Optimization**
- Streaming for large datasets
- Pagination for Excel sheets
- Compressed PDF output

---

## ✅ Summary

**Total Features Implemented:** 9 major features
**API Endpoints Created:** 9 endpoints
**Charts Implemented:** 4 types (Area, Bar, Pie, Line)
**Export Formats:** 2 (Excel, PDF)
**Files Created:** 3 (service, controller, routes, frontend page)
**Files Modified:** 2 (app.js, routes)

**System Status:** ✅ **PRODUCTION READY**

Advanced Analytics & Reporting system telah selesai diimplementasikan dengan fitur-fitur comprehensive untuk data-driven decision making. System ini memberikan insights yang valuable untuk optimasi penggunaan laboratorium dan equipment.
