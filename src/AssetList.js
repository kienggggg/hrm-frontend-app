import React, { useState, useEffect } from 'react';

// Styles dùng chung
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

// State ban đầu cho form Tài sản
const initialFormData = {
  asset_name: '',
  asset_code: '',
  date_assigned: '', // Ngày bàn giao
  status: 'Trong kho', // Mặc định
  employee_id: '' // ID nhân viên, rỗng = trong kho
};

// Trạng thái tài sản
const assetStatuses = ['Trong kho', 'Đang sử dụng', 'Hỏng', 'Thanh lý'];

function AssetList() {
  // State cho danh sách tài sản
  const [assets, setAssets] = useState([]);
  // State cho danh sách nhân viên
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Form, Sửa, Tìm kiếm
  const [formData, setFormData] = useState(initialFormData);
  const [apiError, setApiError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm fetch (READ) Tài sản
  const fetchAssets = (currentSearchTerm) => {
    setLoading(true);
    setError(null);
    const encodedSearchTerm = encodeURIComponent(currentSearchTerm);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/assets?search=${encodedSearchTerm}`)
      .then(response => {
           if (!response.ok) throw new Error('Không thể tải dữ liệu tài sản');
           return response.json();
       })
      .then(data => {
        setAssets(data); // Cập nhật state tài sản
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi API Tài sản:", error);
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
    fetchAssets('');
    fetchEmployees();
  }, []);

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => { e.preventDefault(); fetchAssets(searchTerm); };

  // Xử lý gõ vào form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // Xử lý SUBMIT FORM (Thêm/Sửa)
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);

    // Chuẩn bị dữ liệu: nếu employee_id rỗng thì date_assigned cũng phải rỗng
    const dataToSubmit = {
      ...formData,
      employee_id: formData.employee_id || null, // Chuyển chuỗi rỗng thành null
      date_assigned: formData.employee_id ? formData.date_assigned : null // Nếu không có employee_id thì date_assigned = null
    };
    // Validate date_assigned nếu có employee_id
     if (dataToSubmit.employee_id && !dataToSubmit.date_assigned) {
         setApiError('Ngày bàn giao là bắt buộc khi gán tài sản cho nhân viên.');
         return;
     }

    const method = editingId ? 'PUT' : 'POST';
    // Thay đổi URL API
    const url = editingId
      ? `http://localhost:3001/api/assets/${editingId}`
      : 'http://localhost:3001/api/assets';

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
                // Cập nhật state tài sản
                setAssets(assets.map(a => a.id === editingId ? resultData : a));
                handleCancelEdit();
            } else {
                // Thêm vào state tài sản
                setAssets([resultData, ...assets]);
                setFormData(initialFormData);
            }
       }
    })
    .catch(error => {
      console.error(`Lỗi khi ${editingId ? 'cập nhật' : 'thêm'} tài sản:`, error);
      setApiError(error.message);
    });
  };

  // Xử lý XÓA
  const handleDelete = (assetId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài sản này?')) return;
    setApiError(null);
    // Thay đổi URL API
    fetch(`http://localhost:3001/api/assets/${assetId}`, { method: 'DELETE' })
    .then(async response => {
      if (response.status === 204) {
        // Cập nhật state tài sản
        setAssets(assets.filter(a => a.id !== assetId));
      } else {
         const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định khi xóa' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Lỗi khi xóa tài sản:", error);
      setApiError(error.message);
    });
  };

  // Hàm khi nhấn "SỬA"
  const handleEditClick = (asset) => {
    setEditingId(asset.id);
    const formattedAsset = {
        ...asset,
        employee_id: asset.employee_id ? String(asset.employee_id) : '', // Chuyển thành chuỗi rỗng nếu null
        date_assigned: asset.date_assigned ? asset.date_assigned.split('T')[0] : '', // Format ngày
        asset_code: asset.asset_code || '' // Đảm bảo asset_code là chuỗi
    };
    setFormData(formattedAsset);
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
      <h2>{editingId ? 'Cập nhật Thông tin Tài sản' : 'Thêm Tài sản Mới'}</h2>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          {(apiError || error) && renderError()}

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label htmlFor="asset_name" style={styles.label}>Tên tài sản (*)</label>
              <input type="text" id="asset_name" name="asset_name" value={formData.asset_name} onChange={handleInputChange} required style={styles.input} />
            </div>
             <div style={styles.formGroup}>
              <label htmlFor="asset_code" style={styles.label}>Mã tài sản (Nếu có)</label>
              <input type="text" id="asset_code" name="asset_code" value={formData.asset_code} onChange={handleInputChange} style={styles.input} />
            </div>
             <div style={styles.formGroup}>
              <label htmlFor="status" style={styles.label}>Trạng thái (*)</label>
              <select id="status" name="status" value={formData.status} onChange={handleInputChange} required style={styles.select}>
                {assetStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="employee_id" style={styles.label}>Gán cho nhân viên</label>
              <select id="employee_id" name="employee_id" value={formData.employee_id} onChange={handleInputChange} style={styles.select}>
                 {/* Thêm option "Không gán" */}
                <option value="">-- Không gán (Trong kho) --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="date_assigned" style={styles.label}>Ngày bàn giao (Nếu gán)</label>
               {/* Chỉ bật khi đã chọn nhân viên */}
              <input type="date" id="date_assigned" name="date_assigned"
                     value={formData.date_assigned} onChange={handleInputChange}
                     style={styles.input} disabled={!formData.employee_id} />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, ...styles.btnPrimary, marginTop: '15px' }}>
            {editingId ? '💾 Lưu Cập nhật' : '➕ Thêm Tài sản'}
          </button>
          {editingId && (
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary, marginTop: '15px' }} onClick={handleCancelEdit}>Hủy</button>
          )}
        </form>
      </div>

      {/* --- THANH TÌM KIẾM --- */}
      <h2>Danh sách Tài sản</h2>
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{...styles.formGroup, flexDirection: 'row', gap: '10px' }}>
            <input type="text" placeholder="Tìm theo Tên TS, Mã TS, Tên NV, Trạng thái..." style={{ ...styles.input, flex: 1 }} value={searchTerm} onChange={handleSearchChange}/>
            <button type="submit" style={{...styles.button, ...styles.btnPrimary}}>Tìm kiếm</button>
            <button type="button" style={{ ...styles.button, ...styles.btnSecondary}} onClick={() => { setSearchTerm(''); fetchAssets(''); }}>Xóa tìm kiếm</button>
          </div>
        </form>
      </div>

      {/* --- BẢNG DANH SÁCH --- */}
      {loading && assets.length === 0 ? renderLoading() : error ? null : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Tên tài sản</th>
                <th style={styles.tableHeader}>Mã tài sản</th>
                <th style={styles.tableHeader}>Trạng thái</th>
                <th style={styles.tableHeader}>Người giữ</th>
                <th style={styles.tableHeader}>Ngày bàn giao</th>
                <th style={styles.tableHeader}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && !loading ? (
                  <tr><td colSpan="6" style={{...styles.tableCell, textAlign: 'center'}}>Không tìm thấy tài sản nào.</td></tr>
              ) : (
                  assets.map(a => (
                    <tr key={a.id}>
                      <td style={styles.tableCell}>{a.asset_name}</td>
                      <td style={styles.tableCell}>{a.asset_code || '-'}</td>
                      <td style={styles.tableCell}>{a.status}</td>
                      {/* Hiển thị tên NV hoặc 'Trong kho' */}
                      <td style={styles.tableCell}>{a.employee_name || 'Trong kho'}</td>
                      <td style={styles.tableCell}>{a.date_assigned ? new Date(a.date_assigned).toLocaleDateString('vi-VN') : '-'}</td>
                      <td style={styles.tableCell}>
                        <button style={{ ...styles.button, ...styles.btnWarning }} onClick={() => handleEditClick(a)}>Sửa</button>
                        <button style={{ ...styles.button, ...styles.btnDanger }} onClick={() => handleDelete(a.id)}>Xóa</button>
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

export default AssetList;
