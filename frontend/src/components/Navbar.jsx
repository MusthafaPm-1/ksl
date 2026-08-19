import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="ksl-navbar">
      <div className="ksl-nav-wrapper">
        {/* Brand */}
        <Link to="/" className="ksl-brand" onClick={closeMenu}>
          <span className="ksl-trophy">🏆</span>
          <span className="ksl-brand-text">Kocheri Super League</span>
        </Link>

        {/* 3-line Hamburger Button */}
        <button
          className={`ksl-hamburger ${isOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
                    <span className="bar"></span>
        </button>

        {/* Collapsible Shelved Menu */}
        <nav className={`ksl-nav-menu ${isOpen ? "is-open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/live"
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Live
          </NavLink>

          <NavLink
            to="/fixtures"
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Fixtures
          </NavLink>

          <NavLink
            to="/results"
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Results
          </NavLink>

          <NavLink
            to="/standings"
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Standings
          </NavLink>

          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `ksl-nav-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Teams
          </NavLink>

          <NavLink
            to="/admin/login"
            className={({ isActive }) =>
              `ksl-nav-link ksl-admin-pill ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;