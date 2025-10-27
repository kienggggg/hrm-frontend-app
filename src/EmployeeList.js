import React, { useState, useEffect } from 'react';

// Lấy URL API từ biến môi trường, nếu không có thì dùng localhost (cho development)
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// CSS styles (Thêm nút Sửa/Cảnh báo)
const styles = {
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableCell: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
  tableHeader: { border: '1px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#004aad', color: 'white', fontWeight: 'bold' },
  formContainer: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '5px',
    fontWeight: '600'
  },
  input: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  button: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
    marginRight: '5px'
  },
  btnPrimary: {
    backgroundColor: '#004aad' // Nút Thêm/Lưu
  },
  btnDanger: {
    backgroundColor: '#f44336' // Nút Xóa
  },
  btnWarning: {
    backgroundColor: '#ff9800' // Nút Sửa
  },
  btnSecondary: {
    backgroundColor: '#6c757d' // Nút Hủy
  },
  searchContainer: {
    marginBottom: '20px'
  }
};

// State ban đầu cho form (để dễ dàng reset)
const initialFormData = {
  employee_code: '',
  full_name: '',
  department: '',
  position: '',
  email: '',
  phone: ''
};

function EmployeeList() {
  // State cho danh sách
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form
  const [formData, setFormData] = useState(initialFormData);
  const [apiError, setApiError] = useState(null);

  // State cho việc Sửa và Tìm kiếm
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm fetch (READ)
  const fetchEmployees = (currentSearchTerm) => {
    setLoading(true);
    setError(null); // Xóa lỗi cũ
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    fetch(`${apiUrl}/api/employees?search=${encodedSearchTerm}`) // SỬ DỤNG apiUrl
      .then(response => {
        if (!response.ok) throw new Error('Không thể tải danh sách nhân sự');
        return response.json();
      })
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Nhân sự:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Chạy hàm fetch khi component tải (chỉ 1 lần)
  useEffect(() => {
    fetchEmployees('');
  }, []);

  // Xử lý gõ vào ô TÌM KIẾM
  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
  };

  // Xử lý khi nhấn nút TÌM KIẾM
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      fetchEmployees(searchTerm);
  };

  // Xử lý khi gõ vào FORM
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Hàm xử lý SUBMIT FORM (Thêm MỚI hoặc CẬP NHẬT)
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `${apiUrl}/api/employees/${editingId}` // SỬ DỤNG apiUrl
      : `${apiUrl}/api/employees`;             // SỬ DỤNG apiUrl

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        // Chỉ parse JSON nếu có nội dung
        if (response.status === 204) return null;
        return response.json();
    })
    .then(resultData => {
        if (resultData) { // Kiểm tra resultData trước khi xử lý
            if (editingId) {
                setEmployees(employees.map(emp =>
                    emp.id === editingId ? resultData : emp
                ));
                handleCancelEdit();
            } else {
                setEmployees([resultData, ...employees]);
                setFormData(initialFormData);
            }
        }
    })
    .catch(error => {
      console.error(`Lỗi khi ${editingId ? 'cập nhật' : 'thêm'} nhân viên:`, error);
      setApiError(error.message);
    });
  };

  // Xử lý XÓA
  const handleDelete = (employeeId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      return;
    }
    setApiError(null);
    fetch(`${apiUrl}/api/employees/${employeeId}`, { // SỬ DỤNG apiUrl
      method: 'DELETE',
    })
    .then(async response => {
      if (response.status === 204) {
        setEmployees(employees.filter(emp => emp.id !== employeeId));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định khi xóa' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa nhân viên:", error);
      setApiError(error.message);
    });
  };

  // Hàm khi nhấn nút "SỬA"
  const handleEditClick = (employee) => {
    setEditingId(employee.id);
    // Đảm bảo tất cả các trường đều là chuỗi hoặc rỗng
    const editData = {
        employee_code: employee.employee_code || '',
        full_name: employee.full_name || '',
        department: employee.department || '',
        position: employee.position || '',
        email: employee.email || '',
        phone: employee.phone || '',
    };
    setFormData(editData);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Hàm khi nhấn nút "HỦY BỎ" (khi đang sửa)
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setApiError(null);
  };


  const renderLoading = () => <p>Đang tải dữ liệu...</p>;
  const renderError = () => <p style={{ color: 'red' }}>Lỗi: {error || apiError}</p>;

  return (
    <div>
      {/* --- FORM THÊM MỚI / CẬP NHẬT --- */}
      <h2>{editingId ? 'Cập nhật Nhân sự' : 'Thêm Nhân sự Mới'}</h2>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {(apiError || error) && renderError()}

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label htmlFor="employee_code" style={styles.label}>Mã NV (*)</label>
              <input type="text" id="employee_code" name="employee_code"
                     value={formData.employee_code} onChange={handleInputChange} required
                     style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="full_name" style={styles.label}>Họ tên (*)</label>
              <input type="text" id="full_name" name="full_name"
                     value={formData.full_name} onChange={handleInputChange} required
                     style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="department" style={styles.label}>Phòng ban</label>
              <input type="text" id="department" name="department"
                     value={formData.department} onChange={handleInputChange}
                     style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="position" style={styles.label}>Chức vụ</label>
              <input type="text" id="position" name="position"
                     value={formData.position} onChange={handleInputChange}
                     style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <input type="email" id="email" name="email"
                     value={formData.email} onChange={handleInputChange}
                     style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label}>Số điện thoại</label>
              <input type="text" id="phone" name="phone"
                     value={formData.phone} onChange={handleInputChange}
                     style={styles.input} />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Nhân sự'}
          </button>

          {editingId && (
            <button type="button"
                    style={{ ...styles.button, ...styles.btnSecondary, marginTop: '15px' }}
                    onClick={handleCancelEdit}>
              Hủy
            </button>
          )}
        </form>
      </div>

      {/* --- THANH TÌM KIẾM --- */}
      <h2>Danh sách Nhân sự</h2>
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{...styles.formGroup, flexDirection: 'row', gap: '10px' }}>
            <input
              type="text"
              placeholder="Tìm theo Tên, Mã NV, Email..."
              style={{ ...styles.input, flex: 1 }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit" style={{...styles.button, ...styles.btnPrimary}}>
              Tìm kiếm
            </button>
             <button type="button"
                    style={{ ...styles.button, ...styles.btnSecondary}}
                    onClick={() => { setSearchTerm(''); fetchEmployees(''); }}>
               Xóa tìm kiếm
            </button>
          </div>
        </form>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
      {loading ? renderLoading() : error ? null : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Mã NV</th>
                <th style={styles.tableHeader}>Họ tên</th>
                <th style={styles.tableHeader}>Phòng ban</th>
                <th style={styles.tableHeader}>Chức vụ</th>
                <th style={styles.tableHeader}>Email</th>
                <th style={styles.tableHeader}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                   <tr><td colSpan="6" style={{...styles.tableCell, textAlign: 'center'}}>Không tìm thấy nhân viên nào.</td></tr>
              ) : (
                  employees.map(emp => (
                    <tr key={emp.id}>
                      <td style={styles.tableCell}>{emp.employee_code}</td>
                      <td style={styles.tableCell}>{emp.full_name}</td>
                      <td style={styles.tableCell}>{emp.department || '-'}</td>
                      <td style={styles.tableCell}>{emp.position || '-'}</td>
                      <td style={styles.tableCell}>{emp.email || '-'}</td>
                      <td style={styles.tableCell}>
                        <button style={{ ...styles.button, ...styles.btnWarning }}
                                onClick={() => handleEditClick(emp)}>
                          Sửa
                        </button>
                        <button style={{ ...styles.button, ...styles.btnDanger }}
                                onClick={() => handleDelete(emp.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
      )}
    </div>
  );
}

export default EmployeeList;
