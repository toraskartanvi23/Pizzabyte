import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/">Menu</Link>
        <Link to="/">Delivery</Link>
        <Link to="/">Contact</Link>
      </div>

      <div className="nav-auth">
        <Link to="/login" className="nav-btn">Login</Link>
        <Link to="/register" className="nav-btn">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
