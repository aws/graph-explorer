import { Route, Routes } from "react-router";
import Redirect from "./components/Redirect";
import Connections from "./workspaces/Connections";
import DataExplorer from "./workspaces/DataExplorer";
import GraphExplorer from "./workspaces/GraphExplorer";
import {
  SettingsAbout,
  SettingsGeneral,
  SettingsRoot,
} from "./workspaces/Settings";
import DefaultLayout from "./workspaces/DefaultLayout";

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
