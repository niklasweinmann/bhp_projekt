import React from "react";

// Das Logo wurde als PNG bereitgestellt, daher importieren wir es direkt
import logo from "../assets/permhub_logo_fleave.png";

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img src={logo} alt="Logo" className={className || "logo"} />
);

export default Logo;
