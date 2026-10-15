/**
 * Centralized API service for PaySphere Frontend
 * Connects frontend modules to Django REST Framework backend & PostgreSQL database.
 */

const BASE_URL = '';

export const getAuthToken = () => {
  return localStorage.getItem('paysphere_token') || '';
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
};

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.detail || data.message || data.error || JSON.stringify(data))) ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

/* ==========================================================================
   DASHBOARD SERVICE
   ========================================================================== */
export const DashboardService = {
  async getStats() {
    const response = await fetch(`${BASE_URL}/api/dashboard/stats/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   DEPARTMENT SERVICE
   ========================================================================== */
export const DepartmentService = {
  async getAll() {
    const response = await fetch(`${BASE_URL}/api/departments/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async create(dept) {
    const payload = {
      name: dept.name,
      description: dept.description || '',
      head: dept.head || '',
      location: dept.location || '',
      is_active: dept.status !== 'Inactive',
    };
    const response = await fetch(`${BASE_URL}/api/departments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async update(id, dept) {
    const payload = {
      name: dept.name,
      description: dept.description || '',
      head: dept.head || '',
      location: dept.location || '',
      is_active: dept.status !== 'Inactive',
    };
    const response = await fetch(`${BASE_URL}/api/departments/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${BASE_URL}/api/departments/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   WORKER SERVICE
   ========================================================================== */
export const WorkerService = {
  async getAll() {
    const response = await fetch(`${BASE_URL}/api/workers/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async create(worker) {
    const response = await fetch(`${BASE_URL}/api/workers/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(worker),
    });
    return handleResponse(response);
  },

  async update(id, worker) {
    const response = await fetch(`${BASE_URL}/api/workers/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(worker),
    });
    return handleResponse(response);
  },

  async delete(id) {
    const response = await fetch(`${BASE_URL}/api/workers/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async deactivate(id) {
    const response = await fetch(`${BASE_URL}/api/workers/${id}/deactivate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   ATTENDANCE SERVICE
   ========================================================================== */
export const AttendanceService = {
  async getRecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/attendance/records/${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async getDailyStats(date) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await fetch(`${BASE_URL}/api/attendance/stats/daily/${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async bulkSave(records, date, approvalStatus = 'Draft') {
    const response = await fetch(`${BASE_URL}/api/attendance/bulk/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records, date, approval_status: approvalStatus }),
    });
    return handleResponse(response);
  },

  async approveBulk(recordIds, action = 'Approved', reason = '') {
    const response = await fetch(`${BASE_URL}/api/attendance/approve-bulk/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ record_ids: recordIds, action, reason }),
    });
    return handleResponse(response);
  },

  async importFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Token ${token}`;

    const response = await fetch(`${BASE_URL}/api/attendance/import/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  async getImportBatches() {
    const response = await fetch(`${BASE_URL}/api/attendance/import/batches/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },
};

/* ==========================================================================
   CONTRACTOR SERVICE
   ========================================================================== */
export const ContractorService = {
  async getAll() {
    const response = await fetch(`${BASE_URL}/api/contractors/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async create(contractor) {
    const response = await fetch(`${BASE_URL}/api/contractors/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contractor),
    });
    return handleResponse(response);
  },

  async getBills() {
    const response = await fetch(`${BASE_URL}/api/contractors/bills/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async approveBill(billId, approvedAmount) {
    const response = await fetch(`${BASE_URL}/api/contractors/bills/${billId}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approved_amount: approvedAmount }),
    });
    return handleResponse(response);
  },

  async payBill(billId, amount, paymentReference = '') {
    const response = await fetch(`${BASE_URL}/api/contractors/bills/${billId}/pay/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, payment_reference: paymentReference }),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   ADVANCE SERVICE
   ========================================================================== */
export const AdvanceService = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/advances/${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async create(advance) {
    const response = await fetch(`${BASE_URL}/api/advances/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(advance),
    });
    return handleResponse(response);
  },

  async repay(advanceId, amount, notes = '', referenceNo = '') {
    const response = await fetch(`${BASE_URL}/api/advances/${advanceId}/repay/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, notes, reference_number: referenceNo }),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   PAYROLL SERVICE
   ========================================================================== */
export const PayrollService = {
  async getRuleConfig() {
    const response = await fetch(`${BASE_URL}/api/payroll/config/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateRuleConfig(config) {
    const response = await fetch(`${BASE_URL}/api/payroll/config/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    return handleResponse(response);
  },

  async getPeriods() {
    const response = await fetch(`${BASE_URL}/api/payroll/periods/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async createPeriod(period) {
    const response = await fetch(`${BASE_URL}/api/payroll/periods/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(period),
    });
    return handleResponse(response);
  },

  async calculate(periodId) {
    const response = await fetch(`${BASE_URL}/api/payroll/periods/${periodId}/calculate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async approve(periodId) {
    const response = await fetch(`${BASE_URL}/api/payroll/periods/${periodId}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async lock(periodId) {
    const response = await fetch(`${BASE_URL}/api/payroll/periods/${periodId}/lock/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getLines(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/payroll/lines/${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : (data?.results || []);
  },

  async recordPayment(lineId, amount, paymentMethod = 'Bank Transfer', referenceNo = '') {
    const response = await fetch(`${BASE_URL}/api/payroll/lines/${lineId}/pay/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, payment_method: paymentMethod, reference_number: referenceNo }),
    });
    return handleResponse(response);
  },

  async getPayslip(lineId) {
    const response = await fetch(`${BASE_URL}/api/payroll/lines/${lineId}/payslip/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

/* ==========================================================================
   DATASTORE SERVICE (Persistent modules fallback/cache)
   ========================================================================== */
export const DataStoreService = {
  async get(key, defaultValue = []) {
    try {
      const response = await fetch(`${BASE_URL}/api/datastore/${key}/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return defaultValue;
      const resData = await response.json();
      return resData.data !== undefined && resData.data !== null ? resData.data : defaultValue;
    } catch (err) {
      console.warn(`DataStore load error for ${key}:`, err);
      return defaultValue;
    }
  },

  async save(key, data) {
    try {
      const response = await fetch(`${BASE_URL}/api/datastore/${key}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, data }),
      });
      return handleResponse(response);
    } catch (err) {
      console.error(`DataStore save error for ${key}:`, err);
      throw err;
    }
  },
};
