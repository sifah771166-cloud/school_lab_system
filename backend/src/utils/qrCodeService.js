const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate QR code for lab check-in
exports.generateLabQRCode = async (labId, labName) => {
  try {
    // Create secure token with lab info and timestamp
    const token = crypto.randomBytes(32).toString('hex');
    const qrData = JSON.stringify({
      type: 'lab_checkin',
      labId,
      labName,
      token,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qrCode: qrCodeDataURL,
      token,
      data: qrData
    };
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

// Generate QR code for equipment loan
exports.generateLoanQRCode = async (itemId, itemName) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const qrData = JSON.stringify({
      type: 'equipment_loan',
      itemId,
      itemName,
      token,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#1e40af',
        light: '#FFFFFF'
      }
    });

    return {
      qrCode: qrCodeDataURL,
      token,
      data: qrData
    };
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

// Validate QR code data
exports.validateQRCode = (qrDataString) => {
  try {
    const qrData = JSON.parse(qrDataString);
    
    // Check if QR code has expired
    if (qrData.expiresAt && Date.now() > qrData.expiresAt) {
      return {
        valid: false,
        error: 'QR code has expired'
      };
    }

    // Validate required fields
    if (!qrData.type || !qrData.token) {
      return {
        valid: false,
        error: 'Invalid QR code format'
      };
    }

    return {
      valid: true,
      data: qrData
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid QR code data'
    };
  }
};

// Generate batch QR codes for all labs
exports.generateBatchLabQRCodes = async (labs) => {
  const qrCodes = [];
  
  for (const lab of labs) {
    try {
      const qrCode = await exports.generateLabQRCode(lab.id, lab.name);
      qrCodes.push({
        labId: lab.id,
        labName: lab.name,
        ...qrCode
      });
    } catch (error) {
      console.error(`Failed to generate QR code for lab ${lab.id}:`, error);
    }
  }
  
  return qrCodes;
};
