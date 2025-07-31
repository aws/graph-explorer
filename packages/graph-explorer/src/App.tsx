import { Route, Routes } from "react-router";
import Redirect from "./components/Redirect";
import Connections from "./routes/Connections";
import DataExplorer from "./routes/DataExplorer";
import GraphExplorer from "./routes/GraphExplorer";
import {
  SettingsAbout,
  SettingsGeneral,
  SettingsRoot,
} from "./routes/Settings";
import DefaultLayout from "./routes/DefaultLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/connections" element={<Connections />} />
        <Route path="/data-explorer/:vertexType" element={<DataExplorer />} />
        <Route path="/graph-explorer" element={<GraphExplorer />} />
        <Route path="/settings" element={<SettingsRoot />}>
          <Route path="general" element={<SettingsGeneral />} />
          <Route path="about" element={<SettingsAbout />} />
        </Route>
        <Route path="*" element={<Redirect to="/graph-explorer" />} />
      </Route>
    </Routes>
  );
}
