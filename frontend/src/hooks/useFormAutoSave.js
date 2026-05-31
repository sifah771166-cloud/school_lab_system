import { useEffect, useRef, useCallback } from 'react';
import * as indexedDB from '../utils/indexedDB';

/**
 * Custom hook for automatic form data persistence
 * Saves form data to IndexedDB and restores it on component mount
 */
export const useFormAutoSave = (formId, initialData = {}) => {
  const formDataRef = useRef(initialData);
  const timeoutRef = useRef(null);
  const saveDelayMs = 1000; // Save after 1 second of inactivity

  /**
   * Save form data to IndexedDB
   */
  const saveFormData = useCallback(async (data) => {
    try {
      await indexedDB.saveFormData(formId, data);
      console.log('Form data auto-saved:', formId);
    } catch (error) {
      console.error('Error auto-saving form data:', error);
    }
  }, [formId]);

  /**
   * Handle form field changes
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Update form data reference
    formDataRef.current = {
      ...formDataRef.current,
      [name]: type === 'checkbox' ? checked : value
    };

    // Debounce save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFormData(formDataRef.current);
    }, saveDelayMs);
  }, [saveFormData]);

  /**
   * Restore form data from IndexedDB
   */
  const restoreFormData = useCallback(async () => {
    try {
      const savedData = await indexedDB.getFormData(formId);
      if (savedData) {
        formDataRef.current = savedData;
        console.log('Form data restored:', formId);
        return savedData;
      }
      return null;
    } catch (error) {
      console.error('Error restoring form data:', error);
      return null;
    }
  }, [formId]);

  /**
   * Clear saved form data
   */
  const clearSavedData = useCallback(async () => {
    try {
      await indexedDB.clearFormData(formId);
      formDataRef.current = initialData;
      console.log('Form data cleared:', formId);
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }, [formId, initialData]);

  /**
   * Manually save form data
   */
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveFormData(formDataRef.current);
  }, [saveFormData]);

  /**
   * Update form data directly
   */
  const updateData = useCallback((newData) => {
    formDataRef.current = { ...formDataRef.current, ...newData };
  }, []);

  /**
   * Get current form data
   */
  const getFormData = useCallback(() => {
    return formDataRef.current;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handleChange,
    restoreFormData,
    clearSavedData,
    save,
    updateData,
    getFormData,
    formData: formDataRef.current
  };
};

export default useFormAutoSave;
