const analyticsService = require('./analytics.service');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get overview statistics
exports.getOverviewStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getOverviewStats(req.user, startDate, endDate);
    res.json({
      message: 'Overview statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// Get lab utilization analytics
exports.getLabUtilization = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const utilization = await analyticsService.getLabUtilization(req.user, startDate, endDate);
    res.json({
      message: 'Lab utilization retrieved successfully',
      data: utilization
    });
  } catch (err) {
    next(err);
  }
};

// Get equipment usage analytics
exports.getEquipmentUsage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const usage = await analyticsService.getEquipmentUsage(req.user, startDate, endDate);
    res.json({
      message: 'Equipment usage retrieved successfully',
      data: usage
    });
  } catch (err) {
    next(err);
  }
};

// Get department comparison
exports.getDepartmentComparison = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const comparison = await analyticsService.getDepartmentComparison(req.user, startDate, endDate);
    res.json({
      message: 'Department comparison retrieved successfully',
      data: comparison
    });
  } catch (err) {
    next(err);
  }
};

// Get attendance trends
exports.getAttendanceTrends = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const trends = await analyticsService.getAttendanceTrends(req.user, startDate, endDate);
    res.json({
      message: 'Attendance trends retrieved successfully',
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// Get peak hours analysis
exports.getPeakHours = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const peakHours = await analyticsService.getPeakHours(req.user, startDate, endDate);
    res.json({
      message: 'Peak hours analysis retrieved successfully',
      data: peakHours
    });
  } catch (err) {
    next(err);
  }
};

// Get loan status distribution
exports.getLoanStatusDistribution = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const distribution = await analyticsService.getLoanStatusDistribution(req.user, startDate, endDate);
    res.json({
      message: 'Loan status distribution retrieved successfully',
      data: distribution
    });
  } catch (err) {
    next(err);
  }
};

// Export analytics to Excel
exports.exportToExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Lab Management System';
    workbook.created = new Date();

    // Overview Stats Sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    const stats = await analyticsService.getOverviewStats(req.user, startDate, endDate);
    
    overviewSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 15 }
    ];

    overviewSheet.addRows([
      { metric: 'Total Labs', value: stats.totalLabs },
      { metric: 'Total Items', value: stats.totalItems },
      { metric: 'Total Attendance', value: stats.totalAttendance },
      { metric: 'Total Loans', value: stats.totalLoans },
      { metric: 'Pending Loans', value: stats.pendingLoans },
      { metric: 'Active Check-ins', value: stats.activeCheckIns }
    ]);

    // Style header
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Lab Utilization Sheet
    if (!type || type === 'lab') {
      const labSheet = workbook.addWorksheet('Lab Utilization');
      const labData = await analyticsService.getLabUtilization(req.user, startDate, endDate);
      
      labSheet.columns = [
        { header: 'Lab Name', key: 'labName', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Capacity', key: 'capacity', width: 12 },
        { header: 'Total Visits', key: 'totalVisits', width: 15 },
        { header: 'Avg Occupancy (hrs)', key: 'avgOccupancyHours', width: 20 },
        { header: 'Utilization Rate (%)', key: 'utilizationRate', width: 20 }
      ];

      labSheet.addRows(labData);
      labSheet.getRow(1).font = { bold: true };
      labSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      labSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    // Equipment Usage Sheet
    if (!type || type === 'equipment') {
      const equipSheet = workbook.addWorksheet('Equipment Usage');
      const equipData = await analyticsService.getEquipmentUsage(req.user, startDate, endDate);
      
      equipSheet.columns = [
        { header: 'Item Name', key: 'itemName', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Lab', key: 'lab', width: 20 },
        { header: 'Total Loans', key: 'totalLoans', width: 15 },
        { header: 'Approved', key: 'approvedLoans', width: 12 },
        { header: 'Pending', key: 'pendingLoans', width: 12 },
        { header: 'Returned', key: 'returnedLoans', width: 12 },
        { header: 'Avg Duration (days)', key: 'avgLoanDuration', width: 20 },
        { header: 'Return Rate (%)', key: 'returnRate', width: 18 }
      ];

      equipSheet.addRows(equipData);
      equipSheet.getRow(1).font = { bold: true };
      equipSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      equipSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    // Department Comparison (Super Admin only)
    if (req.user.role === 'SUPER_ADMIN' && (!type || type === 'department')) {
      const deptSheet = workbook.addWorksheet('Department Comparison');
      const deptData = await analyticsService.getDepartmentComparison(req.user, startDate, endDate);
      
      deptSheet.columns = [
        { header: 'Department', key: 'departmentName', width: 25 },
        { header: 'Total Labs', key: 'totalLabs', width: 12 },
        { header: 'Total Users', key: 'totalUsers', width: 12 },
        { header: 'Total Items', key: 'totalItems', width: 12 },
        { header: 'Total Loans', key: 'totalLoans', width: 12 },
        { header: 'Total Attendance', key: 'totalAttendance', width: 18 },
        { header: 'Avg Lab Utilization', key: 'avgLabUtilization', width: 20 }
      ];

      deptSheet.addRows(deptData);
      deptSheet.getRow(1).font = { bold: true };
      deptSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };
      deptSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${Date.now()}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Export analytics to PDF
exports.exportToPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    if (startDate && endDate) {
      doc.text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    }
    doc.moveDown(2);

    // Overview Statistics
    const stats = await analyticsService.getOverviewStats(req.user, startDate, endDate);
    doc.fontSize(16).font('Helvetica-Bold').text('Overview Statistics');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Labs: ${stats.totalLabs}`);
    doc.text(`Total Items: ${stats.totalItems}`);
    doc.text(`Total Attendance: ${stats.totalAttendance}`);
    doc.text(`Total Loans: ${stats.totalLoans}`);
    doc.text(`Pending Loans: ${stats.pendingLoans}`);
    doc.text(`Active Check-ins: ${stats.activeCheckIns}`);
    doc.moveDown(2);

    // Lab Utilization
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Lab Utilization');
    doc.moveDown();
    
    const labData = await analyticsService.getLabUtilization(req.user, startDate, endDate);
    doc.fontSize(10).font('Helvetica');
    
    labData.slice(0, 10).forEach((lab, index) => {
      doc.text(`${index + 1}. ${lab.labName} (${lab.department})`);
      doc.text(`   Visits: ${lab.totalVisits} | Utilization: ${lab.utilizationRate}%`);
      doc.moveDown(0.5);
    });

    // Equipment Usage
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Top Equipment Usage');
    doc.moveDown();
    
    const equipData = await analyticsService.getEquipmentUsage(req.user, startDate, endDate);
    doc.fontSize(10).font('Helvetica');
    
    equipData.slice(0, 10).forEach((item, index) => {
      doc.text(`${index + 1}. ${item.itemName} (${item.lab})`);
      doc.text(`   Loans: ${item.totalLoans} | Return Rate: ${item.returnRate}%`);
      doc.moveDown(0.5);
    });

    // Finalize PDF
    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
