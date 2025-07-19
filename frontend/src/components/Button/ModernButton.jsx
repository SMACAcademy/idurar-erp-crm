import React from 'react';

/**
 * ModernButton - A button component styled with the CRM ERP modern theme.
 * Use this for all primary actions for a consistent look.
 *
 * Props: All standard button props.
 */
const ModernButton = ({ children, ...props }) => (
  <button className="btn" {...props}>
    {children}
  </button>
);

export default ModernButton; 