const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  globalSearch,
  searchModule,
  getAutocompleteSuggestions,
  getSearchHistory,
} = require('./search.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// Global search across all modules
router.get('/', globalSearch);

// Search specific module
router.get('/:module', searchModule);

// Get autocomplete suggestions
router.get('/autocomplete/suggestions', getAutocompleteSuggestions);

// Get search history
router.get('/history/list', getSearchHistory);

module.exports = router;
