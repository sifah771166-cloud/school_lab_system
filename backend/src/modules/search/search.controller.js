const service = require('./search.service');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q, type, limit } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const filters = {
      type,
      limit: limit ? parseInt(limit) : 10,
    };

    const results = await service.globalSearch(q, req.user, filters);

    res.json({
      query: q,
      results,
      totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (err) {
    next(err);
  }
};

exports.searchModule = async (req, res, next) => {
  try {
    const { module } = req.params;
    const { q, limit, offset } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const filters = {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const results = await service.searchModule(module, q, req.user, filters);

    res.json({
      module,
      query: q,
      results,
      count: results.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAutocompleteSuggestions = async (req, res, next) => {
  try {
    const { q, module } = req.query;

    if (!q || q.length < 1) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await service.getAutocompleteSuggestions(q, req.user, module);

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
};

exports.getSearchHistory = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = await service.getSearchHistory(req.user.id, limit ? parseInt(limit) : 10);

    res.json({ history });
  } catch (err) {
    next(err);
  }
};
