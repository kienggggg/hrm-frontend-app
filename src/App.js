import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

// Import các component
import EmployeeList from './EmployeeList';
import ContractList from './ContractList';
import TrainingList from './TrainingList';
import AttendanceList from './AttendanceList';
import AssetList from './AssetList'; // <-- THÊM MỚI

// CSS
const styles = {
  page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" },
  appContainer: { display: 'flex' },
  sidebar: {
    width: '220px',
    background: '#004aad',
    color: 'white',
    height: '100vh',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarTitle: {
      fontSize: '20px',
      textAlign: 'center',
      marginBottom: '20px',
      fontWeight: 'bold',
      color: '#ffcc00'
  },
  navContainer: {
      flexGrow: 1,
      overflowY: 'auto'
  },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white',
    padding: '12px 15px',
    textDecoration: 'none',
    borderRadius: '6px',
    marginBottom: '8px',
    transition: 'background-color 0.2s'
  },
  sidebarLinkActive: {
      backgroundColor: '#003580',
      fontWeight: 'bold'
  },
  mainContent: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#f4f6f9',
    height: '100vh',
    overflowY: 'auto'
  }
};

// Hàm helper để gộp style
const getLinkStyle = ({ isActive }) => ({
  ...styles.sidebarLink,
  ...(isActive ? styles.sidebarLinkActive : {})
});


function App() {
  return (
    <BrowserRouter>
      <div style={styles.page}>
        <div style={styles.appContainer}>

          {/* Sidebar */}
          <nav style={styles.sidebar}>
             <div style={styles.sidebarTitle}>HRM System</div>
             <div style={styles.navContainer}>
                <NavLink to="/employees" style={getLinkStyle}>
                  👥 Nhân sự
                </NavLink>
                <NavLink to="/contracts" style={getLinkStyle}>
                  📑 Hợp đồng
                </NavLink>
                <NavLink to="/training" style={getLinkStyle}>
                  🎓 Đào tạo
                </NavLink>
                <NavLink to="/attendance" style={getLinkStyle}>
                  🗓️ Chấm công
                </NavLink>
                {/* --- THÊM LINK MỚI --- */}
                <NavLink to="/assets" style={getLinkStyle}>
                  🛠️ Tài sản
                </NavLink>
                {/* Thêm các link khác sau */}
             </div>
          </nav>

          {/* Main Content */}
          <main style={styles.mainContent}>
            <Routes>
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/training" element={<TrainingList />} />
              <Route path="/attendance" element={<AttendanceList />} />
              {/* --- THÊM ROUTE MỚI --- */}
              <Route path="/assets" element={<AssetList />} />

              {/* Trang chủ mặc định */}
              <Route path="/" element={<EmployeeList />} />
              <Route path="*" element={<h2>Trang không tồn tại</h2>} />
            </Routes>
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

