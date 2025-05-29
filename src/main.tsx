import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import TableComponent from "./table-script";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <TableComponent />
  </StrictMode>
);
