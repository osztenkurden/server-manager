import { useState } from "react";
import { Upload, X } from "lucide-react";
import { ActionButton } from "./button";
import ky from "ky";

type DemoData = { file: string; updatedAt: number; createdAt: number };
type DemoDataExtended = DemoData & { playedAt: number };

export default function UploadFilesModal({ accessKey }: { accessKey: string }) {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<DemoDataExtended[]>([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set<string>());
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [progressState, _setProgressState] = useState([] as string[]);
  const setProgressState = (msg: string, state: string) => {
    _setProgressState((p) => [...p, msg]);
  };

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const fileData = await ky
        .get("/demos", { headers: { authorization: accessKey } })
        .json<DemoData[]>();
      const filesWithPlayedAt = fileData.map((file) => ({
        ...file,
        playedAt: file.createdAt,
      }));
      setFiles(filesWithPlayedAt);
    } catch (error: any) {
      if (setProgressState) {
        setProgressState(`Error fetching files: ${error.message}`, "error");
      }
    }
    setIsLoadingFiles(false);
  };

  const handleFileSelect = (filename: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  const handlePlayedAtChange = (filename: string, newDate: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.file === filename
          ? { ...file, playedAt: new Date(newDate).getTime() }
          : file
      )
    );
  };
  const handleRemoveFiles = async () => {
    if (selectedFiles.size === 0) return;

    setIsRemoving(true);
    setProgressState(
      `Starting removal of ${selectedFiles.size} files...`,
      "info"
    );

    for (const fileName of selectedFiles) {
      try {
        await ky.delete("/demos", {
          json: { fileName },
          headers: { authorization: accessKey },
        });
        setProgressState(`✓ Removed: ${fileName}`, "success");
      } catch (error: any) {
        if (setProgressState) {
          setProgressState(
            `✗ Error removing ${fileName}: ${error.message}`,
            "error"
          );
        }
      }
    }
    await fetchFiles();
    setIsRemoving(false);
    setSelectedFiles(new Set());
    setProgressState("Removal process completed", "info");
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.size === 0) return;

    setIsUploading(true);
    if (setProgressState) {
      setProgressState(
        `Starting upload of ${selectedFiles.size} files...`,
        "info"
      );
    }

    for (const fileName of selectedFiles) {
      const playedAt = files.find((file) => file.file === fileName)?.playedAt;
      if (!playedAt) {
        continue;
      }
      try {
        await ky.post("/demos", {
          json: { fileName, playedAt },
          headers: { authorization: accessKey },
        });
        setProgressState(`✓ Uploaded: ${fileName}`, "success");
      } catch (error: any) {
        if (setProgressState) {
          setProgressState(
            `✗ Error uploading ${fileName}: ${error.message}`,
            "error"
          );
        }
      }
    }

    setIsUploading(false);
    setSelectedFiles(new Set());
    if (setProgressState) {
      setProgressState("Upload process completed", "info");
    }
  };

  const formatDate = (dateString: number) => {
    return new Date(dateString).toLocaleString();
  };

  const openModal = () => {
    setShowModal(true);
    fetchFiles();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFiles(new Set());
  };

  const getDateTimeValue = (date: Date) => {
    const now = new Date(date);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  return (
    <>
      {/* Trigger Button */}
      <ActionButton color="bg-cyan-600 hover:bg-cyan-700" onClick={openModal}>
        <Upload size={18} />
        <span>MANAGE DEMOS</span>
      </ActionButton>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-mono m-0">
          <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-hidden flex flex-col text-green-400">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-300">
                Manage Demo Files
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white  cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-green-400">Loading files...</div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-400">
                  Selected: {selectedFiles.size} file(s)
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700 sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-green-300">Select</th>
                        <th className="p-2 text-left text-green-300">
                          Filename
                        </th>
                        <th className="p-2 text-left text-green-300">
                          Created
                        </th>
                        <th className="p-2 text-left text-green-300">
                          Updated
                        </th>
                        <th className="p-2 text-left text-green-300">
                          Played At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr
                          key={file.file}
                          className="border-b border-gray-600 hover:bg-gray-700"
                        >
                          <td className="p-2">
                            <div className="flex items-center justify-center h-full">
                              <input
                                type="checkbox"
                                checked={selectedFiles.has(file.file)}
                                onChange={() => handleFileSelect(file.file)}
                                className="w-4 h-4 rounded border-2 border-gray-500 bg-gray-700 text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 accent-green-500"
                              />
                            </div>
                          </td>
                          <td className="p-2 font-mono text-green-400">
                            {file.file}
                          </td>
                          <td className="p-2 text-gray-300">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="p-2 text-gray-300">
                            {formatDate(file.updatedAt)}
                          </td>
                          <td className="p-2">
                            <input
                              type="datetime-local"
                              value={getDateTimeValue(new Date(file.playedAt))}
                              onChange={(e) =>
                                handlePlayedAtChange(file.file, e.target.value)
                              }
                              className="bg-gray-600 text-green-400 px-2 py-1 rounded text-xs border border-gray-500 focus:border-green-400 focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      if (selectedFiles.size === files.length) {
                        setSelectedFiles(new Set());
                      } else {
                        setSelectedFiles(new Set(files.map((f) => f.file)));
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    {selectedFiles.size === files.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={closeModal}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadFiles}
                      disabled={
                        selectedFiles.size === 0 || isUploading || isRemoving
                      }
                      className={`px-4 py-2 rounded text-white font-semibold transition-colors cursor-pointer ${
                        selectedFiles.size === 0 || isUploading || isRemoving
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isUploading
                        ? "Uploading..."
                        : `Upload ${selectedFiles.size} File(s)`}
                    </button>
                    <button
                      onClick={handleRemoveFiles}
                      disabled={
                        selectedFiles.size === 0 || isRemoving || isUploading
                      }
                      className={`px-4 py-2 rounded text-white font-semibold transition-colors cursor-pointer ${
                        selectedFiles.size === 0 || isRemoving || isUploading
                          ? "bg-gray-500 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isRemoving
                        ? "Removing..."
                        : `Remove ${selectedFiles.size} File(s)`}
                    </button>
                  </div>
                </div>

                {progressState.length > 0 && (
                  <div className="border-t border-gray-600 pt-4">
                    <h3 className="text-sm font-semibold text-green-300 mb-2">
                      Manage Logs
                    </h3>
                    <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto">
                      {progressState.map((log, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-300 font-mono mb-1 last:mb-0"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
