import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import CouponFinder from "./CouponFinder.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CouponFinder />
  </StrictMode>
);
