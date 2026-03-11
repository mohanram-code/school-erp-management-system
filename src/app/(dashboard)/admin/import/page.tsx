"use client";

import { useState } from "react";
import Image from "next/image";

const ImportUsersPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [userType, setUserType] = useState<"teacher" | "student" | "parent">("teacher");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleImport = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    setImporting(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", userType);

    try {
      const response = await fetch("/api/import-users", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      alert("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="bg-white p-6 rounded-md">
        <h1 className="text-2xl font-semibold mb-6">Bulk Import Users from Excel</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Excel File Format Required:</h3>
          
          <div className="space-y-4 text-sm text-blue-700">
            <div>
              <p className="font-medium mb-1">For Teachers:</p>
              <p className="text-xs">Columns: Name | Surname | Email | Phone | Address | BloodType | Sex | Birthday | Username | Password</p>
            </div>
            <div>
              <p className="font-medium mb-1">For Students:</p>
              <p className="text-xs">Columns: Name | Surname | Email | Phone | Address | BloodType | Sex | Birthday | ParentEmail (optional) | GradeLevel | ClassName | Username | Password</p>
            </div>
            <div>
              <p className="font-medium mb-1">For Parents:</p>
              <p className="text-xs">Columns: Name | Surname | Email | Phone | Address | Username | Password</p>
            </div>
          </div>

          <div className="mt-3 text-xs text-blue-600">
            <p>Notes:</p>
            <ul className="list-disc ml-5">
              <li>Sex should be: MALE or FEMALE</li>
              <li>Birthday format: YYYY-MM-DD (e.g., 1990-01-15)</li>
              <li>BloodType: A+, B+, O+, AB+, A-, B-, O-, AB-</li>
              <li>First row must be headers</li>
              <li className="font-semibold text-green-700">ParentEmail is optional for students - can be left blank or omitted</li>
              <li className="font-semibold text-green-700">If ParentEmail is provided but parent does not exist, parent will be auto-created</li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User Type
          </label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64"
          >
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File (.xlsx or .xls)
          </label>
          <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4"
            />
            {file && (
              <p className="text-sm text-green-600 mb-4">
                Selected: {file.name}
              </p>
            )}
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin">⏳</div>
                  Importing {userType}s...
                </span>
              ) : (
                `Import ${userType.charAt(0).toUpperCase() + userType.slice(1)}s`
              )}
            </button>
          </div>
        </div>

        {results && (
          <div className={`border rounded-lg p-4 ${
            results.errors?.length > 0 
              ? "bg-yellow-50 border-yellow-200" 
              : "bg-green-50 border-green-200"
          }`}>
            <h3 className={`font-semibold mb-2 ${
              results.errors?.length > 0 ? "text-yellow-800" : "text-green-800"
            }`}>
              Import {results.errors?.length > 0 ? "Completed with Warnings" : "Successful"}!
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-green-700">
                Successfully imported: {results.success} users
              </p>
              {results.skipped > 0 && (
                <p className="text-yellow-700">
                  Skipped (already exist): {results.skipped} users
                </p>
              )}
              {results.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-600 mb-1">Errors:</p>
                  <ul className="text-xs text-red-600 list-disc ml-5 max-h-40 overflow-auto">
                    {results.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportUsersPage;