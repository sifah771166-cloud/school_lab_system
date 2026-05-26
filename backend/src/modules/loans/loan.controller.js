const service = require('./loan.service');

exports.getLoans = async (req, res, next) => {
  try {
    // If user is admin, return all loans; otherwise return user's loans
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN_JURUSAN';
    const loans = isAdmin 
      ? await service.getAllLoans(req.user)
      : await service.getUserLoans(req.user.id);
    res.json({ data: loans });
  } catch (err) { next(err); }
};

exports.requestLoan = async (req, res, next) => {
  try {
    const loan = await service.requestLoan(req.user.id, req.body);
    res.status(201).json(loan);
  } catch (err) { next(err); }
};

exports.getUserLoans = async (req, res, next) => {
  try {
    const loans = await service.getUserLoans(req.user.id);
    res.json({ data: loans });
  } catch (err) { next(err); }
};

exports.getAllLoans = async (req, res, next) => {
  try {
    const loans = await service.getAllLoans(req.user);
    res.json({ data: loans });
  } catch (err) { next(err); }
};

exports.approveLoan = async (req, res, next) => {
  try {
    const loan = await service.approveLoan(req.params.id, req.body.status, req.user.id, req.body.rejectionReason);
    res.json(loan);
  } catch (err) { next(err); }
};

exports.returnLoan = async (req, res, next) => {
  try {
    const loan = await service.returnLoan(req.params.id, req.user.id);
    res.json(loan);
  } catch (err) { next(err); }
};
