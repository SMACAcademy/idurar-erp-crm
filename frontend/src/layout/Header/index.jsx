import logo from '../../style/images/logo-icon.svg';

const Header = () => {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="CRM ERP Logo" style={{ height: 40, marginRight: 16 }} />
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>CRM ERP</span>
      </div>
      {/* ...rest of header... */}
    </header>
  );
};

export default Header; 