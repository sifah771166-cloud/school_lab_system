const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  globalSearch,
  searchModule,
  getAutocompleteSuggestions,
  getSearchHistory,
} = require('./search.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Global search across all modules - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  globalSearch
);

// Search specific module - cached with role/department specific key
router.get('/:module', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  searchModule
);

// Get autocomplete suggestions - cached with role/department specific key
router.get('/autocomplete/suggestions', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  getAutocompleteSuggestions
);

// Get search history - cached with user-specific key
router.get('/history/list', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.user), 
  getSearchHistory
);

module.exports = router;