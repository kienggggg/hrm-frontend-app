import React, { useState, useEffect } from 'react';

// Sử dụng chung styles
const styles = {
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  tableCell: { border: '1px solid #ddd', padding: '12px', textAlign: 'left' },
  tableHeader: { border: '1px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#004aad', color: 'white', fontWeight: 'bold' },
  formContainer: { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '5px', fontWeight: '600' },
  input: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
  select: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' },
    textarea: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }, // Style cho textarea
  button: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', marginRight: '5px' },
  btnPrimary: { backgroundColor: '#004aad' },
  btnDanger: { backgroundColor: '#f44336' },
  btnWarning: { backgroundColor: '#ff9800' },
  btnSecondary: { backgroundColor: '#6c757d' },
  searchContainer: { marginBottom: '20px' }
};

// State ban đầu cho form Chấm công
const initialFormData = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
  status: 'Đi làm', // Mặc định
  notes: ''
};

// Danh sách các trạng thái chấm công
const attendanceStatuses = ['Đi làm', 'Nghỉ phép', 'Nghỉ ốm', 'Đi muộn', 'Về sớm', 'Vắng'];

function AttendanceList() {
  // State cho danh sách chấm công
  const [attendances, setAttendances] = useState([]);
  // State cho danh sách nhân viên (cho dropdown)
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form, Sửa, Tìm kiếm
  const [formData, setFormData] = useState(initialFormData);
  const [apiError, setApiError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm fetch (READ) Chấm công
  const fetchAttendances = (currentSearchTerm) => {
    setLoading(true);
    setError(null);
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/attendance?search=${encodedSearchTerm}`)
      .then(response => {
           if (!response.ok) throw new Error('Không thể tải dữ liệu chấm công');
           return response.json();
       })
      .then(data => {
        setAttendances(data); // Cập nhật state chấm công
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Chấm công:", error);
        setError(error.message);
        setLoading(false);
      });
  };

  // Hàm fetch (READ) Nhân viên (giữ nguyên)
  const fetchEmployees = () => {
    fetch('http://localhost:3001/api/employees?search=')
      .then(response => {
           if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
           return response.json();
       })
      .then(data => setEmployees(data))
      .catch(error => {
          console.error("Lỗi API Nhân sự (dropdown):", error);
          setError(prev => prev ? `${prev}. ${error.message}` : error.message);
      });
  };

  // Chạy cả 2 fetch khi tải component
  useEffect(() => {
    fetchAttendances('');
    fetchEmployees();
  }, []);

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => { e.preventDefault(); fetchAttendances(searchTerm); };

  // Xử lý gõ vào form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Xử lý SUBMIT FORM (Thêm/Sửa)
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);

    const dataToSubmit = { ...formData };
    // Đảm bảo notes không phải là undefined (nếu người dùng không nhập gì)
     dataToSubmit.notes = dataToSubmit.notes || '';


    const method = editingId ? 'PUT' : 'POST';
    // Thay đổi URL API
    const url = editingId
      ? `http://localhost:3001/api/attendance/${editingId}`
      : 'http://localhost:3001/api/attendance';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSubmit),
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) return null;
        return response.json();
    })
    .then(resultData => {
       if (resultData) {
            if (editingId) {
                // Cập nhật state chấm công
                setAttendances(attendances.map(att => att.id === editingId ? resultData : att));
                handleCancelEdit();
            } else {
                // Thêm vào state chấm công
                setAttendances([resultData, ...attendances]);
                setFormData(initialFormData); // Reset form giữ lại ngày hôm nay
            }
       }
    })
    .catch(error => {
      console.error(`Lỗi khi ${editingId ? 'cập nhật' : 'thêm'} chấm công:`, error);
      setApiError(error.message);
    });
  };

  // Xử lý XÓA
  const handleDelete = (attendanceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi chấm công này?')) return;
    setApiError(null);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/attendance/${attendanceId}`, { method: 'DELETE' })
    .then(async response => {
      if (response.status === 204) {
        // Cập nhật state chấm công
        setAttendances(attendances.filter(att => att.id !== attendanceId));
      } else {
         const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định khi xóa' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa chấm công:", error);
      setApiError(error.message);
    });
  };

  // Hàm khi nhấn "SỬA"
  const handleEditClick = (attendance) => {
    setEditingId(attendance.id);
    const formattedAttendance = {
        ...attendance,
        employee_id: attendance.employee_id ? String(attendance.employee_id) : '',
        date: attendance.date ? attendance.date.split('T')[0] : '',
        notes: attendance.notes || '' // Đảm bảo notes là chuỗi
    };
    setFormData(formattedAttendance);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm khi nhấn "HỦY"
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setApiError(null);
  };

  // --- GIAO DIỆN (RENDER) ---
  const renderLoading = () => <p>Đang tải dữ liệu...</p>;
  const renderError = () => <p style={{ color: 'red' }}>Lỗi: {error || apiError}</p>;

  return (
    <div>
      {/* --- FORM THÊM MỚI / CẬP NHẬT --- */}
      <h2>{editingId ? 'Cập nhật Chấm công' : 'Thêm Chấm công'}</h2>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {(apiError || error) && renderError()}

          {/* Thay đổi Grid layout cho phù hợp */}
          <div style={{...styles.formGrid, gridTemplateColumns: '1fr 1fr 1fr'}}>
            <div style={styles.formGroup}>
              <label htmlFor="employee_id" style={styles.label}>Nhân viên (*)</label>
              <select id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleInputChange} required style={styles.select}>
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                ))}
              </select>
            </div>
             <div style={styles.formGroup}>
              <label htmlFor="date" style={styles.label}>Ngày (*)</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="status" style={styles.label}>Trạng thái (*)</label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} required style={styles.select}>
                {/* Lặp qua danh sách trạng thái */}
                {attendanceStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {/* Ghi chú chiếm toàn bộ hàng dưới */}
            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label htmlFor="notes" style={styles.label}>Ghi chú</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows="3" style={styles.textarea}></textarea>
            </div>

          </div>

          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Chấm công'}
          </button>
          {editingId && (
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary, marginTop: '15px' }} onClick={handleCancelEdit}>Hủy</button>
          )}
        </form>
      </div>

      {/* --- THANH TÌM KIẾM --- */}
      <h2>Danh sách Chấm công</h2>
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{...styles.formGroup, flexDirection: 'row', gap: '10px' }}>
            <input type="text" placeholder="Tìm theo Tên NV, Mã NV, Trạng thái..." style={{ ...styles.input, flex: 1 }} value={searchTerm} onChange={handleSearchChange}/>
            <button type="submit" style={{...styles.button, ...styles.btnPrimary}}>Tìm kiếm</button>
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary}} onClick={() => { setSearchTerm(''); fetchAttendances(''); }}>Xóa tìm kiếm</button>
          </div>
        </form>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
      {loading && attendances.length === 0 ? renderLoading() : error ? null : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Ngày</th>
                <th style={styles.tableHeader}>Mã NV</th>
                <th style={styles.tableHeader}>Tên nhân viên</th>
                <th style={styles.tableHeader}>Trạng thái</th>
                <th style={styles.tableHeader}>Ghi chú</th>
                <th style={styles.tableHeader}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 && !loading ? (
                  <tr><td colSpan="6" style={{...styles.tableCell, textAlign: 'center'}}>Không tìm thấy bản ghi chấm công nào.</td></tr>
              ) : (
                  attendances.map(att => (
                    <tr key={att.id}>
                      <td style={styles.tableCell}>{att.date ? new Date(att.date).toLocaleDateString('vi-VN') : ''}</td>
                      <td style={styles.tableCell}>{att.employee_code}</td>
                      <td style={styles.tableCell}>{att.employee_name}</td>
                      <td style={styles.tableCell}>{att.status}</td>
                      <td style={styles.tableCell}>{att.notes || '-'}</td> {/* Hiển thị '-' nếu không có ghi chú */}
                      <td style={styles.tableCell}>
                        <button style={{ ...styles.button, ...styles.btnWarning }} onClick={() => handleEditClick(att)}>Sửa</button>
                        <button style={{ ...styles.button, ...styles.btnDanger }} onClick={() => handleDelete(att.id)}>Xóa</button>
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

export default AttendanceList;
