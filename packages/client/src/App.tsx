import { Route, Routes } from "react-router-dom";
import Redirect from "./components/Redirect";
import Connections from "./workspaces/Connections";
import DataExplorer from "./workspaces/DataExplorer";
import GraphExplorer from "./workspaces/GraphExplorer";

const App = () => {
  return (
    <Routes>
      <Route path={"/connections"} element={<Connections />} />
      <Route path={"/data-explorer/:vertexType"} element={<DataExplorer />} />
      <Route path={"/graph-explorer"} element={<GraphExplorer />} />
      <Route path={"*"} element={<Redirect to={"/graph-explorer"} />} />
    </Routes>
  );
};

export default App;
