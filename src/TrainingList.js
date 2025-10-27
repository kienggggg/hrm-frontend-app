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
  button: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', marginRight: '5px' },
  btnPrimary: { backgroundColor: '#004aad' },
  btnDanger: { backgroundColor: '#f44336' },
  btnWarning: { backgroundColor: '#ff9800' },
  btnSecondary: { backgroundColor: '#6c757d' },
  searchContainer: { marginBottom: '20px' }
};

// State ban đầu cho form Đào tạo
const initialFormData = {
  employee_id: '',
  course_name: '',
  trainer_name: '',
  start_date: '',
  end_date: '',
  score: '' // Để trống, có thể nhập hoặc không
};

function TrainingList() {
  // State cho danh sách đào tạo
  const [trainings, setTrainings] = useState([]);
  // State cho danh sách nhân viên (cho dropdown)
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form, Sửa, Tìm kiếm
  const [formData, setFormData] = useState(initialFormData);
  const [apiError, setApiError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm fetch (READ) Đào tạo
  const fetchTrainings = (currentSearchTerm) => {
    setLoading(true);
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/training?search=${encodedSearchTerm}`)
      .then(response => {
           if (!response.ok) throw new Error('Failed to fetch training data');
           return response.json();
       })
      .then(data => {
        setTrainings(data); // Cập nhật state đào tạo
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Đào tạo:", error);
        setError("Không thể tải danh sách đào tạo.");
        setLoading(false);
      });
  };

  // Hàm fetch (READ) Nhân viên (giữ nguyên)
  const fetchEmployees = () => {
    fetch('http://localhost:3001/api/employees?search=')
      .then(response => {
           if (!response.ok) throw new Error('Failed to fetch employees for dropdown');
           return response.json();
       })
      .then(data => setEmployees(data))
      .catch(error => console.error("Lỗi API Nhân sự (dropdown):", error));
  };

  // Chạy cả 2 fetch khi tải component
  useEffect(() => {
    fetchTrainings('');
    fetchEmployees();
  }, []);

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => { e.preventDefault(); fetchTrainings(searchTerm); };

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
    // Đảm bảo score là số hoặc null
    dataToSubmit.score = dataToSubmit.score ? parseInt(dataToSubmit.score, 10) : null;
    // Kiểm tra score hợp lệ (nếu có nhập)
    if (dataToSubmit.score !== null && (isNaN(dataToSubmit.score) || dataToSubmit.score < 0 || dataToSubmit.score > 100)) {
        setApiError("Điểm đánh giá phải là số từ 0 đến 100.");
        return;
    }


    const method = editingId ? 'PUT' : 'POST';
    // Thay đổi URL API
    const url = editingId
      ? `http://localhost:3001/api/training/${editingId}`
      : 'http://localhost:3001/api/training';

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
         // Chỉ parse JSON nếu có nội dung (PUT/POST trả về 200/201)
        if (response.status === 204) return null;
        return response.json();
    })
    .then(resultData => {
      if (editingId) {
        // Cập nhật state đào tạo
        setTrainings(trainings.map(t => t.id === editingId ? resultData : t));
        handleCancelEdit();
      } else {
        // Thêm vào state đào tạo
        setTrainings([resultData, ...trainings]);
        setFormData(initialFormData);
      }
    })
    .catch(error => {
      console.error(`Lỗi khi ${editingId ? 'cập nhật' : 'thêm'} đào tạo:`, error);
      setApiError(error.message);
    });
  };

  // Xử lý XÓA
  const handleDelete = (trainingId) => {
    if (!window.confirm('Bạn có chắc muốn xóa khóa đào tạo này?')) return;
    setApiError(null);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/training/${trainingId}`, { method: 'DELETE' })
    .then(async response => {
      if (response.status === 204) {
        // Cập nhật state đào tạo
        setTrainings(trainings.filter(t => t.id !== trainingId));
      } else {
         const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định khi xóa' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa đào tạo:", error);
      setApiError(error.message);
    });
  };

  // Hàm khi nhấn "SỬA"
  const handleEditClick = (training) => {
    setEditingId(training.id);
    const formattedTraining = {
        ...training,
        employee_id: training.employee_id ? String(training.employee_id) : '',
        start_date: training.start_date ? training.start_date.split('T')[0] : '',
        end_date: training.end_date ? training.end_date.split('T')[0] : '',
        // Chuyển score thành chuỗi để hiển thị trên input, hoặc chuỗi rỗng nếu null
        score: training.score !== null ? String(training.score) : ''
    };
    setFormData(formattedTraining);
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
      <h2>{editingId ? 'Cập nhật Chương trình Đào tạo' : 'Thêm Chương trình Đào tạo'}</h2>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {apiError && !error && <p style={{ color: 'red' }}>Lỗi: {apiError}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div style={styles.formGrid}>
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
              <label htmlFor="course_name" style={styles.label}>Tên khóa học (*)</label>
              <input type="text" id="course_name" name="course_name" value={formData.course_name} onChange={handleInputChange} required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="trainer_name" style={styles.label}>Người đào tạo</label>
              <input type="text" id="trainer_name" name="trainer_name" value={formData.trainer_name} onChange={handleInputChange} style={styles.input} />
            </div>
             <div style={styles.formGroup}>
              <label htmlFor="score" style={styles.label}>Điểm (0-100)</label>
              <input type="number" id="score" name="score" value={formData.score} onChange={handleInputChange} min="0" max="100" style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="start_date" style={styles.label}>Ngày bắt đầu (*)</label>
              <input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={handleInputChange} required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="end_date" style={styles.label}>Ngày kết thúc (*)</label>
              <input type="date" id="end_date" name="end_date" value={formData.end_date} onChange={handleInputChange} required style={styles.input} />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Đào tạo'}
          </button>
          {editingId && (
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary, marginTop: '15px' }} onClick={handleCancelEdit}>Hủy</button>
          )}
        </form>
      </div>

      {/* --- THANH TÌM KIẾM --- */}
      <h2>Danh sách Đào tạo</h2>
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{...styles.formGroup, flexDirection: 'row', gap: '10px' }}>
            <input type="text" placeholder="Tìm theo Khóa học, Tên NV, Người ĐT..." style={{ ...styles.input, flex: 1 }} value={searchTerm} onChange={handleSearchChange}/>
            <button type="submit" style={{...styles.button, ...styles.btnPrimary}}>Tìm kiếm</button>
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary}} onClick={() => { setSearchTerm(''); fetchTrainings(''); }}>Xóa tìm kiếm</button>
          </div>
        </form>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
      {loading && trainings.length === 0 ? renderLoading() : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Mã NV</th>
                <th style={styles.tableHeader}>Tên nhân viên</th>
                <th style={styles.tableHeader}>Khóa học</th>
                <th style={styles.tableHeader}>Người đào tạo</th>
                <th style={styles.tableHeader}>Ngày bắt đầu</th>
                <th style={styles.tableHeader}>Ngày kết thúc</th>
                <th style={styles.tableHeader}>Điểm</th>
                <th style={styles.tableHeader}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {trainings.length === 0 && !loading ? (
                  <tr><td colSpan="8" style={{...styles.tableCell, textAlign: 'center'}}>Không tìm thấy khóa đào tạo nào.</td></tr>
              ) : (
                  trainings.map(t => (
                    <tr key={t.id}>
                      <td style={styles.tableCell}>{t.employee_code}</td>
                      <td style={styles.tableCell}>{t.employee_name}</td>
                      <td style={styles.tableCell}>{t.course_name}</td>
                      <td style={styles.tableCell}>{t.trainer_name}</td>
                      <td style={styles.tableCell}>{t.start_date ? new Date(t.start_date).toLocaleDateString('vi-VN') : ''}</td>
                      <td style={styles.tableCell}>{t.end_date ? new Date(t.end_date).toLocaleDateString('vi-VN') : ''}</td>
                      <td style={styles.tableCell}>{t.score !== null ? t.score : '-'}</td> {/* Hiển thị '-' nếu điểm là null */}
                      <td style={styles.tableCell}>
                        <button style={{ ...styles.button, ...styles.btnWarning }} onClick={() => handleEditClick(t)}>Sửa</button>
                        <button style={{ ...styles.button, ...styles.btnDanger }} onClick={() => handleDelete(t.id)}>Xóa</button>
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

export default TrainingList;
