import React, { useState, useEffect } from 'react';

// Lấy các style từ EmployeeList (chúng ta sẽ dùng chung)
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
  select: { // Thêm style cho thẻ <select>
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white' // Đảm bảo nền trắng
  },
  button: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
    marginRight: '5px'
  },
  btnPrimary: { backgroundColor: '#004aad' },
  btnDanger: { backgroundColor: '#f44336' },
  btnWarning: { backgroundColor: '#ff9800' },
  btnSecondary: { backgroundColor: '#6c757d' },
  searchContainer: { marginBottom: '20px' }
};

// State ban đầu cho form
const initialFormData = {
  employee_id: '',
  contract_code: '',
  contract_type: 'HĐ chính thức', // Giá trị mặc định
  start_date: '',
  end_date: '',
  status: 'Đang hiệu lực' // Giá trị mặc định
};

function ContractList() {
  // State cho danh sách hợp đồng
  const [contracts, setContracts] = useState([]);
  // --- THÊM MỚI: State cho danh sách nhân viên (để làm dropdown) ---
  const [employees, setEmployees] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form
  const [formData, setFormData] = useState(initialFormData);
  const [apiError, setApiError] = useState(null); 

  // State cho Sửa và Tìm kiếm
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm fetch (READ) Hợp đồng (có tìm kiếm)
  const fetchContracts = (currentSearchTerm) => {
    setLoading(true);
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    
    fetch(`http://localhost:3001/api/contracts?search=${encodedSearchTerm}`)
      .then(response => response.json())
      .then(data => {
        setContracts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Hợp đồng:", error);
        setError("Không thể tải danh sách hợp đồng.");
        setLoading(false);
      });
  };

  // --- THÊM MỚI: Hàm fetch (READ) Nhân viên ---
  const fetchEmployees = () => {
    fetch('http://localhost:3001/api/employees?search=') // Lấy tất cả
      .then(response => response.json())
      .then(data => {
        setEmployees(data); // Lưu vào state employees
      })
      .catch(error => {
        console.error("Lỗi API Nhân sự (cho dropdown):", error);
        // Không set lỗi chính, chỉ log ra
      });
  };

  // Chạy cả 2 hàm fetch khi component tải
  useEffect(() => {
    fetchContracts(''); // Tải hợp đồng
    fetchEmployees();   // Tải nhân viên
  }, []);
  
  // Xử lý tìm kiếm
  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
  };
  const handleSearchSubmit = (e) => {
      e.preventDefault();
      fetchContracts(searchTerm); 
  };

  // Xử lý gõ vào form
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

    // Chuyển đổi ngày tháng về YYYY-MM-DD nếu cần (HTML type="date" đã lo việc này)
    const dataToSubmit = {
      ...formData
    };

    if (editingId) {
      // --- CẬP NHẬT (UPDATE - PUT) ---
      fetch(`http://localhost:3001/api/contracts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      })
      .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lỗi không xác định');
          return data;
      })
      .then(updatedContract => {
        setContracts(contracts.map(con => 
          con.id === editingId ? updatedContract : con
        ));
        handleCancelEdit();
      })
      .catch(error => {
        console.error("Lỗi khi cập nhật hợp đồng:", error);
        setApiError(error.message);
      });

    } else {
      // --- THÊM MỚI (CREATE - POST) ---
      fetch('http://localhost:3001/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      })
      .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lỗi không xác định');
          return data;
      })
      .then(newContract => {
        setContracts([newContract, ...contracts]); 
        setFormData(initialFormData);
      })
      .catch(error => {
        console.error("Lỗi khi thêm hợp đồng:", error);
        setApiError(error.message);
      });
    }
  };

  // Xử lý XÓA
  const handleDelete = (contractId) => {
    if (!window.confirm('Bạn có chắc muốn xóa hợp đồng này?')) {
      return;
    }
    setApiError(null); 
    fetch(`http://localhost:3001/api/contracts/${contractId}`, {
      method: 'DELETE',
    })
    .then(async response => {
      if (response.status === 204) {
        setContracts(contracts.filter(con => con.id !== contractId));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Lỗi khi xóa');
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa hợp đồng:", error);
      setApiError(error.message);
    });
  };

  // Hàm khi nhấn "SỬA"
  const handleEditClick = (contract) => {
    setEditingId(contract.id); 
    // Format lại ngày tháng để input type="date" nhận
    const formattedContract = {
        ...contract,
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
    };
    setFormData(formattedContract);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm khi nhấn "HỦY"
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setApiError(null);
  };

  if (loading) return <p>Đang tải danh sách hợp đồng...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // --- GIAO DIỆN (RENDER) ---
  return (
    <div>
      {/* --- FORM THÊM MỚI / CẬP NHẬT --- */}
      <h2>{editingId ? 'Cập nhật Hợp đồng' : 'Thêm Hợp đồng Mới'}</h2>
      
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {apiError && <p style={{ color: 'red' }}>Lỗi: {apiError}</p>}
          
          <div style={styles.formGrid}>
            
            <div style={styles.formGroup}>
              <label htmlFor="employee_id" style={styles.label}>Nhân viên (*)</label>
              {/* Dropdown danh sách nhân viên */}
              <select 
                id="employee_id" 
                name="employee_id" 
                value={formData.employee_id} 
                onChange={handleInputChange} 
                required 
                style={styles.select}
              >
                <option value="">-- Chọn nhân viên --</option>
                {/* Lặp qua state 'employees' */}
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_code} - {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="contract_code" style={styles.label}>Mã HĐ (*)</label>
              <input type="text" id="contract_code" name="contract_code" 
                     value={formData.contract_code} onChange={handleInputChange} required 
                     style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="contract_type" style={styles.label}>Loại HĐ</label>
              <select 
                id="contract_type" 
                name="contract_type" 
                value={formData.contract_type} 
                onChange={handleInputChange} 
                style={styles.select}
              >
                <option value="HĐ chính thức">HĐ chính thức</option>
                <option value="HĐ thử việc">HĐ thử việc</option>
                <option value="Hợp đồng hợp tác">Hợp đồng hợp tác</option>
                <option value="HĐ thời vụ">HĐ thời vụ</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="status" style={styles.label}>Trạng thái</label>
              <select 
                id="status" 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                style={styles.select}
              >
                <option value="Đang hiệu lực">Đang hiệu lực</option>
                <option value="Hết hạn">Hết hạn</option>
                <option value="Đã thanh lý">Đã thanh lý</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="start_date" style={styles.label}>Ngày bắt đầu</label>
              <input type="date" id="start_date" name="start_date" 
                     value={formData.start_date} onChange={handleInputChange} 
                     style={styles.input} />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="end_date" style={styles.label}>Ngày kết thúc</label>
              <input type="date" id="end_date" name="end_date" 
                     value={formData.end_date} onChange={handleInputChange} 
                     style={styles.input} />
            </div>

          </div>
          
          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Hợp đồng'}
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
      <h2>Danh sách Hợp đồng</h2>
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{...styles.formGroup, flexDirection: 'row', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Tìm theo Mã HĐ, Tên Nhân viên..." 
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
            <th style={styles.tableHeader}>Mã HĐ</th>
            <th style={styles.tableHeader}>Tên nhân viên</th>
            <th style={styles.tableHeader}>Loại HĐ</th>
            <th style={styles.tableHeader}>Ngày bắt đầu</th>
            <th style={styles.tableHeader}>Ngày kết thúc</th>
            <th style={styles.tableHeader}>Trạng thái</th>
            <th style={styles.tableHeader}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(con => (
            <tr key={con.id}>
              <td style={styles.tableCell}>{con.contract_code}</td>
              <td style={styles.tableCell}>{con.employee_name}</td>
              <td style={styles.tableCell}>{con.contract_type}</td>
              <td style={styles.tableCell}>{new Date(con.start_date).toLocaleDateString('vi-VN')}</td>
              <td style={styles.tableCell}>{new Date(con.end_date).toLocaleDateString('vi-VN')}</td>
              <td style={styles.tableCell}>{con.status}</td>
              <td style={styles.tableCell}>
                <button style={{ ...styles.button, ...styles.btnWarning }}
                        onClick={() => handleEditClick(con)}>
                  Sửa
                </button>
                <button style={{ ...styles.button, ...styles.btnDanger }}
                        onClick={() => handleDelete(con.id)}>
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

export default ContractList;
