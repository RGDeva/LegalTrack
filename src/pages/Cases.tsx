import { useState } from "react";
import { CaseList } from "@/components/cases/CaseList";
import { AddCaseDialog } from "@/components/cases/AddCaseDialog";

const Cases = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCaseAdded = () => {
    // Trigger re-render of CaseList
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-muted-foreground">Manage all your legal cases</p>
        </div>
        <AddCaseDialog onCaseAdded={handleCaseAdded} />
      </div>
      <CaseList key={refreshKey} />
    </div>
  );
};

export default Cases;