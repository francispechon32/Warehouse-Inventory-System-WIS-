// Set to false when the real backend is ready
export const USE_MOCK_DATA = true;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const ENDPOINTS = {
  products:          `${API_BASE_URL}/products`,
  purchasingOrders:  `${API_BASE_URL}/purchasing-orders`,
  endingInventory:   `${API_BASE_URL}/ending-inventory`,
  stockSheets:       `${API_BASE_URL}/stock-sheets`,
  returns:           `${API_BASE_URL}/returns`,
  backloadInventory: `${API_BASE_URL}/backload-inventory`,
  advanceCustomerPO: `${API_BASE_URL}/advance-customer-po`,
};
