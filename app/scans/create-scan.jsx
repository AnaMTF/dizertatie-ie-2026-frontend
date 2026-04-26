import { useState } from "react";
import InteractiveAnatomyMap from "./interactive-anatomy-map";

export default function NewAiScanPage() {
  const [selectedOrgan, setSelectedOrgan] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrgan) {
      alert("Please select a target organ from the body map first.");
      return;
    }
    console.log("Starting AI Scan for:", selectedOrgan);
    // Proceed with file upload and AI logic
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          Configure AI Analysis
        </h1>
        <p className="text-base-content/70">
          Pinpoint the specific anatomical region for the AI model to analyze.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* The Interactive Map Component */}
        <InteractiveAnatomyMap
          selectedOrgan={selectedOrgan}
          onSelectOrgan={setSelectedOrgan}
        />

        {/* The rest of your form */}
        <div className="bg-base-100 border-base-200 rounded-2xl border p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">Upload Scan Files</h3>
          <input
            type="file"
            className="file-input file-input-bordered file-input-primary w-full max-w-md"
            accept="image/jpeg, image/png, application/dicom"
          />
          <div className="mt-6">
            <button type="submit" className="btn btn-primary px-8">
              Run AI Diagnostics
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
