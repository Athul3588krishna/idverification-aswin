/**
 * components/common/Sidebar.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Renders the vertical sidebar navigation on the left side of the dashboard layout.
 *   Controls navigation item visibility dynamically based on user roles:
 *
 *   • Admin:
 *     - Dashboard (General stats)
 *     - Registered Students (Search, filter, view details)
 *     - Register Student / User (Form to create new users/students)
 *     - Verification Logs (Audit trail of entries)
 *
 *   • Security Staff:
 *     - Dashboard (Quick summary)
 *     - Verify Candidate (The OCR-based camera scanner upload)
 *     - Verification Logs (Real-time history logs)
 *
 *   • Student:
 *     - Dashboard (Student profile info, exam venue)
 *
 * KEY FEATURES:
 *   • Uses react-router-dom NavLink to apply an 'active' styling automatically.
 *   • Responsive drawer styling using standard dashboard practices.
 * ═══════════════════════════════════════════════════════════════
 */

import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiCpu,
  FiList,
  FiUser,
  FiLock
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  // Navigation config mapping roles to their allowed routes
  const getNavItems = () => {
    const commonItems = [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: <FiGrid size={18} />
      }
    ];

    if (user.role === "admin") {
      return [
        ...commonItems,
        {
          path: "/students",
          label: "Manage Students",
          icon: <FiUsers size={18} />
        },
        {
          path: "/students/add",
          label: "Register Student",
          icon: <FiUserPlus size={18} />
        },
        {
          path: "/history",
          label: "Verification Logs",
          icon: <FiList size={18} />
        }
      ];
    }

    if (user.role === "security_staff") {
      return [
        ...commonItems,
        {
          path: "/verify",
          label: "Verify Candidate",
          icon: <FiCpu size={18} />
        },
        {
          path: "/history",
          label: "Verification Logs",
          icon: <FiList size={18} />
        }
      ];
    }

    if (user.role === "student") {
      return [
        ...commonItems
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar-aside" style={{
      width: "var(--sidebar-width)",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      position: "fixed",
      top: "var(--header-height)",
      bottom: 0,
      left: 0,
      zIndex: 99,
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: "2rem"
    }}>
      {/* User profile short info */}
      <div className="d-flex align-items-center gap-3 p-2 rounded" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-color)" }}>
        <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary-glow" style={{
          width: "40px",
          height: "40px",
          backgroundColor: "var(--primary-glow)",
          color: "var(--primary-light)",
          border: "1px solid var(--border-focus)"
        }}>
          <FiUser size={20} />
        </div>
        <div className="overflow-hidden">
          <h6 className="m-0 text-truncate" style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{user.name}</h6>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
            {user.role.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <ul className="nav flex-column gap-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 rounded p-3 ${
                  isActive ? "sidebar-link-active" : "sidebar-link"
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? "#fff" : "var(--text-secondary)",
                background: isActive ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                transition: "all var(--transition-fast)",
                textDecoration: "none",
                fontSize: "0.9rem"
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Scoped Sidebar CSS overrides to style hover states */}
      <style>{`
        .sidebar-link {
          transition: all var(--transition-fast);
        }
        .sidebar-link:hover {
          color: var(--text-primary) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          transform: translateX(4px);
        }
        .sidebar-link-active {
          box-shadow: 0 4px 15px var(--primary-glow);
        }
        
        /* Apply mobile styles */
        @media (max-width: 768px) {
          .sidebar-aside {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
