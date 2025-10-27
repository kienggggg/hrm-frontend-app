import React, { useState, useEffect } from 'react';

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
  // --- THÊM MỚI ---
  btnWarning: {
    backgroundColor: '#ff9800' // Nút Sửa
  },
  btnSecondary: {
    backgroundColor: '#6c757d' // Nút Hủy
  },
  searchContainer: {
    marginBottom: '20px'
  }
  // --- HẾT THÊM MỚI ---
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

  // --- THÊM MỚI: State cho việc Sửa và Tìm kiếm ---
  const [editingId, setEditingId] = useState(null); // Lưu ID của nhân viên đang sửa
  const [searchTerm, setSearchTerm] = useState(''); // Lưu nội dung ô tìm kiếm

  // Hàm fetch (READ) (NÂNG CẤP)
  // Giờ sẽ fetch dựa trên searchTerm
  const fetchEmployees = (currentSearchTerm) => {
    setLoading(true);
    // Mã hóa searchTerm để an toàn cho URL
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    
    // Gắn searchTerm vào URL
    fetch(`http://localhost:3001/api/employees?search=${encodedSearchTerm}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch employees');
        return response.json();
      })
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Nhân sự:", error);
        setError("Không thể tải danh sách nhân sự.");
        setLoading(false);
      });
  };

  // Chạy hàm fetch khi component tải (chỉ 1 lần)
  useEffect(() => {
    fetchEmployees(''); // Tải tất cả lúc ban đầu
  }, []);
  
  // --- THÊM MỚI: Xử lý gõ vào ô TÌM KIẾM ---
  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
  };

  // --- THÊM MỚI: Xử lý khi nhấn nút TÌM KIẾM ---
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      // Gọi API với searchTerm hiện tại
      fetchEmployees(searchTerm); 
  };

  // Xử lý khi gõ vào FORM (Giữ nguyên)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // --- NÂNG CẤP: Hàm xử lý SUBMIT FORM (Thêm MỚI hoặc CẬP NHẬT) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);

    // Quyết định: Sửa (UPDATE) hay Thêm (CREATE)?
    if (editingId) {
      // --- CẬP NHẬT (UPDATE - PUT) ---
      fetch(`http://localhost:3001/api/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lỗi không xác định');
          return data;
      })
      .then(updatedEmployee => {
        // Cập nhật lại danh sách employees trong state
        setEmployees(employees.map(emp => 
          emp.id === editingId ? updatedEmployee : emp
        ));
        handleCancelEdit(); // Xóa form và reset state
      })
      .catch(error => {
        console.error("Lỗi khi cập nhật nhân viên:", error);
        setApiError(error.message);
      });

    } else {
      // --- THÊM MỚI (CREATE - POST) ---
      fetch('http://localhost:3001/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lỗi không xác định');
          return data;
      })
      .then(newEmployee => {
        setEmployees([newEmployee, ...employees]); 
        setFormData(initialFormData); // Reset form
      })
      .catch(error => {
        console.error("Lỗi khi thêm nhân viên:", error);
        setApiError(error.message);
      });
    }
  };

  // Xử lý XÓA
  const handleDelete = (employeeId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      return;
    }
    setApiError(null); 
    fetch(`http://localhost:3001/api/employees/${employeeId}`, {
      method: 'DELETE',
    })
    .then(async response => {
      if (response.status === 204) {
        setEmployees(employees.filter(emp => emp.id !== employeeId));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Lỗi khi xóa');
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa nhân viên:", error);
      setApiError(error.message);
    });
  };

  // --- THÊM MỚI: Hàm khi nhấn nút "SỬA" ---
  const handleEditClick = (employee) => {
    setEditingId(employee.id); 
    setFormData(employee);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- THÊM MỚI: Hàm khi nhấn nút "HỦY BỎ" (khi đang sửa) ---
  const handleCancelEdit = () => {
    setEditingId(null); // Tắt chế độ sửa
    setFormData(initialFormData); // Reset form
    setApiError(null); // Xóa lỗi
  };


  if (loading) return <p>Đang tải danh sách nhân sự...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // --- GIAO DIỆN (RENDER) ---
  return (
    <div>
      {/* --- FORM THÊM MỚI / CẬP NHẬT --- */}
      <h2>{editingId ? 'Cập nhật Nhân sự' : 'Thêm Nhân sự Mới'}</h2>
      
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {apiError && <p style={{ color: 'red' }}>Lỗi: {apiError}</p>}
          
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
          
          {/* Nút Submit (thay đổi text) */}
          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Nhân sự'}
          </button>
          
          {/* Nút Hủy (chỉ hiện khi đang sửa) */}
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
          </div>
        </form>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
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
          {employees.map(emp => (
            <tr key={emp.id}>
              <td style={styles.tableCell}>{emp.employee_code}</td>
              <td style={styles.tableCell}>{emp.full_name}</td>
              <td style={styles.tableCell}>{emp.department}</td>
              <td style={styles.tableCell}>{emp.position}</td>
              <td style={styles.tableCell}>{emp.email}</td>
              <td style={styles.tableCell}>
                {/* --- NÚT SỬA --- */}
                <button style={{ ...styles.button, ...styles.btnWarning }}
                        onClick={() => handleEditClick(emp)}> {/* Gọi hàm sửa */}
                  Sửa
                </button>
                {/* --- NÚT XÓA --- */}
                <button style={{ ...styles.button, ...styles.btnDanger }}
                        onClick={() => handleDelete(emp.id)}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeList;

